import type { ApiTaskPriority, ApiTaskStatus } from '../../types/api.types'

export type TaskFormValue = {
	title: string
	description: string
	status: ApiTaskStatus
	priority: ApiTaskPriority
	dueDate: string
	projectId: string
	teamId: string
	assigneeMemberId: string
}

type TaskModalProps = {
	value: TaskFormValue
	onChange: (next: TaskFormValue) => void
	projects: Array<{ id: string; name: string }>
	teams: Array<{ id: string; name: string }>
	members: Array<{ id: string; name: string }>
	errorMessage?: string
}

const TaskModal = ({ value, onChange, projects, teams, members, errorMessage }: TaskModalProps) => {
	const setField = <K extends keyof TaskFormValue>(key: K, next: TaskFormValue[K]) => {
		onChange({
			...value,
			[key]: next,
		})
	}

	return (
		<>
			{errorMessage && <p className="form-message form-error">{errorMessage}</p>}
			<label>
				Title
				<input
					type="text"
					placeholder="e.g. Prepare onboarding checklist"
					value={value.title}
					onChange={(event) => setField('title', event.target.value)}
				/>
			</label>
			<label>
				Description
				<input
					type="text"
					placeholder="Describe expected outcome"
					value={value.description}
					onChange={(event) => setField('description', event.target.value)}
				/>
			</label>
			<div className="ceo-form-grid">
				<label>
					Status
					<select value={value.status} onChange={(event) => setField('status', event.target.value as ApiTaskStatus)}>
						<option value="todo">To Do</option>
						<option value="in-progress">In Progress</option>
						<option value="done">Done</option>
					</select>
				</label>
				<label>
					Priority
					<select value={value.priority} onChange={(event) => setField('priority', event.target.value as ApiTaskPriority)}>
						<option value="low">Low</option>
						<option value="medium">Medium</option>
						<option value="high">High</option>
					</select>
				</label>
			</div>
			<div className="ceo-form-grid">
				<label>
					Project
					<select value={value.projectId} onChange={(event) => setField('projectId', event.target.value)}>
						<option value="" disabled>
							Select project
						</option>
						{projects.map((project) => (
							<option key={project.id} value={project.id}>
								{project.name}
							</option>
						))}
					</select>
				</label>
				<label>
					Team
					<select value={value.teamId} onChange={(event) => setField('teamId', event.target.value)}>
						<option value="">No specific team</option>
						{teams.map((team) => (
							<option key={team.id} value={team.id}>
								{team.name}
							</option>
						))}
					</select>
				</label>
			</div>
			<div className="ceo-form-grid">
				<label>
					Due Date
					<input type="date" value={value.dueDate} onChange={(event) => setField('dueDate', event.target.value)} />
				</label>
				<label>
					Assignee
					<select value={value.assigneeMemberId} onChange={(event) => setField('assigneeMemberId', event.target.value)}>
						<option value="">Unassigned</option>
						{members.map((member) => (
							<option key={member.id} value={member.id}>
								{member.name}
							</option>
						))}
					</select>
				</label>
			</div>
			<p className="ceo-member-role">Select a single assignee now, or leave unassigned to assign later.</p>
		</>
	)
}

export default TaskModal
