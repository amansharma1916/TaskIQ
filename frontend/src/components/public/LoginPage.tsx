import BackgroundEffects from './Landing_Page/BackgroundEffects'
import LoginForm from './Login_Page/LoginForm'
import LoginNavbar from './Login_Page/LoginNavbar'
import '../../styles/landing-page.css'
import '../../styles/register-page.css'

const LoginPage = () => {
  return (
    <>
      <BackgroundEffects />
      <LoginNavbar />

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

          <LoginForm />
        </section>
      </main>
    </>
  )
}

export default LoginPage