export type PanelId =
	| 'dashboard'
	| 'analytics'
	| 'teams'
	| 'projects'
	| 'tasks'
	| 'updates'
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
	teams: string[]
	progress: number
	status: 'active' | 'review' | 'planning' | 'completed' | 'blocked'
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
