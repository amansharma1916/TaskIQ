import type { ApiTask } from '../../types/api.types'

type TaskListProps = {
	tasks: ApiTask[]
	onToggleStatus: (task: ApiTask) => void
	onDeleteTask: (task: ApiTask) => void
	onEditTask: (task: ApiTask) => void
}

const formatDueLabel = (value?: string | null): string => {
	if (!value) {
		return 'No due date'
	}

	const parsed = new Date(value)
	if (Number.isNaN(parsed.getTime())) {
		return 'No due date'
	}

	return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

const priorityClassMap = {
	low: 'ceo-chip-dev',
	medium: 'ceo-chip-design',
	high: 'ceo-chip-ops',
} as const

const TaskList = ({ tasks, onToggleStatus, onDeleteTask, onEditTask }: TaskListProps) => {
	if (tasks.length === 0) {
		return <div className="ceo-team-empty">No tasks found for the selected filters.</div>
	}

	return (
		<div className="ceo-task-list">
			{tasks.map((task) => {
				const isDone = task.status === 'done'
				return (
					<div className="ceo-task-item ceo-task-item-extended" key={task._id}>
						<button
							aria-label={`Toggle task ${task.title}`}
							className={`ceo-task-cb ${isDone ? 'done' : ''}`}
							onClick={() => onToggleStatus(task)}
							type="button"
						/>
						<div className="ceo-task-main">
							<div className={`ceo-task-name ${isDone ? 'done-text' : ''}`}>{task.title}</div>
							<div className="ceo-task-meta-row">
								<span>{task.projectId?.projectName || 'No project'}</span>
								<span>{task.teamId?.teamName || 'No team'}</span>
								<span>{formatDueLabel(task.dueDate)}</span>
							</div>
						</div>
						<div className="ceo-task-right">
							<span className={`ceo-chip ${priorityClassMap[task.priority]}`}>{task.priority}</span>
							<span className="ceo-chip ceo-chip-hr">{task.status}</span>
							<button className="ceo-btn-outline" onClick={() => onEditTask(task)} type="button">
								Edit
							</button>
							<button className="ceo-btn-danger" onClick={() => onDeleteTask(task)} type="button">
								Delete
							</button>
						</div>
					</div>
				)
			})}
		</div>
	)
}

export default TaskList
