import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../styles/user/CEOs/Dashboard_CEO.css'
import '../../../styles/user/CEOs/TaskPanel.css'
import '../../../styles/user/Employee/Dashboard_Employee.css'
import '../../../styles/user/Employee/EmployeeUpdatesCard.css'
import { getAuthUser, logoutSession } from '../../../services/auth'
import { getUpdatesFeed, getUpdatesUnreadCount, markUpdateRead } from '../../../services/updates'
import type { EmployeePanelId } from './types/employee.types'
import { useEmployeeDashboardData } from './hooks/useEmployeeDashboardData'
import TasksPanel_Employee from './components/panels/TasksPanel_Employee'
import type { ManagerUpdateItem } from '../Manager/types/manager.types'
import SettingsPanel from '../CEOs/Components/panels/SettingsPanel'

const getInitials = (name?: string): string => {
  if (!name) {
    return 'EM'
  }

  return (
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'EM'
  )
}

const Dashboard_Employee = () => {
  const navigate = useNavigate()
  const apiBase = import.meta.env.VITE_BACKEND_URL ?? ''
  const [activePanel, setActivePanel] = useState<EmployeePanelId>('tasks')

  const {
    tasks,
    state,
    taskQuery,
    taskPageState,
    taskSummary,
    currentMemberName,
    canUpdateTaskStatus,
    setTaskQuery,
    reloadDashboard,
    onUpdateTaskStatus,
  } = useEmployeeDashboardData()

  const user = getAuthUser()
  const displayCompanyName = user?.companyName?.trim() || 'TaskIQ'
  const displayUserName = user?.name?.trim() || 'Employee'
  const displayUserInitials = getInitials(displayUserName)

  const [profileMenuOpen, setProfileMenuOpen] = useState(false)
  const [updates, setUpdates] = useState<ManagerUpdateItem[]>([])
  const [updatesUnreadCount, setUpdatesUnreadCount] = useState(0)
  const [updatesLoading, setUpdatesLoading] = useState(false)
  const [updatesError, setUpdatesError] = useState('')

  const loadEmployeeUpdates = async () => {
    setUpdatesLoading(true)
    setUpdatesError('')
    try {
      const [updatesPage, unread] = await Promise.all([
        getUpdatesFeed({ page: 1, limit: 5 }),
        getUpdatesUnreadCount(),
      ])
      setUpdates(updatesPage.items)
      setUpdatesUnreadCount(unread)
    } catch (error) {
      setUpdates([])
      setUpdatesError(error instanceof Error ? error.message : 'Failed to load updates')
    } finally {
      setUpdatesLoading(false)
    }
  }

  const handleMarkUpdateRead = async (updateId: string) => {
    try {
      await markUpdateRead(updateId)
      await loadEmployeeUpdates()
    } catch (error) {
      setUpdatesError(error instanceof Error ? error.message : 'Failed to mark update as read')
    }
  }

  useEffect(() => {
    if (!profileMenuOpen) {
      return
    }

    const onClickAway = () => setProfileMenuOpen(false)
    window.addEventListener('click', onClickAway)

    return () => window.removeEventListener('click', onClickAway)
  }, [profileMenuOpen])

  useEffect(() => {
    void loadEmployeeUpdates()
  }, [])

  const onSignOut = async () => {
    await logoutSession(apiBase)
    navigate('/login')
  }

  const switchPanel = (panel: EmployeePanelId) => {
    setActivePanel(panel)
    setProfileMenuOpen(false)
  }

  return (
    <div className="ceo-dashboard-root">
      <aside className="ceo-sidebar">
        <div className="ceo-logo-area">
          <div className="ceo-logo">
            Task<span>IQ</span>
          </div>
          <div className="ceo-logo-line" />
          <p className="ceo-org-label">{displayCompanyName}</p>
        </div>

        <div className="ceo-nav-scroll">
          <div className="ceo-nav-section">
            <h4>Workspace</h4>
            <button
              className={`ceo-nav-item ${activePanel === 'overview' ? 'active' : ''}`}
              type="button"
              onClick={() => switchPanel('overview')}
            >
              <span>01</span>
              Overview
            </button>
            <button
              className={`ceo-nav-item ${activePanel === 'tasks' ? 'active' : ''}`}
              type="button"
              onClick={() => switchPanel('tasks')}
            >
              <span>02</span>
              My Tasks
            </button>
          </div>
        </div>

        <div className="ceo-user-area" onClick={(event) => event.stopPropagation()}>
          {profileMenuOpen ? (
            <div className="ceo-profile-menu ceo-profile-menu-bottom">
              <button type="button" onClick={() => switchPanel('settings')}>
                Settings
              </button>
              <button type="button" className="danger" onClick={() => void onSignOut()}>
                Sign out
              </button>
            </div>
          ) : null}
          <button
            className="ceo-user-card employee-user-card-button"
            type="button"
            onClick={() => setProfileMenuOpen((prev) => !prev)}
          >
            <span className="ceo-avatar employee-avatar">{displayUserInitials}</span>
            <span className="employee-user-meta">
              <strong className="ceo-user-name">{displayUserName}</strong>
              <small className="ceo-user-role employee-user-role-line">Employee • {displayCompanyName}</small>
            </span>
          </button>
        </div>
      </aside>

      <main className="ceo-main">
        <header className="ceo-topbar">
          <h1>Employee Dashboard</h1>
          <div className="ceo-topbar-right">
            <button
              className="ceo-btn-outline"
              type="button"
              onClick={() => {
                void Promise.all([reloadDashboard(false), loadEmployeeUpdates()])
              }}
              disabled={state.isRefreshing || state.isLoading}
            >
              {state.isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
        </header>

        <section className="ceo-content">
          <section className={`ceo-panel ${activePanel === 'overview' ? 'active' : ''}`}>
            <div className="employee-summary-grid">
              <article className="ceo-stat">
                <div className="ceo-stat-top">
                  <span className="ceo-stat-label">Visible Tasks</span>
                </div>
                <strong className="ceo-stat-value">{taskSummary.total}</strong>
              </article>
              <article className="ceo-stat">
                <div className="ceo-stat-top">
                  <span className="ceo-stat-label">In Progress</span>
                </div>
                <strong className="ceo-stat-value">{taskSummary.inProgress}</strong>
              </article>
              <article className="ceo-stat">
                <div className="ceo-stat-top">
                  <span className="ceo-stat-label">Completed</span>
                </div>
                <strong className="ceo-stat-value">{taskSummary.done}</strong>
              </article>
              <article className="ceo-stat">
                <div className="ceo-stat-top">
                  <span className="ceo-stat-label">Overdue</span>
                </div>
                <strong className="ceo-stat-value">{taskSummary.overdue}</strong>
              </article>
            </div>

            <article className="ceo-card employee-overview-card">
              <div className="ceo-card-head">
                <h3>Focus for Today</h3>
                <button className="ceo-btn-primary" type="button" onClick={() => switchPanel('tasks')}>
                  Open Tasks
                </button>
              </div>
              <p className="ceo-empty-text">
                Keep your board moving by finishing todo items and reducing overdue tasks.
              </p>
              <p className="ceo-empty-text">
                Showing {taskPageState.total} total tasks from page {taskPageState.page}.
              </p>
            </article>

            <article className="ceo-card employee-updates-card">
              <div className="ceo-card-head employee-updates-head">
                <h3>Company Updates</h3>
                <span className="employee-updates-badge">Unread: {updatesUnreadCount}</span>
              </div>
              {updatesLoading ? <p className="ceo-empty-text">Loading updates...</p> : null}
              {!updatesLoading && updatesError ? <p className="employee-updates-error">{updatesError}</p> : null}
              {!updatesLoading && !updatesError && updates.length === 0 ? (
                <p className="ceo-empty-text">No updates available right now.</p>
              ) : null}
              {!updatesLoading && !updatesError && updates.length > 0 ? (
                <div className="employee-updates-list">
                  {updates.map((update) => (
                    <div key={update.id} className={`employee-update-item ${update.isRead ? '' : 'unread'}`}>
                      <div className="employee-update-top">
                        <strong>{update.title}</strong>
                        <span className={`employee-update-priority ${update.priority}`}>{update.priority}</span>
                      </div>
                      <p>{update.body}</p>
                      <div className="employee-update-meta">
                        <span>{update.authorName}</span>
                        <span>{update.time}</span>
                        {update.isPinned ? <span>Pinned</span> : null}
                      </div>
                      {!update.isRead ? (
                        <button className="ceo-btn-outline" type="button" onClick={() => void handleMarkUpdateRead(update.id)}>
                          Mark as read
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          </section>

          <TasksPanel_Employee
            isActive={activePanel === 'tasks'}
            isLoading={state.isLoading}
            isRefreshing={state.isRefreshing}
            isMutating={state.isUpdatingStatus}
            error={state.error}
            tasks={tasks}
            taskQuery={taskQuery}
            pageState={taskPageState}
            currentMemberName={currentMemberName}
            onTaskQueryChange={setTaskQuery}
            canUpdateTaskStatus={canUpdateTaskStatus}
            onUpdateTaskStatus={onUpdateTaskStatus}
          />
          <SettingsPanel isActive={activePanel === 'settings'} sections={['Profile', 'Security']} />
        </section>
      </main>
    </div>
  )
}

export default Dashboard_Employee
