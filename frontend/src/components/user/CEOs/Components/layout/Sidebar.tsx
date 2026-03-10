import type { DashboardData } from '../../types/dashboard.types'
import type { PanelId } from '../../types/dashboard.types'

type SidebarProps = {
	nav: DashboardData['nav']
	activePanel: PanelId
	profileMenuOpen: boolean
	displayCompanyName: string
	displayDesignation: string
	displayUserInitials: string
	displayUserName: string
	onToggleProfileMenu: () => void
	onOpenPreferences: () => void
	onSignOut: () => void
	onSwitchPanel: (panel: PanelId) => void
}

const Sidebar = ({
	nav,
	activePanel,
	profileMenuOpen,
	displayCompanyName,
	displayDesignation,
	displayUserInitials,
	displayUserName,
	onToggleProfileMenu,
	onOpenPreferences,
	onSignOut,
	onSwitchPanel,
}: SidebarProps) => {
	const roleSuffix = displayDesignation === 'CEO' ? 'Admin' : displayDesignation === 'Manager' ? 'Supervisor' : 'Employee'

	return (
		<aside className="ceo-sidebar">
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
					<h4>Overview</h4>
					{nav.overview.map((item) => (
						<button
							className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
							key={item.id}
							onClick={() => onSwitchPanel(item.id)}
							type="button"
						>
							<span>{item.short}</span>
							{item.label}
						</button>
					))}
				</section>

				<section className="ceo-nav-section">
					<h4>Workspace</h4>
					{nav.workspace.map((item) => (
						<button
							className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
							key={item.id}
							onClick={() => onSwitchPanel(item.id)}
							type="button"
						>
							<span>{item.short}</span>
							{item.label}
							{item.badge && <strong>{item.badge}</strong>}
						</button>
					))}
				</section>

				<section className="ceo-nav-section">
					<h4>System</h4>
					{nav.system.map((item) => (
						<button
							className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
							key={item.id}
							onClick={() => onSwitchPanel(item.id)}
							type="button"
						>
							<span>{item.short}</span>
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
						<div className="ceo-user-role">
							{displayDesignation} | {roleSuffix}
						</div>
					</div>
				</button>

				{profileMenuOpen && (
					<div className="ceo-profile-menu ceo-profile-menu-bottom">
						<button onClick={onOpenPreferences} type="button">
							Settings
						</button>
						<button onClick={onSignOut} type="button" className="danger">
							Sign Out
						</button>
					</div>
				)}
			</div>
		</aside>
	)
}

export default Sidebar
