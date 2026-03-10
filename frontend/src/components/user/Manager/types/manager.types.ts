import type { ApiTaskStatus } from '../../CEOs/types/api.types'
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
	status: ApiTaskStatus
	priority: string
	projectName: string
	teamId: string | null
	teamName: string
	assigneeMemberId: string | null
	assigneeName: string | null
}

export type ManagerMemberOption = {
	id: string
	name: string
	teamId: string | null
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
