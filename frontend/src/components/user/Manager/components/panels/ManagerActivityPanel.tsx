import type { ManagerActivityItem } from '../../types/manager.types'

type ManagerActivityPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	activity: ManagerActivityItem[]
}

const ManagerActivityPanel = ({ isActive, isLoading, error, activity }: ManagerActivityPanelProps) => {
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
			{!isLoading && !error && activity.length === 0 ? <div className="manager-state">No activity yet.</div> : null}
			{!isLoading && !error && activity.length > 0 ? (
				<div className="ceo-list-card ceo-task-list">
					{activity.map((item) => (
						<article className="ceo-task-item ceo-task-item-extended" key={item.id}>
							<div>
								<h3>{item.label}</h3>
							</div>
							<div className="ceo-task-meta-row">
								<span>Entity: {item.entity}</span>
								<span>{item.time}</span>
							</div>
						</article>
					))}
				</div>
			) : null}
		</section>
	)
}

export default ManagerActivityPanel
