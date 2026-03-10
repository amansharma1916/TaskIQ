import { authorizedFetch } from './apiClient'
import type {
	ApiTask,
	ApiTaskStatus,
	CreateTaskPayload,
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

export const getTasks = async (params: TaskListParams = {}): Promise<ApiTask[]> => {
	const response = await authorizedFetch(`/api/tasks${toQuery(params)}`)
	if (!response.ok) {
		await throwFromResponse(response, 'Failed to load tasks')
	}

	return ((await response.json()) as ApiTask[]) ?? []
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
