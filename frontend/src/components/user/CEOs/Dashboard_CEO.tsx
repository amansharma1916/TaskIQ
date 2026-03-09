import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../styles/user/CEOs/Dashboard_CEO.css'
import '../../../styles/user/CEOs/ProjectTeamModal.css'
import '../../../styles/user/CEOs/TaskPanel.css'
import { authorizedFetch } from '../../../services/apiClient'
import { getAuthUser, logoutSession, type AuthUser } from '../../../services/auth'
import { ceoDashboardData } from './CEO_dummy_data'
import Sidebar from './Components/layout/Sidebar'
import Topbar from './Components/layout/Topbar'
import DashboardPanel from './Components/panels/DashboardPanel'
import TeamsPanel from './Components/panels/TeamsPanel'
import ProjectsPanel from './Components/panels/ProjectsPanel'
import TasksPanel from './Components/panels/TasksPanel'
import TaskModal, { type TaskFormValue } from './Components/panels/TaskModal'
import DashboardStat from './Components/shared/DashboardStat'
import type { ApiMember, ApiProject, ApiProjectStatus, ApiTask, ApiTaskStatus, ApiTeam } from './types/api.types'
import type { ModalId, PanelId, ProgressItem, ProjectCard, StatCard, TaskItem } from './types/dashboard.types'
import { avatarTones, modalTitles } from './utils/constants'
import { getInitials } from './utils/formatters'
import { assignTeams, createProject, deleteProject, getProjects, revokeTeams } from '../../../services/projects'
import { createTask, deleteTask, getTasks, updateTask, updateTaskStatus } from '../../../services/tasks'
import type { TaskFiltersValue } from './Components/panels/TaskFilters'

const formatProjectDueLabel = (dateValue?: string | null): string => {
	if (!dateValue) {
		return 'No due date'
	}

	const parsed = new Date(dateValue)
	if (Number.isNaN(parsed.getTime())) {
		return 'No due date'
	}

	return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const mapApiProjectToCard = (project: ApiProject): ProjectCard => ({
	id: project._id,
	name: project.projectName,
	description: project.projectDescription?.trim() || 'No description available yet.',
	due: formatProjectDueLabel(project.dueDate ?? null),
	completedTasks: project.completedTasks ?? 0,
	totalTasks: project.totalTasks ?? 0,
	teams: (project.assignedTeams ?? []).map((team) => team.teamName || 'Team'),
	progress: project.progress ?? 0,
	status: project.projectStatus,
})

const mapDummyTaskToApiTask = (task: (typeof ceoDashboardData.allTasks)[number], projectId: string): ApiTask => ({
	_id: task.id,
	title: task.name,
	description: '',
	status: task.done ? 'done' : 'todo',
	priority: task.chipTone === 'ops' ? 'high' : task.chipTone === 'hr' ? 'low' : 'medium',
	dueDate: null,
	projectId: {
		_id: projectId,
		projectName: 'Fallback Project',
	},
	assignee: task.assignee
		? {
				_id: 'fallback-assignee',
				memberName: task.assignee,
			}
		: null,
})

const toDateAtStartOfDay = (value?: string | null): Date | null => {
	if (!value) {
		return null
	}

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) {
		return null
	}

	return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate())
}

const mapPriorityToChip = (priority: ApiTask['priority']): Pick<TaskItem, 'chip' | 'chipTone'> => {
	if (priority === 'high') {
		return { chip: 'High', chipTone: 'ops' }
	}

	if (priority === 'low') {
		return { chip: 'Low', chipTone: 'hr' }
	}

	return { chip: 'Medium', chipTone: 'dev' }
}

const mapProgressTone = (value: number): ProgressItem['tone'] => {
	if (value >= 80) {
		return 'green'
	}

	if (value >= 50) {
		return 'cyan'
	}

	return 'yellow'
}

