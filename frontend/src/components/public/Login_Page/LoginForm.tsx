import { useState } from 'react'
import { Link } from 'react-router-dom'

const LoginForm = () => {
  const [formData, setFormData] = useState({
    workEmail: '',
    password: '',
    remember: false,
  })

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    console.log(formData)
  }

  return (
    <div className="register-card">
      <h2>Log in to your account</h2>
      <p>Use your work email and password to continue.</p>
      <form className="register-form login-form" onSubmit={handleSubmit}>
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

        <button className="btn-large primary register-submit" type="submit">
          Log In
        </button>
      </form>
      <p className="login-footnote">
        New to TaskIQ? <Link to="/register">Create a free workspace</Link>
      </p>
    </div>
  )
}

export default LoginForm
