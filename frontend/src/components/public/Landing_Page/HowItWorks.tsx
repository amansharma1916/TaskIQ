const HowItWorks = () => {
  return (
    <section className="how" id="how">
      <p className="section-label">How It Works</p>
      <h2 className="section-title">Up and Running in Minutes</h2>
      <div className="steps">
        <div className="step">
          <div className="step-num">1</div>
          <h3>Create Your Workspace</h3>
          <p>Sign up and set up your organization with your company name, team size, and industry in under 2 minutes.</p>
        </div>
        <div className="step">
          <div className="step-num">2</div>
          <h3>Invite Your Team</h3>
          <p>Send invites by email or share a link. Assign roles on the fly — admins, managers, or contributors.</p>
        </div>
        <div className="step">
          <div className="step-num">3</div>
          <h3>Build Your Workflow</h3>
          <p>Create projects, assign tasks, and set sprints. Customize boards to fit how your team actually works.</p>
        </div>
        <div className="step">
          <div className="step-num">4</div>
          <h3>Ship Faster</h3>
          <p>Track progress in real time, hit your goals, and scale confidently with full visibility at every stage.</p>
        </div>
      </div>
    </section>
  )
}

export default HowItWorks
