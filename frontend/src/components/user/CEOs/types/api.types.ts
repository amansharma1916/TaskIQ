export type ApiMember = {
	_id: string
	memberName: string
	memberRole?: string
	userId?: string | { _id: string } | null
	memberTeam?: {
		_id: string
		teamName?: string
	} | null
}

export type ApiTeam = {
	_id: string
	teamName: string
	teamDescription?: string
	teamTags?: string[]
	totalMembers?: number
	teamMembers?: Array<{
		_id: string
		memberName?: string
	}>
}
