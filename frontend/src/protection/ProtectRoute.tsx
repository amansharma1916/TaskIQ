import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAuthUser, hasValidAccessToken } from '../services/auth'

interface ProtectRouteProps {
	children: ReactNode
	redirectTo?: string
}

const hasValidUserSession = (): boolean => {
	const user = getAuthUser()
	return hasValidAccessToken() && Boolean(user && (user.workEmail || user.name))
}

const ProtectRoute = ({ children, redirectTo = '/login' }: ProtectRouteProps) => {
	const location = useLocation()

	if (!hasValidUserSession()) {
		return <Navigate replace state={{ from: location }} to={redirectTo} />
	}

	return <>{children}</>
}

export default ProtectRoute
