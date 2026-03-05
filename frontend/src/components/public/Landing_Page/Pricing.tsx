import { useNavigate } from 'react-router-dom'

const Pricing = () => {
  const navigate = useNavigate()

  return (
    <section className="pricing" id="pricing">
      <p className="section-label">Pricing</p>
      <h2 className="section-title">Simple, Startup-Friendly Pricing</h2>
      <div className="pricing-grid">
        <div className="plan">
          <div className="plan-name">Starter</div>
          <div className="plan-price">$0 <span>/mo</span></div>
          <div className="plan-desc">Perfect for solo founders and small teams just getting started.</div>
          <ul className="plan-features">
            <li>Up to 10 members</li>
            <li>5 active projects</li>
            <li>Basic analytics</li>
            <li>Community support</li>
          </ul>
          <button
            className="plan-btn outline"
            type="button"
            onClick={() => navigate('/register')}
          >
            Get Started Free
          </button>
        </div>
        <div className="plan featured">
          <div className="plan-name">Growth</div>
          <div className="plan-price">$29 <span>/mo</span></div>
          <div className="plan-desc">For growing startups that need more power and integrations.</div>
          <ul className="plan-features">
            <li>Unlimited members</li>
            <li>Unlimited projects</li>
            <li>Advanced analytics</li>
            <li>All integrations</li>
            <li>OKR tracking</li>
            <li>Priority support</li>
          </ul>
          <button className="plan-btn filled" type="button">Start 14-Day Trial</button>
        </div>
        <div className="plan">
          <div className="plan-name">Scale</div>
          <div className="plan-price">$79 <span>/mo</span></div>
          <div className="plan-desc">For scaling companies with enterprise-grade needs and compliance.</div>
          <ul className="plan-features">
            <li>Everything in Growth</li>
            <li>Custom roles &amp; SSO</li>
            <li>Audit logs</li>
            <li>Dedicated success manager</li>
            <li>Custom integrations</li>
          </ul>
          <button className="plan-btn outline" type="button">Contact Sales</button>
        </div>
      </div>
    </section>
  )
}

export default Pricing
