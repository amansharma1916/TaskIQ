import type { ModalId } from '../types/dashboard.types'

export const toneClassMap = {
	cyan: 'tone-cyan',
	purple: 'tone-purple',
	yellow: 'tone-yellow',
	green: 'tone-green',
} as const

export const chipClassMap = {
	dev: 'ceo-chip-dev',
	design: 'ceo-chip-design',
	ops: 'ceo-chip-ops',
	hr: 'ceo-chip-hr',
} as const

export const statusClassMap = {
	active: 'ceo-status-active',
	review: 'ceo-status-review',
	planning: 'ceo-status-planning',
	completed: 'ceo-status-completed',
	blocked: 'ceo-status-blocked',
} as const

export const progressToneClassMap = {
	cyan: 'ceo-fill-cyan',
	green: 'ceo-fill-green',
	yellow: 'ceo-fill-yellow',
} as const

export const avatarTones = ['cyan-purple', 'purple-red', 'yellow-cyan', 'green-purple', 'cyan-green', 'green-cyan', 'muted'] as const

export const modalTitles: Record<ModalId, string> = {
	createTeam: 'Create New Team',
	disbandTeam: 'Disband Team',
	addMember: 'Add Member to Team',
	revokeMember: 'Revoke Member Access',
	createProject: 'Create New Project',
	discardProject: 'Discard Project',
	assignTeam: 'Assign Team to Project',
	revokeTeam: 'Revoke Team from Project',
	invite: 'Invite Team Member',
	editProfile: 'Edit Profile',
	createTask: 'Create Task',
}
