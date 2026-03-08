import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../styles/user/CEOs/Dashboard_CEO.css'
import { authorizedFetch } from '../../../services/apiClient'
import { getAuthUser, logoutSession, type AuthUser } from '../../../services/auth'
import { ceoDashboardData } from './CEO_dummy_data'
import Sidebar from './Components/layout/Sidebar'
import Topbar from './Components/layout/Topbar'
import DashboardPanel from './Components/panels/DashboardPanel'
import TeamsPanel from './Components/panels/TeamsPanel'
import DashboardStat from './Components/shared/DashboardStat'
import TaskRow from './Components/shared/TaskRow'
import type { ApiMember, ApiTeam } from './types/api.types'
import type { ModalId, PanelId } from './types/dashboard.types'
import { avatarTones, modalTitles, statusClassMap } from './utils/constants'
import { getInitials } from './utils/formatters'

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
	const [selectedTeamIdForRevoke, setSelectedTeamIdForRevoke] = useState<string | null>(null)
	const [revokeMemberError, setRevokeMemberError] = useState('')
	const [revokingMemberId, setRevokingMemberId] = useState<string | null>(null)
	const [removingCompanyMemberId, setRemovingCompanyMemberId] = useState<string | null>(null)
	const [pendingCompanyRemoval, setPendingCompanyRemoval] = useState<{ id: string; name: string } | null>(null)
	const [teamOptionsOpenFor, setTeamOptionsOpenFor] = useState<string | null>(null)
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

	const storedUser: AuthUser | null = getAuthUser()

	const displayCompanyName = storedUser?.companyName?.trim() || ceoDashboardData.orgName
	const displayUserName = storedUser?.name?.trim() || ceoDashboardData.currentUser.name
	const displayDesignation = storedUser?.role?.trim() || ceoDashboardData.currentUser.role
	const displayUserInitials = getInitials(displayUserName) || ceoDashboardData.currentUser.initials
	const isCeoUser = storedUser?.role === 'CEO'

	const fetchTeamsAndMembers = async () => {
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
	}

	useEffect(() => {
		void fetchTeamsAndMembers()
	}, [])

	const onlineMembers = membersData.slice(0, 4)
	const selectedTeamForRevoke = selectedTeamIdForRevoke
		? teamsData.find((team) => team.id === selectedTeamIdForRevoke) ?? null
		: null
	const selectedTeamMembersForRevoke = selectedTeamForRevoke
		? membersData.filter((member) => member.team === selectedTeamForRevoke.name)
		: []
	const companyId = storedUser?.companyId ?? null

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
		setTaskState((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
	}

	const switchPanel = (panel: PanelId) => {
		setActivePanel(panel)
		setProfileMenuOpen(false)
		setTeamOptionsOpenFor(null)
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
		if (modalId === 'revokeMember') {
			setSelectedTeamIdForRevoke(presetTeamId ?? null)
			setRevokeMemberError('')
		}
		setOpenModal(modalId)
	}

	const closeModal = () => {
		setCreateTeamError('')
		setInviteError('')
		setAddMemberError('')
		setRevokeMemberError('')
		setSelectedTeamIdForRevoke(null)
		setOpenModal(null)
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

			const result = await response.json().catch(() => null)

			if (!response.ok) {
				throw new Error(result?.message || `Failed to disband team: ${response.status}`)
			}

			setTeamOptionsOpenFor(null)
			await fetchTeamsAndMembers()
			setActionAlert({ type: 'success', message: 'Team disbanded successfully.' })
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Failed to disband team. Please try again.'
			setActionAlert({ type: 'error', message })
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

	const handleProfileSignOut = () => {
		setProfileMenuOpen(false)
		void handleSignOut()
	}

	return (
		<div className="ceo-dashboard-root">
			<Sidebar
				nav={ceoDashboardData.nav}
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
						stats={ceoDashboardData.stats}
						todayTasks={ceoDashboardData.todayTasks}
						onlineMembers={onlineMembers}
						projectHealth={ceoDashboardData.projectHealth}
						activity={ceoDashboardData.activity}
						taskState={taskState}
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
						<article className="ceo-card">
							{ceoDashboardData.allTasks.map((task) => (
								<TaskRow key={task.id} task={task} done={taskState[task.id]} showAssignee={true} onToggleTask={toggleTask} />
							))}
						</article>
					</div>

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
		</div>
	)
}

export default Dashboard_CEO
