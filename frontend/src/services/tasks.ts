import { authorizedFetch } from './apiClient'
import type {
	ApiTaskListResponse,
	ApiTask,
	ApiTaskStatus,
	BulkTaskAssignPayload,
	BulkTaskDeletePayload,
	BulkTaskResult,
	BulkTaskStatusPayload,
	CreateTaskPayload,
	DuplicateTaskPayload,
	PaginatedTaskListParams,
	TaskListParams,
	UpdateTaskPayload,
} from '../components/user/CEOs/types/api.types'

const getJsonOrNull = async <T>(response: Response): Promise<T | null> => {
	return (await response.json().catch(() => null)) as T | null
}

const throwFromResponse = async (response: Response, fallback: string): Promise<never> => {
	const result = await getJsonOrNull<{ message?: string }>(response)
	throw new Error(result?.message || fallback)
}

const toQuery = (params: TaskListParams = {}): string => {
	const query = new URLSearchParams()

	if (params.projectId) {
		query.set('projectId', params.projectId)
	}
	if (params.status) {
		query.set('status', params.status)
	}
	if (params.teamId) {
		query.set('teamId', params.teamId)
	}
	if (params.priority) {
		query.set('priority', params.priority)
	}
	if (params.assigneeMemberId) {
		query.set('assigneeMemberId', params.assigneeMemberId)
	}
	if (params.createdBy) {
		query.set('createdBy', params.createdBy)
	}
	if (params.q?.trim()) {
		query.set('q', params.q.trim())
	}

	const queryString = query.toString()
	return queryString ? `?${queryString}` : ''
}

const toPaginatedQuery = (params: PaginatedTaskListParams = {}): string => {
	const query = new URLSearchParams()

	if (params.projectId) {
		query.set('projectId', params.projectId)
	}
	if (params.status) {
		query.set('status', params.status)
	}
	if (params.teamId) {
		query.set('teamId', params.teamId)
	}
	if (params.priority) {
		query.set('priority', params.priority)
	}
	if (params.assigneeMemberId) {
		query.set('assigneeMemberId', params.assigneeMemberId)
	}
	if (params.createdBy) {
		query.set('createdBy', params.createdBy)
	}
	if (params.q?.trim()) {
		query.set('q', params.q.trim())
	}
	if (typeof params.page === 'number' && params.page > 0) {
		query.set('page', String(params.page))
	}
	if (typeof params.limit === 'number' && params.limit > 0) {
		query.set('limit', String(params.limit))
	}
	if (params.sortBy) {
		query.set('sortBy', params.sortBy)
	}
	if (params.sortOrder) {
		query.set('sortOrder', params.sortOrder)
	}

	const queryString = query.toString()
	return queryString ? `?${queryString}` : ''
}

export const getTasks = async (params: TaskListParams = {}): Promise<ApiTask[]> => {
	const response = await authorizedFetch(`/api/tasks${toQuery(params)}`)
	if (!response.ok) {
		await throwFromResponse(response, 'Failed to load tasks')
	}

	return ((await response.json()) as ApiTask[]) ?? []
}

export const getTasksPage = async (params: PaginatedTaskListParams = {}): Promise<ApiTaskListResponse> => {
	const response = await authorizedFetch(`/api/tasks${toPaginatedQuery(params)}`)
	if (!response.ok) {
		await throwFromResponse(response, 'Failed to load tasks')
	}

	const result = (await response.json()) as ApiTaskListResponse
	return {
		items: result.items ?? [],
		page: result.page ?? 1,
		limit: result.limit ?? params.limit ?? 20,
		total: result.total ?? 0,
		totalPages: result.totalPages ?? 1,
		sortBy: result.sortBy ?? params.sortBy ?? 'createdAt',
		sortOrder: result.sortOrder ?? params.sortOrder ?? 'desc',
	}
}

export const createTask = async (payload: CreateTaskPayload): Promise<ApiTask> => {
	const response = await authorizedFetch('/api/tasks/create', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to create task')
	}

	return (await response.json()) as ApiTask
}

export const updateTask = async (taskId: string, payload: UpdateTaskPayload): Promise<ApiTask> => {
	const response = await authorizedFetch(`/api/tasks/${taskId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to update task')
	}

	return (await response.json()) as ApiTask
}

export const deleteTask = async (taskId: string): Promise<void> => {
	const response = await authorizedFetch(`/api/tasks/${taskId}`, {
		method: 'DELETE',
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to delete task')
	}
}

export const updateTaskStatus = async (taskId: string, status: ApiTaskStatus): Promise<ApiTask> => {
	const response = await authorizedFetch(`/api/tasks/${taskId}/status`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ status }),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to update task status')
	}

	return (await response.json()) as ApiTask
}

export const assignTask = async (taskId: string, assigneeMemberId: string | null): Promise<ApiTask> => {
	const response = await authorizedFetch(`/api/tasks/${taskId}/assign`, {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ assigneeMemberId }),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to assign task')
	}

	return (await response.json()) as ApiTask
}

export const bulkUpdateTaskStatus = async (payload: BulkTaskStatusPayload): Promise<BulkTaskResult> => {
	const response = await authorizedFetch('/api/tasks/bulk/status', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to bulk update task status')
	}

	const result = (await response.json()) as BulkTaskResult
	return {
		...result,
		summary: result.summary ?? {
			requested: payload.taskIds.length,
			succeeded: result.successIds.length,
			failed: result.failed.length,
		},
	}
}

export const bulkAssignTask = async (payload: BulkTaskAssignPayload): Promise<BulkTaskResult> => {
	const response = await authorizedFetch('/api/tasks/bulk/assign', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to bulk assign tasks')
	}

	const result = (await response.json()) as BulkTaskResult
	return {
		...result,
		summary: result.summary ?? {
			requested: payload.taskIds.length,
			succeeded: result.successIds.length,
			failed: result.failed.length,
		},
	}
}

export const bulkDeleteTask = async (payload: BulkTaskDeletePayload): Promise<BulkTaskResult> => {
	const response = await authorizedFetch('/api/tasks/bulk/delete', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to bulk delete tasks')
	}

	const result = (await response.json()) as BulkTaskResult
	return {
		...result,
		summary: result.summary ?? {
			requested: payload.taskIds.length,
			succeeded: result.successIds.length,
			failed: result.failed.length,
		},
	}
}

export const duplicateTask = async (taskId: string, payload: DuplicateTaskPayload = {}): Promise<ApiTask> => {
	const response = await authorizedFetch(`/api/tasks/${taskId}/duplicate`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to duplicate task')
	}

	return (await response.json()) as ApiTask
}
