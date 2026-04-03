import { authorizedFetch } from './apiClient'
import type { ApiTeam } from '../components/user/CEOs/types/api.types'

export type CreateTeamPayload = {
	teamName: string
	teamDescription?: string
	teamTags?: string[]
}

export type SendManagerInvitePayload = {
	name: string
	email: string
	role: 'Manager' | 'Employee'
	scopeTeamIds: string[]
}

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

export const createTeam = async (payload: CreateTeamPayload): Promise<ApiTeam> => {
	const response = await authorizedFetch('/api/teams/create', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			teamName: payload.teamName,
			teamDescription: payload.teamDescription ?? '',
			teamTags: payload.teamTags ?? [],
		}),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to create team')
	}

	return (await response.json()) as ApiTeam
}

export const setTeamLead = async (teamId: string, memberId: string): Promise<void> => {
	const response = await authorizedFetch('/api/teams/set-lead', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({ teamId, memberId }),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to set team lead')
	}
}

export const sendManagerInvite = async (payload: SendManagerInvitePayload): Promise<void> => {
	const response = await authorizedFetch('/api/invite/invite', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			name: payload.name,
			email: payload.email,
			role: payload.role,
			scopeType: 'team',
			scopeTeamIds: payload.scopeTeamIds,
		}),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to send invite')
	}
}
