import { useCallback, useEffect, useState } from 'react'
import { getProjects } from '../../../../services/projects'
import { getTasks } from '../../../../services/tasks'
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
	ManagerTaskRow,
	ManagerTeamCard,
} from '../types/manager.types'
import type { ApiMember } from '../../CEOs/types/api.types'

type UseManagerDashboardDataResult = {
	projects: ManagerProjectCard[]
	tasks: ManagerTaskRow[]
	teams: ManagerTeamCard[]
	activity: ManagerActivityItem[]
	myAssignedTasks: ManagerTaskRow[]
	teamBacklogTasks: ManagerTaskRow[]
	state: ManagerDataState
	members: ManagerMemberOption[]
	reloadAll: () => Promise<void>
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
	const [state, setState] = useState<ManagerDataState>({
		isLoading: true,
		error: '',
	})

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
			const currentMemberId = memberRows.find((member) => {
				const memberUserId = typeof member.userId === 'string' ? member.userId : member.userId?._id
				return memberUserId === authUser?.id
			})?._id

			setMembers(
				memberRows.map((member) => ({
					id: member._id,
					name: member.memberName,
					teamId: member.memberTeam?._id ?? null,
				}))
			)

			setProjects(projectRows.map(mapApiProjectToManagerCard))
			const mappedTasks = taskRows.map(mapApiTaskToManagerTaskRow)
			setTasks(mappedTasks)
			setTeams(teamRows.map(mapApiTeamToManagerTeamCard))
			setActivity(activityRows)

			const assignedToMe = mappedTasks.filter((task) => task.assigneeMemberId && task.assigneeMemberId === currentMemberId)
			const teamBacklog = mappedTasks.filter(
				(task) => task.status !== 'done' && (!task.assigneeMemberId || task.assigneeMemberId !== currentMemberId)
			)

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

	return {
		projects,
		tasks,
		teams,
		activity,
		members,
		myAssignedTasks,
		teamBacklogTasks,
		state,
		reloadAll,
	}
}
