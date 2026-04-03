import type { ProjectCard } from '../../types/dashboard.types'
import { statusClassMap } from '../../utils/constants'

type ProjectsPanelProps = {
	isActive: boolean
	projectsData: ProjectCard[]
	onOpenCreateProject: () => void
	onOpenDiscardProject: () => void
	onOpenAssignTeam: (projectId: string) => void
	onOpenRevokeTeam: (projectId: string) => void
	onOpenProjectDetails: (projectId: string) => void
}

const ProjectsPanel = ({
	isActive,
	projectsData,
	onOpenCreateProject,
	onOpenDiscardProject,
	onOpenAssignTeam,
	onOpenRevokeTeam,
	onOpenProjectDetails,
}: ProjectsPanelProps) => {
	return (
		<div className={`ceo-panel ${isActive ? 'active' : ''}`}>
			<div className="ceo-section-head">
				<h2>Projects</h2>
				<div className="ceo-actions-row">
					<button className="ceo-btn-outline" onClick={onOpenDiscardProject} type="button">
						Discard Project
					</button>
					<button className="ceo-btn-primary" onClick={onOpenCreateProject} type="button">
						Create Project
					</button>
				</div>
			</div>

			<article className="ceo-list-card">
				{projectsData.length === 0 ? (
					<div className="ceo-team-empty">No projects yet. Create your first project.</div>
				) : (
					projectsData.map((project) => (
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
									<span>{project.teams.length > 0 ? project.teams.join(', ') : 'None assigned'}</span>
								</div>
								<div className="ceo-progress-bar ceo-list-progress">
									<div className="ceo-progress-fill ceo-fill-cyan" style={{ width: `${project.progress}%` }} />
								</div>
							</div>
							<div className="ceo-list-actions">
								<button className="ceo-btn-outline" onClick={() => onOpenProjectDetails(project.id)} type="button">
									View Details
								</button>
								<button className="ceo-btn-sm" onClick={() => onOpenAssignTeam(project.id)} type="button">
									Assign Team
								</button>
								<button className="ceo-btn-danger" onClick={() => onOpenRevokeTeam(project.id)} type="button">
									Revoke Team
								</button>
							</div>
						</div>
					))
				)}
				<div className="ceo-list-row ceo-list-row-create">
					<div className="ceo-list-main">
						<h3>New Project</h3>
						<p>Create a project, assign ownership, and start tracking progress immediately.</p>
					</div>
					<div className="ceo-list-actions">
						<button className="ceo-btn-primary" onClick={onOpenCreateProject} type="button">
							Create Project
						</button>
					</div>
				</div>
			</article>
		</div>
	)
}

export default ProjectsPanel
