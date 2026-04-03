import type { ApiTaskPriority, ApiTaskStatus } from '../../types/api.types'

export type TaskFiltersValue = {
	status: 'all' | ApiTaskStatus
	priority: 'all' | ApiTaskPriority
	projectId: 'all' | string
	teamId: 'all' | string
	query: string
}

type TaskFiltersProps = {
	value: TaskFiltersValue
	onChange: (next: TaskFiltersValue) => void
	projects: Array<{ id: string; name: string }>
	teams: Array<{ id: string; name: string }>
	resultsCount: number
}

const TaskFilters = ({ value, onChange, projects, teams, resultsCount }: TaskFiltersProps) => {
	const setFilter = <K extends keyof TaskFiltersValue>(key: K, next: TaskFiltersValue[K]) => {
		onChange({
			...value,
			[key]: next,
		})
	}

	const resetFilters = () => {
		onChange({
			status: 'all',
			priority: 'all',
			projectId: 'all',
			teamId: 'all',
			query: '',
		})
	}

	return (
		<div className="ceo-task-filters">
			<div className="ceo-form-grid">
				<label>
					Status
					<select value={value.status} onChange={(event) => setFilter('status', event.target.value as TaskFiltersValue['status'])}>
						<option value="all">All statuses</option>
						<option value="todo">To Do</option>
						<option value="in-progress">In Progress</option>
						<option value="done">Done</option>
					</select>
				</label>

				<label>
					Priority
					<select
						value={value.priority}
						onChange={(event) => setFilter('priority', event.target.value as TaskFiltersValue['priority'])}
					>
						<option value="all">All priorities</option>
						<option value="low">Low</option>
						<option value="medium">Medium</option>
						<option value="high">High</option>
					</select>
				</label>
			</div>

			<div className="ceo-form-grid">
				<label>
					Project
					<select value={value.projectId} onChange={(event) => setFilter('projectId', event.target.value)}>
						<option value="all">All projects</option>
						{projects.map((project) => (
							<option key={project.id} value={project.id}>
								{project.name}
							</option>
						))}
					</select>
				</label>

				<label>
					Team
					<select value={value.teamId} onChange={(event) => setFilter('teamId', event.target.value)}>
						<option value="all">All teams</option>
						{teams.map((team) => (
							<option key={team.id} value={team.id}>
								{team.name}
							</option>
						))}
					</select>
				</label>
			</div>

			<label>
				Search
				<input
					type="text"
					placeholder="Search task title or description"
					value={value.query}
					onChange={(event) => setFilter('query', event.target.value)}
				/>
			</label>

			<div className="ceo-task-filters-foot">
				<span>{resultsCount} task(s)</span>
				<button className="ceo-link-btn" type="button" onClick={resetFilters}>
					Reset filters
				</button>
			</div>
		</div>
	)
}

export default TaskFilters
