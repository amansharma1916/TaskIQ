export type ApiMember = {
	_id: string
	memberName: string
	memberRole?: string
	userId?: string | { _id: string } | null
	memberTeam?: {
		_id: string
		teamName?: string
	} | null
}

export type ApiTeam = {
	_id: string
	teamName: string
	teamDescription?: string
	teamTags?: string[]
	totalMembers?: number
	teamMembers?: Array<{
		_id: string
		memberName?: string
	}>
}

export type ApiProjectStatus = 'planning' | 'active' | 'review' | 'completed' | 'blocked'

export type ApiProjectTeam = {
	_id: string
	teamName?: string
	teamDescription?: string
	totalMembers?: number
}

export type ApiProject = {
	_id: string
	projectName: string
	projectDescription?: string
	projectStatus: ApiProjectStatus
	dueDate?: string | null
	progress?: number
	completedTasks?: number
	totalTasks?: number
	assignedTeams?: ApiProjectTeam[]
	createdAt?: string
	updatedAt?: string
}

export type CreateProjectPayload = {
	projectName: string
	projectDescription?: string
	projectStatus?: ApiProjectStatus
	dueDate?: string | null
	progress?: number
	completedTasks?: number
	totalTasks?: number
	assignedTeams?: string[]
}

export type UpdateProjectPayload = Partial<CreateProjectPayload>
