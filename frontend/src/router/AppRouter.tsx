import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from '../components/public/LandingPage'
import RegisterPage from '../components/public/RegisterPage'
import LoginPage from '../components/public/LoginPage'
import Dashboard_CEO from '../components/user/CEOs/Dashboard_CEO'

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
    path: '/ceo/dashboard',
    element: <Dashboard_CEO />,
  },
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
