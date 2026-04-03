import { useMemo, useState } from 'react'
import '../../../../../styles/user/Manager/panels/ManagerUpdatesPanel.css'
import type {
	ManagerProjectCard,
	ManagerTeamCard,
	ManagerUpdateAudienceMode,
	ManagerUpdateItem,
	ManagerUpdatePriority,
	ManagerUpdateVisibilityRole,
} from '../../types/manager.types'

type ManagerUpdatesPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	updates: ManagerUpdateItem[]
	unreadCount: number
	canPostUpdates: boolean
	projects: ManagerProjectCard[]
	teams: ManagerTeamCard[]
	isPostingUpdate: boolean
	updateActionError: string
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
	onMarkUpdateRead: (updateId: string) => void
	isLoadingMore: boolean
	canLoadMore: boolean
	onLoadMore: () => void
}

const COMPANY_VISIBLE_ROLES: ManagerUpdateVisibilityRole[] = ['CEO', 'Manager', 'Employee']

const ManagerUpdatesPanel = ({
	isActive,
	isLoading,
	error,
	updates,
	unreadCount,
	canPostUpdates,
	projects,
	teams,
	isPostingUpdate,
	updateActionError,
	onCreateUpdate,
	onMarkUpdateRead,
	isLoadingMore,
	canLoadMore,
	onLoadMore,
}: ManagerUpdatesPanelProps) => {
	const [form, setForm] = useState({
		title: '',
		body: '',
		priority: 'medium' as ManagerUpdatePriority,
		isPinned: false,
		audienceMode: 'company' as ManagerUpdateAudienceMode,
		targetProjectId: '',
		aboutProjectId: '',
		selectedTeamId: '',
	})
	const [formError, setFormError] = useState('')

	const postButtonLabel = isPostingUpdate ? 'Posting...' : 'Post Update'

	const scopedTeams = useMemo(() => teams, [teams])

	const scopedProjects = useMemo(() => projects, [projects])

	if (!isActive) {
		return null
	}

	const selectTeam = (teamId: string) => {
		setForm((prev) => ({
			...prev,
			selectedTeamId: prev.selectedTeamId === teamId ? '' : teamId,
		}))
	}

	const selectProject = (projectId: string) => {
		setForm((prev) => ({
			...prev,
			targetProjectId: prev.targetProjectId === projectId ? '' : projectId,
		}))
	}

	const selectAboutProject = (projectId: string) => {
		setForm((prev) => ({
			...prev,
			aboutProjectId: prev.aboutProjectId === projectId ? '' : projectId,
		}))
	}

	const handleSubmit = () => {
		if (!form.title.trim() || !form.body.trim()) {
			setFormError('Title and message are required.')
			return
		}

		if (form.audienceMode === 'projectTeams' && !form.targetProjectId) {
			setFormError('Select a project to target project members.')
			return
		}

		if (form.audienceMode === 'teams' && !form.selectedTeamId) {
			setFormError('Select a team to target team members.')
			return
		}

		setFormError('')
		onCreateUpdate({
			title: form.title.trim(),
			body: form.body.trim(),
			priority: form.priority,
			isPinned: form.isPinned,
			projectId:
				form.audienceMode === 'projectTeams'
					? form.targetProjectId || null
					: form.aboutProjectId || null,
			audience: {
				mode: form.audienceMode,
				teamIds: form.audienceMode === 'teams' && form.selectedTeamId ? [form.selectedTeamId] : undefined,
				roles: form.audienceMode === 'company' ? COMPANY_VISIBLE_ROLES : undefined,
			},
		})
		setForm({
			title: '',
			body: '',
			priority: 'medium',
			isPinned: false,
			audienceMode: 'company',
			targetProjectId: '',
			aboutProjectId: '',
			selectedTeamId: '',
		})
	}

	return (
		<section className="ceo-panel active manager-updates-panel">
			<div className="ceo-section-head">
				<h2>Updates</h2>
				<span className="manager-updates-unread">Unread: {unreadCount}</span>
			</div>

			{canPostUpdates ? (
				<div className="manager-updates-composer">
					<div className="manager-updates-form-grid">
						<label>
							Title
							<input
								type="text"
								value={form.title}
								onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
								placeholder="What changed?"
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
							Audience Mode
							<select
								value={form.audienceMode}
								onChange={(event) =>
									setForm((prev) => ({
										...prev,
										audienceMode: event.target.value as ManagerUpdateAudienceMode,
										selectedTeamId: '',
										targetProjectId: '',
									}))
								}
							>
								<option value="company">Whole Company</option>
								<option value="teams">Teams</option>
								<option value="projectTeams">Projects</option>
							</select>
						</label>
						{form.audienceMode !== 'teams' ? (
							<label>
								Project Target
								<input
									type="text"
									value={
										form.targetProjectId
											? projects.find((project) => project.id === form.targetProjectId)?.name ?? ''
											: ''
									}
									placeholder={form.audienceMode === 'projectTeams' ? 'Select project below' : 'Not required in this mode'}
									readOnly
								/>
							</label>
						) : (
							<label>
								Team
								<input
									type="text"
									value={form.selectedTeamId ? teams.find((team) => team.id === form.selectedTeamId)?.name ?? '' : ''}
									placeholder="Select a team below"
									readOnly
								/>
							</label>
						)}
					</div>

					<label className="manager-updates-body-label">
						Message
						<textarea
							value={form.body}
							onChange={(event) => setForm((prev) => ({ ...prev, body: event.target.value }))}
							rows={4}
							placeholder="Share status, blockers, or next steps"
						/>
					</label>

					<div className="manager-updates-form-row">
						<div className="manager-updates-role-pills">
							<span>Visible roles:</span>
							{form.audienceMode === 'company' ? (
								<>
									<span className="manager-updates-pill active readonly">CEO</span>
									<span className="manager-updates-pill active readonly">Managers</span>
									<span className="manager-updates-pill active readonly">Employees</span>
								</>
							) : (
								<span className="manager-updates-role-note">Visible to selected {form.audienceMode === 'teams' ? 'team' : 'project'} members.</span>
							)}
						</div>
						<label className="manager-updates-pin-toggle">
							<input
								type="checkbox"
								checked={form.isPinned}
								onChange={(event) => setForm((prev) => ({ ...prev, isPinned: event.target.checked }))}
							/>
							Pin update
						</label>
					</div>

					{form.audienceMode === 'teams' ? (
						<div className="manager-updates-team-grid">
							{scopedTeams.map((team) => (
								<button
									type="button"
									key={team.id}
									className={`manager-updates-team-chip ${form.selectedTeamId === team.id ? 'active' : ''}`}
									onClick={() => selectTeam(team.id)}
								>
									{team.name}
								</button>
							))}
						</div>
					) : null}

					{form.audienceMode === 'projectTeams' ? (
						<div className="manager-updates-team-grid">
							{scopedProjects.map((project) => (
								<button
									type="button"
									key={project.id}
									className={`manager-updates-team-chip ${form.targetProjectId === project.id ? 'active' : ''}`}
									onClick={() => selectProject(project.id)}
								>
									{project.name}
								</button>
							))}
						</div>
					) : null}

					<div className="manager-updates-role-pills">
						<span>About Project (optional):</span>
					</div>
					<div className="manager-updates-team-grid">
						{scopedProjects.map((project) => (
							<button
								type="button"
								key={`about-${project.id}`}
								className={`manager-updates-team-chip ${form.aboutProjectId === project.id ? 'active' : ''}`}
								onClick={() => selectAboutProject(project.id)}
							>
								{project.name}
							</button>
						))}
					</div>

					{formError ? <p className="manager-updates-form-error">{formError}</p> : null}
					{updateActionError ? <p className="manager-updates-form-error">{updateActionError}</p> : null}
					<div className="manager-updates-submit-row">
						<button className="ceo-btn-primary" type="button" onClick={handleSubmit} disabled={isPostingUpdate}>
							{postButtonLabel}
						</button>
					</div>
				</div>
			) : null}

			{isLoading ? <div className="manager-state">Loading updates...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && updates.length === 0 ? <div className="manager-state">No updates yet.</div> : null}

			{!isLoading && !error && updates.length > 0 ? (
				<div className="manager-updates-list">
					{updates.map((update) => (
						<article key={update.id} className={`manager-update-item ${update.isRead ? 'read' : 'unread'}`}>
							<div className="manager-update-head">
								<div>
									<h3>{update.title}</h3>
									<div className="manager-update-meta">
										<span>{update.authorName}</span>
										<span>{update.authorRole}</span>
										<span>{update.time}</span>
									</div>
								</div>
								<div className="manager-update-tags">
									<span className={`manager-update-priority ${update.priority}`}>{update.priority}</span>
									{update.isPinned ? <span className="manager-update-pinned">Pinned</span> : null}
									{!update.isRead ? <span className="manager-update-unread-dot">Unread</span> : null}
								</div>
							</div>
							<p>{update.body}</p>
							<div className="manager-update-foot">
								<div className="manager-update-audience">
									<span>Audience: {update.audienceMode}</span>
									{update.projectName ? <span>Project: {update.projectName}</span> : null}
									{update.teamNames.length > 0 ? <span>Teams: {update.teamNames.join(', ')}</span> : null}
								</div>
								{!update.isRead ? (
									<button className="ceo-btn-outline" type="button" onClick={() => onMarkUpdateRead(update.id)}>
										Mark as read
									</button>
								) : null}
							</div>
						</article>
					))}

					{canLoadMore ? (
						<div className="manager-updates-load-more-row">
							<button className="manager-updates-load-more" type="button" disabled={isLoadingMore} onClick={onLoadMore}>
								{isLoadingMore ? 'Loading...' : 'Load more'}
							</button>
						</div>
					) : null}
				</div>
			) : null}
		</section>
	)
}

export default ManagerUpdatesPanel
