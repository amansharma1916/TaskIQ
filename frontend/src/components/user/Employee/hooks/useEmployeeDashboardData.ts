import { useCallback, useEffect, useMemo, useState } from 'react'
import { authorizedFetch } from '../../../../services/apiClient'
import { getAuthUser } from '../../../../services/auth'
import { getTasksPage, updateTaskStatus } from '../../../../services/tasks'
import type { ApiMember, ApiTaskStatus, PaginatedTaskListParams } from '../../CEOs/types/api.types'
import type {
  EmployeeDataState,
  EmployeeTaskPageState,
  EmployeeTaskQuery,
  EmployeeTaskRow,
  EmployeeTaskSummary,
} from '../types/employee.types'
import { mapApiTaskToEmployeeTaskRow } from '../utils/employeeMappers'

type UseEmployeeDashboardDataResult = {
  tasks: EmployeeTaskRow[]
  state: EmployeeDataState
  taskQuery: EmployeeTaskQuery
  taskPageState: EmployeeTaskPageState
  taskSummary: EmployeeTaskSummary
  currentMemberId: string | null
  currentMemberName: string | null
  canUpdateTaskStatus: (task: EmployeeTaskRow) => boolean
  setTaskQuery: (updater: (prev: EmployeeTaskQuery) => EmployeeTaskQuery) => void
  reloadTasks: (showLoading?: boolean) => Promise<void>
  reloadDashboard: (showLoading?: boolean) => Promise<void>
  onUpdateTaskStatus: (task: EmployeeTaskRow, status: ApiTaskStatus) => Promise<void>
}

const DEFAULT_TASK_QUERY: EmployeeTaskQuery = {
  q: '',
  status: 'all',
  priority: 'all',
  assignment: 'mine',
  page: 1,
  limit: 20,
  sortBy: 'createdAt',
  sortOrder: 'desc',
}

const DEFAULT_PAGE_STATE: EmployeeTaskPageState = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 1,
}

const getCurrentMember = async (): Promise<ApiMember | null> => {
  const response = await authorizedFetch('/api/members/me')
  if (!response.ok) {
    return null
  }

  return ((await response.json().catch(() => null)) as ApiMember | null) ?? null
}

const toTaskListParams = (query: EmployeeTaskQuery, currentMemberId: string | null): PaginatedTaskListParams => {
  const params: PaginatedTaskListParams = {
    q: query.q || undefined,
    status: query.status === 'all' ? undefined : query.status,
    priority: query.priority === 'all' ? undefined : query.priority,
    page: query.page,
    limit: query.limit,
    sortBy: query.sortBy,
    sortOrder: query.sortOrder,
  }

  if (query.assignment === 'mine' && currentMemberId) {
    params.assigneeMemberId = currentMemberId
  }

  return params
}

const isTaskOverdue = (task: EmployeeTaskRow): boolean => {
  if (!task.dueDate || task.status === 'done') {
    return false
  }

  const dueTime = new Date(task.dueDate).getTime()
  if (Number.isNaN(dueTime)) {
    return false
  }

  return dueTime < Date.now()
}

