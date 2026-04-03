
import { useMemo, useState } from 'react'
import type { ApiTaskPriority, ApiTaskStatus, TaskListSortBy } from '../../../CEOs/types/api.types'
import type { ManagerMemberOption, ManagerProjectCard, ManagerTaskPageState, ManagerTaskQuery, ManagerTaskRow, ManagerTeamCard } from '../../types/manager.types'
import { getAssignableMembersForTask } from '../../utils/taskAssignments'
import { getAuthUser } from '../../../../../services/auth'
import '../../../../../styles/user/Manager/panels/ManagerTasksPanel.css'

type ManagerTasksPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	actionError: string
	isMutating: boolean
	tasks: ManagerTaskRow[]
	members: ManagerMemberOption[]
	projects: ManagerProjectCard[]
	teams: ManagerTeamCard[]
	taskQuery: ManagerTaskQuery
	taskPageState: ManagerTaskPageState
	onTaskQueryChange: (updater: (prev: ManagerTaskQuery) => ManagerTaskQuery) => void
	onUpdateStatus: (taskId: string, status: ApiTaskStatus) => void
	onAssign: (taskId: string, assigneeMemberId: string | null) => void
	onDelete: (taskId: string) => void
	onCreateTask: (payload: {
		title: string
		description?: string
		status: ApiTaskStatus
		priority: 'low' | 'medium' | 'high'
		dueDate?: string | null
		projectId: string
		teamId?: string | null
		assigneeMemberId?: string | null
	}) => void
	onEditTask: (
		taskId: string,
		payload: {
			title: string
			description?: string
			status: ApiTaskStatus
			priority: 'low' | 'medium' | 'high'
			dueDate?: string | null
			projectId: string
			teamId?: string | null
			assigneeMemberId?: string | null
		}
	) => void
}

type TaskModalMode = 'create' | 'edit'

type TaskFormState = {
	title: string
	description: string
	status: ApiTaskStatus
	priority: 'low' | 'medium' | 'high'
	projectId: string
	teamId: string
	dueDate: string
	assigneeMemberId: string
}

const statusOptions: Array<{ label: string; value: ApiTaskStatus }> = [
	{ label: 'To do', value: 'todo' },
	{ label: 'In progress', value: 'in-progress' },
	{ label: 'Done', value: 'done' },
]

const statusFilterOptions: Array<{ label: string; value: ManagerTaskQuery['status'] }> = [
	{ label: 'All statuses', value: 'all' },
	{ label: 'To do', value: 'todo' },
	{ label: 'In progress', value: 'in-progress' },
	{ label: 'Done', value: 'done' },
]

const priorityFilterOptions: Array<{ label: string; value: ManagerTaskQuery['priority'] }> = [
	{ label: 'All priorities', value: 'all' },
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
]

const sortByOptions: Array<{ label: string; value: TaskListSortBy }> = [
	{ label: 'Newest', value: 'createdAt' },
	{ label: 'Due date', value: 'dueDate' },
	{ label: 'Status', value: 'status' },
	{ label: 'Priority', value: 'priority' },
	{ label: 'Title', value: 'title' },
]

const pageSizeOptions = [10, 20, 50]

