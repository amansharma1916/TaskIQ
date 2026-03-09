import DashboardStat from '../shared/DashboardStat'
import ProgressRow from '../shared/ProgressRow'
import TaskRow from '../shared/TaskRow'
import type { ActivityItem, MemberPresence, PanelId, ProgressItem, StatCard, TaskItem } from '../../types/dashboard.types'
import { toneClassMap } from '../../utils/constants'

type DashboardPanelProps = {
	isActive: boolean
	stats: StatCard[]
	todayTasks: TaskItem[]
	onlineMembers: MemberPresence[]
	projectHealth: ProgressItem[]
	activity: ActivityItem[]
	taskState: Record<string, boolean>
	onToggleTask: (taskId: string) => void
	onSwitchPanel: (panel: PanelId) => void
}

const DashboardPanel = ({
	isActive,
	stats,
	todayTasks,
	onlineMembers,
	projectHealth,
	activity,
	taskState,
	onToggleTask,
	onSwitchPanel,
}: DashboardPanelProps) => {
	return (
		<div className={`ceo-panel ${isActive ? 'active' : ''}`}>
			<div className="ceo-stats-row">{stats.map((stat) => <DashboardStat key={stat.id} stat={stat} />)}</div>

			<div className="ceo-grid-three">
				<article className="ceo-card">
					<div className="ceo-card-head">
						<h3>Today&apos;s Tasks</h3>
						<button className="ceo-link-btn" onClick={() => onSwitchPanel('tasks')} type="button">
							View all
						</button>
					</div>
					{todayTasks.map((task) => (
						<TaskRow
							key={task.id}
							task={task}
							done={taskState[task.id]}
							showAssignee={false}
							onToggleTask={onToggleTask}
						/>
					))}
				</article>

				<article className="ceo-card">
					<div className="ceo-card-head">
						<h3>Team Online</h3>
						<button className="ceo-link-btn" onClick={() => onSwitchPanel('members')} type="button">
							All
						</button>
					</div>
					{onlineMembers.map((member) => (
						<div className="ceo-member-row" key={member.id}>
							<div className={`ceo-member-avatar tone-${member.tone}`}>{member.initials}</div>
							<div>
								<div className="ceo-member-name">{member.name}</div>
								<div className="ceo-member-role">{member.role}</div>
							</div>
							<div className={`ceo-online-dot ${member.online ? 'online' : 'offline'}`} />
						</div>
					))}
				</article>
			</div>

			<div className="ceo-grid-two">
				<article className="ceo-card">
					<div className="ceo-card-head">
						<h3>Project Health</h3>
					</div>
					{projectHealth.map((item) => (
						<ProgressRow item={item} key={item.id} />
					))}
				</article>

				<article className="ceo-card">
					<div className="ceo-card-head">
						<h3>Recent Activity</h3>
					</div>
					{activity.map((item) => (
						<div className="ceo-activity-item" key={item.id}>
							<span className={`ceo-activity-dot ${toneClassMap[item.tone]}`} />
							<div>
								<p>{item.label}</p>
								<small>{item.time}</small>
							</div>
						</div>
					))}
				</article>
			</div>
		</div>
	)
}

export default DashboardPanel
