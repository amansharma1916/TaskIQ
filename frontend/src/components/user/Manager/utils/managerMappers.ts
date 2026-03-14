import type { ApiProject, ApiTask, ApiTeam } from '../../CEOs/types/api.types'
import type { ManagerProjectCard, ManagerTaskRow, ManagerTeamCard } from '../types/manager.types'

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

export const mapApiProjectToManagerCard = (project: ApiProject): ManagerProjectCard => ({
	id: project._id,
	name: project.projectName,
	description: project.projectDescription?.trim() || 'No description available yet.',
	status: project.projectStatus,
	dueDate: project.dueDate ?? null,
	dueLabel: formatDueLabel(project.dueDate),
	teamCount: project.assignedTeams?.length ?? 0,
	assignedTeamIds: (project.assignedTeams ?? []).map((team) => team._id),
	assignedTeamNames: (project.assignedTeams ?? []).map((team) => team.teamName || 'Team'),
})

export const mapApiTaskToManagerTaskRow = (task: ApiTask): ManagerTaskRow => ({
	id: task._id,
	title: task.title,
	description: task.description?.trim() || '',
	status: task.status,
	priority: task.priority,
	projectId: task.projectId?._id ?? null,
	projectName: task.projectId?.projectName || 'Unknown project',
	dueDate: task.dueDate ?? null,
	teamId: task.teamId?._id ?? null,
	teamName: task.teamId?.teamName || 'Unassigned',
	assigneeMemberId: task.assignee?._id ?? null,
	assigneeName: task.assignee?.memberName ?? null,
})

export const mapApiTeamToManagerTeamCard = (team: ApiTeam): ManagerTeamCard => ({
	id: team._id,
	name: team.teamName,
	description: team.teamDescription || 'No team description available yet.',
	tag: team.teamTags?.[0] || 'Team',
	totalMembers: team.totalMembers ?? team.teamMembers?.length ?? 0,
	leadMemberId: typeof team.teamLead === 'string' ? team.teamLead : team.teamLead?._id ?? null,
	leadMemberName: typeof team.teamLead === 'string' ? null : team.teamLead?.memberName ?? null,
})
