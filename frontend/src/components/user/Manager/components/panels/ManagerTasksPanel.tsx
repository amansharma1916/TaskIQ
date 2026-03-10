
import type { ApiTaskStatus } from '../../../CEOs/types/api.types'
import type { ManagerMemberOption, ManagerTaskRow } from '../../types/manager.types'

type ManagerTasksPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	actionError: string
	isMutating: boolean
	tasks: ManagerTaskRow[]
	members: ManagerMemberOption[]
	onUpdateStatus: (taskId: string, status: ApiTaskStatus) => void
	onAssign: (taskId: string, assigneeMemberId: string | null) => void
	onDelete: (taskId: string) => void
}

const statusOptions: Array<{ label: string; value: ApiTaskStatus }> = [
	{ label: 'To do', value: 'todo' },
	{ label: 'In progress', value: 'in-progress' },
	{ label: 'Done', value: 'done' },
]

const ManagerTasksPanel = ({
	isActive,
	isLoading,
	error,
	actionError,
	isMutating,
	tasks,
	members,
	onUpdateStatus,
	onAssign,
	onDelete,
}: ManagerTasksPanelProps) => {
	if (!isActive) {
		return null
	}

	const getAssignableMembers = (task: ManagerTaskRow): ManagerMemberOption[] => {
		if (!task.teamId) {
			return []
		}

		return members.filter((member) => member.teamId === task.teamId)
	}

	return (
		<section className="ceo-panel active">
			<div className="ceo-section-head">
				<h2>Tasks</h2>
			</div>
			{isLoading ? <div className="manager-state">Loading tasks...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && actionError ? <div className="manager-state manager-state-error">{actionError}</div> : null}
			{!isLoading && !error && tasks.length === 0 ? <div className="manager-state">No tasks available.</div> : null}
			{!isLoading && !error && tasks.length > 0 ? (
				<div className="ceo-list-card ceo-task-list">
					{tasks.map((task) => (
						<article className="ceo-task-item ceo-task-item-extended" key={task.id}>
							<div className="ceo-task-main">
								<h3>{task.title}</h3>
								<p>
									{task.projectName} | {task.teamName}
								</p>
							</div>
							<div className="ceo-task-right manager-task-controls">
								<label>
									Status
									<select
										className="manager-task-select"
										value={task.status}
										onChange={(event) => onUpdateStatus(task.id, event.target.value as ApiTaskStatus)}
										disabled={isMutating}
									>
										{statusOptions.map((option) => (
											<option key={option.value} value={option.value}>
												{option.label}
											</option>
										))}
									</select>
								</label>
								<label>
									Assignee
									<select
										className="manager-task-select"
										value={task.assigneeMemberId ?? ''}
										onChange={(event) => onAssign(task.id, event.target.value || null)}
										disabled={isMutating || !task.teamId}
									>
										<option value="">Unassigned</option>
										{getAssignableMembers(task).map((member) => (
											<option key={member.id} value={member.id}>
												{member.name}
											</option>
										))}
									</select>
								</label>
								<button
									className="ceo-btn-danger"
									type="button"
									onClick={() => onDelete(task.id)}
									disabled={isMutating}
								>
									Delete
								</button>
							</div>
							<div className="ceo-task-meta-row">
								<span>Priority: {task.priority}</span>
								<span>Current assignee: {task.assigneeName || 'Unassigned'}</span>
							</div>
						</article>
					))}
				</div>
			) : null}
		</section>
	)
}

export default ManagerTasksPanel
