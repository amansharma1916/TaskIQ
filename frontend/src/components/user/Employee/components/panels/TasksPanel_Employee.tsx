import type { ApiTaskStatus } from '../../../CEOs/types/api.types'
import type { EmployeeTaskPageState, EmployeeTaskQuery, EmployeeTaskRow } from '../../types/employee.types'

type TasksPanelEmployeeProps = {
	isActive: boolean
	isLoading: boolean
	isMutating: boolean
	isRefreshing: boolean
	error: string
	tasks: EmployeeTaskRow[]
	taskQuery: EmployeeTaskQuery
	pageState: EmployeeTaskPageState
	currentMemberName: string | null
	onTaskQueryChange: (updater: (prev: EmployeeTaskQuery) => EmployeeTaskQuery) => void
	canUpdateTaskStatus: (task: EmployeeTaskRow) => boolean
	onUpdateTaskStatus: (task: EmployeeTaskRow, status: ApiTaskStatus) => Promise<void>
}

const TASK_STATUS_OPTIONS: Array<{ value: ApiTaskStatus; label: string }> = [
	{ value: 'todo', label: 'To do' },
	{ value: 'in-progress', label: 'In progress' },
	{ value: 'done', label: 'Done' },
]

const TasksPanel_Employee = ({
	isActive,
	isLoading,
	isMutating,
	isRefreshing,
	error,
	tasks,
	taskQuery,
	pageState,
	currentMemberName,
	onTaskQueryChange,
	canUpdateTaskStatus,
	onUpdateTaskStatus,
}: TasksPanelEmployeeProps) => {
	if (!isActive) {
		return null
	}

	return (
		<section className="ceo-panel active" aria-label="My tasks">
			<div className="ceo-card ceo-task-panel-card">
				<div className="ceo-card-head">
					<h3>My Tasks</h3>
				</div>

				<div className="ceo-task-filters employee-filter-grid">
					<label>
						Search
						<input
							type="text"
							placeholder="Find by title or description"
							value={taskQuery.q}
							onChange={(event) =>
								onTaskQueryChange((prev) => ({
									...prev,
									q: event.target.value,
									page: 1,
								}))
							}
						/>
					</label>
					<label>
						Status
						<select
							value={taskQuery.status}
							onChange={(event) =>
								onTaskQueryChange((prev) => ({
									...prev,
									status: event.target.value as EmployeeTaskQuery['status'],
									page: 1,
								}))
							}
						>
							<option value="all">All statuses</option>
							<option value="todo">To do</option>
							<option value="in-progress">In progress</option>
							<option value="done">Done</option>
						</select>
					</label>
					<label>
						Priority
						<select
							value={taskQuery.priority}
							onChange={(event) =>
								onTaskQueryChange((prev) => ({
									...prev,
									priority: event.target.value as EmployeeTaskQuery['priority'],
									page: 1,
								}))
							}
						>
							<option value="all">All priorities</option>
							<option value="low">Low</option>
							<option value="medium">Medium</option>
							<option value="high">High</option>
						</select>
					</label>
					<label>
						Assignment
						<select
							value={taskQuery.assignment}
							onChange={(event) =>
								onTaskQueryChange((prev) => ({
									...prev,
									assignment: event.target.value as EmployeeTaskQuery['assignment'],
									page: 1,
								}))
							}
						>
							<option value="mine">Assigned to me</option>
							<option value="all">All visible tasks</option>
						</select>
					</label>
				</div>

				<div className="ceo-task-filters-foot">
					<span>
						{pageState.total} task{pageState.total === 1 ? '' : 's'} found
					</span>
					<span>
						Page {pageState.page} / {pageState.totalPages}
					</span>
				</div>

				{error ? <p className="ceo-empty-text">{error}</p> : null}

				{isLoading ? <p className="ceo-empty-text">Loading your tasks...</p> : null}

				{!isLoading && !error && tasks.length === 0 ? (
					<p className="ceo-empty-text">No tasks match the current filters.</p>
				) : null}

				{!isLoading && !error && tasks.length > 0 ? (
					<div className="ceo-task-list">
						{tasks.map((task) => {
							const canEdit = canUpdateTaskStatus(task)
							return (
								<article className="ceo-task-item ceo-task-item-extended" key={task.id}>
									<div className="ceo-task-main">
										<strong className="ceo-task-name">{task.title}</strong>
										{task.description ? <p className="ceo-empty-text">{task.description}</p> : null}
										<div className="ceo-task-meta-row">
											<span>{task.projectName}</span>
											<span>{task.teamName}</span>
											<span>Due {task.dueLabel}</span>
											<span>{task.priority.toUpperCase()}</span>
										</div>
										<p className="ceo-task-assignee">
											Assigned to {task.assigneeName || 'Unassigned'}
											{canEdit && currentMemberName ? ` (you: ${currentMemberName})` : ''}
										</p>
									</div>

									<div className="ceo-task-right">
										<select
											className="employee-status-select"
											value={task.status}
											disabled={!canEdit || isMutating}
											onChange={(event) => void onUpdateTaskStatus(task, event.target.value as ApiTaskStatus)}
										>
											{TASK_STATUS_OPTIONS.map((option) => (
												<option key={option.value} value={option.value}>
													{option.label}
												</option>
											))}
										</select>
									</div>
								</article>
							)
						})}
					</div>
				) : null}

				<div className="ceo-actions-row employee-pagination-row">
					<button
						className="ceo-btn-outline"
						type="button"
						onClick={() => onTaskQueryChange((prev) => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
						disabled={taskQuery.page <= 1 || isLoading || isRefreshing}
					>
						Previous
					</button>
					<button
						className="ceo-btn-primary"
						type="button"
						onClick={() =>
							onTaskQueryChange((prev) => ({
								...prev,
								page: prev.page < pageState.totalPages ? prev.page + 1 : prev.page,
							}))
						}
						disabled={taskQuery.page >= pageState.totalPages || isLoading || isRefreshing}
					>
						Next
					</button>
				</div>
			</div>
		</section>
	)
}

export default TasksPanel_Employee