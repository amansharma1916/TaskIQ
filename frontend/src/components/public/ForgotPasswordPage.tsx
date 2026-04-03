import BackgroundEffects from './Landing_Page/BackgroundEffects'
import LoginNavbar from './Login_Page/LoginNavbar'
import ForgotPasswordForm from './Login_Page/ForgotPasswordForm'
import '../../styles/landing-page.css'
import '../../styles/register-page.css'

const ForgotPasswordPage = () => {
  return (
    <>
      <BackgroundEffects />
      <LoginNavbar />

      <main className="register-main">
        <section className="register-shell">
          <div className="register-copy">
            <p className="section-label">Account Recovery</p>
            <h1>Reset Your TaskIQ Password</h1>
            <p>
              Enter your work email and we will send you a secure link to reset your password.
            </p>
          </div>

          <ForgotPasswordForm />
        </section>
      </main>
    </>
  )
}

export default ForgotPasswordPage
