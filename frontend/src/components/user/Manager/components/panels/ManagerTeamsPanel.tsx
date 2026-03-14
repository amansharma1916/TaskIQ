import { useEffect, useMemo, useState } from 'react'
import type { ManagerMemberOption, ManagerProjectCard, ManagerTaskRow, ManagerTeamCard } from '../../types/manager.types'
import '../../../../../styles/user/Manager/panels/ManagerTeamsPanel.css'

type ManagerTeamsPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	actionError: string
	isMutating: boolean
	teams: ManagerTeamCard[]
	projects: ManagerProjectCard[]
	tasks: ManagerTaskRow[]
	members: ManagerMemberOption[]
	onAddMember: (teamId: string, memberId: string) => void
	onRevokeMember: (teamId: string, memberId: string) => void
}

type TeamHealth = 'healthy' | 'attention'
type TeamModalState =
	| { type: 'add'; teamId: string }
	| { type: 'revoke'; teamId: string }
	| null

type TeamView = {
	team: ManagerTeamCard
	membersInTeam: ManagerMemberOption[]
	assignedProjects: ManagerProjectCard[]
	assignedTasks: ManagerTaskRow[]
	openTasks: number
	overdueTasks: number
	health: TeamHealth
}

const getTodayMidnight = (): number => {
	const now = new Date()
	return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
}

const isTaskOverdue = (task: ManagerTaskRow): boolean => {
	if (task.status === 'done' || !task.dueDate) {
		return false
	}

	const dueDate = new Date(task.dueDate)
	if (Number.isNaN(dueDate.getTime())) {
		return false
	}

	const dueMidnight = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate()).getTime()
	return dueMidnight < getTodayMidnight()
}

