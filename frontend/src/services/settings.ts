import { authorizedFetch } from './apiClient'
import type {
	ApiSettingsProfile,
	ChangePasswordPayload,
	UpdateSettingsProfilePayload,
} from '../components/user/CEOs/types/api.types'

const getJsonOrNull = async <T>(response: Response): Promise<T | null> => {
	return (await response.json().catch(() => null)) as T | null
}

const throwFromResponse = async (response: Response, fallback: string): Promise<never> => {
	const result = await getJsonOrNull<{ message?: string }>(response)
	throw new Error(result?.message || fallback)
}

type ProfileResponse = {
	user: ApiSettingsProfile
}

export const getMySettingsProfile = async (): Promise<ApiSettingsProfile> => {
	const response = await authorizedFetch('/api/auth/users/me')
	if (!response.ok) {
		await throwFromResponse(response, 'Failed to load profile')
	}

	const payload = (await response.json()) as ProfileResponse
	return payload.user
}

export const updateMySettingsProfile = async (payload: UpdateSettingsProfilePayload): Promise<ApiSettingsProfile> => {
	const response = await authorizedFetch('/api/auth/users/me', {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to update profile')
	}

	const result = (await response.json()) as ProfileResponse
	return result.user
}

export const changeMyPassword = async (payload: ChangePasswordPayload): Promise<void> => {
	const response = await authorizedFetch('/api/auth/users/me/password', {
		method: 'PATCH',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(payload),
	})

	if (!response.ok) {
		await throwFromResponse(response, 'Failed to update password')
	}
}
