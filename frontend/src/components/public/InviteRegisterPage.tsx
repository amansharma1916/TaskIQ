import BackgroundEffects from './Landing_Page/BackgroundEffects'
import RegisterNavbar from './Register_Page/RegisterNavbar'
import InviteRegisterForm from './Register_Page/InviteRegisterForm'
import '../../styles/landing-page.css'
import '../../styles/register-page.css'

const InviteRegisterPage = () => {
  return (
    <>
      <BackgroundEffects />
      <RegisterNavbar />
      <main className="register-main">
        <section className="register-shell">
          <div className="register-copy">
            <p className="section-label">Invitation</p>
            <h1>Join Your Company Workspace</h1>
            <p>
              Complete your invite registration to access teams, projects, and shared tasks in TaskIQ.
            </p>
          </div>
          <InviteRegisterForm />
        </section>
      </main>
    </>
  )
}

export default InviteRegisterPage
