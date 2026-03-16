import type { ManagerPanelId } from '../../types/manager.types'

type ManagerSidebarProps = {
	activePanel: ManagerPanelId
	displayCompanyName: string
	displayDesignation: string
	displayUserName: string
	displayUserInitials: string
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
	displayCompanyName,
	displayDesignation,
	displayUserName,
	displayUserInitials,
	onSwitchPanel,
	onSignOut,
}: ManagerSidebarProps) => {
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
					<h4>Workspace</h4>
					{panelItems.map((item) => (
						<button
							className={`ceo-nav-item ${activePanel === item.id ? 'active' : ''}`}
							key={item.id}
							onClick={() => onSwitchPanel(item.id)}
							type="button"
						>
							<span>{item.label.slice(0, 2).toUpperCase()}</span>
							{item.label}
						</button>
					))}
				</section>
			</div>

			<div className="ceo-user-area">
				<div className="ceo-user-card">
					<div className="ceo-avatar">{displayUserInitials}</div>
					<div>
						<div className="ceo-user-name">{displayUserName}</div>
						<div className="ceo-user-role">{displayDesignation}</div>
					</div>
				</div>
				<button className="ceo-btn-outline" onClick={onSignOut} type="button" style={{ width: '100%' }}>
					Sign Out
				</button>
			</div>
		</aside>
	)
}

export default ManagerSidebar
