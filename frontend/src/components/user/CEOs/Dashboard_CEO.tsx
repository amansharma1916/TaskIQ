import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../styles/user/CEOs/Dashboard_CEO.css'
import {
	ceoDashboardData,
	pageTitles,
	type ModalId,
	type PanelId,
	type ProgressItem,
	type StatCard,
	type TaskItem,
} from './CEO_dummy_data'

const toneClassMap = {
	cyan: 'tone-cyan',
	purple: 'tone-purple',
	yellow: 'tone-yellow',
	green: 'tone-green',
} as const

const chipClassMap = {
	dev: 'ceo-chip-dev',
	design: 'ceo-chip-design',
	ops: 'ceo-chip-ops',
	hr: 'ceo-chip-hr',
} as const

const statusClassMap = {
	active: 'ceo-status-active',
	review: 'ceo-status-review',
	planning: 'ceo-status-planning',
} as const

const progressToneClassMap = {
	cyan: 'ceo-fill-cyan',
	green: 'ceo-fill-green',
	yellow: 'ceo-fill-yellow',
} as const

type ApiMember = {
	_id: string
	memberName: string
	memberRole?: string
	memberTeam?: {
		_id: string
		teamName?: string
	} | null
}

type ApiTeam = {
	_id: string
	teamName: string
	teamDescription?: string
	teamTags?: string[]
	totalMembers?: number
	teamMembers?: Array<{
		_id: string
		memberName?: string
	}>
}

const avatarTones = ['cyan-purple', 'purple-red', 'yellow-cyan', 'green-purple', 'cyan-green', 'green-cyan', 'muted'] as const

const getInitials = (name: string) => {
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean)
	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}

const modalTitles: Record<ModalId, string> = {
	createTeam: 'Create New Team',
	disbandTeam: 'Disband Team',
	addMember: 'Add Member to Team',
	revokeMember: 'Revoke Member Access',
	createProject: 'Create New Project',
	discardProject: 'Discard Project',
	assignTeam: 'Assign Team to Project',
	revokeTeam: 'Revoke Team from Project',
	invite: 'Invite Team Member',
	editProfile: 'Edit Profile',
	createTask: 'Create Task',
}

const DashboardStat = ({ stat }: { stat: StatCard }) => {
	return (
		<div className="ceo-stat">
			<div className="ceo-stat-top">
				<span className="ceo-stat-label">{stat.label}</span>
				<span className={`ceo-stat-icon ${toneClassMap[stat.tone]}`}>{stat.label.slice(0, 2).toUpperCase()}</span>
			</div>
			<div className="ceo-stat-value">{stat.value}</div>
			<div className={`ceo-stat-delta ${stat.trend === 'up' ? 'delta-up' : 'delta-down'}`}>{stat.delta}</div>
		</div>
	)
}

const ProgressRow = ({ item }: { item: ProgressItem }) => (
	<div className="ceo-progress-row" key={item.id}>
		<div className="ceo-progress-head">
			<span>{item.name}</span>
			<span>{item.value}%</span>
		</div>
		<div className="ceo-progress-bar">
			<div className={`ceo-progress-fill ${progressToneClassMap[item.tone]}`} style={{ width: `${item.value}%` }} />
		</div>
	</div>
)

