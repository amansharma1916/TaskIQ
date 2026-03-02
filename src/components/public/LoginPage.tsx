import { Link } from 'react-router-dom'
import BackgroundEffects from './Landing_Page/BackgroundEffects'
import '../../styles/landing-page.css'
import '../../styles/register-page.css'

const LoginPage = () => {
  return (
    <>
      <BackgroundEffects />
      <nav>
        <Link to="/" className="logo">
          Task<span>IQ</span>
        </Link>
        <div className="nav-links">
          <a href="/#features">Features</a>
          <a href="/#how">How It Works</a>
          <a href="/#pricing">Pricing</a>
          <a href="#">Docs</a>
        </div>
        <div className="nav-cta">
          <Link to="/register" className="btn-ghost login-link-btn">
            Sign Up
          </Link>
        </div>
      </nav>

      <main className="register-main">
        <section className="register-shell">
          <div className="register-copy">
            <p className="section-label">Welcome Back</p>
            <h1>Log in to your TaskIQ Workspace</h1>
            <p>
              Continue managing projects, tracking team progress, and shipping
              faster from one centralized dashboard.
            </p>
          </div>

          <div className="register-card login-card">
            <h2>Sign in to TaskIQ</h2>
            <p>Use your workspace credentials to continue.</p>

            <form className="register-form" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="workEmail">Work email</label>
              <input id="workEmail" name="workEmail" type="email" placeholder="you@company.com" />

              <label htmlFor="password">Password</label>
              <input id="password" name="password" type="password" placeholder="Enter your password" />

              <button className="btn-large primary register-submit" type="submit">
                Log In
              </button>
            </form>

            <p className="login-meta">
              New to TaskIQ? <Link to="/register">Create an account</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

export default LoginPage