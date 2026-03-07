import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from '../components/public/LandingPage'
import RegisterPage from '../components/public/RegisterPage'
import LoginPage from '../components/public/LoginPage'
import InviteRegisterPage from '../components/public/InviteRegisterPage'
import Home from '../components/private/Home'
import ProtectRoute from '../protection/ProtectRoute'
import RoleRender from '../protection/RoleRender'

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
    path: '/register/invite',
    element: <InviteRegisterPage />,
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
        <RoleRender />
      </ProtectRoute>
    ),
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