const ManagerTeamsPanel = ({
	isActive,
	isLoading,
	error,
	actionError,
	isMutating,
	teams,
	projects,
	tasks,
	members,
	onAddMember,
	onRevokeMember,
}: ManagerTeamsPanelProps) => {
	const [query, setQuery] = useState('')
	const [tagFilter, setTagFilter] = useState('all')
	const [healthFilter, setHealthFilter] = useState<'all' | TeamHealth>('all')
	const [expandedTeamIds, setExpandedTeamIds] = useState<string[]>([])
	const [modalState, setModalState] = useState<TeamModalState>(null)
	const [selectedMemberId, setSelectedMemberId] = useState('')

	const tagOptions = useMemo(() => {
		const tags = new Set<string>()
		teams.forEach((team) => {
			if (team.tag?.trim()) {
				tags.add(team.tag.trim())
			}
		})

		return ['all', ...Array.from(tags).sort((left, right) => left.localeCompare(right))]
	}, [teams])

	const teamViews = useMemo<TeamView[]>(() => {
		return teams.map((team) => {
			const membersInTeam = members.filter((member) => member.teamId === team.id)
			const assignedProjects = projects.filter((project) => project.assignedTeamIds.includes(team.id))
			const assignedTasks = tasks.filter((task) => task.teamId === team.id)
			const openTasks = assignedTasks.filter((task) => task.status !== 'done')
			const overdueTasks = openTasks.filter(isTaskOverdue)

			return {
				team,
				membersInTeam,
				assignedProjects,
				assignedTasks,
				openTasks: openTasks.length,
				overdueTasks: overdueTasks.length,
				health: overdueTasks.length > 0 ? 'attention' : 'healthy',
			}
		})
	}, [teams, members, projects, tasks])

	const filteredTeams = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase()
		return teamViews.filter((item) => {
			if (tagFilter !== 'all' && item.team.tag !== tagFilter) {
				return false
			}

			if (healthFilter !== 'all' && item.health !== healthFilter) {
				return false
			}

			if (!normalizedQuery) {
				return true
			}

			return (
				item.team.name.toLowerCase().includes(normalizedQuery) ||
				item.team.description.toLowerCase().includes(normalizedQuery) ||
				item.membersInTeam.some((member) => member.name.toLowerCase().includes(normalizedQuery))
			)
		})
	}, [teamViews, query, tagFilter, healthFilter])

	const selectedTeamView = useMemo(
		() => (modalState ? teamViews.find((item) => item.team.id === modalState.teamId) ?? null : null),
		[modalState, teamViews]
	)

	const addableMembers = useMemo(() => {
		if (!selectedTeamView || modalState?.type !== 'add') {
			return []
		}

		return [...members]
			.filter((member) => member.teamId !== selectedTeamView.team.id)
			.sort((left, right) => left.name.localeCompare(right.name))
	}, [members, selectedTeamView, modalState])

	const revokableMembers = useMemo(() => {
		if (!selectedTeamView || modalState?.type !== 'revoke') {
			return []
		}

		return [...selectedTeamView.membersInTeam].sort((left, right) => left.name.localeCompare(right.name))
	}, [selectedTeamView, modalState])

	const selectedMember = useMemo(() => {
		if (!selectedMemberId) {
			return null
		}

		return members.find((member) => member.id === selectedMemberId) ?? null
	}, [selectedMemberId, members])

	const selectedMemberOpenTaskCount = useMemo(() => {
		if (!selectedMemberId || !selectedTeamView || modalState?.type !== 'revoke') {
			return 0
		}

		return selectedTeamView.assignedTasks.filter(
			(task) => task.assigneeMemberId === selectedMemberId && task.status !== 'done'
		).length
	}, [selectedMemberId, selectedTeamView, modalState])

	const hasActiveFilters = Boolean(query.trim()) || tagFilter !== 'all' || healthFilter !== 'all'

	const closeModal = () => {
		setModalState(null)
		setSelectedMemberId('')
	}

	const openAddMemberModal = (teamId: string) => {
		setModalState({ type: 'add', teamId })
		setSelectedMemberId('')
	}

	const openRevokeMemberModal = (teamId: string) => {
		setModalState({ type: 'revoke', teamId })
		setSelectedMemberId('')
	}

	const toggleTeamExpanded = (teamId: string) => {
		setExpandedTeamIds((current) =>
			current.includes(teamId) ? current.filter((id) => id !== teamId) : [...current, teamId]
		)
	}

	const clearFilters = () => {
		setQuery('')
		setTagFilter('all')
		setHealthFilter('all')
	}

	const submitAddMember = () => {
		if (!selectedTeamView || !selectedMemberId) {
			return
		}

		onAddMember(selectedTeamView.team.id, selectedMemberId)
		closeModal()
	}

	const submitRevokeMember = () => {
		if (!selectedTeamView || !selectedMemberId) {
			return
		}

		onRevokeMember(selectedTeamView.team.id, selectedMemberId)
		closeModal()
	}

	useEffect(() => {
		const hasModalOpen = Boolean(modalState)
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
	}, [modalState, isMutating])

	if (!isActive) {
		return null
	}

	return (
		<section className="ceo-panel active manager-teams-panel">
			<div className="ceo-section-head">
				<h2>Teams</h2>
			</div>

			{!isLoading && !error ? (
				<div className="ceo-task-filters manager-project-filters manager-teams-filters">
					<label>
						Search
						<input
							type="text"
							value={query}
							onChange={(event) => setQuery(event.target.value)}
							placeholder="Search team or member"
						/>
					</label>
					<label>
						Tag
						<select value={tagFilter} onChange={(event) => setTagFilter(event.target.value)}>
							<option value="all">All tags</option>
							{tagOptions
								.filter((tag) => tag !== 'all')
								.map((tag) => (
									<option key={tag} value={tag}>
										{tag}
									</option>
								))}
						</select>
					</label>
					<label>
						Workload
						<select value={healthFilter} onChange={(event) => setHealthFilter(event.target.value as 'all' | TeamHealth)}>
							<option value="all">All workload states</option>
							<option value="healthy">Healthy</option>
							<option value="attention">Needs attention</option>
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
					{tagFilter !== 'all' ? (
						<button className="manager-filter-chip" type="button" onClick={() => setTagFilter('all')}>
							Tag: {tagFilter} x
						</button>
					) : null}
					{healthFilter !== 'all' ? (
						<button className="manager-filter-chip" type="button" onClick={() => setHealthFilter('all')}>
							Workload: {healthFilter === 'healthy' ? 'Healthy' : 'Needs attention'} x
						</button>
					) : null}
					<button className="ceo-btn-outline" type="button" onClick={clearFilters}>
						Reset Filters
					</button>
				</div>
			) : null}

			{isLoading ? <div className="manager-state">Loading teams...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && actionError ? <div className="manager-state manager-state-error">{actionError}</div> : null}
			{!isLoading && !error && teams.length === 0 ? <div className="manager-state">No teams available.</div> : null}
			{!isLoading && !error && teams.length > 0 && filteredTeams.length === 0 ? (
				<div className="manager-state manager-state-empty">
					<p>No teams match your current filters.</p>
					<button className="ceo-btn-outline" type="button" onClick={clearFilters}>
						Reset Filters
					</button>
				</div>
			) : null}

			{!isLoading && !error && filteredTeams.length > 0 ? (
				<div className="ceo-list-card manager-teams-list-card">
					{filteredTeams.map((item) => {
						const isExpanded = expandedTeamIds.includes(item.team.id)

						return (
							<article className="ceo-task-item ceo-task-item-extended manager-team-card" key={item.team.id}>
								<div className="ceo-task-main">
									<div className="ceo-list-title-wrap">
										<h3>{item.team.name}</h3>
										<span className="ceo-team-tag">{item.team.tag}</span>
										<span className={`manager-team-health-pill ${item.health === 'healthy' ? 'healthy' : 'attention'}`}>
											{item.health === 'healthy' ? 'Healthy' : 'Needs attention'}
										</span>
									</div>
									<p>{item.team.description}</p>
									<div className="ceo-task-meta-row manager-team-metrics">
										<span>Members: {item.membersInTeam.length}</span>
										<span>Projects: {item.assignedProjects.length}</span>
										<span>Tasks: {item.assignedTasks.length}</span>
										<span>Open: {item.openTasks}</span>
										<span className={item.overdueTasks > 0 ? 'manager-team-overdue' : ''}>Overdue: {item.overdueTasks}</span>
									</div>
									<div className="manager-team-member-strip">
										{item.membersInTeam.slice(0, 6).map((member) => (
											<span className="manager-team-member-chip" key={member.id} title={member.name}>
												{member.name}
											</span>
										))}
										{item.membersInTeam.length > 6 ? <small>+{item.membersInTeam.length - 6} more</small> : null}
									</div>
								</div>
								<div className="ceo-task-right manager-team-actions">
									<button className="ceo-btn-sm" type="button" onClick={() => openAddMemberModal(item.team.id)} disabled={isMutating}>
										Add Member
									</button>
									<button className="ceo-btn-danger" type="button" onClick={() => openRevokeMemberModal(item.team.id)} disabled={isMutating || item.membersInTeam.length === 0}>
										Revoke Member
									</button>
									<button className="ceo-btn-outline" type="button" onClick={() => toggleTeamExpanded(item.team.id)}>
										{isExpanded ? 'Hide details' : 'View details'}
									</button>
								</div>

								{isExpanded ? (
									<div className="manager-team-details">
										<div className="manager-team-details-column">
											<h4>Assigned Projects</h4>
											{item.assignedProjects.length === 0 ? <p className="manager-team-empty">No projects assigned.</p> : null}
											{item.assignedProjects.map((project) => (
												<div className="manager-team-list-item" key={project.id}>
													<strong>{project.name}</strong>
													<small>Status: {project.status}</small>
												</div>
											))}
										</div>
										<div className="manager-team-details-column">
											<h4>Assigned Tasks</h4>
											{item.assignedTasks.length === 0 ? <p className="manager-team-empty">No tasks assigned.</p> : null}
											{item.assignedTasks.slice(0, 8).map((task) => (
												<div className="manager-team-list-item" key={task.id}>
													<strong>{task.title}</strong>
													<small>
														{task.status} | {task.priority}
														{task.assigneeName ? ` | ${task.assigneeName}` : ''}
													</small>
												</div>
											))}
											{item.assignedTasks.length > 8 ? <p className="manager-team-empty">Showing 8 of {item.assignedTasks.length} tasks.</p> : null}
										</div>
										<div className="manager-team-details-column">
											<h4>Team Members</h4>
											{item.membersInTeam.length === 0 ? <p className="manager-team-empty">No members in this team.</p> : null}
											{item.membersInTeam.map((member) => (
												<div className="manager-team-list-item manager-team-list-item-member" key={member.id}>
													<strong>{member.name}</strong>
													<button className="ceo-btn-danger" type="button" disabled={isMutating} onClick={() => {
														openRevokeMemberModal(item.team.id)
														setSelectedMemberId(member.id)
													}}>
														Revoke
													</button>
												</div>
											))}
										</div>
									</div>
								) : null}
							</article>
						)
					})}
				</div>
			) : null}

			{modalState?.type === 'add' && selectedTeamView ? (
				<div
					className="manager-project-modal-overlay"
					role="presentation"
					onClick={(event) => {
						if (event.target === event.currentTarget && !isMutating) {
							closeModal()
						}
					}}
				>
					<div className="ceo-modal manager-project-modal manager-team-modal" role="dialog" aria-modal="true" aria-label="Add member">
						<h2>Add Member to {selectedTeamView.team.name}</h2>
						<p>Select a member to add to this team.</p>
						<label className="ceo-field">
							<span>Member</span>
							<select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
								<option value="">Select member</option>
								{addableMembers.map((member) => (
									<option key={member.id} value={member.id}>
										{member.name}
										{member.teamId ? ' (will move from another team)' : ''}
									</option>
								))}
							</select>
						</label>
						{addableMembers.length === 0 ? <div className="manager-project-modal-empty">No eligible members available to add.</div> : null}
						<div className="ceo-row ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={closeModal}>
								Cancel
							</button>
							<button className="ceo-btn-primary" type="button" onClick={submitAddMember} disabled={isMutating || !selectedMemberId || addableMembers.length === 0}>
								Add Member
							</button>
						</div>
					</div>
				</div>
			) : null}

			{modalState?.type === 'revoke' && selectedTeamView ? (
				<div
					className="manager-project-modal-overlay"
					role="presentation"
					onClick={(event) => {
						if (event.target === event.currentTarget && !isMutating) {
							closeModal()
						}
					}}
				>
					<div className="ceo-modal manager-project-modal manager-team-modal" role="dialog" aria-modal="true" aria-label="Revoke member">
						<h2>Revoke Member from {selectedTeamView.team.name}</h2>
						<p>This action is allowed even if the member still has open tasks. Review warning before confirming.</p>
						<label className="ceo-field">
							<span>Member</span>
							<select value={selectedMemberId} onChange={(event) => setSelectedMemberId(event.target.value)}>
								<option value="">Select member</option>
								{revokableMembers.map((member) => (
									<option key={member.id} value={member.id}>
										{member.name}
									</option>
								))}
							</select>
						</label>
						{selectedMember ? (
							<div className={`manager-team-warning ${selectedMemberOpenTaskCount > 0 ? 'warning' : 'safe'}`}>
								<strong>Warning</strong>
								<span>
									{selectedMember.name} has {selectedMemberOpenTaskCount} open task
									{selectedMemberOpenTaskCount === 1 ? '' : 's'} in this team.
								</span>
							</div>
						) : null}
						{revokableMembers.length === 0 ? <div className="manager-project-modal-empty">No members available to revoke.</div> : null}
						<div className="ceo-row ceo-modal-actions">
							<button className="ceo-btn-outline" type="button" onClick={closeModal}>
								Cancel
							</button>
							<button className="ceo-btn-danger" type="button" onClick={submitRevokeMember} disabled={isMutating || !selectedMemberId || revokableMembers.length === 0}>
								Confirm Revoke
							</button>
						</div>
					</div>
				</div>
			) : null}
		</section>
	)
}

export default ManagerTeamsPanel
