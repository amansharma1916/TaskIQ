import type { ManagerTeamCard } from '../../types/manager.types'

type ManagerTeamsPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	teams: ManagerTeamCard[]
}

const ManagerTeamsPanel = ({ isActive, isLoading, error, teams }: ManagerTeamsPanelProps) => {
	if (!isActive) {
		return null
	}

	return (
		<section className="ceo-panel active">
			<div className="ceo-section-head">
				<h2>Teams</h2>
			</div>
			{isLoading ? <div className="manager-state">Loading teams...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && teams.length === 0 ? <div className="manager-state">No teams available.</div> : null}
			{!isLoading && !error && teams.length > 0 ? (
				<div className="ceo-list-card">
					{teams.map((team) => (
						<article className="ceo-task-item ceo-task-item-extended" key={team.id}>
							<div>
								<h3>{team.name}</h3>
								<p>{team.description}</p>
							</div>
							<div className="ceo-task-meta-row">
								<span>Tag: {team.tag}</span>
								<span>Members: {team.totalMembers}</span>
							</div>
						</article>
					))}
				</div>
			) : null}
		</section>
	)
}

export default ManagerTeamsPanel
