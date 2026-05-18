import {
    Activity,
    BarChart3,
    Bell,
    CalendarDays,
    CheckCircle2,
    ClipboardList,
    Clock3,
    FileText,
    MessageSquare,
    Settings,
    ShieldCheck,
    Target,
    TrendingUp,
    User,
    UserCheck,
    Users,
} from 'lucide-react';

export type ManagerRouteKey =
    | 'dashboard'
    | 'team'
    | 'employees'
    | 'attendance'
    | 'tasks'
    | 'reports'
    | 'leave'
    | 'performance'
    | 'messages'
    | 'settings'
    | 'profile';

export const managerNavItems = [
    { to: '/manager/dashboard', icon: BarChart3, label: 'DASHBOARD', key: 'dashboard' },
    { to: '/manager/team', icon: Users, label: 'TEAM MANAGEMENT', key: 'team' },
    { to: '/manager/employees', icon: UserCheck, label: 'EMPLOYEES', key: 'employees' },
    { to: '/manager/attendance', icon: CalendarDays, label: 'ATTENDANCE', key: 'attendance' },
    { to: '/manager/tasks', icon: ClipboardList, label: 'TASKS', key: 'tasks' },
    { to: '/manager/reports', icon: FileText, label: 'REPORTS', key: 'reports' },
    { to: '/manager/leave', icon: Clock3, label: 'LEAVE REQUESTS', key: 'leave' },
    { to: '/manager/performance', icon: TrendingUp, label: 'PERFORMANCE', key: 'performance' },
    { to: '/manager/messages', icon: MessageSquare, label: 'MESSAGES', key: 'messages' },
    { to: '/manager/settings', icon: Settings, label: 'SETTINGS', key: 'settings' },
    { to: '/manager/profile', icon: User, label: 'PROFILE', key: 'profile' },
] as const;

export const managerMetrics = [
    { label: 'TEAM.SIZE', value: '24', detail: 'ACTIVE DIRECT REPORTS', tone: 'text-gray-900 dark:text-white', icon: Users },
    { label: 'TASK.SLA', value: '91%', detail: 'ASSIGNMENTS ON TRACK', tone: 'text-blue-500 dark:text-[#00FF66]', icon: Target },
    { label: 'ATTENDANCE', value: '96%', detail: 'THIS WEEK PRESENCE', tone: 'text-gray-900 dark:text-white', icon: CalendarDays },
    { label: 'OPEN.RISKS', value: '3', detail: 'ITEMS NEED REVIEW', tone: 'text-[#FF9900]', icon: Activity },
];

export const teamMembers = [
    { name: 'Aarav Mehta', role: 'Frontend Engineer', department: 'Product', load: 82, status: 'Online', performance: 94 },
    { name: 'Nisha Rao', role: 'Backend Engineer', department: 'Platform', load: 68, status: 'In Focus', performance: 89 },
    { name: 'Kabir Sen', role: 'QA Analyst', department: 'Quality', load: 54, status: 'Available', performance: 86 },
    { name: 'Maya Iyer', role: 'UX Designer', department: 'Design', load: 73, status: 'In Review', performance: 92 },
    { name: 'Dev Patel', role: 'Data Analyst', department: 'Insights', load: 61, status: 'Online', performance: 88 },
    { name: 'Sara Khan', role: 'Project Coordinator', department: 'Delivery', load: 77, status: 'Meeting', performance: 90 },
];

export const attendanceRows = [
    { day: 'MON', present: 23, remote: 7, late: 1, leave: 1 },
    { day: 'TUE', present: 22, remote: 8, late: 2, leave: 2 },
    { day: 'WED', present: 24, remote: 6, late: 0, leave: 0 },
    { day: 'THU', present: 21, remote: 9, late: 1, leave: 3 },
    { day: 'FRI', present: 20, remote: 10, late: 1, leave: 4 },
];

export const taskRows = [
    { title: 'Finalize sprint allocation matrix', owner: 'Sara Khan', priority: 'High', status: 'In Progress', due: 'Today' },
    { title: 'Review API handoff checklist', owner: 'Nisha Rao', priority: 'Medium', status: 'Blocked', due: 'Tomorrow' },
    { title: 'Approve dashboard QA notes', owner: 'Kabir Sen', priority: 'High', status: 'Review', due: 'May 17' },
    { title: 'Prepare quarterly talent report', owner: 'Dev Patel', priority: 'Low', status: 'Queued', due: 'May 22' },
];

export const leaveRequests = [
    { name: 'Maya Iyer', type: 'Personal Leave', dates: 'May 20 - May 21', status: 'Pending', impact: 'Design review coverage needed' },
    { name: 'Aarav Mehta', type: 'Work From Home', dates: 'May 18', status: 'Pending', impact: 'No delivery impact' },
    { name: 'Kabir Sen', type: 'Sick Leave', dates: 'May 15', status: 'Approved', impact: 'QA backup assigned' },
];

export const notifications = [
    { icon: Bell, title: '3 leave requests need review', time: '12 min ago', tone: 'text-[#FF9900]' },
    { icon: ShieldCheck, title: 'Team compliance checklist completed', time: '1 hr ago', tone: 'text-blue-500 dark:text-[#00FF66]' },
    { icon: CheckCircle2, title: 'Sprint tasks synced successfully', time: '3 hrs ago', tone: 'text-gray-500 dark:text-[#8a8a8a]' },
];

export const recentActivity = [
    { actor: 'Nisha Rao', action: 'updated backend allocation to 68%', time: '09:45' },
    { actor: 'Sara Khan', action: 'created a new delivery checkpoint', time: '10:20' },
    { actor: 'Maya Iyer', action: 'submitted leave request for review', time: '11:05' },
    { actor: 'Dev Patel', action: 'published performance trend notes', time: '12:10' },
];

export const messageThreads = [
    { sender: 'HR Operations', subject: 'Manager policy refresh', unread: true, time: '08:30' },
    { sender: 'Delivery Leads', subject: 'Sprint capacity confirmation', unread: true, time: '10:15' },
    { sender: 'Maya Iyer', subject: 'Design handoff timeline', unread: false, time: 'Yesterday' },
];

export const chartBars = [72, 88, 64, 91, 76, 84, 69, 95];
