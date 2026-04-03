import BackgroundEffects from './Landing_Page/BackgroundEffects'
import LoginNavbar from './Login_Page/LoginNavbar'
import PasswordResetForm from './Login_Page/PasswordResetForm'
import '../../styles/landing-page.css'
import '../../styles/register-page.css'

const PasswordResetPage = () => {
  return (
    <>
      <BackgroundEffects />
      <LoginNavbar />

      <main className="register-main">
        <section className="register-shell">
          <div className="register-copy">
            <p className="section-label">Set New Password</p>
            <h1>Create a New Password</h1>
            <p>
              Use a strong password with at least 8 characters. This reset link is valid for a limited time.
            </p>
          </div>

          <PasswordResetForm />
        </section>
      </main>
    </>
  )
}

export default PasswordResetPage