const Dashboard_CEO = () => {
	const navigate = useNavigate()
	const apiBase = import.meta.env.VITE_BACKEND_URL ?? ''
	const [activePanel, setActivePanel] = useState<PanelId>('dashboard')
	const [openModal, setOpenModal] = useState<ModalId | null>(null)
	const [profileMenuOpen, setProfileMenuOpen] = useState(false)
	const [teamsData, setTeamsData] = useState(ceoDashboardData.teams)
	const [membersData, setMembersData] = useState(ceoDashboardData.members)
	const [projectsData, setProjectsData] = useState<ProjectCard[]>(ceoDashboardData.projects)
	const [selectedProjectIdForModal, setSelectedProjectIdForModal] = useState<string | null>(null)
	const [createProjectForm, setCreateProjectForm] = useState({
		projectName: '',
		projectDescription: '',
		projectStatus: 'planning' as ApiProjectStatus,
		dueDate: '',
		progress: 0,
		completedTasks: 0,
		totalTasks: 0,
		assignedTeams: [] as string[],
	})
	const [projectActionError, setProjectActionError] = useState('')
	const [isCreatingProject, setIsCreatingProject] = useState(false)
	const [isDeletingProject, setIsDeletingProject] = useState(false)
	const [isAssigningProjectTeams, setIsAssigningProjectTeams] = useState(false)
	const [isRevokingProjectTeams, setIsRevokingProjectTeams] = useState(false)
	const [projectTeamSelection, setProjectTeamSelection] = useState<string[]>([])
	const [createTeamForm, setCreateTeamForm] = useState({
		teamName: '',
		teamDescription: '',
		teamTags: '',
	})
	const [createTeamError, setCreateTeamError] = useState('')
	const [isCreatingTeam, setIsCreatingTeam] = useState(false)
	const [inviteForm, setInviteForm] = useState({
		name: '',
		email: '',
		role: 'Employee' as 'Manager' | 'Employee',
	})
	const [inviteError, setInviteError] = useState('')
	const [isSendingInvite, setIsSendingInvite] = useState(false)
	const [addMemberForm, setAddMemberForm] = useState({
		teamId: '',
		memberId: '',
	})
	const [addMemberError, setAddMemberError] = useState('')
	const [isAddingMember, setIsAddingMember] = useState(false)
	const [selectedTeamIdForRevoke, setSelectedTeamIdForRevoke] = useState<string | null>(null)
	const [revokeMemberError, setRevokeMemberError] = useState('')
	const [revokingMemberId, setRevokingMemberId] = useState<string | null>(null)
	const [removingCompanyMemberId, setRemovingCompanyMemberId] = useState<string | null>(null)
	const [pendingCompanyRemoval, setPendingCompanyRemoval] = useState<{ id: string; name: string } | null>(null)
	const [pendingTeamDisband, setPendingTeamDisband] = useState<{
		teamId: string
		teamName: string
		message: string
		projects: string[]
	} | null>(null)
	const [forceDisbandingTeamId, setForceDisbandingTeamId] = useState<string | null>(null)
	const [teamOptionsOpenFor, setTeamOptionsOpenFor] = useState<string | null>(null)
	const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
	const [tasksData, setTasksData] = useState<ApiTask[]>([])
	const [taskActionError, setTaskActionError] = useState('')
	const [isSavingTask, setIsSavingTask] = useState(false)
	const [taskFilters, setTaskFilters] = useState<TaskFiltersValue>({
		status: 'all',
		priority: 'all',
		projectId: 'all',
		teamId: 'all',
		query: '',
	})
	const [editingTaskId, setEditingTaskId] = useState<string | null>(null)
	const [taskForm, setTaskForm] = useState<TaskFormValue>({
		title: '',
		description: '',
		status: 'todo',
		priority: 'medium',
		dueDate: '',
		projectId: '',
		teamId: '',
	})
	const [notificationState, setNotificationState] = useState<Record<string, boolean>>(() => {
		const map: Record<string, boolean> = {}
		for (const item of ceoDashboardData.notificationSettings) {
			map[item.id] = item.enabled
		}
		return map
	})

	const storedUser: AuthUser | null = getAuthUser()

	const displayCompanyName = storedUser?.companyName?.trim() || ceoDashboardData.orgName
	const displayUserName = storedUser?.name?.trim() || ceoDashboardData.currentUser.name
	const displayDesignation = storedUser?.role?.trim() || ceoDashboardData.currentUser.role
	const displayUserInitials = getInitials(displayUserName) || ceoDashboardData.currentUser.initials
	const isCeoUser = storedUser?.role === 'CEO'
	const companyId = storedUser?.companyId ?? null

	const fetchTeamsAndMembers = useCallback(async () => {
		try {
			if (!companyId) {
				throw new Error('Company not found for current user')
			}

			const [teamsResponse, membersResponse] = await Promise.all([
				authorizedFetch('/api/teams'),
				authorizedFetch('/api/members'),
			])

			if (!teamsResponse.ok || !membersResponse.ok) {
				throw new Error('Failed to load team/member data')
			}

			const [teamsJson, membersJson] = (await Promise.all([teamsResponse.json(), membersResponse.json()])) as [ApiTeam[], ApiMember[]]

			const mappedMembers = membersJson.map((member, index) => ({
				id: member._id,
				userId: typeof member.userId === 'string' ? member.userId : member.userId?._id,
				initials: getInitials(member.memberName),
				name: member.memberName,
				role: member.memberRole ?? 'Member',
				team: member.memberTeam?.teamName ?? 'Unassigned',
				online: true,
				tone: avatarTones[index % avatarTones.length],
			}))

			const memberToneById = new Map(mappedMembers.map((member) => [member.id, member.tone]))

			const mappedTeams = teamsJson.map((team, index) => {
				const teamMembers = team.teamMembers ?? []
				return {
					id: team._id,
					name: team.teamName,
					description: team.teamDescription ?? 'No team description provided yet.',
					tag: team.teamTags?.[0] ?? 'Team',
					members: teamMembers.slice(0, 4).map((member, memberIndex) => ({
						initials: getInitials(member.memberName ?? 'TM'),
						tone: memberToneById.get(member._id) ?? avatarTones[(index + memberIndex) % avatarTones.length],
					})),
					totalMembers: team.totalMembers ?? teamMembers.length,
				}
			})

			setMembersData(mappedMembers)
			setTeamsData(mappedTeams)
		} catch (error) {
			console.error('Using fallback CEO team/member data:', error)
		}
	}, [companyId])

	const fetchProjectsData = useCallback(async () => {
		try {
			if (!companyId) {
				throw new Error('Company not found for current user')
			}

			const projects = await getProjects()
			setProjectsData(projects.map(mapApiProjectToCard))
		} catch (error) {
			console.error('Using fallback CEO project data:', error)
		}
	}, [companyId])

	const fetchTasksData = useCallback(async (projectHintId?: string | null) => {
		try {
			if (!companyId) {
				throw new Error('Company not found for current user')
			}

			const fetchedTasks = await getTasks()
			setTasksData(fetchedTasks)
		} catch (error) {
			console.error('Using fallback CEO task data:', error)
			const fallbackProjectId = projectHintId || projectsData[0]?.id || 'fallback-project'
			setTasksData(ceoDashboardData.allTasks.map((task) => mapDummyTaskToApiTask(task, fallbackProjectId)))
		}
	}, [companyId, projectsData])

	useEffect(() => {
		void Promise.all([fetchTeamsAndMembers(), fetchProjectsData()])
	}, [fetchProjectsData, fetchTeamsAndMembers])

	useEffect(() => {
		if (projectsData.length === 0) {
			return
		}

		void fetchTasksData(projectsData[0]?.id)
	}, [fetchTasksData, projectsData])

	const onlineMembers = membersData.slice(0, 4)
	const selectedTeamForRevoke = selectedTeamIdForRevoke
		? teamsData.find((team) => team.id === selectedTeamIdForRevoke) ?? null
		: null
	const selectedTeamMembersForRevoke = selectedTeamForRevoke
		? membersData.filter((member) => member.team === selectedTeamForRevoke.name)
		: []
	const selectedProjectForModal = selectedProjectIdForModal
		? projectsData.find((project) => project.id === selectedProjectIdForModal) ?? null
		: null
	const selectedTaskProject = taskForm.projectId ? projectsData.find((project) => project.id === taskForm.projectId) ?? null : null
	const taskProjectTeams = selectedTaskProject
		? teamsData.filter((team) => selectedTaskProject.teams.includes(team.name))
		: teamsData
	const selectedProjectAssignedTeamIds = selectedProjectForModal
		? teamsData.filter((team) => selectedProjectForModal.teams.includes(team.name)).map((team) => team.id)
		: []
	const isProjectTeamModal = openModal === 'assignTeam' || openModal === 'revokeTeam'
	const dynamicNav = useMemo(
		() => ({
			...ceoDashboardData.nav,
			workspace: ceoDashboardData.nav.workspace.map((item) =>
				item.id === 'projects' ? { ...item, badge: String(projectsData.length) } : item
			),
		}),
		[projectsData.length]
	)
	const dashboardStats = useMemo<StatCard[]>(() => {
		const totalProjects = projectsData.length
		const activeProjects = projectsData.filter((project) => project.status === 'active').length
		const openTasks = tasksData.filter((task) => task.status !== 'done').length
		const overdueOpenTasks = tasksData.filter((task) => {
			if (task.status === 'done') {
				return false
			}

			const dueDate = toDateAtStartOfDay(task.dueDate)
			if (!dueDate) {
				return false
			}

			const today = toDateAtStartOfDay(new Date().toISOString())
			return today ? dueDate.getTime() < today.getTime() : false
		}).length
		const doneTasks = tasksData.filter((task) => task.status === 'done').length
		const sprintProgress = tasksData.length > 0 ? Math.round((doneTasks / tasksData.length) * 100) : 0

		return [
			{
				id: 'active-projects',
				label: 'Active Projects',
				value: String(activeProjects),
				delta: `${totalProjects} total projects`,
				trend: activeProjects > 0 ? 'up' : 'down',
				tone: 'cyan',
			},
			{
				id: 'team-members',
				label: 'Team Members',
				value: String(membersData.length),
				delta: `${teamsData.length} teams`,
				trend: membersData.length > 0 ? 'up' : 'down',
				tone: 'purple',
			},
			{
				id: 'open-tasks',
				label: 'Open Tasks',
				value: String(openTasks),
				delta: overdueOpenTasks > 0 ? `${overdueOpenTasks} overdue` : 'No overdue tasks',
				trend: overdueOpenTasks > 0 ? 'down' : 'up',
				tone: 'yellow',
			},
			{
				id: 'sprint-progress',
				label: 'Sprint Progress',
				value: `${sprintProgress}%`,
				delta: doneTasks > 0 ? `${doneTasks} completed` : 'No tasks completed yet',
				trend: sprintProgress >= 50 ? 'up' : 'down',
				tone: 'green',
			},
		]
	}, [membersData.length, projectsData, tasksData, teamsData.length])

	const dashboardTodayTasks = useMemo<TaskItem[]>(() => {
		const today = toDateAtStartOfDay(new Date().toISOString())
		const dueToday = tasksData
			.filter((task) => {
				const dueDate = toDateAtStartOfDay(task.dueDate)
				if (!dueDate || !today) {
					return false
				}

				return dueDate.getTime() === today.getTime()
			})
			.slice(0, 5)

		const source = dueToday.length > 0 ? dueToday : tasksData.slice(0, 5)

		return source.map((task) => {
			const chip = mapPriorityToChip(task.priority)
			return {
				id: task._id,
				name: task.title,
				chip: chip.chip,
				chipTone: chip.chipTone,
				done: task.status === 'done',
				assignee: task.assignee?.memberName,
			}
		})
	}, [tasksData])

	const todayTaskLookup = useMemo(() => {
		return new Map(dashboardTodayTasks.map((task) => [task.id, tasksData.find((item) => item._id === task.id)]))
	}, [dashboardTodayTasks, tasksData])

	const dashboardTaskState = useMemo(() => {
		const map: Record<string, boolean> = {}
		for (const task of dashboardTodayTasks) {
			map[task.id] = task.done
		}
		return map
	}, [dashboardTodayTasks])

	const projectHealthItems = useMemo<ProgressItem[]>(() => {
		return projectsData.slice(0, 4).map((project) => ({
			id: project.id,
			name: project.name,
			value: project.progress,
			tone: mapProgressTone(project.progress),
		}))
	}, [projectsData])

	const analyticsStats = useMemo<StatCard[]>(() => {
		const completedTasks = tasksData.filter((task) => task.status === 'done')
		const overdueTasks = tasksData.filter((task) => {
			if (task.status === 'done') {
				return false
			}

			const dueDate = toDateAtStartOfDay(task.dueDate)
			const today = toDateAtStartOfDay(new Date().toISOString())
			return dueDate && today ? dueDate.getTime() < today.getTime() : false
		}).length
		const velocity = tasksData.length > 0 ? Math.round((completedTasks.length / tasksData.length) * 100) : 0

		const durationsInDays = completedTasks
			.map((task) => {
				if (!task.createdAt || !task.updatedAt) {
					return null
				}

				const createdAt = new Date(task.createdAt)
				const updatedAt = new Date(task.updatedAt)
				if (Number.isNaN(createdAt.getTime()) || Number.isNaN(updatedAt.getTime())) {
					return null
				}

				const ms = Math.max(0, updatedAt.getTime() - createdAt.getTime())
				return ms / (1000 * 60 * 60 * 24)
			})
			.filter((value): value is number => value !== null)

		const avgCompletionDays = durationsInDays.length
			? `${(durationsInDays.reduce((total, value) => total + value, 0) / durationsInDays.length).toFixed(1)}d`
			: '--'

		return [
			{
				id: 'as1',
				label: 'Tasks Completed',
				value: String(completedTasks.length),
				delta: `${tasksData.length} total tasks`,
				trend: completedTasks.length > 0 ? 'up' : 'down',
				tone: 'green',
			},
			{
				id: 'as2',
				label: 'Avg Completion',
				value: avgCompletionDays,
				delta: durationsInDays.length > 0 ? 'Based on completed tasks' : 'Waiting for completion data',
				trend: durationsInDays.length > 0 ? 'up' : 'down',
				tone: 'cyan',
			},
			{
				id: 'as3',
				label: 'Overdue',
				value: String(overdueTasks),
				delta: overdueTasks > 0 ? 'Needs attention' : 'All tasks on schedule',
				trend: overdueTasks > 0 ? 'down' : 'up',
				tone: 'yellow',
			},
			{
				id: 'as4',
				label: 'Team Velocity',
				value: `${velocity}%`,
				delta: `${projectsData.length} active workstreams`,
				trend: velocity >= 50 ? 'up' : 'down',
				tone: 'purple',
			},
		]
	}, [projectsData.length, tasksData])

	useEffect(() => {
		if (!actionAlert) {
			return
		}

		const timer = setTimeout(() => {
			setActionAlert(null)
		}, 3500)

		return () => clearTimeout(timer)
	}, [actionAlert])

	useEffect(() => {
		if (!teamOptionsOpenFor) {
			return
		}

		const handleOutsideClick = (event: MouseEvent) => {
			const target = event.target as HTMLElement | null
			if (!target) {
				return
			}

			if (target.closest('.ceo-team-options-wrap')) {
				return
			}

			setTeamOptionsOpenFor(null)
		}

		document.addEventListener('mousedown', handleOutsideClick)
		return () => {
			document.removeEventListener('mousedown', handleOutsideClick)
		}
	}, [teamOptionsOpenFor])

	const toggleTask = (taskId: string) => {
		const selectedTask = todayTaskLookup.get(taskId)
		if (!selectedTask) {
			return
		}

		void handleToggleTaskStatus(selectedTask)
	}

	const switchPanel = (panel: PanelId) => {
		setActivePanel(panel)
		setProfileMenuOpen(false)
		setTeamOptionsOpenFor(null)
	}

	const openModalById = (modalId: ModalId, presetEntityId?: string) => {
		setProfileMenuOpen(false)
		if (modalId === 'createTeam') {
			setCreateTeamForm({ teamName: '', teamDescription: '', teamTags: '' })
			setCreateTeamError('')
		}
		if (modalId === 'invite') {
			setInviteForm({ name: '', email: '', role: 'Employee' })
			setInviteError('')
		}
		if (modalId === 'addMember') {
			setAddMemberForm({ teamId: presetEntityId ?? teamsData[0]?.id ?? '', memberId: '' })
			setAddMemberError('')
		}
		if (modalId === 'revokeMember') {
			setSelectedTeamIdForRevoke(presetEntityId ?? null)
			setRevokeMemberError('')
		}
		if (modalId === 'createProject') {
			setCreateProjectForm({
				projectName: '',
				projectDescription: '',
				projectStatus: 'planning',
				dueDate: '',
				progress: 0,
				completedTasks: 0,
				totalTasks: 0,
				assignedTeams: [],
			})
			setProjectActionError('')
		}
		if (modalId === 'discardProject') {
			setSelectedProjectIdForModal(presetEntityId ?? projectsData[0]?.id ?? null)
			setProjectActionError('')
		}
		if (modalId === 'assignTeam' || modalId === 'revokeTeam') {
			const targetProjectId = presetEntityId ?? projectsData[0]?.id ?? null
			setSelectedProjectIdForModal(targetProjectId)
			setProjectActionError('')
			if (targetProjectId) {
				const project = projectsData.find((item) => item.id === targetProjectId)
				const assignedTeamIds = teamsData.filter((team) => (project?.teams ?? []).includes(team.name)).map((team) => team.id)
				setProjectTeamSelection(modalId === 'assignTeam' ? [] : assignedTeamIds)
			}
		}
		if (modalId === 'createTask') {
			setTaskActionError(projectsData.length === 0 ? 'Create a project first before adding tasks.' : '')
			setEditingTaskId(null)
			setTaskForm({
				title: '',
				description: '',
				status: 'todo',
				priority: 'medium',
				dueDate: '',
				projectId: presetEntityId ?? projectsData[0]?.id ?? '',
				teamId: '',
			})
		}
		setOpenModal(modalId)
	}

	const closeModal = () => {
		setCreateTeamError('')
		setInviteError('')
		setAddMemberError('')
		setRevokeMemberError('')
		setProjectActionError('')
		setTaskActionError('')
		setSelectedTeamIdForRevoke(null)
		setSelectedProjectIdForModal(null)
		setProjectTeamSelection([])
		setOpenModal(null)
	}

	const handleEditTask = (task: ApiTask) => {
		setEditingTaskId(task._id)
		setTaskActionError('')
		setTaskForm({
			title: task.title,
			description: task.description || '',
			status: task.status,
			priority: task.priority,
			dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
			projectId: task.projectId?._id || projectsData[0]?.id || '',
			teamId: task.teamId?._id || '',
		})
		setOpenModal('createTask')
	}

	const handleSaveTask = async () => {
		if (!taskForm.title.trim()) {
			setTaskActionError('Task title is required.')
			return
		}

		if (!taskForm.projectId) {
			setTaskActionError('Please select a project.')
			return
		}

		if (taskForm.teamId) {
			const validTeam = taskProjectTeams.some((team) => team.id === taskForm.teamId)
			if (!validTeam) {
				setTaskActionError('Selected team is not assigned to the selected project.')
				return
			}
		}

		setTaskActionError('')
		setIsSavingTask(true)

		try {
			if (editingTaskId) {
				await updateTask(editingTaskId, {
					title: taskForm.title.trim(),
					description: taskForm.description.trim(),
					status: taskForm.status,
					priority: taskForm.priority,
					dueDate: taskForm.dueDate || null,
					projectId: taskForm.projectId,
					teamId: taskForm.teamId || null,
				})
				setActionAlert({ type: 'success', message: 'Task updated successfully.' })
			} else {
				await createTask({
					title: taskForm.title.trim(),
					description: taskForm.description.trim(),
					status: taskForm.status,
					priority: taskForm.priority,
					dueDate: taskForm.dueDate || null,
					projectId: taskForm.projectId,
					teamId: taskForm.teamId || null,
				})
				setActionAlert({ type: 'success', message: 'Task created successfully.' })
			}

			await Promise.all([fetchTasksData(taskForm.projectId), fetchProjectsData()])
			closeModal()
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to save task. Please try again.'
			setTaskActionError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsSavingTask(false)
		}
	}

	const handleDeleteTask = async (task: ApiTask) => {
		try {
			await deleteTask(task._id)
			setTasksData((prev) => prev.filter((item) => item._id !== task._id))
			setActionAlert({ type: 'success', message: 'Task deleted successfully.' })
			await fetchProjectsData()
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to delete task. Please try again.'
			setActionAlert({ type: 'error', message })
		}
	}

	const handleToggleTaskStatus = async (task: ApiTask) => {
		const nextStatus: ApiTaskStatus = task.status === 'done' ? 'todo' : 'done'
		try {
			const updated = await updateTaskStatus(task._id, nextStatus)
			setTasksData((prev) => prev.map((item) => (item._id === task._id ? updated : item)))
			await fetchProjectsData()
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to update task status.'
			setActionAlert({ type: 'error', message })
		}
	}

	const handleSignOut = async () => {
		await logoutSession(apiBase)
		navigate('/login')
	}

	const handleRevokeMember = async (memberId: string, teamId: string) => {
		setRevokeMemberError('')
		setRevokingMemberId(memberId)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			const response = await authorizedFetch('/api/teams/remove-member', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ memberId, teamId }),
			})

			const result = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(result?.message || `Failed to revoke from team: ${response.status}`)
			}

			await fetchTeamsAndMembers()
			setActionAlert({ type: 'success', message: 'Member removed from team successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to remove member from team. Please try again.'
			setRevokeMemberError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setRevokingMemberId(null)
		}
	}

	const promptRemoveMemberFromCompany = (memberId: string, memberName: string) => {
		setPendingCompanyRemoval({ id: memberId, name: memberName })
	}

	const closeRemoveMemberAlert = () => {
		if (removingCompanyMemberId) {
			return
		}
		setPendingCompanyRemoval(null)
	}

	const closeTeamDisbandAlert = () => {
		if (forceDisbandingTeamId) {
			return
		}
		setPendingTeamDisband(null)
	}

	const handleRemoveMemberFromCompany = async () => {
		if (!pendingCompanyRemoval) {
			return
		}

		const memberId = pendingCompanyRemoval.id

		setRemovingCompanyMemberId(memberId)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			const response = await authorizedFetch(`/api/members/${memberId}`, {
				method: 'DELETE',
			})

			const result = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(result?.message || `Failed to remove member: ${response.status}`)
			}

			await fetchTeamsAndMembers()
			setPendingCompanyRemoval(null)
			setActionAlert({ type: 'success', message: 'Member removed from company successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to remove member from company. Please try again.'
			setActionAlert({ type: 'error', message })
		} finally {
			setRemovingCompanyMemberId(null)
		}
	}

	const handleDisbandTeam = async (teamId: string) => {
		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			const response = await authorizedFetch(`/api/teams/${teamId}`, {
				method: 'DELETE',
			})

			const result = (await response.json().catch(() => null)) as
				| {
						message?: string
						code?: string
						projects?: string[]
				  }
				| null

			if (response.status === 409 && result?.code === 'TEAM_ASSIGNED_TO_PROJECTS') {
				const teamName = teamsData.find((team) => team.id === teamId)?.name ?? 'This team'
				setPendingTeamDisband({
					teamId,
					teamName,
					message:
						result.message || 'This team is assigned to one or more projects. Disbanding will remove it from those projects.',
					projects: result.projects ?? [],
				})
				return
			}

			if (!response.ok) {
				throw new Error(result?.message || `Failed to disband team: ${response.status}`)
			}

			setTeamOptionsOpenFor(null)
			await fetchTeamsAndMembers()
			await fetchProjectsData()
			setActionAlert({ type: 'success', message: 'Team disbanded successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to disband team. Please try again.'
			setActionAlert({ type: 'error', message })
		}
	}

	const handleForceDisbandTeam = async () => {
		if (!pendingTeamDisband) {
			return
		}

		setForceDisbandingTeamId(pendingTeamDisband.teamId)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			const forceResponse = await authorizedFetch(`/api/teams/${pendingTeamDisband.teamId}?force=true`, {
				method: 'DELETE',
			})

			const forceResult = await forceResponse.json().catch(() => null)

			if (!forceResponse.ok) {
				throw new Error(forceResult?.message || `Failed to disband team: ${forceResponse.status}`)
			}

			setPendingTeamDisband(null)
			setTeamOptionsOpenFor(null)
			await fetchTeamsAndMembers()
			await fetchProjectsData()
			setActionAlert({ type: 'success', message: 'Team disbanded and removed from assigned projects.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to disband team. Please try again.'
			setActionAlert({ type: 'error', message })
		} finally {
			setForceDisbandingTeamId(null)
		}
	}

	const handleCreateTeam = async () => {
		if (!createTeamForm.teamName.trim()) {
			setCreateTeamError('Team name is required.')
			return
		}

		setCreateTeamError('')
		setIsCreatingTeam(true)

		const parsedTags = createTeamForm.teamTags
			.split(',')
			.map((tag) => tag.trim())
			.filter(Boolean)

		try {
			const response = await authorizedFetch('/api/teams/create', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					teamName: createTeamForm.teamName.trim(),
					teamDescription: createTeamForm.teamDescription.trim(),
					teamTags: parsedTags,
				}),
			})

			const result = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(result?.message || `Failed to create team: ${response.status}`)
			}

			await fetchTeamsAndMembers()
			setActivePanel('teams')
			closeModal()
			setActionAlert({ type: 'success', message: 'Team created successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to create team. Please try again.'
			setCreateTeamError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsCreatingTeam(false)
		}
	}

	const handleSendInvite = async () => {
		if (!inviteForm.name.trim() || !inviteForm.email.trim()) {
			setInviteError('Name and email are required.')
			return
		}

		if (!companyId) {
			setInviteError('Company not found for current user. Please log in again.')
			return
		}

		setInviteError('')
		setIsSendingInvite(true)

		try {
			const response = await authorizedFetch('/api/invite/invite', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: inviteForm.name.trim(),
					email: inviteForm.email.trim(),
					role: inviteForm.role,
				}),
			})

			const result = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(result?.message || `Failed to send invite: ${response.status}`)
			}

			closeModal()
			setActionAlert({ type: 'success', message: 'Invite sent successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to send invite. Please try again.'
			setInviteError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsSendingInvite(false)
		}
	}

	const handleAddMemberToTeam = async () => {
		if (!addMemberForm.teamId || !addMemberForm.memberId) {
			setAddMemberError('Please select both team and member.')
			return
		}

		setAddMemberError('')
		setIsAddingMember(true)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			const response = await authorizedFetch('/api/teams/add-member', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					teamId: addMemberForm.teamId,
					memberId: addMemberForm.memberId,
				}),
			})

			const result = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(result?.message || `Failed to add member: ${response.status}`)
			}

			await fetchTeamsAndMembers()
			closeModal()
			setActionAlert({ type: 'success', message: 'Member added to team successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to add member. Please try again.'
			setAddMemberError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsAddingMember(false)
		}
	}

	const toggleProjectTeamSelection = (teamId: string) => {
		setProjectTeamSelection((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
	}

	const handleCreateProject = async () => {
		if (!createProjectForm.projectName.trim()) {
			setProjectActionError('Project name is required.')
			return
		}

		setProjectActionError('')
		setIsCreatingProject(true)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			await createProject({
				projectName: createProjectForm.projectName.trim(),
				projectDescription: createProjectForm.projectDescription.trim(),
				projectStatus: createProjectForm.projectStatus,
				dueDate: createProjectForm.dueDate ? createProjectForm.dueDate : null,
				progress: createProjectForm.progress,
				completedTasks: createProjectForm.completedTasks,
				totalTasks: createProjectForm.totalTasks,
				assignedTeams: createProjectForm.assignedTeams,
			})

			await fetchProjectsData()
			setActivePanel('projects')
			closeModal()
			setActionAlert({ type: 'success', message: 'Project created successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to create project. Please try again.'
			setProjectActionError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsCreatingProject(false)
		}
	}

	const handleDiscardProject = async () => {
		if (!selectedProjectIdForModal) {
			setProjectActionError('Please select a project to discard.')
			return
		}

		setProjectActionError('')
		setIsDeletingProject(true)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			await deleteProject(selectedProjectIdForModal)
			await fetchProjectsData()
			closeModal()
			setActionAlert({ type: 'success', message: 'Project discarded successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to discard project. Please try again.'
			setProjectActionError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsDeletingProject(false)
		}
	}

	const handleAssignTeamsToProject = async () => {
		if (!selectedProjectIdForModal) {
			setProjectActionError('Please select a project first.')
			return
		}

		if (projectTeamSelection.length === 0) {
			setProjectActionError('Select at least one team to assign.')
			return
		}

		const duplicateTeamIds = projectTeamSelection.filter((teamId) => selectedProjectAssignedTeamIds.includes(teamId))
		if (duplicateTeamIds.length > 0) {
			const duplicateTeamNames = teamsData
				.filter((team) => duplicateTeamIds.includes(team.id))
				.map((team) => team.name)
				.join(', ')

			setProjectActionError(
				duplicateTeamNames
					? `Team already assigned: ${duplicateTeamNames}`
					: 'One or more selected teams are already assigned to this project.'
			)
			return
		}

		setProjectActionError('')
		setIsAssigningProjectTeams(true)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			await assignTeams(selectedProjectIdForModal, projectTeamSelection)
			await fetchProjectsData()
			closeModal()
			setActionAlert({ type: 'success', message: 'Teams assigned to project successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to assign teams. Please try again.'
			setProjectActionError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsAssigningProjectTeams(false)
		}
	}

	const handleRevokeTeamsFromProject = async () => {
		if (!selectedProjectIdForModal) {
			setProjectActionError('Please select a project first.')
			return
		}

		if (projectTeamSelection.length === 0) {
			setProjectActionError('Select at least one team to revoke.')
			return
		}

		setProjectActionError('')
		setIsRevokingProjectTeams(true)

		try {
			if (!companyId) {
				throw new Error('Company not found for current user. Please log in again.')
			}

			await revokeTeams(selectedProjectIdForModal, projectTeamSelection)
			await fetchProjectsData()
			closeModal()
			setActionAlert({ type: 'success', message: 'Teams revoked from project successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to revoke teams. Please try again.'
			setProjectActionError(message)
			setActionAlert({ type: 'error', message })
		} finally {
			setIsRevokingProjectTeams(false)
		}
	}

	const goToProjectDetails = (projectId: string) => {
		navigate(`/ceo/projects/${projectId}`)
	}

	const handleProfileSignOut = () => {
		setProfileMenuOpen(false)
		void handleSignOut()
	}

	return (
		<div className="ceo-dashboard-root">
			<Sidebar
				nav={dynamicNav}
				activePanel={activePanel}
				profileMenuOpen={profileMenuOpen}
				displayCompanyName={displayCompanyName}
				displayDesignation={displayDesignation}
				displayUserInitials={displayUserInitials}
				displayUserName={displayUserName}
				onToggleProfileMenu={() => setProfileMenuOpen((prev) => !prev)}
				onOpenEditProfile={() => openModalById('editProfile')}
				onOpenPreferences={() => switchPanel('settings')}
				onSignOut={handleProfileSignOut}
				onSwitchPanel={switchPanel}
			/>

			<main className="ceo-main">
				<Topbar
					activePanel={activePanel}
					onInviteMember={() => openModalById('invite')}
					onCreateProject={() => openModalById('createProject')}
				/>

				{actionAlert && (
					<div className={`ceo-action-alert ${actionAlert.type === 'success' ? 'success' : 'error'}`} role="status">
						<span>{actionAlert.message}</span>
						<button aria-label="Dismiss alert" onClick={() => setActionAlert(null)} type="button">
							X
						</button>
					</div>
				)}

				<section className="ceo-content">
					<DashboardPanel
						isActive={activePanel === 'dashboard'}
						stats={dashboardStats}
						todayTasks={dashboardTodayTasks}
						onlineMembers={onlineMembers}
						projectHealth={projectHealthItems}
						activity={ceoDashboardData.activity}
						taskState={dashboardTaskState}
						onToggleTask={toggleTask}
						onSwitchPanel={switchPanel}
					/>

					<TeamsPanel
						isActive={activePanel === 'teams'}
						teamsData={teamsData}
						teamOptionsOpenFor={teamOptionsOpenFor}
						onOpenModalById={openModalById}
						onToggleTeamOptions={(teamId) => setTeamOptionsOpenFor((prev) => (prev === teamId ? null : teamId))}
						onDisbandTeam={(teamId) => void handleDisbandTeam(teamId)}
					/>

					<ProjectsPanel
						isActive={activePanel === 'projects'}
						projectsData={projectsData}
						onOpenCreateProject={() => openModalById('createProject')}
						onOpenDiscardProject={() => openModalById('discardProject')}
						onOpenAssignTeam={(projectId) => openModalById('assignTeam', projectId)}
						onOpenRevokeTeam={(projectId) => openModalById('revokeTeam', projectId)}
						onOpenProjectDetails={goToProjectDetails}
					/>

					<TasksPanel
						isActive={activePanel === 'tasks'}
						tasks={tasksData}
						filters={taskFilters}
						projects={projectsData.map((project) => ({ id: project.id, name: project.name }))}
						teams={teamsData.map((team) => ({ id: team.id, name: team.name }))}
						onChangeFilters={setTaskFilters}
						onCreateTask={() => openModalById('createTask')}
						onToggleStatus={(task) => void handleToggleTaskStatus(task)}
						onDeleteTask={(task) => void handleDeleteTask(task)}
						onEditTask={handleEditTask}
					/>

					<div className={`ceo-panel ${activePanel === 'members' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>Members</h2>
							<button className="ceo-btn-primary" onClick={() => openModalById('invite')} type="button">
								Invite Member
							</button>
						</div>
						<article className="ceo-list-card">
							{membersData.length === 0 ? (
								<div className="ceo-team-empty">No members available.</div>
							) : (
								membersData.map((member) => {
									const memberTeam = member.team && member.team !== 'Unassigned' ? teamsData.find((team) => team.name === member.team) : null
									const isCurrentUser =
										(storedUser?.id && (member as { userId?: string }).userId === storedUser.id) || member.name.includes('(You)')
									const canRemoveMemberFromCompany = isCeoUser && !memberTeam && !isCurrentUser

									return (
									<div className="ceo-team-member-row" key={member.id}>
										<div className={`ceo-member-avatar tone-${member.tone}`}>{member.initials}</div>
										<div className="ceo-list-main ceo-list-main-member">
											<div className="ceo-member-name">{member.name}</div>
											<div className="ceo-member-role">
												{member.role}
												{member.team && member.team !== 'Unassigned' ? ` | ${member.team}` : ''}
											</div>
										</div>
										<div className="ceo-list-actions">
											{isCurrentUser ? (
												<span className="ceo-chip ceo-chip-dev">Admin</span>
											) : canRemoveMemberFromCompany ? (
												<button
													className="ceo-btn-danger"
													onClick={() => promptRemoveMemberFromCompany(member.id, member.name)}
													type="button"
													disabled={removingCompanyMemberId === member.id}
												>
													{removingCompanyMemberId === member.id ? 'Removing...' : 'Remove Member'}
												</button>
											) : !memberTeam ? (
												<span className="ceo-chip ceo-chip-dev">CEO only</span>
											) : (
												<span className="ceo-chip ceo-chip-ops">Assigned to team</span>
											)}
										</div>
									</div>
									)
								})
							)}
						</article>
					</div>

					<div className={`ceo-panel ${activePanel === 'analytics' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>Analytics</h2>
						</div>
						<div className="ceo-stats-row">
								{analyticsStats.map((stat) => (
								<DashboardStat key={stat.id} stat={stat} />
							))}
						</div>
						<article className="ceo-card">
							<div className="ceo-card-head">
								<h3>Sprint Burndown</h3>
							</div>
							<div className="ceo-chart-placeholder">Chart area reserved for API-driven analytics.</div>
						</article>
					</div>

					<div className={`ceo-panel ${activePanel === 'settings' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>Settings</h2>
						</div>
						<div className="ceo-settings-layout">
							<aside className="ceo-settings-nav">
								{ceoDashboardData.settingsSections.map((section, index) => (
									<button className={index === 0 ? 'active' : ''} key={section} type="button">
										{section}
									</button>
								))}
							</aside>

							<article className="ceo-settings-content">
								<section>
									<h3>Profile Information</h3>
									<div className="ceo-form-grid">
										<label>
											First Name
											<input defaultValue="Rahul" type="text" />
										</label>
										<label>
											Last Name
											<input defaultValue="Kumar" type="text" />
										</label>
									</div>
									<label>
										Email
										<input defaultValue={ceoDashboardData.currentUser.email} type="email" />
									</label>
									<label>
										Role / Title
										<input defaultValue={ceoDashboardData.currentUser.title} type="text" />
									</label>
									<button className="ceo-btn-primary" type="button">
										Save Changes
									</button>
								</section>

								<section>
									<h3>Notifications</h3>
									{ceoDashboardData.notificationSettings.map((item) => (
										<div className="ceo-toggle-row" key={item.id}>
											<div>
												<p>{item.title}</p>
												<small>{item.desc}</small>
											</div>
											<button
												aria-label={`Toggle ${item.title}`}
												className={`ceo-toggle ${notificationState[item.id] ? 'on' : ''}`}
												onClick={() =>
													setNotificationState((prev) => ({
														...prev,
														[item.id]: !prev[item.id],
													}))
												}
												type="button"
											/>
										</div>
									))}
								</section>
							</article>
						</div>
					</div>
				</section>
			</main>

			{openModal && (
				<div
					className="ceo-overlay"
					onClick={(event) => {
						if (event.currentTarget === event.target) {
							closeModal()
						}
					}}
				>
					<div className={`ceo-modal ${isProjectTeamModal ? 'ptm-modal' : ''}`} role="dialog" aria-modal="true" aria-label={modalTitles[openModal]}>
						<div className="ceo-modal-head">
							<h3>{modalTitles[openModal]}</h3>
							<button onClick={closeModal} type="button">
								X
							</button>
						</div>
						<div className="ceo-modal-body">
							{openModal === 'createTeam' ? (
								<>
									{createTeamError && <p className="form-message form-error">{createTeamError}</p>}
									<label>
										Team Name
										<input
											placeholder="e.g. Engineering"
											type="text"
											value={createTeamForm.teamName}
											onChange={(event) =>
												setCreateTeamForm((prev) => ({
													...prev,
													teamName: event.target.value,
												}))
											}
										/>
									</label>
									<label>
										Description
										<input
											placeholder="What this team works on"
											type="text"
											value={createTeamForm.teamDescription}
											onChange={(event) =>
												setCreateTeamForm((prev) => ({
													...prev,
													teamDescription: event.target.value,
												}))
											}
										/>
									</label>
									<label>
										Tags
										<input
											placeholder="Build, Product, Growth"
											type="text"
											value={createTeamForm.teamTags}
											onChange={(event) =>
												setCreateTeamForm((prev) => ({
													...prev,
													teamTags: event.target.value,
												}))
											}
										/>
									</label>
								</>
							) : openModal === 'invite' ? (
								<>
									{inviteError && <p className="form-message form-error">{inviteError}</p>}
									<label>
										Full Name
										<input
											placeholder="e.g. Rahul Sharma"
											type="text"
											value={inviteForm.name}
											onChange={(event) =>
												setInviteForm((prev) => ({
													...prev,
													name: event.target.value,
												}))
											}
										/>
									</label>
									<label>
										Work Email
										<input
											placeholder="member@company.com"
											type="email"
											value={inviteForm.email}
											onChange={(event) =>
												setInviteForm((prev) => ({
													...prev,
													email: event.target.value,
												}))
											}
										/>
									</label>
									<label>
										Role
										<select
											value={inviteForm.role}
											onChange={(event) =>
												setInviteForm((prev) => ({
													...prev,
													role: event.target.value as 'Manager' | 'Employee',
												}))
											}
										>
											<option value="Employee">Employee</option>
											<option value="Manager">Manager</option>
										</select>
									</label>
								</>
							) : openModal === 'addMember' ? (
								<>
									{addMemberError && <p className="form-message form-error">{addMemberError}</p>}
									<label>
										Team
										<select
											value={addMemberForm.teamId}
											onChange={(event) =>
												setAddMemberForm((prev) => ({
													...prev,
													teamId: event.target.value,
												}))
											}
										>
											<option value="" disabled>
												Select a team
											</option>
											{teamsData.map((team) => (
												<option key={team.id} value={team.id}>
													{team.name}
												</option>
											))}
										</select>
									</label>
									<label>
										Member
										<select
											value={addMemberForm.memberId}
											onChange={(event) =>
												setAddMemberForm((prev) => ({
													...prev,
													memberId: event.target.value,
												}))
											}
										>
											<option value="" disabled>
												Select a member
											</option>
											{membersData.map((member) => (
												<option key={member.id} value={member.id}>
													{member.name} ({member.role})
												</option>
											))}
										</select>
									</label>
								</>
							) : openModal === 'revokeMember' ? (
								<>
									{revokeMemberError && <p className="form-message form-error">{revokeMemberError}</p>}
									{selectedTeamForRevoke ? (
										<>
											<p className="ceo-member-role">Team: {selectedTeamForRevoke.name}</p>
											{selectedTeamMembersForRevoke.length === 0 ? (
												<div className="ceo-team-empty">No members in this team.</div>
											) : (
												selectedTeamMembersForRevoke.map((member) => (
													<div className="ceo-team-member-row" key={member.id}>
														<div className={`ceo-member-avatar tone-${member.tone}`}>{member.initials}</div>
														<div className="ceo-list-main ceo-list-main-member">
															<div className="ceo-member-name">{member.name}</div>
															<div className="ceo-member-role">{member.role}</div>
														</div>
														<div className="ceo-list-actions">
															<button
																className="ceo-btn-danger"
																onClick={() => selectedTeamForRevoke && void handleRevokeMember(member.id, selectedTeamForRevoke.id)}
																type="button"
																disabled={revokingMemberId === member.id}
															>
																{revokingMemberId === member.id ? 'Revoking...' : 'Revoke'}
															</button>
														</div>
													</div>
												))
											)}
										</>
									) : (
										<div className="ceo-team-empty">Select a team row to manage member revokes.</div>
									)}
								</>
							) : openModal === 'createProject' ? (
								<>
									{projectActionError && <p className="form-message form-error">{projectActionError}</p>}
									<label>
										Project Name
										<input
											placeholder="e.g. Customer Success Portal"
											type="text"
											value={createProjectForm.projectName}
											onChange={(event) =>
												setCreateProjectForm((prev) => ({
													...prev,
													projectName: event.target.value,
												}))
											}
										/>
									</label>
									<label>
										Description
										<input
											placeholder="What should this project deliver?"
											type="text"
											value={createProjectForm.projectDescription}
											onChange={(event) =>
												setCreateProjectForm((prev) => ({
													...prev,
													projectDescription: event.target.value,
												}))
											}
										/>
									</label>
									<div className="ceo-form-grid">
										<label>
											Status
											<select
												value={createProjectForm.projectStatus}
												onChange={(event) =>
													setCreateProjectForm((prev) => ({
														...prev,
														projectStatus: event.target.value as ApiProjectStatus,
													}))
												}
											>
												<option value="planning">Planning</option>
												<option value="active">Active</option>
												<option value="review">Review</option>
												<option value="completed">Completed</option>
												<option value="blocked">Blocked</option>
											</select>
										</label>
										<label>
											Due Date
											<input
												type="date"
												value={createProjectForm.dueDate}
												onChange={(event) =>
													setCreateProjectForm((prev) => ({
														...prev,
														dueDate: event.target.value,
													}))
												}
											/>
										</label>
									</div>
									<div className="ceo-form-grid">
										<label>
											Progress %
											<input
												type="number"
												min={0}
												max={100}
												value={createProjectForm.progress}
												onChange={(event) =>
													setCreateProjectForm((prev) => ({
														...prev,
														progress: Number(event.target.value) || 0,
													}))
												}
											/>
										</label>
										<label>
											Completed / Total Tasks
											<div className="ceo-form-grid">
												<input
													type="number"
													min={0}
													value={createProjectForm.completedTasks}
													onChange={(event) =>
														setCreateProjectForm((prev) => ({
															...prev,
															completedTasks: Number(event.target.value) || 0,
														}))
													}
												/>
												<input
													type="number"
													min={0}
													value={createProjectForm.totalTasks}
													onChange={(event) =>
														setCreateProjectForm((prev) => ({
															...prev,
															totalTasks: Number(event.target.value) || 0,
														}))
													}
												/>
											</div>
										</label>
									</div>
									<label>
										Assign Teams
										<select
											multiple
											value={createProjectForm.assignedTeams}
											onChange={(event) =>
												setCreateProjectForm((prev) => ({
													...prev,
													assignedTeams: Array.from(event.target.selectedOptions).map((option) => option.value),
												}))
											}
										>
											{teamsData.map((team) => (
												<option key={team.id} value={team.id}>
													{team.name}
												</option>
											))}
										</select>
									</label>
								</>
							) : openModal === 'discardProject' ? (
								<>
									{projectActionError && <p className="form-message form-error">{projectActionError}</p>}
									<label>
										Project
										<select
											value={selectedProjectIdForModal ?? ''}
											onChange={(event) => setSelectedProjectIdForModal(event.target.value || null)}
										>
											<option value="" disabled>
												Select a project
											</option>
											{projectsData.map((project) => (
												<option key={project.id} value={project.id}>
													{project.name}
												</option>
											))}
										</select>
									</label>
									<p className="ceo-confirm-note">Discarding a project is permanent and cannot be undone.</p>
								</>
							) : openModal === 'assignTeam' || openModal === 'revokeTeam' ? (
								<div className="ptm-shell">
									{projectActionError && <p className="form-message form-error">{projectActionError}</p>}
									<div className="ptm-top-row">
										<label className="ptm-field">
											<span>Project</span>
											<select
												value={selectedProjectIdForModal ?? ''}
												onChange={(event) => {
													const nextProjectId = event.target.value || null
													setSelectedProjectIdForModal(nextProjectId)
													if (!nextProjectId) {
														setProjectTeamSelection([])
														return
													}

													const nextProject = projectsData.find((project) => project.id === nextProjectId)
													const nextAssigned = teamsData.filter((team) => (nextProject?.teams ?? []).includes(team.name)).map((team) => team.id)
													setProjectTeamSelection(openModal === 'assignTeam' ? [] : nextAssigned)
												}}
											>
												<option value="" disabled>
													Select a project
												</option>
												{projectsData.map((project) => (
													<option key={project.id} value={project.id}>
														{project.name}
													</option>
												))}
											</select>
										</label>
										<div className="ptm-summary">
											<strong>{openModal === 'assignTeam' ? 'Assign Teams' : 'Revoke Teams'}</strong>
											<small>{projectTeamSelection.length} selected</small>
										</div>
									</div>

									{selectedProjectForModal && (
										<p className="ptm-current-teams">
											Current teams: {selectedProjectForModal.teams.length > 0 ? selectedProjectForModal.teams.join(', ') : 'None assigned'}
										</p>
									)}

									{teamsData.length === 0 ? (
										<div className="ceo-team-empty">Create teams first to manage project assignment.</div>
									) : (
										<div className="ptm-team-grid">
											{teamsData
												.filter((team) => (openModal === 'assignTeam' ? true : selectedProjectAssignedTeamIds.includes(team.id)))
												.map((team) => {
													const isSelected = projectTeamSelection.includes(team.id)
													const isAssigned = selectedProjectAssignedTeamIds.includes(team.id)

													return (
														<label key={team.id} className={`ptm-team-card ${isSelected ? 'selected' : ''}`}>
															<input
																type="checkbox"
																checked={isSelected}
																onChange={() => toggleProjectTeamSelection(team.id)}
															/>
															<div className="ptm-team-card-text">
																<span>{team.name}</span>
																<small>{isAssigned ? 'Already assigned' : 'Available'}</small>
															</div>
														</label>
													)
												})}
										</div>
									)}
								</div>
							) : openModal === 'createTask' ? (
								<TaskModal
									value={taskForm}
									onChange={(next) => {
										if (next.projectId !== taskForm.projectId) {
												setTaskForm({ ...next, teamId: '' })
											return
										}

										setTaskForm(next)
									}}
									projects={projectsData.map((project) => ({ id: project.id, name: project.name }))}
									teams={taskProjectTeams.map((team) => ({ id: team.id, name: team.name }))}
									errorMessage={taskActionError}
								/>
							) : (
								<>
									<label>
										Name
										<input placeholder="Enter value" type="text" />
									</label>
									<label>
										Description
										<input placeholder="Add details" type="text" />
									</label>
									<label>
										Selection
										<select>
											<option>Option 1</option>
											<option>Option 2</option>
											<option>Option 3</option>
										</select>
									</label>
								</>
							)}
						</div>
						<div className={`ceo-modal-actions ${isProjectTeamModal ? 'ptm-actions' : ''}`}>
							<button className="ceo-btn-outline" onClick={closeModal} type="button">
								Cancel
							</button>
							{openModal !== 'revokeMember' && (
								<button
									className="ceo-btn-primary"
									onClick={
										openModal === 'createTeam'
											? () => void handleCreateTeam()
											: openModal === 'invite'
												? () => void handleSendInvite()
												: openModal === 'addMember'
													? () => void handleAddMemberToTeam()
													: openModal === 'createProject'
														? () => void handleCreateProject()
																: openModal === 'createTask'
																	? () => void handleSaveTask()
														: openModal === 'discardProject'
															? () => void handleDiscardProject()
															: openModal === 'assignTeam'
																? () => void handleAssignTeamsToProject()
																: openModal === 'revokeTeam'
																	? () => void handleRevokeTeamsFromProject()
																	: closeModal
									}
									type="button"
									disabled={
										(openModal === 'createTeam' && isCreatingTeam) ||
										(openModal === 'invite' && isSendingInvite) ||
										(openModal === 'addMember' && isAddingMember) ||
										(openModal === 'createProject' && isCreatingProject) ||
										(openModal === 'createTask' && isSavingTask) ||
										(openModal === 'discardProject' && isDeletingProject) ||
										(openModal === 'assignTeam' && isAssigningProjectTeams) ||
										(openModal === 'revokeTeam' && isRevokingProjectTeams)
									}
								>
									{openModal === 'createTeam'
										? isCreatingTeam
											? 'Creating...'
											: 'Create Team'
										: openModal === 'invite'
											? isSendingInvite
												? 'Sending...'
												: 'Send Invite'
											: openModal === 'addMember'
												? isAddingMember
													? 'Adding...'
													: 'Add Member'
												: openModal === 'createProject'
													? isCreatingProject
														? 'Creating...'
														: 'Create Project'
													: openModal === 'createTask'
														? isSavingTask
															? 'Saving...'
															: editingTaskId
																? 'Update Task'
																: 'Create Task'
													: openModal === 'discardProject'
														? isDeletingProject
															? 'Discarding...'
															: 'Discard Project'
														: openModal === 'assignTeam'
															? isAssigningProjectTeams
																? 'Assigning...'
																: 'Assign Teams'
															: openModal === 'revokeTeam'
																? isRevokingProjectTeams
																	? 'Revoking...'
																	: 'Revoke Teams'
																: 'Confirm'}
								</button>
							)}
						</div>
					</div>
				</div>
			)}

			{pendingCompanyRemoval && (
				<div
					className="ceo-overlay"
					onClick={(event) => {
						if (event.currentTarget === event.target) {
							closeRemoveMemberAlert()
						}
					}}
				>
					<div className="ceo-modal ceo-confirm-alert" role="alertdialog" aria-modal="true" aria-label="Confirm member removal">
						<div className="ceo-modal-head">
							<h3>Remove Member</h3>
							<button onClick={closeRemoveMemberAlert} type="button" aria-label="Close confirmation">
								X
							</button>
						</div>
						<div className="ceo-modal-body">
							<p>
								Are you sure you want to remove <strong>{pendingCompanyRemoval.name}</strong> from the company?
							</p>
							<p className="ceo-confirm-note">This action cannot be undone.</p>
						</div>
						<div className="ceo-modal-actions">
							<button className="ceo-btn-outline" onClick={closeRemoveMemberAlert} type="button" disabled={Boolean(removingCompanyMemberId)}>
								Cancel
							</button>
							<button className="ceo-btn-danger" onClick={() => void handleRemoveMemberFromCompany()} type="button" disabled={Boolean(removingCompanyMemberId)}>
								{removingCompanyMemberId === pendingCompanyRemoval.id ? 'Removing...' : 'Yes, Remove'}
							</button>
						</div>
					</div>
				</div>
			)}

			{pendingTeamDisband && (
				<div
					className="ceo-overlay"
					onClick={(event) => {
						if (event.currentTarget === event.target) {
							closeTeamDisbandAlert()
						}
					}}
				>
					<div className="ceo-modal ceo-confirm-alert" role="alertdialog" aria-modal="true" aria-label="Confirm team disband">
						<div className="ceo-modal-head">
							<h3>Disband Team</h3>
							<button onClick={closeTeamDisbandAlert} type="button" aria-label="Close confirmation">
								X
							</button>
						</div>
						<div className="ceo-modal-body">
							<p>
								<strong>{pendingTeamDisband.teamName}</strong> is assigned to project(s). Disbanding this team will remove it from those projects.
							</p>
							{pendingTeamDisband.projects.length > 0 && (
								<div className="ceo-confirm-projects">
									<strong>Affected projects:</strong>
									<ul>
										{pendingTeamDisband.projects.map((project) => (
											<li key={project}>{project}</li>
										))}
									</ul>
								</div>
							)}
							<p className="ceo-confirm-note">This action cannot be undone.</p>
						</div>
						<div className="ceo-modal-actions">
							<button className="ceo-btn-outline" onClick={closeTeamDisbandAlert} type="button" disabled={Boolean(forceDisbandingTeamId)}>
								Cancel
							</button>
							<button className="ceo-btn-danger" onClick={() => void handleForceDisbandTeam()} type="button" disabled={Boolean(forceDisbandingTeamId)}>
								{forceDisbandingTeamId === pendingTeamDisband.teamId ? 'Disbanding...' : 'Yes, Disband Team'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Dashboard_CEO
