import { authorizedFetch } from './apiClient'
import type { ApiTeam } from '../components/user/CEOs/types/api.types'

const getJsonOrNull = async <T>(response: Response): Promise<T | null> => {
	return (await response.json().catch(() => null)) as T | null
}

const throwFromResponse = async (response: Response, fallback: string): Promise<never> => {
	const result = await getJsonOrNull<{ message?: string }>(response)
	throw new Error(result?.message || fallback)
}

export const getTeams = async (): Promise<ApiTeam[]> => {
	const response = await authorizedFetch('/api/teams')
	if (!response.ok) {
		await throwFromResponse(response, 'Failed to load teams')
	}

	return ((await response.json()) as ApiTeam[]) ?? []
}

export const addTeamMember = async (teamId: string, memberId: string): Promise<void> => {
	const response = await authorizedFetch('/api/teams/add-member', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ teamId, memberId }),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to add member to team')
	}
}

export const removeTeamMember = async (teamId: string, memberId: string): Promise<void> => {
	const response = await authorizedFetch('/api/teams/remove-member', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ teamId, memberId }),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to revoke member from team')
	}
}
