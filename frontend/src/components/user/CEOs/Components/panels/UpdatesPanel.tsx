import { useMemo, useState } from 'react'
import '../../../../../styles/user/CEOs/CeoUpdatesPanel.css'
import type {
	ManagerUpdateAudienceMode,
	ManagerUpdateItem,
	ManagerUpdatePriority,
	ManagerUpdateVisibilityRole,
} from '../../../Manager/types/manager.types'
import type { ProjectCard, TeamCard } from '../../types/dashboard.types'

type UpdatesPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	actionError: string
	updates: ManagerUpdateItem[]
	unreadCount: number
	projects: ProjectCard[]
	teams: TeamCard[]
	isMutating: boolean
	onCreateUpdate: (payload: {
		title: string
		body: string
		priority: ManagerUpdatePriority
		isPinned?: boolean
		projectId?: string | null
		audience: {
			mode: ManagerUpdateAudienceMode
			teamIds?: string[]
			roles?: ManagerUpdateVisibilityRole[]
		}
	}) => void
	onEditUpdate: (
		updateId: string,
		payload: Partial<{
			title: string
			body: string
			priority: ManagerUpdatePriority
			isPinned: boolean
		}>
	) => void
	onDeleteUpdate: (updateId: string) => void
	onTogglePin: (updateId: string, isPinned: boolean) => void
	onMarkRead: (updateId: string) => void
	onLoadMore: () => void
	isLoadingMore: boolean
	canLoadMore: boolean
}

const ROLE_OPTIONS: Array<{ label: string; value: ManagerUpdateVisibilityRole }> = [
	{ label: 'CEO', value: 'CEO' },
	{ label: 'Managers', value: 'Manager' },
	{ label: 'Employees', value: 'Employee' },
]