const Dashboard_CEO = () => {
	const navigate = useNavigate()
	const apiBase = import.meta.env.VITE_BACKEND_URL ?? ''
	const [activePanel, setActivePanel] = useState<PanelId>('dashboard')
	const [openModal, setOpenModal] = useState<ModalId | null>(null)
	const [profileMenuOpen, setProfileMenuOpen] = useState(false)
	const [teamsData, setTeamsData] = useState(ceoDashboardData.teams)
	const [membersData, setMembersData] = useState(ceoDashboardData.members)
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
	const [actionAlert, setActionAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
	const [taskState, setTaskState] = useState<Record<string, boolean>>(() => {
		const map: Record<string, boolean> = {}
		for (const item of [...ceoDashboardData.todayTasks, ...ceoDashboardData.allTasks]) {
			map[item.id] = item.done
		}
		return map
	})
	const [notificationState, setNotificationState] = useState<Record<string, boolean>>(() => {
		const map: Record<string, boolean> = {}
		for (const item of ceoDashboardData.notificationSettings) {
			map[item.id] = item.enabled
		}
		return map
	})

	const fetchTeamsAndMembers = async () => {
		try {
			if (!companyId) {
				throw new Error('Company not found for current user')
			}

			const [teamsResponse, membersResponse] = await Promise.all([
				fetch(`${apiBase}/api/teams?companyId=${encodeURIComponent(companyId)}`),
				fetch(`${apiBase}/api/members?companyId=${encodeURIComponent(companyId)}`),
			])

			if (!teamsResponse.ok || !membersResponse.ok) {
				throw new Error('Failed to load team/member data')
			}

			const [teamsJson, membersJson] = (await Promise.all([teamsResponse.json(), membersResponse.json()])) as [ApiTeam[], ApiMember[]]

			const mappedMembers = membersJson.map((member, index) => ({
				id: member._id,
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
	}

	useEffect(() => {
		void fetchTeamsAndMembers()
	}, [])

	const teamMemberGroups = useMemo(() => {
		const groups = teamsData.map((team) => ({
			id: team.id,
			name: team.name,
			members: membersData.filter((member) => member.team === team.name),
		}))

		const unassigned = membersData.filter((member) => !member.team || member.team === 'Unassigned')
		if (unassigned.length > 0) {
			groups.push({ id: 'team-unassigned', name: 'Unassigned', members: unassigned })
		}

		return groups
	}, [teamsData, membersData])
	const [expandedTeamId, setExpandedTeamId] = useState<string | null>(ceoDashboardData.teams[0]?.id ?? null)
	const onlineMembers = membersData.slice(0, 4)
	const companyId = (() => {
		try {
			const userRaw = localStorage.getItem('user')
			if (!userRaw) {
				return null
			}
			const parsed = JSON.parse(userRaw) as { companyId?: string | null }
			return parsed.companyId ?? null
		} catch {
			return null
		}
	})()

	useEffect(() => {
		if (!expandedTeamId && teamMemberGroups[0]?.id) {
			setExpandedTeamId(teamMemberGroups[0].id)
		}
	}, [expandedTeamId, teamMemberGroups])

	useEffect(() => {
		if (!actionAlert) {
			return
		}

		const timer = setTimeout(() => {
			setActionAlert(null)
		}, 3500)

		return () => clearTimeout(timer)
	}, [actionAlert])

	const toggleTask = (taskId: string) => {
		setTaskState((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
	}

	const switchPanel = (panel: PanelId) => {
		setActivePanel(panel)
		setProfileMenuOpen(false)
	}

	const openModalById = (modalId: ModalId, presetTeamId?: string) => {
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
			setAddMemberForm({ teamId: presetTeamId ?? teamsData[0]?.id ?? '', memberId: '' })
			setAddMemberError('')
		}
		setOpenModal(modalId)
	}

	const closeModal = () => {
		setCreateTeamError('')
		setInviteError('')
		setAddMemberError('')
		setOpenModal(null)
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
			const response = await fetch(`${apiBase}/api/teams/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					teamName: createTeamForm.teamName.trim(),
					teamDescription: createTeamForm.teamDescription.trim(),
					teamTags: parsedTags,
					companyId,
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
			const response = await fetch(`${apiBase}/api/invite/invite`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					name: inviteForm.name.trim(),
					email: inviteForm.email.trim(),
					role: inviteForm.role,
					companyId,
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

			const response = await fetch(`${apiBase}/api/teams/add-member`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					teamId: addMemberForm.teamId,
					memberId: addMemberForm.memberId,
					companyId,
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

	const renderTask = (task: TaskItem, showAssignee: boolean) => {
		const done = taskState[task.id]
		return (
			<div className="ceo-task-item" key={task.id}>
				<button
					aria-label={`Toggle task ${task.name}`}
					className={`ceo-task-cb ${done ? 'done' : ''}`}
					onClick={() => toggleTask(task.id)}
					type="button"
				/>
				<span className={`ceo-task-name ${done ? 'done-text' : ''}`}>{task.name}</span>
				{showAssignee && <span className="ceo-task-assignee">{task.assignee}</span>}
				<span className={`ceo-chip ${chipClassMap[task.chipTone]}`}>{task.chip}</span>
			</div>
		)
	}

	return (
		<div className="ceo-dashboard-root">
			<aside className="ceo-sidebar">
				<button className="ceo-logo-area" onClick={() => setProfileMenuOpen((prev) => !prev)} type="button">
					<div className="ceo-logo">
						Task<span>IQ</span>
					</div>
					<div className="ceo-logo-line" />
					<div className="ceo-org-label">
						{ceoDashboardData.orgName} | CEO
					</div>
				</button>

				{profileMenuOpen && (
					<div className="ceo-profile-menu">
						<button onClick={() => openModalById('editProfile')} type="button">
							Edit Profile
						</button>
						<button onClick={() => switchPanel('settings')} type="button">
							Preferences
						</button>
						<button onClick={() => {setProfileMenuOpen(false)
							localStorage.removeItem('user')
							navigate('/login')
						}} type="button" className="danger">
							Sign Out
						</button>
					</div>
				)}

				<div className="ceo-nav-scroll">
					<section className="ceo-nav-section">
						<h4>Overview</h4>
						{ceoDashboardData.nav.overview.map((item) => (
							<button
								className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
								key={item.id}
								onClick={() => switchPanel(item.id)}
								type="button"
							>
								<span>{item.short}</span>
								{item.label}
							</button>
						))}
					</section>

					<section className="ceo-nav-section">
						<h4>Workspace</h4>
						{ceoDashboardData.nav.workspace.map((item) => (
							<button
								className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
								key={item.id}
								onClick={() => switchPanel(item.id)}
								type="button"
							>
								<span>{item.short}</span>
								{item.label}
								{item.badge && <strong>{item.badge}</strong>}
							</button>
						))}
					</section>

					<section className="ceo-nav-section">
						<h4>System</h4>
						{ceoDashboardData.nav.system.map((item) => (
							<button
								className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
								key={item.id}
								onClick={() => switchPanel(item.id)}
								type="button"
							>
								<span>{item.short}</span>
								{item.label}
							</button>
						))}
					</section>
				</div>

				<button className="ceo-user-card" onClick={() => setProfileMenuOpen((prev) => !prev)} type="button">
					<div className="ceo-avatar">{ceoDashboardData.currentUser.initials}</div>
					<div>
						<div className="ceo-user-name">{ceoDashboardData.currentUser.name}</div>
						<div className="ceo-user-role">{ceoDashboardData.currentUser.role}</div>
					</div>
				</button>
			</aside>

			<main className="ceo-main">
				<header className="ceo-topbar">
					<h1>{pageTitles[activePanel]}</h1>
					<div className="ceo-topbar-right">
						<button className="ceo-btn-outline" onClick={() => openModalById('invite')} type="button">
							Invite Member
						</button>
						<button className="ceo-btn-primary" onClick={() => openModalById('createProject')} type="button">
							New Project
						</button>
						<button className="ceo-notif" type="button" aria-label="Notifications">
							N
						</button>
					</div>
				</header>

				{actionAlert && (
					<div className={`ceo-action-alert ${actionAlert.type === 'success' ? 'success' : 'error'}`} role="status">
						<span>{actionAlert.message}</span>
						<button aria-label="Dismiss alert" onClick={() => setActionAlert(null)} type="button">
							X
						</button>
					</div>
				)}

				<section className="ceo-content">
					<div className={`ceo-panel ${activePanel === 'dashboard' ? 'active' : ''}`}>
						<div className="ceo-stats-row">{ceoDashboardData.stats.map((stat) => <DashboardStat key={stat.id} stat={stat} />)}</div>

						<div className="ceo-grid-three">
							<article className="ceo-card">
								<div className="ceo-card-head">
									<h3>Today&apos;s Tasks</h3>
									<button className="ceo-link-btn" onClick={() => switchPanel('tasks')} type="button">
										View all
									</button>
								</div>
								{ceoDashboardData.todayTasks.map((task) => renderTask(task, false))}
							</article>

							<article className="ceo-card">
								<div className="ceo-card-head">
									<h3>Team Online</h3>
									<button className="ceo-link-btn" onClick={() => switchPanel('members')} type="button">
										All
									</button>
								</div>
								{onlineMembers.map((member) => (
									<div className="ceo-member-row" key={member.id}>
										<div className={`ceo-member-avatar tone-${member.tone}`}>{member.initials}</div>
										<div>
											<div className="ceo-member-name">{member.name}</div>
											<div className="ceo-member-role">{member.role}</div>
										</div>
										<div className={`ceo-online-dot ${member.online ? 'online' : 'offline'}`} />
									</div>
								))}
							</article>
						</div>

						<div className="ceo-grid-two">
							<article className="ceo-card">
								<div className="ceo-card-head">
									<h3>Project Health</h3>
								</div>
								{ceoDashboardData.projectHealth.map((item) => (
									<ProgressRow item={item} key={item.id} />
								))}
							</article>

							<article className="ceo-card">
								<div className="ceo-card-head">
									<h3>Recent Activity</h3>
								</div>
								{ceoDashboardData.activity.map((item) => (
									<div className="ceo-activity-item" key={item.id}>
										<span className={`ceo-activity-dot ${toneClassMap[item.tone]}`} />
										<div>
											<p>{item.label}</p>
											<small>{item.time}</small>
										</div>
									</div>
								))}
							</article>
						</div>
					</div>

					<div className={`ceo-panel ${activePanel === 'teams' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>Teams</h2>
							<div className="ceo-actions-row">
								<button className="ceo-btn-outline" onClick={() => openModalById('disbandTeam')} type="button">
									Disband Team
								</button>
								<button className="ceo-btn-primary" onClick={() => openModalById('createTeam')} type="button">
									Create Team
								</button>
							</div>
						</div>

						<article className="ceo-list-card">
							{teamsData.map((team) => (
								<div className="ceo-list-row" key={team.id}>
									<div className="ceo-list-main">
										<div className="ceo-list-title-wrap">
											<h3>{team.name}</h3>
											<span className="ceo-team-tag">{team.tag}</span>
										</div>
										<p>{team.description}</p>
									</div>
									<div className="ceo-list-avatars">
										{team.members.map((member) => (
											<span className={`ceo-mini-avatar tone-${member.tone}`} key={`${team.id}-${member.initials}`}>
												{member.initials}
											</span>
										))}
										<small>{team.totalMembers} members</small>
									</div>
									<div className="ceo-list-actions">
										<button className="ceo-btn-sm" onClick={() => openModalById('addMember', team.id)} type="button">
											Add Member
										</button>
										<button className="ceo-btn-danger" onClick={() => openModalById('revokeMember')} type="button">
											Revoke
										</button>
									</div>
								</div>
							))}
							<div className="ceo-list-row ceo-list-row-create">
								<div className="ceo-list-main">
									<h3>Create New Team</h3>
									<p>Group members into focused teams with clear goals and role boundaries.</p>
								</div>
								<div className="ceo-list-actions">
									<button className="ceo-btn-primary" onClick={() => openModalById('createTeam')} type="button">
										Create Team
									</button>
								</div>
							</div>
						</article>
					</div>

					<div className={`ceo-panel ${activePanel === 'projects' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>Projects</h2>
							<div className="ceo-actions-row">
								<button className="ceo-btn-outline" onClick={() => openModalById('discardProject')} type="button">
									Discard Project
								</button>
								<button className="ceo-btn-primary" onClick={() => openModalById('createProject')} type="button">
									Create Project
								</button>
							</div>
						</div>

						<article className="ceo-list-card">
							{ceoDashboardData.projects.map((project) => (
								<div className="ceo-list-row" key={project.id}>
									<div className="ceo-list-main ceo-list-main-project">
										<div className="ceo-list-title-wrap">
											<h3>{project.name}</h3>
											<span className={`ceo-status ${statusClassMap[project.status]}`}>{project.status}</span>
										</div>
										<p>{project.description}</p>
										<div className="ceo-project-meta">
											<span>Due {project.due}</span>
											<span>
												{project.completedTasks}/{project.totalTasks} tasks
											</span>
											<span>{project.team}</span>
										</div>
										<div className="ceo-progress-bar ceo-list-progress">
											<div className="ceo-progress-fill ceo-fill-cyan" style={{ width: `${project.progress}%` }} />
										</div>
									</div>
									<div className="ceo-list-actions">
										<button className="ceo-btn-sm" onClick={() => openModalById('assignTeam')} type="button">
											Assign Team
										</button>
										<button className="ceo-btn-danger" onClick={() => openModalById('revokeTeam')} type="button">
											Revoke Team
										</button>
									</div>
								</div>
							))}
							<div className="ceo-list-row ceo-list-row-create">
								<div className="ceo-list-main">
									<h3>New Project</h3>
									<p>Create a project, assign ownership, and start tracking progress immediately.</p>
								</div>
								<div className="ceo-list-actions">
									<button className="ceo-btn-primary" onClick={() => openModalById('createProject')} type="button">
										Create Project
									</button>
								</div>
							</div>
						</article>
					</div>

					<div className={`ceo-panel ${activePanel === 'tasks' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>All Tasks</h2>
							<button className="ceo-btn-primary" onClick={() => openModalById('createTask')} type="button">
								New Task
							</button>
						</div>
						<article className="ceo-card">{ceoDashboardData.allTasks.map((task) => renderTask(task, true))}</article>
					</div>

					<div className={`ceo-panel ${activePanel === 'members' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>Members</h2>
							<button className="ceo-btn-primary" onClick={() => openModalById('invite')} type="button">
								Invite Member
							</button>
						</div>
						<article className="ceo-list-card">
							{teamMemberGroups.map((group) => {
								const isExpanded = expandedTeamId === group.id
								return (
									<div className="ceo-team-member-group" key={group.id}>
										<button
											className={`ceo-list-row ceo-team-toggle-row ${isExpanded ? 'expanded' : ''}`}
											onClick={() => setExpandedTeamId((prev) => (prev === group.id ? null : group.id))}
											type="button"
										>
											<div className="ceo-list-main">
												<div className="ceo-list-title-wrap">
													<h3>{group.name}</h3>
													<span className="ceo-chip ceo-chip-dev">{group.members.length} members</span>
												</div>
												<p>Click to view members in this team.</p>
											</div>
											<div className="ceo-list-actions">
												<span className="ceo-team-toggle-indicator">{isExpanded ? 'Hide' : 'Show'}</span>
											</div>
										</button>

										{isExpanded && (
											<div className="ceo-team-members-container">
												{group.members.length === 0 ? (
													<div className="ceo-team-empty">No members assigned yet.</div>
												) : (
													group.members.map((member) => (
														<div className="ceo-team-member-row" key={member.id}>
															<div className={`ceo-member-avatar tone-${member.tone}`}>{member.initials}</div>
															<div className="ceo-list-main ceo-list-main-member">
																<div className="ceo-member-name">{member.name}</div>
																<div className="ceo-member-role">{member.role}</div>
															</div>
															<div className="ceo-list-actions">
																{member.name.includes('(You)') ? (
																	<span className="ceo-chip ceo-chip-dev">Admin</span>
																) : (
																	<button className="ceo-btn-danger" onClick={() => openModalById('revokeMember')} type="button">
																		Revoke
																	</button>
																)}
															</div>
														</div>
													))
												)}
											</div>
										)}
									</div>
								)
							})}
						</article>
					</div>

					<div className={`ceo-panel ${activePanel === 'analytics' ? 'active' : ''}`}>
						<div className="ceo-section-head">
							<h2>Analytics</h2>
						</div>
						<div className="ceo-stats-row">
							{ceoDashboardData.analyticsStats.map((stat) => (
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
					<div className="ceo-modal" role="dialog" aria-modal="true" aria-label={modalTitles[openModal]}>
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
						<div className="ceo-modal-actions">
							<button className="ceo-btn-outline" onClick={closeModal} type="button">
								Cancel
							</button>
							<button
								className="ceo-btn-primary"
								onClick={
									openModal === 'createTeam'
										? () => void handleCreateTeam()
										: openModal === 'invite'
											? () => void handleSendInvite()
											: openModal === 'addMember'
												? () => void handleAddMemberToTeam()
											: closeModal
								}
								type="button"
								disabled={(openModal === 'createTeam' && isCreatingTeam) || (openModal === 'invite' && isSendingInvite) || (openModal === 'addMember' && isAddingMember)}
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
										: 'Confirm'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

export default Dashboard_CEO
