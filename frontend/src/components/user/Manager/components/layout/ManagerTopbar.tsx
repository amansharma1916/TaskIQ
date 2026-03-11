import type { ManagerPanelId } from '../../types/manager.types'

type ManagerTopbarProps = {
	activePanel: ManagerPanelId
	onRefresh: () => void
}

const panelTitles: Record<ManagerPanelId, string> = {
	projects: 'Project Oversight',
	tasks: 'Task Execution',
	'my-assignments': 'My Assignments',
	teams: 'Team Coordination',
	activity: 'Recent Activity',
}

const ManagerTopbar = ({ activePanel, onRefresh }: ManagerTopbarProps) => {
	return (
		<header className="ceo-topbar">
			<h1>{panelTitles[activePanel]}</h1>
			<div className="ceo-topbar-right">
				<button className="ceo-btn-outline" onClick={onRefresh} type="button">
					Refresh
				</button>
				<button className="ceo-notif" type="button" aria-label="Notifications">
					🔔
				</button>
			</div>
		</header>
	)
}

export default ManagerTopbar
