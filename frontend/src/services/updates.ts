import { authorizedFetch } from './apiClient'

type UpdatePriority = 'low' | 'medium' | 'high'
type VisibilityRole = 'CEO' | 'Manager' | 'Employee'
type AudienceMode = 'company' | 'teams' | 'projectTeams'

type ApiUpdateTeam = {
  _id: string
  teamName?: string
}

type ApiUpdateProject = {
  _id: string
  projectName?: string
}

type ApiUpdateAuthor = {
  _id: string
  name?: string
  role?: string
}

type ApiUpdateItem = {
  _id: string
  title: string
  body: string
  priority: UpdatePriority
  isPinned: boolean
  audienceMode: AudienceMode
  visibleRoles: VisibilityRole[]
  targetTeamIds: ApiUpdateTeam[]
  projectId?: ApiUpdateProject | null
  createdByUserId?: ApiUpdateAuthor | null
  createdAt: string
  isRead?: boolean
}

type ApiUpdatePage = {
  items: ApiUpdateItem[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type ManagerUpdateItem = {
  id: string
  title: string
  body: string
  priority: UpdatePriority
  isPinned: boolean
  audienceMode: AudienceMode
  visibleRoles: VisibilityRole[]
  teamNames: string[]
  projectId: string | null
  projectName: string | null
  authorName: string
  authorRole: string
  createdAt: string
  time: string
  isRead: boolean
}

export type CreateUpdatePayload = {
  title: string
  body: string
  priority: UpdatePriority
  isPinned?: boolean
  projectId?: string | null
  audience: {
    mode: AudienceMode
    teamIds?: string[]
    roles?: VisibilityRole[]
  }
}

const getJsonOrNull = async <T>(response: Response): Promise<T | null> => {
  return (await response.json().catch(() => null)) as T | null
}

const throwFromResponse = async (response: Response, fallback: string): Promise<never> => {
  const result = await getJsonOrNull<{ message?: string }>(response)
  throw new Error(result?.message || fallback)
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

const mapUpdate = (item: ApiUpdateItem): ManagerUpdateItem => ({
  id: item._id,
  title: item.title,
  body: item.body,
  priority: item.priority,
  isPinned: item.isPinned,
  audienceMode: item.audienceMode,
  visibleRoles: item.visibleRoles ?? [],
  teamNames: (item.targetTeamIds ?? []).map((team) => team.teamName || 'Team'),
  projectId: item.projectId?._id ?? null,
  projectName: item.projectId?.projectName ?? null,
  authorName: item.createdByUserId?.name || 'Unknown',
  authorRole: item.createdByUserId?.role || 'Unknown',
  createdAt: item.createdAt,
  time: timeAgo(item.createdAt),
  isRead: Boolean(item.isRead),
})

export const getUpdatesFeed = async (params?: {
  limit?: number
  page?: number
  projectId?: string
  unreadOnly?: boolean
}): Promise<{ items: ManagerUpdateItem[]; page: number; limit: number; total: number; totalPages: number }> => {
  const search = new URLSearchParams()
  if (params?.limit) {
    search.set('limit', String(params.limit))
  }
  if (params?.page) {
    search.set('page', String(params.page))
  }
  if (params?.projectId) {
    search.set('projectId', params.projectId)
  }
  if (params?.unreadOnly) {
    search.set('unreadOnly', 'true')
  }

  const response = await authorizedFetch(`/api/updates${search.size > 0 ? `?${search.toString()}` : ''}`)
  if (!response.ok) {
    await throwFromResponse(response, 'Failed to load updates feed')
  }

  const payload = (await response.json().catch(() => null)) as ApiUpdatePage | null
  const items = payload?.items?.map(mapUpdate) ?? []

  return {
    items,
    page: payload?.page ?? 1,
    limit: payload?.limit ?? 30,
    total: payload?.total ?? items.length,
    totalPages: payload?.totalPages ?? 1,
  }
}

export const getUpdatesUnreadCount = async (): Promise<number> => {
  const response = await authorizedFetch('/api/updates/unread-count')
  if (!response.ok) {
    await throwFromResponse(response, 'Failed to load unread updates count')
  }

  const payload = (await response.json().catch(() => null)) as { unreadCount?: number } | null
  return payload?.unreadCount ?? 0
}

export const createUpdate = async (payload: CreateUpdatePayload): Promise<ManagerUpdateItem> => {
  const response = await authorizedFetch('/api/updates', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await throwFromResponse(response, 'Failed to create update')
  }

  const item = (await response.json()) as ApiUpdateItem
  return mapUpdate(item)
}

export const markUpdateRead = async (updateId: string): Promise<void> => {
  const response = await authorizedFetch(`/api/updates/${updateId}/read`, {
    method: 'POST',
  })

  if (!response.ok) {
    await throwFromResponse(response, 'Failed to mark update as read')
  }
}

export const editUpdate = async (
  updateId: string,
  payload: Partial<{
    title: string
    body: string
    priority: UpdatePriority
    isPinned: boolean
    projectId: string | null
    visibleRoles: VisibilityRole[]
    audience: {
      mode: AudienceMode
      teamIds?: string[]
      roles?: VisibilityRole[]
    }
  }>
): Promise<ManagerUpdateItem> => {
  const response = await authorizedFetch(`/api/updates/${updateId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    await throwFromResponse(response, 'Failed to update post')
  }

  const item = (await response.json()) as ApiUpdateItem
  return mapUpdate(item)
}

export const setUpdatePinned = async (updateId: string, isPinned: boolean): Promise<ManagerUpdateItem> => {
  const response = await authorizedFetch(`/api/updates/${updateId}/pin`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ isPinned }),
  })

  if (!response.ok) {
    await throwFromResponse(response, 'Failed to update pin state')
  }

  const item = (await response.json()) as ApiUpdateItem
  return mapUpdate(item)
}

export const deleteUpdate = async (updateId: string): Promise<void> => {
  const response = await authorizedFetch(`/api/updates/${updateId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    await throwFromResponse(response, 'Failed to delete update')
  }
}
