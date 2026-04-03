import { authorizedFetch } from './apiClient'
import type { ManagerActivityItem } from '../components/user/Manager/types/manager.types'

type ActivityApiItem = {
	_id?: string
	id?: string
	label?: string
	action?: string
	entityType?: string
	createdAt?: string
}

const timeAgo = (value?: string): string => {
	if (!value) {
		return 'Just now'
	}

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) {
		return 'Just now'
	}

	const diffMinutes = Math.floor((Date.now() - parsed.getTime()) / 60000)
	if (diffMinutes < 1) {
		return 'Just now'
	}
	if (diffMinutes < 60) {
		return `${diffMinutes}m ago`
	}

	const diffHours = Math.floor(diffMinutes / 60)
	if (diffHours < 24) {
		return `${diffHours}h ago`
	}

	const diffDays = Math.floor(diffHours / 24)
	return `${diffDays}d ago`
}

const mapActivity = (item: ActivityApiItem, index: number): ManagerActivityItem => ({
	id: item.id || item._id || `activity-${index}`,
	label: item.label || item.action || 'Activity recorded',
	time: timeAgo(item.createdAt),
	rawDate: item.createdAt ?? '',
	entity:
		item.entityType === 'project' ||
		item.entityType === 'task' ||
		item.entityType === 'team' ||
		item.entityType === 'member'
			? item.entityType
			: 'system',
})

export const getActivityFeed = async (limit = 50): Promise<ManagerActivityItem[]> => {
	const response = await authorizedFetch(`/api/activity?limit=${limit}`)

	// Backend endpoint may not exist yet during frontend-first implementation.
	if (response.status === 404) {
		return []
	}

	if (!response.ok) {
		throw new Error('Failed to load activity feed')
	}

	const payload = (await response.json().catch(() => [])) as ActivityApiItem[]
	return payload.map(mapActivity)
}