export const useEmployeeDashboardData = (): UseEmployeeDashboardDataResult => {
  const [tasks, setTasks] = useState<EmployeeTaskRow[]>([])
  const [taskQuery, setTaskQueryState] = useState<EmployeeTaskQuery>(DEFAULT_TASK_QUERY)
  const [taskPageState, setTaskPageState] = useState<EmployeeTaskPageState>(DEFAULT_PAGE_STATE)
  const [currentMemberId, setCurrentMemberId] = useState<string | null>(null)
  const [currentMemberName, setCurrentMemberName] = useState<string | null>(null)
  const [state, setState] = useState<EmployeeDataState>({
    isLoading: true,
    isRefreshing: false,
    isUpdatingStatus: false,
    error: '',
  })

  const setTaskQuery = useCallback((updater: (prev: EmployeeTaskQuery) => EmployeeTaskQuery) => {
    setTaskQueryState((prev) => updater(prev))
  }, [])

  const resolveMemberContext = useCallback(async (): Promise<ApiMember | null> => {
    const authUser = getAuthUser()
    const userId = authUser?.id

    if (!userId) {
      setCurrentMemberId(null)
      setCurrentMemberName(null)
      return null
    }

    const currentMember = await getCurrentMember()
    setCurrentMemberId(currentMember?._id ?? null)
    setCurrentMemberName(currentMember?.memberName ?? null)
    return currentMember
  }, [])

  const applyLoadingState = useCallback((showLoading: boolean) => {
    if (showLoading) {
      setState((prev) => ({ ...prev, isLoading: true, error: '' }))
      return
    }

    setState((prev) => ({ ...prev, isRefreshing: true, error: '' }))
  }, [])

  const clearLoadingState = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isLoading: false,
      isRefreshing: false,
      error: '',
    }))
  }, [])

  const applyLoadingError = useCallback((message: string) => {
    setTasks([])
    setTaskPageState(DEFAULT_PAGE_STATE)
    setState((prev) => ({
      ...prev,
      isLoading: false,
      isRefreshing: false,
      error: message,
    }))
  }, [])

  const reloadTasks = useCallback(
    async (showLoading = false) => {
      applyLoadingState(showLoading)
      try {
        const result = await getTasksPage(toTaskListParams(taskQuery, currentMemberId))
        setTasks(result.items.map(mapApiTaskToEmployeeTaskRow))
        setTaskPageState({
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        })
        clearLoadingState()
      } catch (error) {
        applyLoadingError(error instanceof Error ? error.message : 'Failed to load your tasks')
      }
    },
    [applyLoadingError, applyLoadingState, clearLoadingState, currentMemberId, taskQuery]
  )

  const reloadDashboard = useCallback(
    async (showLoading = false) => {
      applyLoadingState(showLoading)

      try {
        const currentMember = await resolveMemberContext()
        const result = await getTasksPage(toTaskListParams(taskQuery, currentMember?._id ?? null))
        setTasks(result.items.map(mapApiTaskToEmployeeTaskRow))
        setTaskPageState({
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages,
        })
        clearLoadingState()
      } catch (error) {
        applyLoadingError(error instanceof Error ? error.message : 'Failed to refresh your dashboard')
      }
    },
    [applyLoadingError, applyLoadingState, clearLoadingState, resolveMemberContext, taskQuery]
  )

  const canUpdateTaskStatus = useCallback(
    (task: EmployeeTaskRow): boolean => {
      if (!currentMemberId) {
        return false
      }

      return task.assigneeMemberId === currentMemberId
    },
    [currentMemberId]
  )

  const onUpdateTaskStatus = useCallback(
    async (task: EmployeeTaskRow, status: ApiTaskStatus) => {
      if (!canUpdateTaskStatus(task) || task.status === status) {
        return
      }

      setState((prev) => ({ ...prev, isUpdatingStatus: true, error: '' }))
      try {
        await updateTaskStatus(task.id, status)
        await reloadDashboard(false)
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isUpdatingStatus: false,
          error: error instanceof Error ? error.message : 'Failed to update task status',
        }))
        return
      }

      setState((prev) => ({ ...prev, isUpdatingStatus: false }))
    },
    [canUpdateTaskStatus, reloadTasks]
  )

  const taskSummary = useMemo<EmployeeTaskSummary>(() => {
    return tasks.reduce<EmployeeTaskSummary>(
      (summary, task) => {
        summary.total += 1
        if (task.status === 'todo') {
          summary.todo += 1
        }
        if (task.status === 'in-progress') {
          summary.inProgress += 1
        }
        if (task.status === 'done') {
          summary.done += 1
        }
        if (isTaskOverdue(task)) {
          summary.overdue += 1
        }

        return summary
      },
      {
        total: 0,
        todo: 0,
        inProgress: 0,
        done: 0,
        overdue: 0,
      }
    )
  }, [tasks])

  useEffect(() => {
    void reloadDashboard(true)
  }, [reloadDashboard])

  return {
    tasks,
    state,
    taskQuery,
    taskPageState,
    taskSummary,
    currentMemberId,
    currentMemberName,
    canUpdateTaskStatus,
    setTaskQuery,
    reloadTasks,
    reloadDashboard,
    onUpdateTaskStatus,
  }
}
