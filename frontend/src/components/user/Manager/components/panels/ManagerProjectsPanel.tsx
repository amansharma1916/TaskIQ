import { useEffect, useMemo, useState } from 'react'
import type { ApiProjectStatus } from '../../../CEOs/types/api.types'
import { statusClassMap } from '../../../CEOs/utils/constants'
import type { ManagerProjectCard, ManagerTeamCard } from '../../types/manager.types'
import { getAuthUser } from '../../../../../services/auth'
import '../../../../../styles/user/Manager/panels/ManagerProjectsPanel.css'

type ManagerProjectsPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	actionError: string
	isMutating: boolean
	projects: ManagerProjectCard[]
	teams: ManagerTeamCard[]
	onCreateProject: (payload: {
		projectName: string
		projectDescription?: string
		projectStatus: ApiProjectStatus
		dueDate?: string | null
	}) => void
	onUpdateProject: (
		projectId: string,
		payload: {
			projectName: string
			projectDescription?: string
			projectStatus: ApiProjectStatus
			dueDate?: string | null
		}
	) => void
	onAssignTeams: (projectId: string, teamIds: string[]) => void
	onRevokeTeams: (projectId: string, teamIds: string[]) => void
}

const projectStatuses: Array<{ value: 'all' | ApiProjectStatus; label: string }> = [
	{ value: 'all', label: 'All statuses' },
	{ value: 'planning', label: 'Planning' },
	{ value: 'active', label: 'Active' },
	{ value: 'review', label: 'Review' },
	{ value: 'completed', label: 'Completed' },
	{ value: 'blocked', label: 'Blocked' },
]

const statusLabelMap: Record<ApiProjectStatus, string> = {
	planning: 'Planning',
	active: 'Active',
	review: 'Review',
	completed: 'Completed',
	blocked: 'Blocked',
}

const sortOptions = [
	{ value: 'due-asc', label: 'Due Date (Soonest)' },
	{ value: 'due-desc', label: 'Due Date (Latest)' },
	{ value: 'name-asc', label: 'Name (A-Z)' },
	{ value: 'status', label: 'Status' },
	{ value: 'teams-desc', label: 'Most Teams' },
] as const

type ProjectSortValue = (typeof sortOptions)[number]['value']
type ModalType = 'create' | 'edit' | 'assign' | 'revoke' | 'revoke-confirm'

const createInitialSortValue = (): ProjectSortValue => {
	if (typeof window === 'undefined') {
		return 'due-asc'
	}

	const stored = window.localStorage.getItem('manager:projects:sort')
	if (stored && sortOptions.some((option) => option.value === stored)) {
		return stored as ProjectSortValue
	}

	return 'due-asc'
}

const createInitialTeamFilter = (): string => {
	if (typeof window === 'undefined') {
		return 'all'
	}

	return window.localStorage.getItem('manager:projects:teamFilter') || 'all'
}

const getDueRisk = (dueDate: string | null): { label: string; className: string } => {
	if (!dueDate) {
		return { label: 'No due date', className: 'manager-due-neutral' }
	}

	const parsed = new Date(dueDate)
	if (Number.isNaN(parsed.getTime())) {
		return { label: 'No due date', className: 'manager-due-neutral' }
	}

	const today = new Date()
	const current = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
	const due = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()).getTime()
	const diffDays = Math.ceil((due - current) / (1000 * 60 * 60 * 24))

	if (diffDays < 0) {
		return { label: `Overdue by ${Math.abs(diffDays)}d`, className: 'manager-due-overdue' }
	}

	if (diffDays <= 3) {
		return { label: `Due in ${diffDays}d`, className: 'manager-due-soon' }
	}

	return { label: `Due in ${diffDays}d`, className: 'manager-due-good' }
}

