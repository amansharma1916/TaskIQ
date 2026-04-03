import BackgroundEffects from './Landing_Page/BackgroundEffects'
import RegisterForm from './Register_Page/RegisterForm'
import RegisterNavbar from './Register_Page/RegisterNavbar'
import '../../styles/landing-page.css'
import '../../styles/register-page.css'

const RegisterPage = () => {
  return (
    <>
      <BackgroundEffects />
      <RegisterNavbar />
      <main className="register-main">
        <section className="register-shell">
          <div className="register-copy">
            <p className="section-label">Get Started</p>
            <h1>Build Your TaskIQ Workspace</h1>
            <p>
              Start organizing teams, projects, and workflows in one command
              center. Free for teams up to 10 members.
            </p>
          </div>
          <RegisterForm />
        </section>
      </main>
    </>
  )
}

export default RegisterPage
