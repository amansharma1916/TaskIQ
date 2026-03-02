import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from '../components/public/LandingPage'
import RegisterPage from '../components/public/RegisterPage'
import LoginPage from '../components/public/LoginPage'

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
])

const AppRouter = () => {
  return <RouterProvider router={router} />
}

export default AppRouter
