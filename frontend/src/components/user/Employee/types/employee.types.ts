import type { ApiTaskPriority, ApiTaskStatus, TaskListSortBy, TaskListSortOrder } from '../../CEOs/types/api.types'

export type EmployeePanelId = 'overview' | 'tasks' | 'settings'

export type EmployeeTaskRow = {
  id: string
  title: string
  description: string
  status: ApiTaskStatus
  priority: ApiTaskPriority
  dueDate: string | null
  dueLabel: string
  projectName: string
  teamName: string
  assigneeMemberId: string | null
  assigneeName: string | null
}

export type EmployeeAssignmentFilter = 'mine' | 'all'

export type EmployeeTaskQuery = {
  q: string
  status: ApiTaskStatus | 'all'
  priority: ApiTaskPriority | 'all'
  assignment: EmployeeAssignmentFilter
  page: number
  limit: number
  sortBy: TaskListSortBy
  sortOrder: TaskListSortOrder
}

export type EmployeeTaskPageState = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type EmployeeTaskSummary = {
  total: number
  todo: number
  inProgress: number
  done: number
  overdue: number
}

export type EmployeeDataState = {
  isLoading: boolean
  isRefreshing: boolean
  isUpdatingStatus: boolean
  error: string
}
