import { useNavigate } from 'react-router-dom'

const Navbar = () => {
  const navigate = useNavigate()

  return (
    <nav>
      <div className="logo">Task<span>IQ</span></div>
      <div className="nav-links">
        <a href="#features">Features</a>
        <a href="#how">How It Works</a>
        <a href="#pricing">Pricing</a>
        <a href="#">Docs</a>
      </div>
      <div className="nav-cta">
        <a href="/login" className="btn-ghost login-link-btn">Log In</a>
        <button
          className="btn-primary"
          type="button"
          onClick={() => navigate('/register')}
        >
          Get Started Free
        </button>
      </div>
    </nav>
  )
}

export default Navbar
