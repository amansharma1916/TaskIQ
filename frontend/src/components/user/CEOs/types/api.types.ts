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
	teamLead?:
		| string
		| {
				_id: string
				memberName?: string
		  }
		| null
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

export type ApiTaskStatus = 'todo' | 'in-progress' | 'done'

export type ApiTaskPriority = 'low' | 'medium' | 'high'

export type ApiTask = {
	_id: string
	title: string
	description?: string
	status: ApiTaskStatus
	priority: ApiTaskPriority
	dueDate?: string | null
	projectId?: {
		_id: string
		projectName?: string
	} | null
	teamId?: {
		_id: string
		teamName?: string
	} | null
	assignee?: {
		_id: string
		memberName?: string
		memberRole?: string
		userId?: string
	} | null
	createdBy?: string
	createdAt?: string
	updatedAt?: string
}

export type TaskListParams = {
	projectId?: string
	teamId?: string
	status?: ApiTaskStatus
	priority?: ApiTaskPriority
	assigneeMemberId?: string | 'unassigned'
	createdBy?: string
	q?: string
}

export type TaskListSortBy = 'createdAt' | 'dueDate' | 'status' | 'priority' | 'title'

export type TaskListSortOrder = 'asc' | 'desc'

export type PaginatedTaskListParams = TaskListParams & {
	page?: number
	limit?: number
	sortBy?: TaskListSortBy
	sortOrder?: TaskListSortOrder
}

export type ApiTaskListResponse = {
	items: ApiTask[]
	page: number
	limit: number
	total: number
	totalPages: number
	sortBy: TaskListSortBy
	sortOrder: TaskListSortOrder
}

export type CreateTaskPayload = {
	title: string
	description?: string
	status?: ApiTaskStatus
	priority?: ApiTaskPriority
	dueDate?: string | null
	projectId: string
	teamId?: string | null
	assigneeMemberId?: string | null
}

export type UpdateTaskPayload = Partial<CreateTaskPayload>

export type BulkTaskStatusPayload = {
	taskIds: string[]
	status: ApiTaskStatus
}

export type BulkTaskAssignPayload = {
	taskIds: string[]
	assigneeMemberId: string | null
}

export type BulkTaskDeletePayload = {
	taskIds: string[]
}

export type BulkTaskFailure = {
	taskId: string
	reason: string
}

export type BulkTaskSummary = {
	requested: number
	succeeded: number
	failed: number
}

export type BulkTaskResult = {
	message: string
	successIds: string[]
	failed: BulkTaskFailure[]
	summary?: BulkTaskSummary
}

export type DuplicateTaskPayload = {
	title?: string
}

export type ApiSettingsProfile = {
	id: string
	name: string
	workEmail: string
	role: string
	companyId?: string | null
}

export type UpdateSettingsProfilePayload = {
	name: string
	workEmail: string
}

export type ChangePasswordPayload = {
	currentPassword: string
	newPassword: string
}
