import type { ManagerPanelId } from '../../types/manager.types'

type ManagerSidebarProps = {
	activePanel: ManagerPanelId
	profileMenuOpen: boolean
	isMobileViewport: boolean
	isMobileNavOpen: boolean
	displayCompanyName: string
	displayDesignation: string
	displayUserName: string
	displayUserInitials: string
	onToggleProfileMenu: () => void
	onCloseMobileNav: () => void
	onOpenPreferences: () => void
	onSwitchPanel: (panel: ManagerPanelId) => void
	onSignOut: () => void
}

const panelItems: Array<{ id: ManagerPanelId; label: string }> = [
	{ id: 'projects', label: 'Projects' },
	{ id: 'tasks', label: 'Tasks' },
	{ id: 'members', label: 'Members' },
	{ id: 'my-assignments', label: 'My Assignments' },
	{ id: 'teams', label: 'Teams' },
	{ id: 'updates', label: 'Updates' },
	{ id: 'activity', label: 'Activity' },
]

const ManagerSidebar = ({
	activePanel,
	profileMenuOpen,
	isMobileViewport,
	isMobileNavOpen,
	displayCompanyName,
	displayDesignation,
	displayUserName,
	displayUserInitials,
	onToggleProfileMenu,
	onCloseMobileNav,
	onOpenPreferences,
	onSwitchPanel,
	onSignOut,
}: ManagerSidebarProps) => {
	const sidebarClassName = `ceo-sidebar${isMobileViewport ? ' mobile' : ''}${isMobileNavOpen ? ' mobile-open' : ''}`

	const handleSwitchPanel = (panel: ManagerPanelId) => {
		onSwitchPanel(panel)
		if (isMobileViewport) {
			onCloseMobileNav()
		}
	}

	const handleOpenPreferences = () => {
		onOpenPreferences()
		if (isMobileViewport) {
			onCloseMobileNav()
		}
	}

	const handleSignOut = () => {
		onSignOut()
		if (isMobileViewport) {
			onCloseMobileNav()
		}
	}

	return (
		<aside id="manager-sidebar-nav" className={sidebarClassName} aria-hidden={isMobileViewport && !isMobileNavOpen}>
			<div className="ceo-logo-area">
				<div className="ceo-logo">
					Task<span>IQ</span>
				</div>
				<div className="ceo-logo-line" />
				<div className="ceo-org-label">
					{displayCompanyName} | {displayDesignation}
				</div>
			</div>

			<div className="ceo-nav-scroll">
				<section className="ceo-nav-section">
					<h4>Workspace</h4>
					{panelItems.map((item) => (
						<button
							className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
							key={item.id}
							onClick={() => handleSwitchPanel(item.id)}
							type="button"
						>
							<span>{item.label.slice(0, 2).toUpperCase()}</span>
							{item.label}
						</button>
					))}
				</section>
			</div>

			<div className="ceo-user-area">
				<button className="ceo-user-card" onClick={onToggleProfileMenu} type="button">
					<div className="ceo-avatar">{displayUserInitials}</div>
					<div>
						<div className="ceo-user-name">{displayUserName}</div>
						<div className="ceo-user-role">{displayDesignation}</div>
					</div>
				</button>

				{profileMenuOpen && (
					<div className="ceo-profile-menu ceo-profile-menu-bottom">
						<button onClick={handleOpenPreferences} type="button">
							Settings
						</button>
						<button onClick={handleSignOut} type="button" className="danger">
							Sign Out
						</button>
					</div>
				)}
			</div>
		</aside>
	)
}

export default ManagerSidebar
