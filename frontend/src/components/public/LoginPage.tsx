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
          <Link className="btn-ghost" to="/register">
            Create Account
          </Link>
        </div>
      </nav>

      <main className="register-main">
        <section className="register-shell">
          <div className="register-copy">
            <p className="section-label">Welcome Back</p>
            <h1>Sign In to Your TaskIQ Workspace</h1>
            <p>
              Pick up where your team left off with a secure, focused workspace
              for projects, priorities, and execution.
            </p>
          </div>

          <div className="register-card">
            <h2>Log in to your account</h2>
            <p>Use your work email and password to continue.</p>
            <form className="register-form login-form" onSubmit={(event) => event.preventDefault()}>
              <label htmlFor="workEmail">Work email</label>
              <input
                id="workEmail"
                name="workEmail"
                type="email"
                placeholder="you@company.com"
              />

              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
              />

              <div className="login-row">
                <label className="login-checkbox" htmlFor="remember">
                  <input id="remember" name="remember" type="checkbox" />
                  Remember me
                </label>
                <a className="login-link" href="#">
                  Forgot password?
                </a>
              </div>

              <button className="btn-large primary register-submit" type="submit">
                Log In
              </button>
            </form>
            <p className="login-footnote">
              New to TaskIQ? <Link to="/register">Create a free workspace</Link>
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

export default LoginPage