const formatDateInputValue = (value?: string | null): string => {
	if (!value) {
		return ''
	}

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) {
		return ''
	}

	return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}`
}

const ManagerProjectsPanel = ({
	isActive,
	isLoading,
	error,
	actionError,
	isMutating,
	projects,
	teams,
	onCreateProject,
	onUpdateProject,
	onAssignTeams,
	onRevokeTeams,
}: ManagerProjectsPanelProps) => {
	const authUser = getAuthUser()
	const isTeamScopedManager = authUser?.role === 'Manager' && authUser?.managerScope === 'team'

	const [query, setQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState<'all' | ApiProjectStatus>('all')
	const [teamFilter, setTeamFilter] = useState<string>(createInitialTeamFilter)
	const [sortBy, setSortBy] = useState<ProjectSortValue>(createInitialSortValue)
	const [activeModal, setActiveModal] = useState<{ type: ModalType; projectId?: string } | null>(null)
	const [name, setName] = useState('')
	const [description, setDescription] = useState('')
	const [status, setStatus] = useState<ApiProjectStatus>('planning')
	const [dueDate, setDueDate] = useState('')
	const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])

	const filteredProjects = useMemo(() => {
		const filtered = projects.filter((project) => {
			if (statusFilter !== 'all' && project.status !== statusFilter) {
				return false
			}

			if (teamFilter !== 'all' && !project.assignedTeamIds.includes(teamFilter)) {
				return false
			}

			const normalizedQuery = query.trim().toLowerCase()
			if (!normalizedQuery) {
				return true
			}

			return (
				project.name.toLowerCase().includes(normalizedQuery) ||
				project.description.toLowerCase().includes(normalizedQuery) ||
				project.assignedTeamNames.some((teamName) => teamName.toLowerCase().includes(normalizedQuery))
			)
		})

		const sorted = [...filtered]
		sorted.sort((left, right) => {
			if (sortBy === 'name-asc') {
				return left.name.localeCompare(right.name)
			}

			if (sortBy === 'status') {
				return left.status.localeCompare(right.status)
			}

			if (sortBy === 'teams-desc') {
				return right.teamCount - left.teamCount
			}

			const leftDue = left.dueDate ? new Date(left.dueDate).getTime() : Number.MAX_SAFE_INTEGER
			const rightDue = right.dueDate ? new Date(right.dueDate).getTime() : Number.MAX_SAFE_INTEGER

			return sortBy === 'due-desc' ? rightDue - leftDue : leftDue - rightDue
		})

		return sorted
	}, [projects, query, statusFilter, teamFilter, sortBy])

	const selectedProject = activeModal?.projectId ? projects.find((project) => project.id === activeModal.projectId) ?? null : null
	const isProjectFormModal = activeModal?.type === 'create' || activeModal?.type === 'edit'
	const isAssignModal = activeModal?.type === 'assign'
	const isRevokeModal = activeModal?.type === 'revoke'
	const isRevokeConfirmModal = activeModal?.type === 'revoke-confirm'
	const hasActiveFilters = Boolean(query.trim()) || statusFilter !== 'all' || teamFilter !== 'all'
	const assignableTeams = isAssignModal && selectedProject ? teams.filter((team) => !selectedProject.assignedTeamIds.includes(team.id)) : []
	const revokableTeams = (isRevokeModal || isRevokeConfirmModal) && selectedProject
		? teams.filter((team) => selectedProject.assignedTeamIds.includes(team.id))
		: []

	const openCreateModal = () => {
		setActiveModal({ type: 'create' })
		setName('')
		setDescription('')
		setStatus('planning')
		setDueDate('')
		setSelectedTeamIds([])
	}

	const openEditModal = (project: ManagerProjectCard) => {
		setActiveModal({ type: 'edit', projectId: project.id })
		setName(project.name)
		setDescription(project.description)
		setStatus(project.status)
		setDueDate(formatDateInputValue(project.dueDate))
		setSelectedTeamIds([])
	}

	const openAssignModal = (project: ManagerProjectCard) => {
		setActiveModal({ type: 'assign', projectId: project.id })
		setSelectedTeamIds([])
	}

	const openRevokeModal = (project: ManagerProjectCard) => {
		setActiveModal({ type: 'revoke', projectId: project.id })
		setSelectedTeamIds([])
	}

	const closeModal = () => {
		setActiveModal(null)
		setSelectedTeamIds([])
	}

	const submitProjectForm = () => {
		const trimmedName = name.trim()
		if (!trimmedName) {
			return
		}

		const payload = {
			projectName: trimmedName,
			projectDescription: description.trim(),
			projectStatus: status,
			dueDate: dueDate || null,
		}

		if (activeModal?.type === 'edit' && selectedProject) {
			onUpdateProject(selectedProject.id, payload)
		} else {
			onCreateProject(payload)
		}

		closeModal()
	}

	const toggleTeamSelection = (teamId: string) => {
		setSelectedTeamIds((current) => (current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId]))
	}

	const submitAssignTeams = () => {
		if (!selectedProject || selectedTeamIds.length === 0) {
			return
		}

		onAssignTeams(selectedProject.id, selectedTeamIds)
		closeModal()
	}

	const submitRevokeTeams = () => {
		if (!selectedProject || selectedTeamIds.length === 0) {
			return
		}

		onRevokeTeams(selectedProject.id, selectedTeamIds)
		closeModal()
	}

	const clearFilters = () => {
		setQuery('')
		setStatusFilter('all')
		setTeamFilter('all')
	}

	useEffect(() => {
		if (typeof window === 'undefined') {
			return
		}

		window.localStorage.setItem('manager:projects:sort', sortBy)
	}, [sortBy])

	useEffect(() => {
		if (typeof window === 'undefined') {
			return
		}

		window.localStorage.setItem('manager:projects:teamFilter', teamFilter)
	}, [teamFilter])

	useEffect(() => {
		const hasModalOpen = Boolean(activeModal)
		if (!hasModalOpen) {
			return
		}

		const onKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && !isMutating) {
				closeModal()
			}
		}

		window.addEventListener('keydown', onKeyDown)
		return () => {
			window.removeEventListener('keydown', onKeyDown)
		}
	}, [activeModal, isMutating])

	if (!isActive) {
		return null
	}

	return (
		<section className="ceo-panel active">
			<div className="ceo-section-head">
				<h2>Projects</h2>
				{!isTeamScopedManager ? (
					<div className="ceo-actions-row">
						<button className="ceo-btn-primary" type="button" onClick={openCreateModal} disabled={isMutating}>
							Create Project
						</button>
					</div>
				) : null}
			</div>
			{!isLoading && !error ? (
				<div className="ceo-task-filters manager-project-filters">
					<label>
						Search
						<input
							type="text"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search by project or team"
						/>
					</label>
					<label>
						Status
						<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | ApiProjectStatus)}>
							{projectStatuses.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
					<label>
						Team
						<select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
							<option value="all">All teams</option>
							{teams.map((team) => (
								<option key={team.id} value={team.id}>
									{team.name}
								</option>
							))}
						</select>
					</label>
					<label>
						Sort
						<select value={sortBy} onChange={(event) => setSortBy(event.target.value as ProjectSortValue)}>
							{sortOptions.map((option) => (
								<option key={option.value} value={option.value}>
									{option.label}
								</option>
							))}
						</select>
					</label>
				</div>
			) : null}
			{!isLoading && !error && hasActiveFilters ? (
				<div className="manager-filter-chip-row">
					{query.trim() ? (
						<button className="manager-filter-chip" type="button" onClick={() => setQuery('')}>
							Search: {query.trim()} x
						</button>
					) : null}
					{statusFilter !== 'all' ? (
						<button className="manager-filter-chip" type="button" onClick={() => setStatusFilter('all')}>
							Status: {statusLabelMap[statusFilter]} x
						</button>
					) : null}
					{teamFilter !== 'all' ? (
						<button className="manager-filter-chip" type="button" onClick={() => setTeamFilter('all')}>
							Team: {teams.find((team) => team.id === teamFilter)?.name || 'Selected'} x
						</button>
					) : null}
					<button className="ceo-btn-outline" type="button" onClick={clearFilters}>
						Reset Filters
					</button>
				</div>
			) : null}
			{isLoading ? <div className="manager-state">Loading projects...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && actionError ? <div className="manager-state manager-state-error">{actionError}</div> : null}
			{!isLoading && !error && projects.length === 0 ? (
				<div className="manager-state manager-state-empty">
					{isTeamScopedManager ? (
						<p>No projects are currently assigned to your team scope.</p>
					) : (
						<>
							<p>No projects yet. Create the first project for your team.</p>
							<button className="ceo-btn-primary" type="button" onClick={openCreateModal} disabled={isMutating}>
								Create Project
							</button>
						</>
					)}
				</div>
			) : null}
			{!isLoading && !error && projects.length > 0 && filteredProjects.length === 0 ? (
				<div className="manager-state manager-state-empty">
					<p>No projects match your current filters.</p>
					<button className="ceo-btn-outline" type="button" onClick={clearFilters}>
						Reset Filters
					</button>
				</div>
			) : null}
			{!isLoading && !error && filteredProjects.length > 0 ? (
				<div className="ceo-list-card">
					{filteredProjects.map((project) => (
						<article className="ceo-task-item ceo-task-item-extended" key={project.id}>
							<div className="ceo-task-main">
								<div className="ceo-list-title-wrap">
									<h3>{project.name}</h3>
									<span className={`ceo-status ${statusClassMap[project.status]}`}>{statusLabelMap[project.status]}</span>
								</div>
								<p>{project.description}</p>
								<div className="ceo-task-meta-row">
									<span>Teams: {project.assignedTeamNames.length > 0 ? project.assignedTeamNames.join(', ') : 'None assigned'}</span>
									<span className={getDueRisk(project.dueDate).className}>{getDueRisk(project.dueDate).label}</span>
								</div>
							</div>
							<div className="ceo-task-right">
								<button className="ceo-btn-outline" type="button" onClick={() => openEditModal(project)} disabled={isMutating}>
									Edit
								</button>
								<button className="ceo-btn-sm" type="button" onClick={() => openAssignModal(project)} disabled={isMutating}>
									Assign Teams
								</button>
								<button className="ceo-btn-danger" type="button" onClick={() => openRevokeModal(project)} disabled={isMutating}>
									Revoke Teams
								</button>
							</div>
							<div className="ceo-task-meta-row">
								<span>Due: {project.dueLabel}</span>
								<span>Teams: {project.teamCount}</span>
							</div>
						</article>
					))}
				</div>
			) : null}

			{isProjectFormModal && (
				<div className="manager-project-modal-overlay" role="presentation" onClick={(event) => {
					if (event.target === event.currentTarget && !isMutating) {
						closeModal()
					}
				}}>
					<div className="ceo-modal manager-project-modal" role="dialog" aria-modal="true" aria-label="Project form">
						<h2>{activeModal?.type === 'edit' ? 'Edit Project' : 'Create Project'}</h2>
						<label className="ceo-field">
							<span>Project name</span>
							<input value={name} onChange={(event) => setName(event.target.value)} placeholder="Q2 Delivery Plan" />
						</label>
						<label className="ceo-field">
							<span>Description</span>
							<textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} />
						</label>
						<div className="manager-project-modal-grid">
							<label className="ceo-field">
								<span>Status</span>
								<select value={status} onChange={(event) => setStatus(event.target.value as ApiProjectStatus)}>
									{projectStatuses
										.filter((option) => option.value !== 'all')
										.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
								</select>
							</label>
							<label className="ceo-field">
								<span>Due date</span>
								<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
							</label>
						</div>
						<div className="ceo-row ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={closeModal}>
								Cancel
							</button>
							<button className="ceo-btn-primary" type="button" onClick={submitProjectForm} disabled={isMutating || !name.trim()}>
								{activeModal?.type === 'edit' ? 'Save Changes' : 'Create Project'}
							</button>
						</div>
					</div>
				</div>
			)}

			{isAssignModal && selectedProject && (
				<div className="manager-project-modal-overlay" role="presentation" onClick={(event) => {
					if (event.target === event.currentTarget && !isMutating) {
						closeModal()
					}
				}}>
					<div className="ceo-modal manager-project-modal" role="dialog" aria-modal="true" aria-label="Assign teams">
						<h2>Assign Teams</h2>
						<p>Project: {selectedProject.name}</p>
						<div className="manager-project-team-grid">
							{assignableTeams.length === 0 ? <div className="manager-project-modal-empty">No unassigned teams available.</div> : null}
							{assignableTeams.map((team) => {
									const isSelected = selectedTeamIds.includes(team.id)
									return (
										<label className={`ptm-team-card ${isSelected ? 'selected' : ''}`} key={team.id}>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => toggleTeamSelection(team.id)}
											/>
											<span className="ptm-team-card-text">
												<span>{team.name}</span>
												<small>{team.description}</small>
											</span>
										</label>
									)
								})}
						</div>
						<div className="ceo-row ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={closeModal}>
								Cancel
							</button>
							<button
								className="ceo-btn-primary"
								type="button"
								onClick={submitAssignTeams}
								disabled={isMutating || selectedTeamIds.length === 0 || assignableTeams.length === 0}
							>
								Assign Selected
							</button>
						</div>
					</div>
				</div>
			)}

			{isRevokeModal && selectedProject && (
				<div className="manager-project-modal-overlay" role="presentation" onClick={(event) => {
					if (event.target === event.currentTarget && !isMutating) {
						closeModal()
					}
				}}>
					<div className="ceo-modal manager-project-modal" role="dialog" aria-modal="true" aria-label="Revoke teams">
						<h2>Revoke Teams</h2>
						<p>Project: {selectedProject.name}</p>
						<div className="manager-project-team-grid">
							{revokableTeams.length === 0 ? <div className="manager-project-modal-empty">No teams are currently assigned.</div> : null}
							{revokableTeams.map((team) => {
									const isSelected = selectedTeamIds.includes(team.id)
									return (
										<label className={`ptm-team-card ${isSelected ? 'selected' : ''}`} key={team.id}>
											<input
												type="checkbox"
												checked={isSelected}
												onChange={() => toggleTeamSelection(team.id)}
											/>
											<span className="ptm-team-card-text">
												<span>{team.name}</span>
												<small>{team.description}</small>
											</span>
										</label>
									)
								})}
						</div>
						<div className="ceo-row ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={closeModal}>
								Cancel
							</button>
							<button
								className="ceo-btn-danger"
								type="button"
								onClick={() => setActiveModal({ type: 'revoke-confirm', projectId: selectedProject.id })}
								disabled={isMutating || selectedTeamIds.length === 0 || revokableTeams.length === 0}
							>
								Continue
							</button>
						</div>
					</div>
				</div>
			)}

			{isRevokeConfirmModal && selectedProject ? (
				<div className="manager-project-modal-overlay" role="presentation" onClick={(event) => {
					if (event.target === event.currentTarget && !isMutating) {
						setActiveModal({ type: 'revoke', projectId: selectedProject.id })
					}
				}}>
					<div className="ceo-modal manager-project-modal manager-project-confirm-modal" role="dialog" aria-modal="true" aria-label="Confirm revoke">
						<h2>Confirm Team Revoke</h2>
						<p>
							You are about to revoke {selectedTeamIds.length} team{selectedTeamIds.length === 1 ? '' : 's'} from {selectedProject.name}.
						</p>
						<div className="ceo-row ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={() => setActiveModal({ type: 'revoke', projectId: selectedProject.id })}>
								Back
							</button>
							<button className="ceo-btn-danger" type="button" onClick={submitRevokeTeams} disabled={isMutating}>
								Confirm Revoke
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	)
}

export default ManagerProjectsPanel
