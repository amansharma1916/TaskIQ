import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from '../components/public/LandingPage'
import RegisterPage from '../components/public/RegisterPage'
import LoginPage from '../components/public/LoginPage'
import Home from '../components/private/Home'
import ProtectRoute from '../protection/ProtectRoute'
import RoleRender from '../protection/RoleRender'

const user = localStorage.getItem('user')
const role = user ? JSON.parse(user).role : null

const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/home',
    element: (
      <ProtectRoute>
        <Home />
      </ProtectRoute>
    ),
  },
  {
    path: '/ceo/dashboard',
    element: (
      <ProtectRoute>
        <RoleRender role={role} />
      </ProtectRoute>
    ),
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
