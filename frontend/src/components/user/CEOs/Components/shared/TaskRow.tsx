import type { TaskItem } from '../../types/dashboard.types'
import { chipClassMap } from '../../utils/constants'

type TaskRowProps = {
	task: TaskItem
	done: boolean
	showAssignee: boolean
	onToggleTask: (taskId: string) => void
}

const TaskRow = ({ task, done, showAssignee, onToggleTask }: TaskRowProps) => {
	return (
		<div className="ceo-task-item" key={task.id}>
			<button
				aria-label={`Toggle task ${task.name}`}
				className={`ceo-task-cb ${done ? 'done' : ''}`}
				onClick={() => onToggleTask(task.id)}
				type="button"
			/>
			<span className={`ceo-task-name ${done ? 'done-text' : ''}`}>{task.name}</span>
			{showAssignee && <span className="ceo-task-assignee">{task.assignee}</span>}
			<span className={`ceo-chip ${chipClassMap[task.chipTone]}`}>{task.chip}</span>
		</div>
	)
}

export default TaskRow
