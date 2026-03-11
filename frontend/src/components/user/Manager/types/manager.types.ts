import type { ApiTaskPriority, ApiTaskStatus, TaskListSortBy, TaskListSortOrder } from '../../CEOs/types/api.types'
import type { ApiProjectStatus } from '../../CEOs/types/api.types'

export type ManagerPanelId = 'projects' | 'tasks' | 'teams' | 'activity' | 'my-assignments'

export type ManagerProjectCard = {
	id: string
	name: string
	description: string
	status: ApiProjectStatus
	dueDate: string | null
	dueLabel: string
	teamCount: number
	assignedTeamIds: string[]
	assignedTeamNames: string[]
}

export type ManagerTaskRow = {
	id: string
	title: string
	description: string
	status: ApiTaskStatus
	priority: ApiTaskPriority
	projectId: string | null
	projectName: string
	dueDate: string | null
	teamId: string | null
	teamName: string
	assigneeMemberId: string | null
	assigneeName: string | null
}

export type ManagerTaskQuery = {
	q: string
	status: ApiTaskStatus | 'all'
	priority: ApiTaskPriority | 'all'
	projectId: string | 'all'
	teamId: string | 'all'
	assigneeMemberId: string | 'all' | 'unassigned'
	page: number
	limit: number
	sortBy: TaskListSortBy
	sortOrder: TaskListSortOrder
}

export type ManagerTaskPageState = {
	page: number
	limit: number
	total: number
	totalPages: number
}

export type ManagerMemberOption = {
	id: string
	name: string
	teamId: string | null
	role?: string
}

export type ManagerTeamCard = {
	id: string
	name: string
	description: string
	tag: string
	totalMembers: number
}

export type ManagerActivityItem = {
	id: string
	label: string
	time: string
	entity: 'project' | 'task' | 'team' | 'member' | 'system'
}

export type ManagerDataState = {
	isLoading: boolean
	error: string
}
