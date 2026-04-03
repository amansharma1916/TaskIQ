import type { ModalId, TeamCard } from '../../types/dashboard.types'

type TeamsPanelProps = {
	isActive: boolean
	teamsData: TeamCard[]
	teamOptionsOpenFor: string | null
	onOpenModalById: (modalId: ModalId, presetTeamId?: string) => void
	onToggleTeamOptions: (teamId: string) => void
	onDisbandTeam: (teamId: string) => void
}

const TeamsPanel = ({
	isActive,
	teamsData,
	teamOptionsOpenFor,
	onOpenModalById,
	onToggleTeamOptions,
	onDisbandTeam,
}: TeamsPanelProps) => {
	return (
		<div className={`ceo-panel ${isActive ? 'active' : ''}`}>
			<div className="ceo-section-head">
				<h2>Teams</h2>
				<div className="ceo-actions-row">
					<button className="ceo-btn-outline" onClick={() => onOpenModalById('disbandTeam')} type="button">
						Disband Team
					</button>
					<button className="ceo-btn-primary" onClick={() => onOpenModalById('createTeam')} type="button">
						Create Team
					</button>
				</div>
			</div>

			<article className="ceo-list-card">
				{teamsData.map((team) => (
					<div className="ceo-list-row" key={team.id}>
						<div className="ceo-list-main">
							<div className="ceo-list-title-wrap">
								<h3>{team.name}</h3>
								<span className="ceo-team-tag">{team.tag}</span>
							</div>
							<p>{team.description}</p>
						</div>
						<div className="ceo-list-avatars">
							{team.members.map((member) => (
								<span className={`ceo-mini-avatar tone-${member.tone}`} key={`${team.id}-${member.initials}`}>
									{member.initials}
								</span>
							))}
							<small>{team.totalMembers} members</small>
						</div>
						<div className="ceo-list-actions">
							<button className="ceo-btn-sm" onClick={() => onOpenModalById('addMember', team.id)} type="button">
								Add Member
							</button>
							<button className="ceo-btn-danger" onClick={() => onOpenModalById('revokeMember', team.id)} type="button">
								Revoke Member
							</button>
							<div className="ceo-team-options-wrap">
								<button className="ceo-btn-outline" onClick={() => onToggleTeamOptions(team.id)} type="button">
									☰
								</button>
								{teamOptionsOpenFor === team.id && (
									<div className="ceo-team-options-menu">
										<button className="ceo-btn-danger" onClick={() => onDisbandTeam(team.id)} type="button">
											Disband Team
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				))}
				<div className="ceo-list-row ceo-list-row-create">
					<div className="ceo-list-main">
						<h3>Create New Team</h3>
						<p>Group members into focused teams with clear goals and role boundaries.</p>
					</div>
					<div className="ceo-list-actions">
						<button className="ceo-btn-primary" onClick={() => onOpenModalById('createTeam')} type="button">
							Create Team
						</button>
					</div>
				</div>
			</article>
		</div>
	)
}

export default TeamsPanel
