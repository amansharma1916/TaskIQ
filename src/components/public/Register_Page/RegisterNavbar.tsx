import { Link } from 'react-router-dom'

const RegisterNavbar = () => {

  return (
    <nav>
      <Link to="/" className="logo">Task<span>IQ</span></Link>
      <div className="nav-links">
        <a href="/#features">Features</a>
        <a href="/#how">How It Works</a>
        <a href="/#pricing">Pricing</a>
        <a href="#">Docs</a>
      </div>
      <div className="nav-cta">
        <Link to="/login" className="btn-ghost login-link-btn">Log In</Link>
        
      </div>
    </nav>
  )
}

export default RegisterNavbar
