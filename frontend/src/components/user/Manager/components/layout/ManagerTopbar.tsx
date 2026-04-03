import type { ManagerPanelId } from '../../types/manager.types'
import ThemeToggle from '../../../../shared/ThemeToggle'

type ManagerTopbarProps = {
	activePanel: ManagerPanelId
	isMobileViewport: boolean
	isMobileNavOpen: boolean
	onToggleMobileNav: () => void
	onRefresh: () => void
	onOpenUpdates: () => void
	unreadUpdatesCount: number
}

const panelTitles: Record<ManagerPanelId, string> = {
	projects: 'Project Oversight',
	tasks: 'Task Execution',
	members: 'Member Directory',
	'my-assignments': 'My Assignments',
	teams: 'Team Coordination',
	updates: 'Updates Center',
	activity: 'Recent Activity',
	settings: 'Settings',
}

const ManagerTopbar = ({
	activePanel,
	isMobileViewport,
	isMobileNavOpen,
	onToggleMobileNav,
	onRefresh,
	onOpenUpdates,
	unreadUpdatesCount,
}: ManagerTopbarProps) => {
	return (
		<header className="ceo-topbar">
			<div className="ceo-topbar-title-wrap">
				{isMobileViewport && (
					<button
						className="ceo-mobile-menu-btn"
						type="button"
						onClick={onToggleMobileNav}
						aria-label="Toggle navigation menu"
						aria-expanded={isMobileNavOpen}
						aria-controls="manager-sidebar-nav"
					>
						☰
					</button>
				)}
				<h1>{panelTitles[activePanel]}</h1>
			</div>
			<div className="ceo-topbar-right">
				<ThemeToggle />
				<button className="ceo-btn-outline" onClick={onRefresh} type="button">
					Refresh
				</button>
				<button className="ceo-notif" type="button" aria-label="Open updates" onClick={onOpenUpdates}>
					🔔{unreadUpdatesCount > 0 ? ` ${unreadUpdatesCount}` : ''}
				</button>
			</div>
		</header>
	)
}

export default ManagerTopbar