const ManagerTasksPanel = ({
	isActive,
	isLoading,
	error,
	actionError,
	isMutating,
	tasks,
	members,
	projects,
	teams,
	taskQuery,
	taskPageState,
	onTaskQueryChange,
	onUpdateStatus,
	onAssign,
	onDelete,
	onCreateTask,
	onEditTask,
}: ManagerTasksPanelProps) => {
	const authUser = getAuthUser()
	const isTeamScopedManager = authUser?.role === 'Manager' && authUser?.managerScope === 'team'
	const managerScopedTeamIdSet = new Set(authUser?.managerTeamIds ?? [])

	const [activeModal, setActiveModal] = useState<{ mode: TaskModalMode; taskId?: string } | null>(null)
	const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null)
	const [taskFormError, setTaskFormError] = useState('')
	const [taskForm, setTaskForm] = useState<TaskFormState>({
		title: '',
		description: '',
		status: 'todo',
		priority: 'medium',
		projectId: '',
		teamId: '',
		dueDate: '',
		assigneeMemberId: '',
	})

	const updateQuery = (updates: Partial<ManagerTaskQuery>, resetPage = true) => {
		onTaskQueryChange((prev) => ({
			...prev,
			...updates,
			page: resetPage ? 1 : updates.page ?? prev.page,
		}))
	}

	const hasActiveFilters =
		Boolean(taskQuery.q.trim()) ||
		taskQuery.status !== 'all' ||
		taskQuery.priority !== 'all' ||
		taskQuery.projectId !== 'all' ||
		taskQuery.teamId !== 'all' ||
		taskQuery.assigneeMemberId !== 'all'

	const clearFilters = () => {
		onTaskQueryChange((prev) => ({
			...prev,
			q: '',
			status: 'all',
			priority: 'all',
			projectId: 'all',
			teamId: 'all',
			assigneeMemberId: 'all',
			page: 1,
		}))
	}

	const handleDeleteTask = (task: ManagerTaskRow) => {
		setDeleteTarget({ id: task.id, title: task.title })
	}

	const closeDeleteModal = () => {
		setDeleteTarget(null)
	}

	const confirmDeleteTask = () => {
		if (!deleteTarget) {
			return
		}

		onDelete(deleteTarget.id)
		setDeleteTarget(null)
	}

	const sortedProjects = useMemo(() => [...projects].sort((left, right) => left.name.localeCompare(right.name)), [projects])
	const sortedTeams = useMemo(() => [...teams].sort((left, right) => left.name.localeCompare(right.name)), [teams])
	const sortedMembers = useMemo(() => [...members].sort((left, right) => left.name.localeCompare(right.name)), [members])
	const toolbarTeams = isTeamScopedManager ? sortedTeams.filter((team) => managerScopedTeamIdSet.has(team.id)) : sortedTeams

	const getAssignableTeamsForProject = (projectId: string): ManagerTeamCard[] => {
		const selected = sortedProjects.find((project) => project.id === projectId)
		if (!selected) {
			return isTeamScopedManager ? sortedTeams.filter((team) => managerScopedTeamIdSet.has(team.id)) : sortedTeams
		}

		const projectTeams = sortedTeams.filter((team) => selected.assignedTeamIds.includes(team.id))
		if (!isTeamScopedManager) {
			return projectTeams
		}

		return projectTeams.filter((team) => managerScopedTeamIdSet.has(team.id))
	}

	const assignableTeamsForForm = getAssignableTeamsForProject(taskForm.projectId)

	const handleProjectChange = (projectId: string) => {
		const candidateTeams = getAssignableTeamsForProject(projectId)
		const nextTeamId = isTeamScopedManager ? candidateTeams[0]?.id ?? '' : ''
		setTaskFormError('')
		updateTaskForm({ projectId, teamId: nextTeamId })
	}

	const openCreateTaskModal = () => {
		const defaultProjectId = sortedProjects[0]?.id ?? ''
		const defaultAssignableTeams = getAssignableTeamsForProject(defaultProjectId)
		setActiveModal({ mode: 'create' })
		setTaskFormError('')
		setTaskForm({
			title: '',
			description: '',
			status: 'todo',
			priority: 'medium',
			projectId: defaultProjectId,
			teamId: isTeamScopedManager ? defaultAssignableTeams[0]?.id ?? '' : '',
			dueDate: '',
			assigneeMemberId: '',
		})
	}

	const openEditTaskModal = (task: ManagerTaskRow) => {
		const resolvedProjectId = task.projectId ?? sortedProjects[0]?.id ?? ''
		const candidateTeams = getAssignableTeamsForProject(resolvedProjectId)
		const hasCurrentTeam = Boolean(task.teamId && candidateTeams.some((team) => team.id === task.teamId))
		setActiveModal({ mode: 'edit', taskId: task.id })
		setTaskFormError('')
		setTaskForm({
			title: task.title,
			description: task.description,
			status: task.status,
			priority: task.priority,
			projectId: resolvedProjectId,
			teamId: isTeamScopedManager ? (hasCurrentTeam ? task.teamId ?? '' : candidateTeams[0]?.id ?? '') : task.teamId ?? '',
			dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
			assigneeMemberId: task.assigneeMemberId ?? '',
		})
	}

	const closeTaskModal = () => {
		setActiveModal(null)
		setTaskFormError('')
	}

	const getAssignableMembers = (task: ManagerTaskRow): ManagerMemberOption[] => getAssignableMembersForTask(task, members)

	const updateTaskForm = (updates: Partial<TaskFormState>) => {
		if (taskFormError) {
			setTaskFormError('')
		}

		setTaskForm((prev) => ({
			...prev,
			...updates,
		}))
	}

	const submitTaskForm = () => {
		const trimmedTitle = taskForm.title.trim()
		if (!trimmedTitle || !taskForm.projectId) {
			setTaskFormError('Title and project are required.')
			return
		}

		if (taskForm.teamId && !assignableTeamsForForm.some((team) => team.id === taskForm.teamId)) {
			setTaskFormError('Selected team is not assigned to the selected project.')
			return
		}

		if (isTeamScopedManager && !taskForm.teamId) {
			setTaskFormError('Team is required for team-scoped managers.')
			return
		}

		if (isTeamScopedManager && taskForm.teamId && !managerScopedTeamIdSet.has(taskForm.teamId)) {
			setTaskFormError('Selected team is outside your scope.')
			return
		}

		const payload = {
			title: trimmedTitle,
			description: taskForm.description.trim(),
			status: taskForm.status,
			priority: taskForm.priority,
			dueDate: taskForm.dueDate || null,
			projectId: taskForm.projectId,
			teamId: taskForm.teamId || null,
			assigneeMemberId: taskForm.assigneeMemberId || null,
		}

		if (activeModal?.mode === 'edit' && activeModal.taskId) {
			onEditTask(activeModal.taskId, payload)
		} else {
			onCreateTask(payload)
		}

		closeTaskModal()
	}

	const disableSubmit =
		!taskForm.title.trim() ||
		!taskForm.projectId ||
		(isTeamScopedManager && !taskForm.teamId) ||
		(isTeamScopedManager && taskForm.projectId !== '' && assignableTeamsForForm.length === 0) ||
		isMutating

	if (!isActive) {
		return null
	}

	return (
		<section className="ceo-panel active manager-task-panel">
			<div className="ceo-section-head">
				<h2>Tasks</h2>
				<button className="ceo-btn-primary" type="button" onClick={openCreateTaskModal} disabled={isMutating || sortedProjects.length === 0}>
					Create Task
				</button>
			</div>
			<div className="manager-task-toolbar">
				<label>
					Search
					<input
						className="manager-task-input"
						type="search"
						placeholder="Search title or description"
						value={taskQuery.q}
						onChange={(event) => updateQuery({ q: event.target.value })}
					/>
				</label>
				<label>
					Status
					<select
						className="manager-task-select"
						value={taskQuery.status}
						onChange={(event) => updateQuery({ status: event.target.value as ManagerTaskQuery['status'] })}
					>
						{statusFilterOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label>
					Priority
					<select
						className="manager-task-select"
						value={taskQuery.priority}
						onChange={(event) => updateQuery({ priority: event.target.value as ApiTaskPriority | 'all' })}
					>
						{priorityFilterOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<label>
					Project
					<select
						className="manager-task-select"
						value={taskQuery.projectId}
						onChange={(event) => updateQuery({ projectId: event.target.value })}
					>
						<option value="all">All projects</option>
						{sortedProjects.map((project) => (
							<option key={project.id} value={project.id}>
								{project.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Team
					<select
						className="manager-task-select"
						value={taskQuery.teamId}
						onChange={(event) => updateQuery({ teamId: event.target.value })}
					>
						<option value="all">All teams</option>
						{toolbarTeams.map((team) => (
							<option key={team.id} value={team.id}>
								{team.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Assignee
					<select
						className="manager-task-select"
						value={taskQuery.assigneeMemberId}
						onChange={(event) => updateQuery({ assigneeMemberId: event.target.value as ManagerTaskQuery['assigneeMemberId'] })}
					>
						<option value="all">All assignees</option>
						<option value="unassigned">Unassigned</option>
						{sortedMembers.map((member) => (
							<option key={member.id} value={member.id}>
								{member.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Sort by
					<select
						className="manager-task-select"
						value={taskQuery.sortBy}
						onChange={(event) => updateQuery({ sortBy: event.target.value as TaskListSortBy })}
					>
						{sortByOptions.map((option) => (
							<option key={option.value} value={option.value}>
								{option.label}
							</option>
						))}
					</select>
				</label>
				<div className="manager-task-toolbar-actions">
					<button
						type="button"
						className="manager-filter-btn"
						onClick={clearFilters}
						disabled={!hasActiveFilters || isMutating}
					>
						Clear filters
					</button>
				</div>
			</div>
			{isLoading ? <div className="manager-state">Loading tasks...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && actionError ? <div className="manager-state manager-state-error">{actionError}</div> : null}
			{!isLoading && !error && tasks.length === 0 ? <div className="manager-state">No tasks available.</div> : null}
			{!isLoading && !error && tasks.length > 0 ? (
				<div className="ceo-list-card ceo-task-list">
					{tasks.map((task) => (
						<article className="ceo-task-item ceo-task-item-extended" key={task.id}>
							<div className="ceo-task-main">
								<h3>{task.title}</h3>
								<p>
									{task.projectName} | {task.teamName}
								</p>
							</div>
							<div className="ceo-task-right manager-task-controls">
								<label>
									Status
									<select
										className="manager-task-select"
										value={task.status}
										onChange={(event) => onUpdateStatus(task.id, event.target.value as ApiTaskStatus)}
										disabled={isMutating}
									>
										{statusOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<label>
									Assignee
									<select
										className="manager-task-select"
										value={task.assigneeMemberId ?? ''}
										onChange={(event) => onAssign(task.id, event.target.value || null)}
										disabled={isMutating}
									>
										<option value="">Unassigned</option>
										{getAssignableMembers(task).map((member) => (
											<option key={member.id} value={member.id}>
												{member.name}
											</option>
										))}
									</select>
								</label>
								<button
									className="ceo-btn-sm"
									type="button"
									onClick={() => openEditTaskModal(task)}
									disabled={isMutating}
								>
									Edit
								</button>
								<button
									className="ceo-btn-danger"
									type="button"
									onClick={() => handleDeleteTask(task)}
									disabled={isMutating}
								>
									Delete
								</button>
							</div>
							<div className="ceo-task-meta-row">
								<span>Priority: {task.priority}</span>
								<span>Current assignee: {task.assigneeName || 'Unassigned'}</span>
							</div>
						</article>
					))}
					<div className="manager-task-pagination">
						<div className="manager-task-page-meta">
							<span>
								Page {taskPageState.page} of {taskPageState.totalPages}
							</span>
							<span>{taskPageState.total} tasks total</span>
						</div>
						<div className="manager-task-page-controls">
							<label>
								Page size
								<select
									className="manager-task-select"
									value={taskQuery.limit}
									onChange={(event) => updateQuery({ limit: Number(event.target.value) as 10 | 20 | 50 })}
								>
									{pageSizeOptions.map((size) => (
										<option key={size} value={size}>
											{size}
										</option>
									))}
								</select>
							</label>
							<button
								type="button"
								className="ceo-btn-ghost"
								onClick={() => updateQuery({ page: Math.max(1, taskQuery.page - 1) }, false)}
								disabled={taskQuery.page <= 1}
							>
								Previous
							</button>
							<button
								type="button"
								className="ceo-btn-primary"
								onClick={() => updateQuery({ page: Math.min(taskPageState.totalPages, taskQuery.page + 1) }, false)}
								disabled={taskQuery.page >= taskPageState.totalPages}
							>
								Next
							</button>
						</div>
					</div>
				</div>
			) : null}
			{activeModal ? (
				<div className="ceo-overlay" role="dialog" aria-modal="true" aria-label={activeModal.mode === 'edit' ? 'Edit task' : 'Create task'}>
					<div className="ceo-modal">
						<div className="ceo-modal-head">
							<h3>{activeModal.mode === 'edit' ? 'Edit Task' : 'Create Task'}</h3>
							<button type="button" onClick={closeTaskModal} aria-label="Close task modal">
								x
							</button>
						</div>
						<div className="ceo-modal-body">
							<div className="ceo-form-grid">
								<label>
									Title
									<input value={taskForm.title} onChange={(event) => updateTaskForm({ title: event.target.value })} placeholder="Task title" />
								</label>
								<label>
									Project
									<select
										value={taskForm.projectId}
										onChange={(event) => handleProjectChange(event.target.value)}
									>
										<option value="">Select project</option>
										{sortedProjects.map((project) => (
											<option key={project.id} value={project.id}>
												{project.name}
											</option>
										))}
									</select>
								</label>
								<label>
									Status
									<select value={taskForm.status} onChange={(event) => updateTaskForm({ status: event.target.value as ApiTaskStatus })}>
										{statusOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<label>
									Priority
									<select
										value={taskForm.priority}
										onChange={(event) => updateTaskForm({ priority: event.target.value as 'low' | 'medium' | 'high' })}
									>
										<option value="low">Low</option>
										<option value="medium">Medium</option>
										<option value="high">High</option>
									</select>
								</label>
								<label>
									Team
									<select value={taskForm.teamId} onChange={(event) => updateTaskForm({ teamId: event.target.value })}>
										{!isTeamScopedManager ? <option value="">No team</option> : null}
										{assignableTeamsForForm.map((team) => (
											<option key={team.id} value={team.id}>
												{team.name}
											</option>
										))}
									</select>
								</label>
								{isTeamScopedManager && taskForm.projectId && assignableTeamsForForm.length === 0 ? (
									<p className="manager-state manager-state-error">No teams in your scope are assigned to this project.</p>
								) : null}
								<label>
									Due Date
									<input type="date" value={taskForm.dueDate} onChange={(event) => updateTaskForm({ dueDate: event.target.value })} />
								</label>
								<label>
									Assignee
									<select
										value={taskForm.assigneeMemberId}
										onChange={(event) => updateTaskForm({ assigneeMemberId: event.target.value })}
									>
										<option value="">Unassigned</option>
										{sortedMembers.map((member) => (
											<option key={member.id} value={member.id}>
												{member.name}
											</option>
										))}
									</select>
								</label>
							</div>
							{taskFormError ? <p className="manager-state manager-state-error">{taskFormError}</p> : null}
							<label>
								Description
								<textarea
									className="manager-task-textarea"
									value={taskForm.description}
									onChange={(event) => updateTaskForm({ description: event.target.value })}
									placeholder="Describe the task details"
								/>
							</label>
						</div>
						<div className="ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={closeTaskModal}>
								Cancel
							</button>
							<button className="ceo-btn-primary" type="button" onClick={submitTaskForm} disabled={disableSubmit}>
								{activeModal.mode === 'edit' ? 'Save Changes' : 'Create Task'}
							</button>
						</div>
					</div>
				</div>
			) : null}
			{deleteTarget ? (
				<div className="ceo-overlay" role="dialog" aria-modal="true" aria-label="Confirm delete task">
					<div className="ceo-modal ceo-confirm-alert">
						<div className="ceo-modal-head">
							<h3>Delete Task</h3>
							<button type="button" onClick={closeDeleteModal} aria-label="Close delete confirmation">
								x
							</button>
						</div>
						<div className="ceo-modal-body">
							<p>
								Are you sure you want to delete <strong>{deleteTarget.title}</strong>?
							</p>
							<p className="ceo-confirm-note">This action cannot be undone.</p>
						</div>
						<div className="ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={closeDeleteModal} disabled={isMutating}>
								Cancel
							</button>
							<button className="ceo-btn-danger" type="button" onClick={confirmDeleteTask} disabled={isMutating}>
								Delete
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	)
}

export default ManagerTasksPanel
