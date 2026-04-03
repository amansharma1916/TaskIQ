import '../../../../../styles/user/Manager/panels/ManagerActivityPanel.css'
import type { ManagerActivityItem } from '../../types/manager.types'

type ManagerActivityPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	activity: ManagerActivityItem[]
	isLoadingMore: boolean
	canLoadMore: boolean
	onLoadMore: () => void
}

const ENTITY_DOT_CLASS: Record<ManagerActivityItem['entity'], string> = {
	project: 'activity-dot-cyan',
	task: 'activity-dot-yellow',
	team: 'activity-dot-purple',
	member: 'activity-dot-green',
	system: 'activity-dot-muted',
}

const ENTITY_CHIP_CLASS: Record<ManagerActivityItem['entity'], string> = {
	project: 'manager-activity-chip-project',
	task: 'manager-activity-chip-task',
	team: 'manager-activity-chip-team',
	member: 'manager-activity-chip-member',
	system: 'manager-activity-chip-system',
}

const toDateKey = (rawDate: string): string => {
	if (!rawDate) {
		return 'older'
	}
	const parsed = new Date(rawDate)
	if (Number.isNaN(parsed.getTime())) {
		return 'older'
	}
	const now = new Date()
	const todayStr = now.toDateString()
	const yesterday = new Date(now)
	yesterday.setDate(now.getDate() - 1)
	const parsedStr = parsed.toDateString()
	if (parsedStr === todayStr) {
		return 'today'
	}
	if (parsedStr === yesterday.toDateString()) {
		return 'yesterday'
	}
	return 'older'
}

type ActivityGroup = {
	label: string
	items: ManagerActivityItem[]
}

const groupByDate = (items: ManagerActivityItem[]): ActivityGroup[] => {
	const buckets: Record<string, ManagerActivityItem[]> = { today: [], yesterday: [], older: [] }
	for (const item of items) {
		const key = toDateKey(item.rawDate)
		buckets[key].push(item)
	}
	const groups: ActivityGroup[] = [
		{ label: 'Today', items: buckets.today },
		{ label: 'Yesterday', items: buckets.yesterday },
		{ label: 'Older', items: buckets.older },
	]
	return groups.filter((g) => g.items.length > 0)
}

const ManagerActivityPanel = ({
	isActive,
	isLoading,
	error,
	activity,
	isLoadingMore,
	canLoadMore,
	onLoadMore,
}: ManagerActivityPanelProps) => {
	if (!isActive) {
		return null
	}

	return (
		<section className="ceo-panel active">
			<div className="ceo-section-head">
				<h2>Activity</h2>
			</div>

			{isLoading ? <div className="manager-state">Loading activity...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}
			{!isLoading && !error && activity.length === 0 ? (
				<div className="manager-activity-empty">
					<span className="manager-activity-empty-icon">&#9672;</span>
					<p>No activity recorded yet.</p>
				</div>
			) : null}

			{!isLoading && !error && activity.length > 0 ? (
				<div className="manager-activity-feed">
					{groupByDate(activity).map((group) => (
						<div className="manager-activity-group" key={group.label}>
							<div className="manager-activity-group-head">{group.label}</div>
							{group.items.map((item) => (
								<div className="manager-activity-item" key={item.id}>
									<span className={`manager-activity-dot ${ENTITY_DOT_CLASS[item.entity]}`} />
									<div className="manager-activity-content">
										<span className="manager-activity-label">{item.label}</span>
										<div className="manager-activity-meta">
											<span className={`manager-activity-chip ${ENTITY_CHIP_CLASS[item.entity]}`}>
												{item.entity}
											</span>
											<span className="manager-activity-time">{item.time}</span>
										</div>
									</div>
								</div>
							))}
						</div>
					))}

					{canLoadMore ? (
						<div className="manager-activity-load-more-row">
							<button
								className="manager-activity-load-more"
								type="button"
								disabled={isLoadingMore}
								onClick={onLoadMore}
							>
								{isLoadingMore ? 'Loading...' : 'Load more'}
							</button>
						</div>
					) : null}
				</div>
			) : null}
		</section>
	)
}

export default ManagerActivityPanel
