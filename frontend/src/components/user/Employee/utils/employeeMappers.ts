import type { ApiTask } from '../../CEOs/types/api.types'
import type { EmployeeTaskRow } from '../types/employee.types'

const formatDueLabel = (dateValue?: string | null): string => {
  if (!dateValue) {
    return 'No due date'
  }

  const parsed = new Date(dateValue)
  if (Number.isNaN(parsed.getTime())) {
    return 'No due date'
  }

  return parsed.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export const mapApiTaskToEmployeeTaskRow = (task: ApiTask): EmployeeTaskRow => ({
  id: task._id,
  title: task.title,
  description: task.description?.trim() || '',
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate ?? null,
  dueLabel: formatDueLabel(task.dueDate),
  projectName: task.projectId?.projectName || 'Unknown project',
  teamName: task.teamId?.teamName || 'Unassigned team',
  assigneeMemberId: task.assignee?._id ?? null,
  assigneeName: task.assignee?.memberName ?? null,
})
