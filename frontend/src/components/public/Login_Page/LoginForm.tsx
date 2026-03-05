import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

const LoginForm = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    workEmail: '',
    password: '',
    remember: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    if (!formData.workEmail || !formData.password) {
      setErrorMessage('Please fill all required fields.')
      return
    }

    try {
      setIsSubmitting(true)

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workEmail: formData.workEmail,
          password: formData.password,
        }),
      })

      const result = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(result?.message || `Login failed: ${response.status}`)
      }

      setSuccessMessage('Login successful! Redirecting...')
      console.log('Login successful:', result)
      
      localStorage.setItem('user', JSON.stringify(result.user))
      
      setTimeout(() => {
        navigate('/ceo/dashboard')
      }, 1500)
      
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Login failed. Please try again.'
      setErrorMessage(message)
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="register-card">
      <h2>Log in to your account</h2>
      <p>Use your work email and password to continue.</p>
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
          value={formData.workEmail}
          onChange={handleChange}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
        />

        <div className="login-row">
          <label className="login-checkbox" htmlFor="remember">
            <input
              id="remember"
              name="remember"
              type="checkbox"
              checked={formData.remember}
              onChange={handleChange}
            />
            Remember me
          </label>
          <a className="login-link" href="#">
            Forgot password?
          </a>
        </div>

        <button 
          className="btn-large primary register-submit" 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Logging in...' : 'Log In'}
        </button>
      </form>
      <p className="login-footnote">
        New to TaskIQ? <Link to="/register">Create a free workspace</Link>
      </p>
    </div>
  )
}

export default LoginForm
