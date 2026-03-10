import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from '../components/public/LandingPage'
import RegisterPage from '../components/public/RegisterPage'
import LoginPage from '../components/public/LoginPage'
import InviteRegisterPage from '../components/public/InviteRegisterPage'
import Home from '../components/private/Home'
import ProjectDetails from '../components/user/CEOs/ProjectDetails'
import Dashboard_CEO from '../components/user/CEOs/Dashboard_CEO'
import Dashboard_Manager from '../components/user/Manager/Dashboard_Manager'
import ProtectRoute from '../protection/ProtectRoute'

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
      <ProtectRoute requiredRoles={['CEO']}>
        <Dashboard_CEO />
      </ProtectRoute>
    ),
  },
  {
    path: '/manager/dashboard',
    element: (
      <ProtectRoute requiredRoles={['Manager']}>
        <Dashboard_Manager />
      </ProtectRoute>
    ),
  },
  {
    path: '/ceo/projects/:projectId',
    element: (
      <ProtectRoute>
        <ProjectDetails />
      </ProtectRoute>
    ),
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
