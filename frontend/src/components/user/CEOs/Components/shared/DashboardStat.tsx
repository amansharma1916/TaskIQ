import type { StatCard } from '../../types/dashboard.types'
import { toneClassMap } from '../../utils/constants'

type DashboardStatProps = {
	stat: StatCard
}

const DashboardStat = ({ stat }: DashboardStatProps) => {
	return (
		<div className="ceo-stat">
			<div className="ceo-stat-top">
				<span className="ceo-stat-label">{stat.label}</span>
				<span className={`ceo-stat-icon ${toneClassMap[stat.tone]}`}>{stat.label.slice(0, 2).toUpperCase()}</span>
			</div>
			<div className="ceo-stat-value">{stat.value}</div>
			<div className={`ceo-stat-delta ${stat.trend === 'up' ? 'delta-up' : 'delta-down'}`}>{stat.delta}</div>
		</div>
	)
}

export default DashboardStat
