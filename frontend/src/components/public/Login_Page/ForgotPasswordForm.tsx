import { useState } from 'react'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../../services/auth'

const ForgotPasswordForm = () => {
  const [workEmail, setWorkEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!workEmail.trim()) {
      setErrorMessage('Please enter your work email.')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await requestPasswordReset(workEmail.trim())
      setSuccessMessage(result.message)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to request password reset. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-card">
      <h2>Forgot your password?</h2>
      <p>Enter your work email and we will send reset instructions.</p>
      <form className="register-form login-form" onSubmit={handleSubmit}>
        {errorMessage && (
          <p className="form-message form-error" role="alert">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="form-message form-success" role="status">{successMessage}</p>
        )}

        <label htmlFor="workEmail">Work email</label>
        <input
          id="workEmail"
          name="workEmail"
          type="email"
          placeholder="you@company.com"
          value={workEmail}
          onChange={(event) => {
            setWorkEmail(event.target.value)
            if (errorMessage) {
              setErrorMessage('')
            }
            if (successMessage) {
              setSuccessMessage('')
            }
          }}
          required
        />

        <button
          className="btn-large primary register-submit"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Sending reset link...' : 'Send Reset Link'}
        </button>
      </form>
      <p className="login-footnote">
        Remembered your password? <Link to="/login">Back to login</Link>
      </p>
    </div>
  )
}

export default ForgotPasswordForm
