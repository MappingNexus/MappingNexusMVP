"""
Frontend class migration helper.

Originally this script replaced scattered hardcoded colours with Tailwind tokens.
It now supports a conservative migration away from:
  - `dark:*` variants (DESIGN.md is light-canvas marketing-first)
  - glassmorphism (`backdrop-blur-*`, translucent `bg-*/NN`)

This script is intentionally conservative and text-based. Review the diff after running.

Usage (from `frontend/`):
  python replace_colors.py --apply
  python replace_colors.py --dry-run
  python replace_colors.py --apply --paths components/hr/EmployeeManagement.tsx components/manager/MatchingEngine.tsx

Note: If `python` isn't available in your environment, you can run the same logic
via a Node script, or apply the replacements manually.
"""

from __future__ import annotations

import argparse
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, Iterator, Sequence


@dataclass(frozen=True)
class ReplaceRule:
    name: str
    pattern: re.Pattern[str]
    replacement: str


def _iter_default_paths(frontend_root: Path) -> Iterator[Path]:
    for folder in ("components", "services"):
        base = frontend_root / folder
        if not base.exists():
            continue
        yield from base.rglob("*.tsx")
        yield from base.rglob("*.ts")


def _normalize_class_whitespace(text: str) -> str:
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text


def _apply_rules(content: str, rules: Sequence[ReplaceRule]) -> tuple[str, int]:
    total = 0
    for rule in rules:
        content, count = rule.pattern.subn(rule.replacement, content)
        total += count
    content = _normalize_class_whitespace(content)
    return content, total


def build_rules() -> list[ReplaceRule]:
    # Rule ordering matters: do specific transforms before generic removals.
    return [
        ReplaceRule(
            name="Remove backdrop blur",
            pattern=re.compile(r"(?<![\w-])backdrop-blur(?:-[\w\[\]]+)?(?![\w-])"),
            replacement="",
        ),
        ReplaceRule(
            name="Remove dark variants",
            pattern=re.compile(r"(?<![\w-])dark:[^\s\"']+(?![\w-])"),
            replacement="",
        ),
        ReplaceRule(
            name="Flatten translucent card backgrounds",
            pattern=re.compile(r"(?<![\w-])bg-card/(?:40|50|60|70|80|90)(?![\w-])"),
            replacement="bg-card",
        ),
        ReplaceRule(
            name="Flatten translucent white/black backgrounds",
            pattern=re.compile(r"(?<![\w-])bg-(?:white|black)/(?:20|40|50|60|70|80|90)(?![\w-])"),
            replacement="bg-card",
        ),
        ReplaceRule(
            name="Replace common gray borders with token",
            pattern=re.compile(r"(?<![\w-])border-gray-(?:100|200|300)(?:/50)?(?![\w-])"),
            replacement="border-border",
        ),
        ReplaceRule(
            name="Replace common gray text with tokens",
            pattern=re.compile(r"(?<![\w-])text-gray-900(?![\w-])"),
            replacement="text-foreground",
        ),
        ReplaceRule(
            name="Replace muted gray text with token",
            pattern=re.compile(r"(?<![\w-])text-gray-(?:400|500|600)(?![\w-])"),
            replacement="text-muted-foreground",
        ),
        ReplaceRule(
            name="Normalize focus rings to primary",
            pattern=re.compile(r"(?<![\w-])focus:ring-ring(?![\w-])"),
            replacement="focus:ring-primary",
        ),
        ReplaceRule(
            name="Prefer DESIGN.md input style (cb-input)",
            pattern=re.compile(r"(?<![\w-])w-full bg-background/50 border border-border rounded-xl px-4 py-3(?![\w-])"),
            replacement="cb-input",
        ),
    ]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def write_text(path: Path, content: str) -> None:
    path.write_text(content, encoding="utf-8")


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Migrate frontend Tailwind classes to DESIGN.md tokens.")
    parser.add_argument("--apply", action="store_true", help="Write changes to disk.")
    parser.add_argument("--dry-run", action="store_true", help="Show what would change, but do not write.")
    parser.add_argument("--paths", nargs="*", default=None, help="Explicit file paths (relative to frontend/).")
    args = parser.parse_args(argv)

    frontend_root = Path(__file__).resolve().parent
    rules = build_rules()

    if args.paths:
        targets = [(frontend_root / p).resolve() for p in args.paths]
    else:
        targets = list(_iter_default_paths(frontend_root))

    changed_files = 0
    total_replacements = 0

    for path in targets:
        if not path.exists() or path.is_dir():
            continue
        original = read_text(path)
        updated, count = _apply_rules(original, rules)
        if updated != original:
            changed_files += 1
            total_replacements += count
            rel = path.relative_to(frontend_root)
            print(f"{rel}: {count} replacements")
            if args.apply and not args.dry_run:
                write_text(path, updated)

    print(f"Done. {changed_files} files changed, {total_replacements} replacements.")
    if args.dry_run and args.apply:
        print("Note: both --dry-run and --apply were set; no files were written.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
