import { pageTitles } from '../../CEO_dummy_data'
import type { PanelId } from '../../types/dashboard.types'
import ThemeToggle from '../../../../shared/ThemeToggle'

type TopbarProps = {
	activePanel: PanelId
	isMobileViewport: boolean
	isMobileNavOpen: boolean
	onToggleMobileNav: () => void
	onInviteMember: () => void
	onCreateProject: () => void
	onOpenUpdates: () => void
	unreadUpdatesCount: number
}

const Topbar = ({
	activePanel,
	isMobileViewport,
	isMobileNavOpen,
	onToggleMobileNav,
	onInviteMember,
	onCreateProject,
	onOpenUpdates,
	unreadUpdatesCount,
}: TopbarProps) => {
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
						aria-controls="ceo-sidebar-nav"
					>
						☰
					</button>
				)}
				<h1>{pageTitles[activePanel]}</h1>
			</div>
			<div className="ceo-topbar-right">
				<ThemeToggle />
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
