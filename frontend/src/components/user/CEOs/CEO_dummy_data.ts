export type PanelId =
	| 'dashboard'
	| 'analytics'
	| 'teams'
	| 'projects'
	| 'tasks'
	| 'members'
	| 'settings'

export type ModalId =
	| 'createTeam'
	| 'disbandTeam'
	| 'addMember'
	| 'revokeMember'
	| 'createProject'
	| 'discardProject'
	| 'assignTeam'
	| 'revokeTeam'
	| 'invite'
	| 'editProfile'
	| 'createTask'

export interface NavItem {
	id: PanelId
	label: string
	short: string
	badge?: string
}

export interface StatCard {
	id: string
	label: string
	value: string
	delta: string
	trend: 'up' | 'down'
	tone: 'cyan' | 'purple' | 'yellow' | 'green'
}

export interface TaskItem {
	id: string
	name: string
	chip: string
	chipTone: 'dev' | 'design' | 'ops' | 'hr'
	done: boolean
	assignee?: string
}

export interface MemberPresence {
	id: string
	initials: string
	name: string
	role: string
	team?: string
	online: boolean
	tone: string
}

export interface ProgressItem {
	id: string
	name: string
	value: number
	tone: 'cyan' | 'green' | 'yellow'
}

export interface ActivityItem {
	id: string
	label: string
	time: string
	tone: 'cyan' | 'purple' | 'yellow' | 'green'
}

export interface TeamCard {
	id: string
	name: string
	description: string
	tag: string
	members: Array<{ initials: string; tone: string }>
	totalMembers: number
}

export interface ProjectCard {
	id: string
	name: string
	description: string
	due: string
	completedTasks: number
	totalTasks: number
	team: string
	progress: number
	status: 'active' | 'review' | 'planning'
}

export interface DashboardData {
	orgName: string
	currentUser: {
		initials: string
		name: string
		role: string
		title: string
		email: string
	}
	nav: {
		overview: NavItem[]
		workspace: NavItem[]
		system: NavItem[]
	}
	stats: StatCard[]
	todayTasks: TaskItem[]
	allTasks: TaskItem[]
	onlineMembers: MemberPresence[]
	members: MemberPresence[]
	projectHealth: ProgressItem[]
	activity: ActivityItem[]
	teams: TeamCard[]
	projects: ProjectCard[]
	analyticsStats: StatCard[]
	settingsSections: string[]
	notificationSettings: Array<{ id: string; title: string; desc: string; enabled: boolean }>
}

export const pageTitles: Record<PanelId, string> = {
	dashboard: 'Overview Dashboard',
	analytics: 'Analytics',
	teams: 'Teams',
	projects: 'Projects',
	tasks: 'All Tasks',
	members: 'Members',
	settings: 'Settings',
}

