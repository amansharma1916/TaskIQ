import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import '../../../styles/user/CEOs/ProjectDetails.css'
import { authorizedFetch } from '../../../services/apiClient'
import { getAuthUser } from '../../../services/auth'
import { assignTeams, getProjectById, revokeTeams, updateProject } from '../../../services/projects'
import { getTasks, updateTaskStatus } from '../../../services/tasks'
import type { ApiProject, ApiProjectStatus, ApiTask, ApiTaskStatus, ApiTeam } from './types/api.types'

const toInputDate = (value?: string | null): string => {
	if (!value) {
		return ''
	}
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) {
		return ''
	}
	return date.toISOString().slice(0, 10)
}

const ProjectDetails = () => {
	const navigate = useNavigate()
	const { projectId } = useParams()
	const userRole = getAuthUser()?.role

	const [project, setProject] = useState<ApiProject | null>(null)
	const [teams, setTeams] = useState<ApiTeam[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [saving, setSaving] = useState(false)
	const [assigning, setAssigning] = useState(false)
	const [revoking, setRevoking] = useState(false)
	const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
	const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([])
	const [projectTasks, setProjectTasks] = useState<ApiTask[]>([])
	const [tasksLoading, setTasksLoading] = useState(false)
	const [form, setForm] = useState({
		projectName: '',
		projectDescription: '',
		projectStatus: 'planning' as ApiProjectStatus,
		dueDate: '',
		progress: 0,
		completedTasks: 0,
		totalTasks: 0,
	})

	const assignedTeamIds = useMemo(() => (project?.assignedTeams ?? []).map((team) => team._id), [project])
	const groupedTasks = useMemo(() => {
		return projectTasks.reduce<Record<string, ApiTask[]>>((acc, task) => {
			const key = task.teamId?.teamName || 'Unassigned'
			if (!acc[key]) {
				acc[key] = []
			}
			acc[key].push(task)
			return acc
		}, {})
	}, [projectTasks])

	const loadProjectTasks = async (nextProjectId: string) => {
		setTasksLoading(true)
		try {
			const tasks = await getTasks({ projectId: nextProjectId })
			setProjectTasks(tasks)
		} catch (requestError) {
			const nextMessage = requestError instanceof Error ? requestError.message : 'Unable to load project tasks.'
			setMessage({ type: 'error', text: nextMessage })
		} finally {
			setTasksLoading(false)
		}
	}

	const refreshProject = async () => {
		if (!projectId) {
			setError('Project id is missing from the route.')
			setLoading(false)
			return
		}

		try {
			setLoading(true)
			setError('')
			const [projectData, teamsResponse] = await Promise.all([
				getProjectById(projectId),
				authorizedFetch('/api/teams'),
			])

			let teamsData: ApiTeam[] = []
			if (teamsResponse.ok) {
				teamsData = ((await teamsResponse.json()) as ApiTeam[]) ?? []
			}

			setProject(projectData)
			setTeams(teamsData)
			void loadProjectTasks(projectData._id)
			setForm({
				projectName: projectData.projectName,
				projectDescription: projectData.projectDescription ?? '',
				projectStatus: projectData.projectStatus,
				dueDate: toInputDate(projectData.dueDate ?? null),
				progress: projectData.progress ?? 0,
				completedTasks: projectData.completedTasks ?? 0,
				totalTasks: projectData.totalTasks ?? 0,
			})
		} catch (requestError) {
			const nextMessage = requestError instanceof Error ? requestError.message : 'Unable to load project details.'
			setError(nextMessage)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		if (userRole !== 'CEO' && userRole !== 'Manager') {
			setLoading(false)
			setError('You are not authorized to access project details.')
			return
		}

		void refreshProject()
	}, [projectId, userRole])

	useEffect(() => {
		if (!message) {
			return
		}

		const timer = setTimeout(() => setMessage(null), 3500)
		return () => clearTimeout(timer)
	}, [message])

	const toggleTeam = (teamId: string) => {
		setSelectedTeamIds((prev) => (prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId]))
	}

	const handleSave = async () => {
		if (!projectId) {
			return
		}
		if (!form.projectName.trim()) {
			setMessage({ type: 'error', text: 'Project name is required.' })
			return
		}

		setSaving(true)
		try {
			const updated = await updateProject(projectId, {
				projectName: form.projectName.trim(),
				projectDescription: form.projectDescription.trim(),
				projectStatus: form.projectStatus,
				dueDate: form.dueDate ? form.dueDate : null,
				progress: form.progress,
				completedTasks: form.completedTasks,
				totalTasks: form.totalTasks,
			})
			setProject(updated)
			setMessage({ type: 'success', text: 'Project updated successfully.' })
		} catch (requestError) {
			const nextMessage = requestError instanceof Error ? requestError.message : 'Failed to update project.'
			setMessage({ type: 'error', text: nextMessage })
		} finally {
			setSaving(false)
		}
	}

	const handleAssignTeams = async () => {
		if (!projectId) {
			return
		}
		if (selectedTeamIds.length === 0) {
			setMessage({ type: 'error', text: 'Select at least one team to assign.' })
			return
		}

		const duplicateTeamIds = selectedTeamIds.filter((teamId) => assignedTeamIds.includes(teamId))
		if (duplicateTeamIds.length > 0) {
			const duplicateTeamNames = teams
				.filter((team) => duplicateTeamIds.includes(team._id))
				.map((team) => team.teamName)
				.filter(Boolean)
				.join(', ')

			setMessage({
				type: 'error',
				text: duplicateTeamNames
					? `Team already assigned: ${duplicateTeamNames}`
					: 'One or more selected teams are already assigned to this project.',
			})
			return
		}

		setAssigning(true)
		try {
			const updated = await assignTeams(projectId, selectedTeamIds)
			setProject(updated)
			setSelectedTeamIds([])
			setMessage({ type: 'success', text: 'Teams assigned successfully.' })
		} catch (requestError) {
			const nextMessage = requestError instanceof Error ? requestError.message : 'Failed to assign teams.'
			setMessage({ type: 'error', text: nextMessage })
		} finally {
			setAssigning(false)
		}
	}

	const handleRevokeTeams = async () => {
		if (!projectId) {
			return
		}
		if (selectedTeamIds.length === 0) {
			setMessage({ type: 'error', text: 'Select at least one team to revoke.' })
			return
		}

		setRevoking(true)
		try {
			const updated = await revokeTeams(projectId, selectedTeamIds)
			setProject(updated)
			setSelectedTeamIds([])
			setMessage({ type: 'success', text: 'Teams revoked successfully.' })
		} catch (requestError) {
			const nextMessage = requestError instanceof Error ? requestError.message : 'Failed to revoke teams.'
			setMessage({ type: 'error', text: nextMessage })
		} finally {
			setRevoking(false)
		}
	}

	const toggleTaskStatus = async (task: ApiTask) => {
		const nextStatus: ApiTaskStatus = task.status === 'done' ? 'todo' : 'done'
		try {
			const updatedTask = await updateTaskStatus(task._id, nextStatus)
			setProjectTasks((prev) => prev.map((item) => (item._id === task._id ? updatedTask : item)))
			await refreshProject()
		} catch (requestError) {
			const nextMessage = requestError instanceof Error ? requestError.message : 'Unable to update task status.'
			setMessage({ type: 'error', text: nextMessage })
		}
	}

	if (loading) {
		return <div className="pd-loading">Loading project details...</div>
	}

	return (
		<div className="pd-page">
			<main className="pd-main">
				<div className="pd-topbar">
					<h1>Project Details</h1>
					<div className="pd-topbar-actions">
						<button className="pd-btn pd-btn-outline" onClick={() => navigate('/ceo/dashboard')} type="button">
							Back to Dashboard
						</button>
					</div>
				</div>

				<section className="pd-content">
					{error && <div className="pd-alert pd-alert-error">{error}</div>}
					{message && <div className={`pd-alert ${message.type === 'success' ? 'pd-alert-success' : 'pd-alert-error'}`}>{message.text}</div>}

					{project && (
						<div className="pd-grid">
							<article className="pd-card">
								<div className="pd-card-head">
									<h3>Project Info</h3>
								</div>
								<div className="pd-form-grid">
									<label className="pd-field">
										Project Name
										<input
											type="text"
											value={form.projectName}
											onChange={(event) => setForm((prev) => ({ ...prev, projectName: event.target.value }))}
										/>
									</label>
									<label className="pd-field">
										Status
										<select
											value={form.projectStatus}
											onChange={(event) => setForm((prev) => ({ ...prev, projectStatus: event.target.value as ApiProjectStatus }))}
										>
											<option value="planning">Planning</option>
											<option value="active">Active</option>
											<option value="review">Review</option>
											<option value="completed">Completed</option>
											<option value="blocked">Blocked</option>
										</select>
									</label>
									<label className="pd-field">
										Due Date
										<input
											type="date"
											value={form.dueDate}
											onChange={(event) => setForm((prev) => ({ ...prev, dueDate: event.target.value }))}
										/>
									</label>
									<label className="pd-field">
										Progress %
										<input
											type="number"
											min={0}
											max={100}
											value={form.progress}
											onChange={(event) => setForm((prev) => ({ ...prev, progress: Number(event.target.value) || 0 }))}
										/>
									</label>
									<label className="pd-field">
										Completed Tasks
										<input
											type="number"
											min={0}
											value={form.completedTasks}
											onChange={(event) => setForm((prev) => ({ ...prev, completedTasks: Number(event.target.value) || 0 }))}
										/>
									</label>
									<label className="pd-field">
										Total Tasks
										<input
											type="number"
											min={0}
											value={form.totalTasks}
											onChange={(event) => setForm((prev) => ({ ...prev, totalTasks: Number(event.target.value) || 0 }))}
										/>
									</label>
								</div>
								<label className="pd-field pd-field-full">
									Description
									<input
										type="text"
										value={form.projectDescription}
										onChange={(event) => setForm((prev) => ({ ...prev, projectDescription: event.target.value }))}
									/>
								</label>
								<button className="pd-btn pd-btn-primary" onClick={() => void handleSave()} type="button" disabled={saving}>
									{saving ? 'Saving...' : 'Save Changes'}
								</button>
							</article>

							<article className="pd-card">
								<div className="pd-card-head">
									<h3>Team Assignment</h3>
								</div>
								<p className="pd-meta-text">
									Assigned teams: {project.assignedTeams?.length ? project.assignedTeams.map((team) => team.teamName || 'Team').join(', ') : 'None'}
								</p>
								<div className="pd-team-list">
									{teams.map((team) => (
										<label key={team._id} className="pd-team-check">
											<input
												type="checkbox"
												checked={selectedTeamIds.includes(team._id)}
												onChange={() => toggleTeam(team._id)}
											/>
											<span>
												{team.teamName}
												{assignedTeamIds.includes(team._id) ? ' (assigned)' : ''}
											</span>
										</label>
									))}
								</div>
								<div className="pd-actions-row">
									<button className="pd-btn pd-btn-accent" onClick={() => void handleAssignTeams()} type="button" disabled={assigning}>
										{assigning ? 'Assigning...' : 'Assign Selected'}
									</button>
									<button className="pd-btn pd-btn-danger" onClick={() => void handleRevokeTeams()} type="button" disabled={revoking}>
										{revoking ? 'Revoking...' : 'Revoke Selected'}
									</button>
								</div>
							</article>

							<article className="pd-card">
								<div className="pd-card-head">
									<h3>Project Tasks</h3>
								</div>
								<p className="pd-meta-text">Task list scoped to this project, grouped by team ownership.</p>
								{tasksLoading ? (
									<div className="pd-loading">Loading tasks...</div>
								) : projectTasks.length === 0 ? (
									<div className="pd-meta-text">No tasks yet for this project.</div>
								) : (
									Object.entries(groupedTasks).map(([teamName, tasks]) => (
										<div key={teamName} className="pd-task-group">
											<div className="pd-task-group-head">
												<strong>{teamName}</strong>
												<span>{tasks.length} task(s)</span>
											</div>
											<div className="pd-team-list">
												{tasks.map((task) => (
													<div key={task._id} className="pd-team-check pd-task-row">
														<span>
															{task.title} ({task.status})
														</span>
														<button className="pd-btn pd-btn-outline" onClick={() => void toggleTaskStatus(task)} type="button">
															Mark {task.status === 'done' ? 'Todo' : 'Done'}
														</button>
													</div>
												))}
											</div>
										</div>
									))
								)}
							</article>
						</div>
					)}
				</section>
			</main>
		</div>
	)
}

export default ProjectDetails
