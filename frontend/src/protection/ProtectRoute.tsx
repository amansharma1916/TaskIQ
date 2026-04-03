import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { getAuthUser, hasValidAccessToken } from '../services/auth'
import type { RoleId } from '../config/roles'

interface ProtectRouteProps {
	children: ReactNode
	redirectTo?: string
	requiredRoles?: RoleId[]
}

const hasValidUserSession = (): boolean => {
	const user = getAuthUser()
	return hasValidAccessToken() && Boolean(user && (user.workEmail || user.name))
}

const ProtectRoute = ({ children, redirectTo = '/login', requiredRoles }: ProtectRouteProps) => {
	const location = useLocation()
	const user = getAuthUser()

	if (!hasValidUserSession()) {
		return <Navigate replace state={{ from: location }} to={redirectTo} />
	}

	if (requiredRoles && requiredRoles.length > 0 && (!user?.role || !requiredRoles.includes(user.role))) {
		return <Navigate replace to="/home" />
	}

	return <>{children}</>
}

export default ProtectRoute
