import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../../styles/user/CEOs/Dashboard_CEO.css'
import '../../../styles/user/CEOs/TaskPanel.css'
import '../../../styles/user/Employee/Dashboard_Employee.css'
import { getAuthUser, logoutSession } from '../../../services/auth'
import type { EmployeePanelId } from './types/employee.types'
import { useEmployeeDashboardData } from './hooks/useEmployeeDashboardData'
import TasksPanel_Employee from './components/panels/TasksPanel_Employee'

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

  const [showSignOutMenu, setShowSignOutMenu] = useState(false)

  useEffect(() => {
    if (!showSignOutMenu) {
      return
    }

    const onClickAway = () => setShowSignOutMenu(false)
    window.addEventListener('click', onClickAway)

    return () => window.removeEventListener('click', onClickAway)
  }, [showSignOutMenu])

  const onSignOut = async () => {
    await logoutSession(apiBase)
    navigate('/login')
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
              onClick={() => setActivePanel('overview')}
            >
              <span>01</span>
              Overview
            </button>
            <button
              className={`ceo-nav-item ${activePanel === 'tasks' ? 'active' : ''}`}
              type="button"
              onClick={() => setActivePanel('tasks')}
            >
              <span>02</span>
              My Tasks
            </button>
          </div>
        </div>

        <div className="ceo-user-area" onClick={(event) => event.stopPropagation()}>
          {showSignOutMenu ? (
            <div className="ceo-profile-menu ceo-profile-menu-bottom">
              <button type="button" className="danger" onClick={() => void onSignOut()}>
                Sign out
              </button>
            </div>
          ) : null}
          <button
            className="ceo-user-card employee-user-card-button"
            type="button"
            onClick={() => setShowSignOutMenu((prev) => !prev)}
          >
            <span className="ceo-avatar">{displayUserInitials}</span>
            <span>
              <strong className="ceo-user-name">{displayUserName}</strong>
              <small className="ceo-user-role">Employee</small>
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
              onClick={() => void reloadDashboard(false)}
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
                <button className="ceo-btn-primary" type="button" onClick={() => setActivePanel('tasks')}>
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
        </section>
      </main>
    </div>
  )
}

export default Dashboard_Employee
