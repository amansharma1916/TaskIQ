import { pageTitles } from '../../CEO_dummy_data'
import type { PanelId } from '../../types/dashboard.types'

type TopbarProps = {
	activePanel: PanelId
	onInviteMember: () => void
	onCreateProject: () => void
	onOpenUpdates: () => void
	unreadUpdatesCount: number
}

const Topbar = ({ activePanel, onInviteMember, onCreateProject, onOpenUpdates, unreadUpdatesCount }: TopbarProps) => {
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
				<button className="ceo-notif" type="button" aria-label="Open updates" onClick={onOpenUpdates}>
					🔔{unreadUpdatesCount > 0 ? ` ${unreadUpdatesCount}` : ''}
				</button>
			</div>
		</header>
	)
}

export default Topbar
