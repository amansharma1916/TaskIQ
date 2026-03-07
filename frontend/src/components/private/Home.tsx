import { getAuthUser } from '../../services/auth'

const Home = () => {
  const user = getAuthUser() ?? {}

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
