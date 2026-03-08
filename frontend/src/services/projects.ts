import { authorizedFetch } from './apiClient'
import type { ApiProject, CreateProjectPayload, UpdateProjectPayload } from '../components/user/CEOs/types/api.types'

const getJsonOrNull = async <T>(response: Response): Promise<T | null> => {
	return (await response.json().catch(() => null)) as T | null
}

const throwFromResponse = async (response: Response, fallback: string): Promise<never> => {
	const result = await getJsonOrNull<{ message?: string }>(response)
	throw new Error(result?.message || fallback)
}

export const getProjects = async (): Promise<ApiProject[]> => {
	const response = await authorizedFetch('/api/projects')
	if (!response.ok) {
		await throwFromResponse(response, 'Failed to load projects')
	}

	return ((await response.json()) as ApiProject[]) ?? []
}

export const getProjectById = async (projectId: string): Promise<ApiProject> => {
	const response = await authorizedFetch(`/api/projects/${projectId}`)
	if (!response.ok) {
		await throwFromResponse(response, 'Failed to load project details')
	}

	return (await response.json()) as ApiProject
}

export const createProject = async (payload: CreateProjectPayload): Promise<ApiProject> => {
	const response = await authorizedFetch('/api/projects/create', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to create project')
	}

	return (await response.json()) as ApiProject
}

export const updateProject = async (projectId: string, payload: UpdateProjectPayload): Promise<ApiProject> => {
	const response = await authorizedFetch(`/api/projects/${projectId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to update project')
	}

	return (await response.json()) as ApiProject
}

export const deleteProject = async (projectId: string): Promise<void> => {
	const response = await authorizedFetch(`/api/projects/${projectId}`, {
		method: 'DELETE',
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to delete project')
	}
}

export const assignTeams = async (projectId: string, teamIds: string[]): Promise<ApiProject> => {
	const response = await authorizedFetch(`/api/projects/${projectId}/assign-teams`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ teamIds }),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to assign teams')
	}

	return (await response.json()) as ApiProject
}

export const revokeTeams = async (projectId: string, teamIds: string[]): Promise<ApiProject> => {
	const response = await authorizedFetch(`/api/projects/${projectId}/revoke-teams`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ teamIds }),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to revoke teams')
	}

	return (await response.json()) as ApiProject
}
