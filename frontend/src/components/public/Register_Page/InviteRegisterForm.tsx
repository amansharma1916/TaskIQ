import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDashboardRouteForRole, saveAuthSession } from '../../../services/auth'

interface InviteMeta {
  email: string
  name: string
  role: 'Manager' | 'Employee'
  companyName: string | null
}

const InviteRegisterForm = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')

  const [inviteMeta, setInviteMeta] = useState<InviteMeta | null>(null)
  const [formData, setFormData] = useState({
    fullName: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoadingInvite, setIsLoadingInvite] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setErrorMessage('Invite token missing.')
        setIsLoadingInvite(false)
        return
      }

      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/invite/validate/${token}`)
        const result = await response.json().catch(() => null)

        if (!response.ok) {
          throw new Error(result?.message || 'Invalid invite link.')
        }

        const data = result as InviteMeta
        setInviteMeta(data)
        setFormData((prev) => ({ ...prev, fullName: data.name }))
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Failed to validate invite.'
        setErrorMessage(message)
      } finally {
        setIsLoadingInvite(false)
      }
    }

    void validateInvite()
  }, [token])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    if (errorMessage) {
      setErrorMessage('')
    }
    if (successMessage) {
      setSuccessMessage('')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')

    if (!token) {
      setErrorMessage('Invite token missing.')
      return
    }

    if (!formData.fullName || !formData.password || !formData.confirmPassword) {
      setErrorMessage('Please fill all required fields.')
      return
    }

    if (formData.password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('Passwords do not match.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/users/register-with-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          name: formData.fullName,
          password: formData.password,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || `Failed to register: ${response.status}`)
      }

      const session = saveAuthSession(result ?? {})
      setSuccessMessage('Account created. Redirecting...')
      setTimeout(() => {
        navigate(getDashboardRouteForRole(session.user.role))
      }, 1200)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Invite registration failed. Please try again.'
      setErrorMessage(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoadingInvite) {
    return (
      <div className="register-card">
        <h2>Validating invite...</h2>
        <p>Please wait while we verify your invitation link.</p>
      </div>
    )
  }

  return (
    <div className="register-card">
      <h2>Complete your invitation</h2>
      <p>
        Join {inviteMeta?.companyName ?? 'your company'} as {inviteMeta?.role ?? 'Employee'}.
      </p>
      <form className="register-form" onSubmit={handleSubmit}>
        {errorMessage && (
          <p className="form-message form-error" role="alert">{errorMessage}</p>
        )}
        {successMessage && (
          <p className="form-message form-success" role="status">{successMessage}</p>
        )}

        <label htmlFor="inviteEmail">Work email</label>
        <input
          id="inviteEmail"
          name="inviteEmail"
          type="email"
          value={inviteMeta?.email ?? ''}
          readOnly
        />

        <label htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          name="fullName"
          type="text"
          placeholder="Your full name"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Create a password"
          value={formData.password}
          onChange={handleChange}
          minLength={8}
          required
        />

        <label htmlFor="confirmPassword">Confirm password</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          minLength={8}
          required
        />

        <button className="btn-large primary register-submit" type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating account...' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}

export default InviteRegisterForm
