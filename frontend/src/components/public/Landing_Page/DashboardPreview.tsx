const DashboardPreview = () => {
  return (
    <div className="preview-wrap">
      <div className="dashboard-preview">
        <div className="dash-bar">
          <div className="dot" />
          <div className="dot" />
          <div className="dot" />
        </div>
        <div className="dash-inner">
          <div className="dash-sidebar">
            <div className="logo-sm">Task<span>IQ</span></div>
            <div className="sidebar-item active"><span className="sidebar-icon">⊞</span> Dashboard</div>
            <div className="sidebar-item"><span className="sidebar-icon">✓</span> Tasks</div>
            <div className="sidebar-item"><span className="sidebar-icon">◎</span> Projects</div>
            <div className="sidebar-item"><span className="sidebar-icon">👥</span> Team</div>
            <div className="sidebar-item"><span className="sidebar-icon">📊</span> Analytics</div>
            <div className="sidebar-item"><span className="sidebar-icon">⚙</span> Settings</div>
          </div>
          <div className="dash-main">
            <div className="dash-row">
              <div className="stat-card">
                <div className="label">Open Tasks</div>
                <div className="value">24</div>
                <div className="delta">↑ 3 added today</div>
              </div>
              <div className="stat-card">
                <div className="label">Team Members</div>
                <div className="value">8</div>
                <div className="delta">↑ 2 online now</div>
              </div>
              <div className="stat-card">
                <div className="label">Sprint Progress</div>
                <div className="value">68%</div>
                <div className="delta">On track ✓</div>
              </div>
            </div>
            <div className="task-list">
              <h4>TODAY'S TASKS</h4>
              <div className="task-item"><div className="task-check done" /> Update landing page copy <span className="task-tag tag-design">Design</span></div>
              <div className="task-item"><div className="task-check" /> Fix auth token bug <span className="task-tag tag-dev">Dev</span></div>
              <div className="task-item"><div className="task-check" /> Review investor deck v3 <span className="task-tag tag-ops">Ops</span></div>
              <div className="task-item"><div className="task-check done" /> Set up CI/CD pipeline <span className="task-tag tag-dev">Dev</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DashboardPreview