const UpdatesPanel = ({
	isActive,
	isLoading,
	error,
	actionError,
	updates,
	unreadCount,
	projects,
	teams,
	isMutating,
	onCreateUpdate,
	onEditUpdate,
	onDeleteUpdate,
	onTogglePin,
	onMarkRead,
	onLoadMore,
	isLoadingMore,
	canLoadMore,
}: UpdatesPanelProps) => {
	const [form, setForm] = useState({
		title: '',
		body: '',
		priority: 'medium' as ManagerUpdatePriority,
		isPinned: false,
		audienceMode: 'company' as ManagerUpdateAudienceMode,
		projectId: '',
		selectedRoles: [] as ManagerUpdateVisibilityRole[],
		selectedTeamIds: [] as string[],
	})
	const [formError, setFormError] = useState('')
	const [editingId, setEditingId] = useState<string | null>(null)
	const [editingTitle, setEditingTitle] = useState('')
	const [editingBody, setEditingBody] = useState('')

	const filteredTeams = useMemo(() => {
		if (form.audienceMode === 'projectTeams' && form.projectId) {
			const selectedProject = projects.find((project) => project.id === form.projectId)
			if (!selectedProject) {
				return []
			}
			const projectTeams = new Set(selectedProject.teams)
			return teams.filter((team) => projectTeams.has(team.name))
		}
		return teams
	}, [form.audienceMode, form.projectId, projects, teams])

	if (!isActive) {
		return null
	}

	const toggleRole = (role: ManagerUpdateVisibilityRole) => {
		setForm((prev) => ({
			...prev,
			selectedRoles: prev.selectedRoles.includes(role)
				? prev.selectedRoles.filter((item) => item !== role)
				: [...prev.selectedRoles, role],
		}))
	}

	const toggleTeam = (teamId: string) => {
		setForm((prev) => ({
			...prev,
			selectedTeamIds: prev.selectedTeamIds.includes(teamId)
				? prev.selectedTeamIds.filter((item) => item !== teamId)
				: [...prev.selectedTeamIds, teamId],
		}))
	}

	const handleCreate = () => {
		if (!form.title.trim() || !form.body.trim()) {
			setFormError('Title and message are required.')
			return
		}
		if (form.audienceMode === 'projectTeams' && !form.projectId) {
			setFormError('Select a project for project-team visibility.')
			return
		}
		if (form.audienceMode === 'teams' && form.selectedTeamIds.length === 0) {
			setFormError('Choose at least one team for team-targeted updates.')
			return
		}

		setFormError('')
		onCreateUpdate({
			title: form.title.trim(),
			body: form.body.trim(),
			priority: form.priority,
			isPinned: form.isPinned,
			projectId: form.projectId || null,
			audience: {
				mode: form.audienceMode,
				teamIds: form.audienceMode === 'teams' ? form.selectedTeamIds : undefined,
				roles: form.selectedRoles,
			},
		})
		setForm({
			title: '',
			body: '',
			priority: 'medium',
			isPinned: false,
			audienceMode: 'company',
			projectId: '',
			selectedRoles: [],
			selectedTeamIds: [],
		})
	}

	const startEdit = (update: ManagerUpdateItem) => {
		setEditingId(update.id)
		setEditingTitle(update.title)
		setEditingBody(update.body)
	}

	const submitEdit = () => {
		if (!editingId) {
			return
		}
		if (!editingTitle.trim() || !editingBody.trim()) {
			return
		}
		onEditUpdate(editingId, {
			title: editingTitle.trim(),
			body: editingBody.trim(),
		})
		setEditingId(null)
	}

	return (
		<section className="ceo-panel active ceo-updates-panel">
			<div className="ceo-section-head">
				<h2>Updates</h2>
				<span className="ceo-updates-unread">Unread: {unreadCount}</span>
			</div>

			<div className="ceo-updates-composer">
				<div className="ceo-updates-grid">
					<label>
						Title
						<input
							type="text"
							value={form.title}
							onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
							placeholder="Write an update headline"
						/>
					</label>
					<label>
						Priority
						<select
							value={form.priority}
							onChange={(event) => setForm((prev) => ({ ...prev, priority: event.target.value as ManagerUpdatePriority }))}
						>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</label>
					<label>
						Audience
						<select
							value={form.audienceMode}
							onChange={(event) =>
								setForm((prev) => ({
									...prev,
									audienceMode: event.target.value as ManagerUpdateAudienceMode,
									selectedTeamIds: [],
								}))
							}
						>
							<option value="company">Company-wide</option>
							<option value="teams">Selected teams</option>
							<option value="projectTeams">Project teams</option>
						</select>
					</label>
					<label>
						Project (optional)
						<select
							value={form.projectId}
							onChange={(event) => setForm((prev) => ({ ...prev, projectId: event.target.value, selectedTeamIds: [] }))}
						>
							<option value="">No project</option>
							{projects.map((project) => (
								<option key={project.id} value={project.id}>
									{project.name}
								</option>
							))}
						</select>
					</label>
				</div>
				<label className="ceo-updates-body">
					Message
					<textarea
						rows={4}
						value={form.body}
						onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
						placeholder="Share outcomes, blockers, and next actions"
					/>
				</label>
				<div className="ceo-updates-row">
					<div className="ceo-updates-role-pills">
						{ROLE_OPTIONS.map((option) => (
							<button
								key={option.value}
								type="button"
								className={`ceo-updates-pill ${form.selectedRoles.includes(option.value) ? 'active' : ''}`}
								onClick={() => toggleRole(option.value)}
							>
								{option.label}
							</button>
						))}
					</div>
					<label className="ceo-updates-pin">
						<input
							type="checkbox"
							checked={form.isPinned}
							onChange={(event) => setForm((prev) => ({ ...prev, isPinned: event.target.checked }))}
						/>
						Pin this update
					</label>
				</div>

				{form.audienceMode === 'teams' ? (
					<div className="ceo-updates-team-choices">
						{filteredTeams.map((team) => (
							<button
								type="button"
								key={team.id}
								className={`ceo-updates-team-pill ${form.selectedTeamIds.includes(team.id) ? 'active' : ''}`}
								onClick={() => toggleTeam(team.id)}
							>
								{team.name}
							</button>
						))}
					</div>
				) : null}

				{formError ? <p className="ceo-updates-error">{formError}</p> : null}
				{actionError ? <p className="ceo-updates-error">{actionError}</p> : null}
				<div className="ceo-updates-submit">
					<button className="ceo-btn-primary" type="button" onClick={handleCreate} disabled={isMutating}>
						{isMutating ? 'Saving...' : 'Publish Update'}
					</button>
				</div>
			</div>

			{isLoading ? <div className="manager-state">Loading updates...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && updates.length === 0 ? <div className="manager-state">No updates posted yet.</div> : null}

			{!isLoading && !error && updates.length > 0 ? (
				<div className="ceo-updates-list">
					{updates.map((update) => (
						<article className={`ceo-update-item ${update.isRead ? '' : 'unread'}`} key={update.id}>
							<div className="ceo-update-head">
								<div>
									{editingId === update.id ? (
										<input value={editingTitle} onChange={(event) => setEditingTitle(event.target.value)} />
									) : (
										<h3>{update.title}</h3>
									)}
									<div className="ceo-update-meta">
										<span>{update.authorName}</span>
										<span>{update.authorRole}</span>
										<span>{update.time}</span>
									</div>
								</div>
								<div className="ceo-update-tags">
									<span className={`ceo-update-priority ${update.priority}`}>{update.priority}</span>
									{update.isPinned ? <span className="ceo-update-pinned">Pinned</span> : null}
								</div>
							</div>
							{editingId === update.id ? (
								<textarea rows={3} value={editingBody} onChange={(event) => setEditingBody(event.target.value)} />
							) : (
								<p>{update.body}</p>
							)}
							<div className="ceo-update-foot">
								<div className="ceo-update-audience">
									<span>Audience: {update.audienceMode}</span>
									{update.projectName ? <span>Project: {update.projectName}</span> : null}
									{update.teamNames.length > 0 ? <span>Teams: {update.teamNames.join(', ')}</span> : null}
								</div>
								<div className="ceo-update-actions">
									{!update.isRead ? (
										<button className="ceo-btn-outline" type="button" onClick={() => onMarkRead(update.id)} disabled={isMutating}>
											Mark Read
										</button>
									) : null}
									<button
										className="ceo-btn-outline"
										type="button"
										onClick={() => onTogglePin(update.id, !update.isPinned)}
										disabled={isMutating}
									>
										{update.isPinned ? 'Unpin' : 'Pin'}
									</button>
									{editingId === update.id ? (
										<>
											<button className="ceo-btn-primary" type="button" onClick={submitEdit} disabled={isMutating}>
												Save
											</button>
											<button className="ceo-btn-outline" type="button" onClick={() => setEditingId(null)} disabled={isMutating}>
												Cancel
											</button>
										</>
									) : (
										<button className="ceo-btn-outline" type="button" onClick={() => startEdit(update)} disabled={isMutating}>
											Edit
										</button>
									)}
									<button className="ceo-btn-danger" type="button" onClick={() => onDeleteUpdate(update.id)} disabled={isMutating}>
										Delete
									</button>
								</div>
							</div>
						</article>
					))}

					{canLoadMore ? (
						<div className="ceo-updates-load-row">
							<button className="ceo-updates-load" type="button" onClick={onLoadMore} disabled={isLoadingMore}>
								{isLoadingMore ? 'Loading...' : 'Load more'}
							</button>
						</div>
					) : null}
				</div>
			) : null}
		</section>
	)
}

export default UpdatesPanel
