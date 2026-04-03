import { getAuthUser } from '../../services/auth'
import { Navigate } from 'react-router-dom'
import { getRoleDefaultRoute } from '../../config/roles'

const Home = () => {
  const user = getAuthUser() ?? {}
  const roleRoute = getRoleDefaultRoute(user.role)

  if (roleRoute !== '/home') {
    return <Navigate to={roleRoute} replace />
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Welcome to TaskIQ</h1>
      {user.name && (
        <div>
          <h2>Hello, {user.name}!</h2>
          <p>Email: {user.workEmail}</p>
          <p>Company: {user.companyName}</p>
          {user.teamSize && <p>Team Size: {user.teamSize}</p>}
        </div>
      )}
      <p>You are now logged in to your dashboard.</p>
    </div>
  )
}

export default Home
