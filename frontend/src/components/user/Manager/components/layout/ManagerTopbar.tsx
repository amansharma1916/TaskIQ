import type { ManagerPanelId } from '../../types/manager.types'

type ManagerTopbarProps = {
	activePanel: ManagerPanelId
	onRefresh: () => void
	onOpenActivity: () => void
}

const panelTitles: Record<ManagerPanelId, string> = {
	projects: 'Project Oversight',
	tasks: 'Task Execution',
	members: 'Member Directory',
	'my-assignments': 'My Assignments',
	teams: 'Team Coordination',
	activity: 'Recent Activity',
}

const ManagerTopbar = ({ activePanel, onRefresh, onOpenActivity }: ManagerTopbarProps) => {
	return (
		<header className="ceo-topbar">
			<h1>{panelTitles[activePanel]}</h1>
			<div className="ceo-topbar-right">
				<button className="ceo-btn-outline" onClick={onRefresh} type="button">
					Refresh
				</button>
				<button className="ceo-notif" type="button" aria-label="Open recent activity" onClick={onOpenActivity}>
					🔔
				</button>
			</div>
		</header>
	)
}

export default ManagerTopbar
