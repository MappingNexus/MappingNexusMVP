# Auth & Session Implementation Notes

_Branch: `manya` — prepared for PR review_

---

## 1. Token Model

### Access Token (JWT)
- **Expiry:** 15 minutes
- **Claims:** `userId`, `role`, `tokenVersion`, `companyId`, `iat`, `exp`
- Short-lived by design — even if intercepted, window of misuse is small

### Refresh Token
- **Expiry:** 7 days
- **Storage:** Never stored plaintext — SHA-256 hashed before writing to `refresh_token_sessions` table
- **Session context:** Each row also stores `user_agent`, `ip_address`, `created_at`, `last_used_at`

### Rotation
- Every call to `POST /auth/refresh` issues a **brand new** access + refresh token pair
- The old refresh token is immediately marked `revoked = true` in DB
- `replaced_by` column points to the new session for audit trail
- **Replay attack:** If a revoked token is reused → ALL sessions for that user are revoked instantly and a `CRITICAL` audit log is written

---

## 2. Session Revocation Rules

### What triggers full session revocation (all devices):
| Event | Mechanism |
|---|---|
| Password change | `revokeAllSessionsForUser()` + `token_version` bump |
| Password reset | `revokeAllSessionsForUser()` + `token_version` bump |
| Role change | `revokeAllSessionsForUser()` + `token_version` bump |
| Suspend | `revokeAllSessionsForUser()` + `token_version` bump |
| Deactivate | `revokeAllSessionsForUser()` + `token_version` bump |
| Offboard | `revokeAllSessionsForUser()` + `token_version` bump |

### How revocation works (two-layer):
1. **`token_version` (users table):** Bumped on every revocation event. Auth middleware compares JWT's `tokenVersion` claim against DB on every request — mismatch = instant 401, even if token hasn't expired yet
2. **`refresh_token_sessions.revoked` flag:** Handles individual session invalidation (e.g. single-device logout). Checked on every `/refresh` call

Both layers work together — `token_version` kills access tokens immediately, `revoked` flag kills refresh tokens

---

## 3. User Status Model

### Statuses (ENUM: `user_status`)
| Status | Meaning | Can Login | Can Reactivate |
|---|---|---|---|
| `active` | Full access | ✅ | — |
| `suspended` | Temporary block | ❌ | ✅ (admin only) |
| `deactivated` | Permanent block, data retained | ❌ | ❌ |
| `offboarded` | Account closed | ❌ | ❌ |

### Allowed transitions:
- `active` → `suspended` → `active` (reactivate)
- `active` → `deactivated` (permanent)
- `active` → `offboarded` (permanent)
- `suspended` → `deactivated` or `offboarded`

### Enforcement:
- Auth middleware queries `users.status` from DB on **every authenticated request** after JWT validation
- No caching — status changes take effect immediately
- Login and `/refresh` endpoints also block non-active users
- Error messages: `"Account suspended."` / `"Account deactivated."` / `"Account offboarded."`

### Audit trail:
Every lifecycle action writes an entry to the audit log with: `actor (admin userId)`, `action`, `target userId`, `metadata`, `timestamp`

---

## 4. Database Migrations (in order)
| File | What it adds |
|---|---|
| `013_refresh_token_sessions.sql` | `refresh_token_sessions` table + indexes |
| `014_user_lifecycle_status.sql` | `user_status` ENUM + `users.status` column |
| `015_session_revocation_token_version.sql` | `users.token_version` column |

All three are also included in `neon_master_migration.sql` for fresh DB setup.
