const Features = () => {
  return (
    <section className="features" id="features">
      <p className="section-label">Features</p>
      <h2 className="section-title">Everything Your Startup Needs</h2>
      <div className="features-grid">
        <div className="feat-card">
          <div className="feat-icon">⚡</div>
          <h3>Smart Task Management</h3>
          <p>Create, assign, and prioritize tasks in seconds. Auto-sort by deadline, priority, or team member with intelligent queues.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon">👥</div>
          <h3>Team Directory &amp; Roles</h3>
          <p>Manage your entire team from one screen. Assign roles, set permissions, and track who&apos;s working on what in real time.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon">🎯</div>
          <h3>Goal &amp; OKR Tracking</h3>
          <p>Set company-level OKRs and cascade them down to team goals. See alignment across every sprint and quarter.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon">📊</div>
          <h3>Analytics Dashboard</h3>
          <p>Get real-time insights on team velocity, sprint burndown, and task completion rates — no spreadsheets needed.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon">🔗</div>
          <h3>Integrations</h3>
          <p>Connect with Slack, GitHub, Notion, Google Calendar, and 50+ tools your team already uses every day.</p>
        </div>
        <div className="feat-card">
          <div className="feat-icon">🔒</div>
          <h3>Granular Permissions</h3>
          <p>Control who sees what. Set project-level access, create custom roles, and keep sensitive info secure.</p>
        </div>
      </div>
    </section>
  )
}

export default Features
