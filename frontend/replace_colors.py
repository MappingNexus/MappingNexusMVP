import os

files = [
    'components/hr/EmployeeManagement.tsx',
    'components/manager/MatchingEngine.tsx',
    'components/employee/MyProfile.tsx',
]

replacements = [
    ('bg-[#FAFAFA]', 'bg-background'),
    ('dark:bg-[#0a0a0c]', ''),
    ('dark:bg-[#0f0f0f]', 'dark:bg-card'),
    ('bg-white dark:bg-[#0f0f0f]', 'bg-card'),
    ('bg-white/50 dark:bg-black/50', 'bg-card/50'),
    ('bg-white/40 dark:bg-black/20', 'bg-card/40'),
    ('bg-white/70 dark:bg-[#111111]/70', 'bg-card/70'),
    ('bg-white/80 dark:bg-[#1a1a1a]/80', 'bg-card/80'),
    ('dark:bg-[#111111]/70', 'dark:bg-card/70'),
    ('dark:bg-[#1a1a1c]/70', 'dark:bg-card/70'),
    ('dark:bg-[#1a1a1c]/50', 'dark:bg-card/50'),
    ('dark:bg-[#1a1a1a]/50', 'dark:bg-card/50'),
    ('dark:bg-[#1A1A1A]', 'dark:bg-secondary'),
    ('dark:bg-[#0A0A0A]', 'dark:bg-background'),
    ('bg-[#111111]', 'bg-card'),
    ('dark:bg-black/20', 'dark:bg-card/20'),
    ('dark:bg-black/50', 'dark:bg-card/50'),
    ('bg-gray-100 dark:bg-[#2a2a2a]', 'bg-muted'),
    ('bg-gray-100 dark:bg-[#1A1A1A]', 'bg-secondary'),
    ('bg-gray-100/60 dark:bg-white/5', 'bg-secondary/60'),
    ('bg-gray-100', 'bg-secondary'),
    ('text-gray-900 dark:text-white', 'text-foreground'),
    ('text-[#111] dark:text-white', 'text-foreground'),
    ('text-[#111111] dark:text-white', 'text-foreground'),
    ('dark:text-white', 'dark:text-foreground'),
    ('text-gray-500 dark:text-[#8a8a8a]', 'text-muted-foreground'),
    ('text-gray-500 dark:text-[#8A8A8A]', 'text-muted-foreground'),
    ('text-gray-400 dark:text-gray-500', 'text-muted-foreground'),
    ('text-gray-400 dark:text-[#8A8A8A]', 'text-muted-foreground'),
    ('text-[#666666] dark:text-[#a0a0a0]', 'text-muted-foreground'),
    ('text-[#666666] dark:text-[#999999]', 'text-muted-foreground'),
    ('text-gray-700 dark:text-gray-300', 'text-foreground'),
    ('text-gray-600 dark:text-gray-300', 'text-muted-foreground'),
    ('text-gray-500 dark:text-gray-400', 'text-muted-foreground'),
    ('dark:text-[#8a8a8a]', 'dark:text-muted-foreground'),
    ('dark:text-[#8A8A8A]', 'dark:text-muted-foreground'),
    ('text-blue-500 dark:text-[#00FF66]', 'text-nexus-green'),
    ('dark:text-[#00FF66]', 'dark:text-nexus-green'),
    ('bg-[#00FF66]/10', 'bg-nexus-green/10'),
    ('border-[#00FF66]/20', 'border-nexus-green/20'),
    ('border-[#00FF66]/30', 'border-nexus-green/30'),
    ('text-[#FF3333]', 'text-nexus-red'),
    ('bg-[#FF3333]/10', 'bg-nexus-red/10'),
    ('border-[#FF3333]/20', 'border-nexus-red/20'),
    ('border-[#FF3333]/30', 'border-nexus-red/30'),
    ('text-[#FF9900]', 'text-nexus-orange'),
    ('bg-[#FF9900]/10', 'bg-nexus-orange/10'),
    ('border-[#FF9900]/20', 'border-nexus-orange/20'),
    ('border-[#FF9900]/30', 'border-nexus-orange/30'),
    ('text-[#9D4EDD]', 'text-nexus-purple'),
    ('bg-[#9D4EDD]/10', 'bg-nexus-purple/10'),
    ('border-[#9D4EDD]/30', 'border-nexus-purple/30'),
    ('border-gray-200 dark:border-white/10', 'border-border'),
    ('border-gray-200/50 dark:border-white/10', 'border-border/50'),
    ('border-gray-300 dark:border-[#2A2A2A]', 'border-border'),
    ('border-gray-200/50 dark:border-[#2A2A2A]', 'border-border/50'),
    ('border-gray-200/50 dark:border-[#2A2A2A]/50', 'border-border/50'),
    ('dark:border-white/10', 'dark:border-border'),
    ('dark:border-[#2A2A2A]', 'dark:border-border'),
    ('dark:border-[#333333]', 'dark:border-border'),
    ('border-gray-200', 'border-border'),
    ('border-gray-300', 'border-border'),
    ('bg-white text-black', 'bg-primary text-primary-foreground'),
    ('bg-[#111] dark:bg-white text-white dark:text-[#111]', 'bg-primary text-primary-foreground'),
    ('hover:bg-gray-200', 'hover:opacity-90'),
    ('focus:border-blue-500 dark:border-[#00FF66]', 'focus:border-ring'),
    ('focus:border-blue-500 dark:focus:border-[#00FF66]', 'focus:border-ring'),
    ('hover:bg-black/5 dark:hover:bg-white/10', 'hover:bg-accent'),
    ('hover:bg-black/5 dark:hover:bg-[#1A1A1A]/50', 'hover:bg-accent'),
    ('hover:text-gray-900 dark:hover:text-white', 'hover:text-foreground'),
    ('hover:text-gray-900 dark:text-white', 'hover:text-foreground'),
    ('text-green-500', 'text-success'),
    ('bg-green-500/10', 'bg-success/10')
]

for file in files:
    if os.path.exists(file):
        with open(file, 'r', encoding='utf-8') as f:
            content = f.read()
        for old, new in replacements:
            content = content.replace(old, new)
        with open(file, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Updated {file}')
    else:
        print(f'File not found: {file}')
