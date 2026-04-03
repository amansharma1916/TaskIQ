import type { ManagerMemberOption, ManagerTaskRow } from '../types/manager.types'

export const getAssignableMembersForTask = (
	_task: ManagerTaskRow,
	members: ManagerMemberOption[]
): ManagerMemberOption[] => {
	return members
}