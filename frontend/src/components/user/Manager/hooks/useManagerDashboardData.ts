import { useCallback, useEffect, useState } from 'react'
import { getProjects } from '../../../../services/projects'
import { getTasks, getTasksPage } from '../../../../services/tasks'
import { getTeams } from '../../../../services/teams'
import { getActivityFeed } from '../../../../services/activity'
import { authorizedFetch } from '../../../../services/apiClient'
import { getAuthUser } from '../../../../services/auth'
import { mapApiProjectToManagerCard, mapApiTaskToManagerTaskRow, mapApiTeamToManagerTeamCard } from '../utils/managerMappers'
import type {
	ManagerActivityItem,
	ManagerDataState,
	ManagerMemberOption,
	ManagerProjectCard,
	ManagerTaskPageState,
	ManagerTaskQuery,
	ManagerTaskRow,
	ManagerTeamCard,
} from '../types/manager.types'
import type { ApiMember, PaginatedTaskListParams } from '../../CEOs/types/api.types'

type UseManagerDashboardDataResult = {
	projects: ManagerProjectCard[]
	tasks: ManagerTaskRow[]
	teams: ManagerTeamCard[]
	activity: ManagerActivityItem[]
	myAssignedTasks: ManagerTaskRow[]
	teamBacklogTasks: ManagerTaskRow[]
	state: ManagerDataState
	members: ManagerMemberOption[]
	taskQuery: ManagerTaskQuery
	taskPageState: ManagerTaskPageState
	setTaskQuery: (updater: (prev: ManagerTaskQuery) => ManagerTaskQuery) => void
	reloadTasks: () => Promise<void>
	reloadAll: () => Promise<void>
}

const DEFAULT_TASK_QUERY: ManagerTaskQuery = {
	q: '',
	status: 'all',
	priority: 'all',
	projectId: 'all',
	teamId: 'all',
	assigneeMemberId: 'all',
	page: 1,
	limit: 20,
	sortBy: 'createdAt',
	sortOrder: 'desc',
}

const toTaskListParams = (query: ManagerTaskQuery): PaginatedTaskListParams => {
	return {
		q: query.q || undefined,
		status: query.status === 'all' ? undefined : query.status,
		priority: query.priority === 'all' ? undefined : query.priority,
		projectId: query.projectId === 'all' ? undefined : query.projectId,
		teamId: query.teamId === 'all' ? undefined : query.teamId,
		assigneeMemberId: query.assigneeMemberId === 'all' ? undefined : query.assigneeMemberId,
		page: query.page,
		limit: query.limit,
		sortBy: query.sortBy,
		sortOrder: query.sortOrder,
	}
}

const getCompanyMembers = async (): Promise<ApiMember[]> => {
	const response = await authorizedFetch('/api/members')
	if (!response.ok) {
		return []
	}

	return ((await response.json().catch(() => [])) as ApiMember[]) ?? []
}

export const useManagerDashboardData = (): UseManagerDashboardDataResult => {
	const [projects, setProjects] = useState<ManagerProjectCard[]>([])
	const [tasks, setTasks] = useState<ManagerTaskRow[]>([])
	const [teams, setTeams] = useState<ManagerTeamCard[]>([])
	const [activity, setActivity] = useState<ManagerActivityItem[]>([])
	const [members, setMembers] = useState<ManagerMemberOption[]>([])
	const [myAssignedTasks, setMyAssignedTasks] = useState<ManagerTaskRow[]>([])
	const [teamBacklogTasks, setTeamBacklogTasks] = useState<ManagerTaskRow[]>([])
	const [taskQuery, setTaskQueryState] = useState<ManagerTaskQuery>(DEFAULT_TASK_QUERY)
	const [taskPageState, setTaskPageState] = useState<ManagerTaskPageState>({
		page: 1,
		limit: 20,
		total: 0,
		totalPages: 1,
	})
	const [state, setState] = useState<ManagerDataState>({
		isLoading: true,
		error: '',
	})

	const setTaskQuery = useCallback((updater: (prev: ManagerTaskQuery) => ManagerTaskQuery) => {
		setTaskQueryState((prev) => updater(prev))
	}, [])

	const reloadTasks = useCallback(async () => {
		try {
			const taskPage = await getTasksPage(toTaskListParams(taskQuery))
			setTasks(taskPage.items.map(mapApiTaskToManagerTaskRow))
			setTaskPageState({
				page: taskPage.page,
				limit: taskPage.limit,
				total: taskPage.total,
				totalPages: taskPage.totalPages,
			})
		} catch (error) {
			setState((prev) => ({
				...prev,
				error: error instanceof Error ? error.message : 'Failed to load tasks',
			}))
		}
	}, [taskQuery])

	const reloadAll = useCallback(async () => {
		setState({ isLoading: true, error: '' })

		try {
			const [projectRows, taskRows, teamRows, activityRows, memberRows] = await Promise.all([
				getProjects(),
				getTasks(),
				getTeams(),
				getActivityFeed(),
				getCompanyMembers(),
			])

			const authUser = getAuthUser()
			const currentMember = memberRows.find((member) => {
				const memberUserId = typeof member.userId === 'string' ? member.userId : member.userId?._id
				return memberUserId === authUser?.id
			})
			const currentMemberId = currentMember?._id
			const currentMemberTeamId = currentMember?.memberTeam?._id ?? null

			setMembers(
				memberRows.map((member) => ({
					id: member._id,
					name: member.memberName,
					teamId: member.memberTeam?._id ?? null,
					role: member.memberRole,
				}))
			)

			setProjects(projectRows.map(mapApiProjectToManagerCard))
			const mappedTasks = taskRows.map(mapApiTaskToManagerTaskRow)
			setTeams(teamRows.map(mapApiTeamToManagerTeamCard))
			setActivity(activityRows)

			const assignedToMe = mappedTasks.filter((task) => task.assigneeMemberId && task.assigneeMemberId === currentMemberId)
			const teamBacklog = currentMemberTeamId
				? mappedTasks.filter(
					(task) =>
						task.status !== 'done' &&
						task.teamId === currentMemberTeamId &&
						task.assigneeMemberId !== currentMemberId
				)
				: []

			setMyAssignedTasks(assignedToMe)
			setTeamBacklogTasks(teamBacklog)
			setState({ isLoading: false, error: '' })
		} catch (error) {
			setMembers([])
			setMyAssignedTasks([])
			setTeamBacklogTasks([])
			setState({
				isLoading: false,
				error: error instanceof Error ? error.message : 'Failed to load manager dashboard data',
			})
		}
	}, [])

	useEffect(() => {
		void reloadAll()
	}, [reloadAll])

	useEffect(() => {
		void reloadTasks()
	}, [reloadTasks])

	return {
		projects,
		tasks,
		teams,
		activity,
		members,
		myAssignedTasks,
		teamBacklogTasks,
		taskQuery,
		taskPageState,
		setTaskQuery,
		reloadTasks,
		state,
		reloadAll,
	}
}