export const ceoDashboardData: DashboardData = {
	orgName: 'Nexaflow Inc.',
	currentUser: {
		initials: 'RK',
		name: 'Rahul Kumar',
		role: 'CEO & Admin',
		title: 'CEO & Founder',
		email: 'rahul@nexaflow.com',
	},
	nav: {
		overview: [
			{ id: 'dashboard', label: 'Dashboard', short: 'DB' },
			{ id: 'analytics', label: 'Analytics', short: 'AN' },
		],
		workspace: [
			{ id: 'teams', label: 'Teams', short: 'TM' },
			{ id: 'projects', label: 'Projects', short: 'PR', badge: '4' },
			{ id: 'tasks', label: 'Tasks', short: 'TS' },
			{ id: 'members', label: 'Members', short: 'MB' },
		],
		system: [{ id: 'settings', label: 'Settings', short: 'ST' }],
	},
	stats: [
		{ id: 'active-projects', label: 'Active Projects', value: '4', delta: '+1 this week', trend: 'up', tone: 'cyan' },
		{ id: 'team-members', label: 'Team Members', value: '12', delta: '+2 new', trend: 'up', tone: 'purple' },
		{ id: 'open-tasks', label: 'Open Tasks', value: '38', delta: '-5 overdue', trend: 'down', tone: 'yellow' },
		{ id: 'sprint-progress', label: 'Sprint Progress', value: '72%', delta: 'On track', trend: 'up', tone: 'green' },
	],
	todayTasks: [
		{ id: 't1', name: 'Update landing page copy', chip: 'Design', chipTone: 'design', done: true },
		{ id: 't2', name: 'Fix auth token bug', chip: 'Dev', chipTone: 'dev', done: false },
		{ id: 't3', name: 'Review investor deck v3', chip: 'Ops', chipTone: 'ops', done: false },
		{ id: 't4', name: 'Set up CI/CD pipeline', chip: 'Dev', chipTone: 'dev', done: true },
		{ id: 't5', name: 'Onboard 2 new engineers', chip: 'HR', chipTone: 'hr', done: false },
	],
	allTasks: [
		{ id: 'a1', name: 'Update landing page copy', chip: 'Design', chipTone: 'design', done: true, assignee: 'Priya S.' },
		{ id: 'a2', name: 'Fix auth token bug', chip: 'Dev', chipTone: 'dev', done: false, assignee: 'Arjun K.' },
		{ id: 'a3', name: 'Review investor deck v3', chip: 'Ops', chipTone: 'ops', done: false, assignee: 'Rahul K.' },
		{ id: 'a4', name: 'Set up CI/CD pipeline', chip: 'Dev', chipTone: 'dev', done: true, assignee: 'Sneha T.' },
		{ id: 'a5', name: 'Onboard 2 new engineers', chip: 'HR', chipTone: 'hr', done: false, assignee: 'Rahul K.' },
		{ id: 'a6', name: 'Write API documentation', chip: 'Dev', chipTone: 'dev', done: false, assignee: 'Arjun K.' },
		{ id: 'a7', name: 'Social media campaign brief', chip: 'Marketing', chipTone: 'ops', done: false, assignee: 'Mohan R.' },
	],
	onlineMembers: [
		{ id: 'm1', initials: 'AK', name: 'Arjun K.', role: 'Lead Dev', online: true, tone: 'cyan-purple' },
		{ id: 'm2', initials: 'PS', name: 'Priya S.', role: 'Designer', online: true, tone: 'purple-red' },
		{ id: 'm3', initials: 'MR', name: 'Mohan R.', role: 'Marketing', online: false, tone: 'yellow-cyan' },
		{ id: 'm4', initials: 'ST', name: 'Sneha T.', role: 'Backend', online: true, tone: 'green-purple' },
	],
	members: [
		{ id: 'u1', initials: 'RK', name: 'Rahul Kumar (You)', role: 'CEO - Admin', team: 'Unassigned', online: true, tone: 'cyan-purple' },
		{ id: 'u2', initials: 'AK', name: 'Arjun Kumar', role: 'Engineering - Lead Dev', team: 'Engineering', online: true, tone: 'cyan-green' },
		{ id: 'u3', initials: 'PS', name: 'Priya Singh', role: 'Design - UI/UX Lead', team: 'Design', online: true, tone: 'purple-red' },
		{ id: 'u4', initials: 'MR', name: 'Mohan Rao', role: 'Marketing - Growth', team: 'Marketing', online: false, tone: 'yellow-cyan' },
		{ id: 'u5', initials: 'ST', name: 'Sneha Tiwari', role: 'Engineering - Backend', team: 'Engineering', online: true, tone: 'green-purple' },
	],
	projectHealth: [
		{ id: 'p1', name: 'TaskIQ App MVP', value: 72, tone: 'cyan' },
		{ id: 'p2', name: 'Marketing Website', value: 90, tone: 'green' },
		{ id: 'p3', name: 'API Integration', value: 45, tone: 'yellow' },
		{ id: 'p4', name: 'Mobile App', value: 20, tone: 'cyan' },
	],
	activity: [
		{ id: 'ac1', label: 'Arjun completed "Setup auth module"', time: '2 min ago', tone: 'cyan' },
		{ id: 'ac2', label: 'You added Sneha to Design Team', time: '1 hr ago', tone: 'purple' },
		{ id: 'ac3', label: 'Priya created project "Mobile App"', time: '3 hr ago', tone: 'yellow' },
		{ id: 'ac4', label: 'Mohan joined Marketing Team', time: 'Yesterday', tone: 'green' },
	],
	teams: [
		{
			id: 'team1',
			name: 'Engineering',
			description: 'Core product development, infrastructure, and DevOps.',
			tag: 'Build',
			members: [
				{ initials: 'AK', tone: 'cyan-purple' },
				{ initials: 'ST', tone: 'green-cyan' },
				{ initials: 'VN', tone: 'yellow-red' },
				{ initials: '+2', tone: 'muted' },
			],
			totalMembers: 5,
		},
		{
			id: 'team2',
			name: 'Design',
			description: 'UI/UX, branding, and product design across all platforms.',
			tag: 'Design',
			members: [
				{ initials: 'PS', tone: 'purple-red' },
				{ initials: 'RD', tone: 'red-yellow' },
			],
			totalMembers: 2,
		},
		{
			id: 'team3',
			name: 'Marketing',
			description: 'Growth, content strategy, social media, and campaigns.',
			tag: 'Growth',
			members: [
				{ initials: 'MR', tone: 'yellow-cyan' },
				{ initials: 'KL', tone: 'green-yellow' },
				{ initials: 'NP', tone: 'red-purple' },
			],
			totalMembers: 3,
		},
	],
	projects: [
		{
			id: 'proj1',
			name: 'TaskIQ App MVP',
			description: 'Core platform build with auth, tasks, teams, and dashboard modules.',
			due: 'Mar 30',
			completedTasks: 18,
			totalTasks: 25,
			team: 'Engineering',
			progress: 72,
			status: 'active',
		},
		{
			id: 'proj2',
			name: 'Marketing Website',
			description: 'Public-facing marketing site, landing pages, and blog setup.',
			due: 'Mar 15',
			completedTasks: 9,
			totalTasks: 10,
			team: 'Design',
			progress: 90,
			status: 'active',
		},
		{
			id: 'proj3',
			name: 'API Integration',
			description: 'Slack, GitHub, and Google Calendar integration workflows.',
			due: 'Apr 10',
			completedTasks: 5,
			totalTasks: 11,
			team: 'Engineering',
			progress: 45,
			status: 'review',
		},
		{
			id: 'proj4',
			name: 'Mobile App',
			description: 'iOS and Android app build kickoff for Q2.',
			due: 'Jun 30',
			completedTasks: 2,
			totalTasks: 10,
			team: 'None assigned',
			progress: 20,
			status: 'planning',
		},
	],
	analyticsStats: [
		{ id: 'as1', label: 'Tasks Completed', value: '142', delta: '+18% this month', trend: 'up', tone: 'green' },
		{ id: 'as2', label: 'Avg Completion', value: '2.4d', delta: 'Faster than last sprint', trend: 'up', tone: 'cyan' },
		{ id: 'as3', label: 'Overdue', value: '5', delta: '+2 since last week', trend: 'down', tone: 'yellow' },
		{ id: 'as4', label: 'Team Velocity', value: '87%', delta: 'On track', trend: 'up', tone: 'purple' },
	],
	settingsSections: ['Profile', 'Organization', 'Security', 'Notifications', 'Billing', 'Integrations'],
	notificationSettings: [
		{ id: 'n1', title: 'Email Digest', desc: 'Daily summary of team activity', enabled: true },
		{ id: 'n2', title: 'Task Reminders', desc: 'Alerts for overdue tasks', enabled: true },
		{ id: 'n3', title: '@Mentions', desc: 'Notify when you are mentioned', enabled: false },
	],
}
