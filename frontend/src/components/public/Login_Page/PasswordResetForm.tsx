import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPasswordWithToken, validatePasswordResetToken } from '../../../services/auth'

const PasswordResetForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [workEmail, setWorkEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isValidatingToken, setIsValidatingToken] = useState(true)
  const [isTokenValid, setIsTokenValid] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setErrorMessage('Reset token missing.')
        setIsTokenValid(false)
        setIsValidatingToken(false)
        return
      }

      try {
        const result = await validatePasswordResetToken(token)
        if (!result.valid) {
          setErrorMessage(result.message || 'Reset link is invalid or expired.')
          setIsTokenValid(false)
          return
        }

        setIsTokenValid(true)
        setWorkEmail(result.workEmail || '')
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Could not validate reset link.'
        setErrorMessage(message)
        setIsTokenValid(false)
      } finally {
        setIsValidatingToken(false)
      }
    }

    void validateToken()
  }, [token])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!token) {
      setErrorMessage('Reset token missing.')
      return
    }

    if (!password || !confirmPassword) {
      setErrorMessage('Please fill all required fields.')
      return
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)
      const result = await resetPasswordWithToken(token, password)
      setSuccessMessage(result.message)

      setTimeout(() => {
        navigate('/login')
      }, 1300)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Could not reset password. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isValidatingToken) {
    return (
      <div className="register-card">
        <h2>Validating reset link...</h2>
        <p>Please wait while we verify your password reset token.</p>
      </div>
    )
  }

  if (!isTokenValid) {
    return (
      <div className="register-card">
        <h2>Reset link is unavailable</h2>
        <p className="form-message form-error" role="alert">{errorMessage || 'Reset link is invalid or expired.'}</p>
        <p className="login-footnote">
          <Link to="/forgot-password">Request a new reset link</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="register-card">
      <h2>Set a new password</h2>
      <p>Resetting password for {workEmail || 'your account'}.</p>

      <form className="register-form login-form" onSubmit={handleSubmit}>
        {errorMessage && (
          <p className="form-message form-error" role="alert">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="form-message form-success" role="status">{successMessage}</p>
        )}

        <label htmlFor="password">New password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Create a new password"
          value={password}
          minLength={8}
          onChange={(event) => {
            setPassword(event.target.value)
            if (errorMessage) {
              setErrorMessage('')
            }
          }}
          required
        />

        <label htmlFor="confirmPassword">Confirm new password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your new password"
          value={confirmPassword}
          minLength={8}
          onChange={(event) => {
            setConfirmPassword(event.target.value)
            if (errorMessage) {
              setErrorMessage('')
            }
          }}
          required
        />

        <button className="btn-large primary register-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Resetting password...' : 'Reset Password'}
        </button>
      </form>

      <p className="login-footnote">
        <Link to="/login">Back to login</Link>
      </p>
    </div>
  )
}

export default PasswordResetForm
