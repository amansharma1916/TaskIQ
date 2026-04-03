import { useMemo } from 'react'
import type { ApiTask } from '../../types/api.types'
import TaskFilters, { type TaskFiltersValue } from './TaskFilters'
import TaskList from './TaskList'

type TasksPanelProps = {
	isActive: boolean
	tasks: ApiTask[]
	filters: TaskFiltersValue
	projects: Array<{ id: string; name: string }>
	teams: Array<{ id: string; name: string }>
	onChangeFilters: (next: TaskFiltersValue) => void
	onCreateTask: () => void
	onToggleStatus: (task: ApiTask) => void
	onDeleteTask: (task: ApiTask) => void
	onEditTask: (task: ApiTask) => void
}

const TasksPanel = ({
	isActive,
	tasks,
	filters,
	projects,
	teams,
	onChangeFilters,
	onCreateTask,
	onToggleStatus,
	onDeleteTask,
	onEditTask,
}: TasksPanelProps) => {
	const filteredTasks = useMemo(() => {
		return tasks.filter((task) => {
			if (filters.status !== 'all' && task.status !== filters.status) {
				return false
			}

			if (filters.priority !== 'all' && task.priority !== filters.priority) {
				return false
			}

			if (filters.projectId !== 'all' && task.projectId?._id !== filters.projectId) {
				return false
			}

			if (filters.teamId !== 'all' && task.teamId?._id !== filters.teamId) {
				return false
			}

			const q = filters.query.trim().toLowerCase()
			if (!q) {
				return true
			}

			return task.title.toLowerCase().includes(q) || (task.description || '').toLowerCase().includes(q)
		})
	}, [tasks, filters])

	return (
		<div className={`ceo-panel ${isActive ? 'active' : ''}`}>
			<div className="ceo-section-head">
				<h2>All Tasks</h2>
				<button className="ceo-btn-primary" onClick={onCreateTask} type="button">
					New Task
				</button>
			</div>

			<article className="ceo-card ceo-task-panel-card">
				<TaskFilters value={filters} onChange={onChangeFilters} projects={projects} teams={teams} resultsCount={filteredTasks.length} />
				<TaskList tasks={filteredTasks} onToggleStatus={onToggleStatus} onDeleteTask={onDeleteTask} onEditTask={onEditTask} />
			</article>
		</div>
	)
}

export default TasksPanel
