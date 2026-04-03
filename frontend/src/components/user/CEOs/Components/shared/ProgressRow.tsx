import type { ProgressItem } from '../../types/dashboard.types'
import { progressToneClassMap } from '../../utils/constants'

type ProgressRowProps = {
	item: ProgressItem
}

const ProgressRow = ({ item }: ProgressRowProps) => {
	return (
		<div className="ceo-progress-row" key={item.id}>
			<div className="ceo-progress-head">
				<span>{item.name}</span>
				<span>{item.value}%</span>
			</div>
			<div className="ceo-progress-bar">
				<div className={`ceo-progress-fill ${progressToneClassMap[item.tone]}`} style={{ width: `${item.value}%` }} />
			</div>
		</div>
	)
}

export default ProgressRow
