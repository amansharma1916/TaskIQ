import { useMemo, useState } from 'react'
import { getAuthUser } from '../../../../../services/auth'
import type { ManagerMemberOption, ManagerTeamCard } from '../../types/manager.types'
import '../../../../../styles/user/Manager/panels/ManagerMembersPanel.css'

type ManagerMembersPanelProps = {
	isActive: boolean
	isLoading: boolean
	error: string
	members: ManagerMemberOption[]
	teams: ManagerTeamCard[]
}

const formatRoleLabel = (role?: string): string => {
	if (!role?.trim()) {
		return 'Member'
	}

	const normalized = role.trim().toLowerCase()
	if (normalized === 'ceo') {
		return 'CEO'
	}

	return normalized.charAt(0).toUpperCase() + normalized.slice(1)
}

const getInitials = (name: string): string =>
	name
		.split(' ')
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase())
		.join('') || 'MB'

const toneClasses = [
	'tone-cyan',
	'tone-purple',
	'tone-yellow',
	'tone-green',
	'tone-cyan-purple',
	'tone-green-cyan',
] as const

const getToneClassFromId = (id: string): string => {
	const score = id.split('').reduce((total, char) => total + char.charCodeAt(0), 0)
	return toneClasses[score % toneClasses.length]
}

const getRoleChipClass = (role?: string): string => {
	const normalized = String(role ?? '').toLowerCase()
	if (normalized === 'manager') {
		return 'ceo-chip-dev'
	}
	if (normalized === 'employee') {
		return 'ceo-chip-ops'
	}
	if (normalized === 'ceo') {
		return 'ceo-chip-hr'
	}
	return 'ceo-chip-design'
}

const ManagerMembersPanel = ({ isActive, isLoading, error, members, teams }: ManagerMembersPanelProps) => {
	const authUser = getAuthUser()
	const isTeamScopedManager = authUser?.role === 'Manager' && authUser?.managerScope === 'team'

	const [query, setQuery] = useState('')
	const [teamFilter, setTeamFilter] = useState<'all' | 'unassigned' | string>('all')
	const [roleFilter, setRoleFilter] = useState<'all' | string>('all')

	const teamNameById = useMemo(() => {
		const entries = teams.map((team) => [team.id, team.name] as const)
		return new Map<string, string>(entries)
	}, [teams])

	const roleOptions = useMemo(() => {
		const roles = new Set<string>()
		for (const member of members) {
			if (member.role?.trim()) {
				roles.add(member.role.trim().toLowerCase())
			}
		}
		return Array.from(roles).sort((left, right) => left.localeCompare(right))
	}, [members])

	const filteredMembers = useMemo(() => {
		const normalizedQuery = query.trim().toLowerCase()

		return [...members]
			.filter((member) => {
				if (teamFilter === 'unassigned' && member.teamId) {
					return false
				}

				if (teamFilter !== 'all' && teamFilter !== 'unassigned' && member.teamId !== teamFilter) {
					return false
				}

				const memberRole = member.role?.trim().toLowerCase() ?? ''
				if (roleFilter !== 'all' && memberRole !== roleFilter) {
					return false
				}

				if (!normalizedQuery) {
					return true
				}

				const teamName = member.teamId ? teamNameById.get(member.teamId) ?? 'Unassigned' : 'Unassigned'
				return (
					member.name.toLowerCase().includes(normalizedQuery) ||
					teamName.toLowerCase().includes(normalizedQuery) ||
					memberRole.includes(normalizedQuery)
				)
			})
			.sort((left, right) => left.name.localeCompare(right.name))
	}, [members, query, roleFilter, teamFilter, teamNameById])

	const summary = useMemo(() => {
		const managerCount = members.filter((member) => String(member.role ?? '').toLowerCase() === 'manager').length
		const unassignedCount = members.filter((member) => !member.teamId).length
		return {
			total: members.length,
			managerCount,
			employeeCount: Math.max(members.length - managerCount, 0),
			unassignedCount,
		}
	}, [members])

	const hasActiveFilters = Boolean(query.trim()) || teamFilter !== 'all' || roleFilter !== 'all'

	if (!isActive) {
		return null
	}

	return (
		<section className="ceo-panel active manager-members-panel">
			<div className="ceo-section-head manager-members-section-head">
				<div>
					<h2>Members</h2>
					<p className="manager-members-copy">
						{isTeamScopedManager
							? 'Showing members inside your managed teams.'
							: 'Showing all members in your company workspace.'}
					</p>
				</div>
				<div className="manager-members-summary-inline">
					<span>Total {summary.total}</span>
					<span>Managers {summary.managerCount}</span>
					<span>Employees {summary.employeeCount}</span>
					<span>Unassigned {summary.unassignedCount}</span>
				</div>
			</div>

			{isLoading ? <div className="manager-state">Loading members...</div> : null}
			{!isLoading && error ? <div className="manager-state manager-state-error">{error}</div> : null}

			{!isLoading && !error ? (
				<>
					<article className="ceo-list-card manager-members-filter-card">
						<div className="manager-members-filters">
						<label>
							Search
							<input
								type="search"
								value={query}
								onChange={(event) => setQuery(event.target.value)}
								placeholder="Search by name, role, or team"
							/>
						</label>
						<label>
							Team
							<select value={teamFilter} onChange={(event) => setTeamFilter(event.target.value)}>
								<option value="all">All teams</option>
								<option value="unassigned">Unassigned</option>
								{teams.map((team) => (
									<option key={team.id} value={team.id}>
										{team.name}
									</option>
								))}
							</select>
						</label>
						<label>
							Role
							<select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}>
								<option value="all">All roles</option>
								{roleOptions.map((role) => (
									<option key={role} value={role}>
										{formatRoleLabel(role)}
									</option>
								))}
							</select>
						</label>
						{hasActiveFilters ? (
							<button
								type="button"
								className="ceo-btn-outline manager-members-clear"
								onClick={() => {
									setQuery('')
									setTeamFilter('all')
									setRoleFilter('all')
								}}
							>
								Clear Filters
							</button>
						) : null}
						</div>
					</article>

					{filteredMembers.length === 0 ? (
						<div className="manager-members-empty">
							<h3>No members found</h3>
							<p>
								{isTeamScopedManager
									? 'There are no members in your current team scope that match these filters.'
									: 'No company members match the current filters.'}
							</p>
						</div>
					) : (
						<article className="ceo-list-card manager-members-list-card" role="list">
							{filteredMembers.map((member) => {
								const teamName = member.teamId ? teamNameById.get(member.teamId) ?? 'Unassigned' : 'Unassigned'
								return (
									<div className="ceo-team-member-row manager-members-row" key={member.id} role="listitem">
										<div className={`ceo-member-avatar ${getToneClassFromId(member.id)}`}>{getInitials(member.name)}</div>
										<div className="ceo-list-main ceo-list-main-member">
											<div className="ceo-member-name">{member.name}</div>
											<div className="ceo-member-role">{teamName}</div>
										</div>
										<div className="ceo-list-actions">
											<span className={`ceo-chip ${getRoleChipClass(member.role)}`}>{formatRoleLabel(member.role)}</span>
										</div>
									</div>
								)
							})}
						</article>
					)}
				</>
			) : null}
		</section>
	)
}

export default ManagerMembersPanel
