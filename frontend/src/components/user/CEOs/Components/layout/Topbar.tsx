import { pageTitles } from '../../CEO_dummy_data'
import type { PanelId } from '../../types/dashboard.types'

type TopbarProps = {
	activePanel: PanelId
	onInviteMember: () => void
	onCreateProject: () => void
}

const Topbar = ({ activePanel, onInviteMember, onCreateProject }: TopbarProps) => {
	return (
		<header className="ceo-topbar">
			<h1>{pageTitles[activePanel]}</h1>
			<div className="ceo-topbar-right">
				<button className="ceo-btn-outline" onClick={onInviteMember} type="button">
					Invite Member
				</button>
				<button className="ceo-btn-primary" onClick={onCreateProject} type="button">
					New Project
				</button>
				<button className="ceo-notif" type="button" aria-label="Notifications">
					🔔
				</button>
			</div>
		</header>
	)
}

export default Topbar
