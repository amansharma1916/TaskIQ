import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'

interface ProtectRouteProps {
	children: ReactNode
	redirectTo?: string
}

const hasValidUserSession = (): boolean => {
	const storedUser = localStorage.getItem('user')
	if (!storedUser) {
		return false
	}

	try {
		const parsedUser = JSON.parse(storedUser) as { workEmail?: string; name?: string } | null
		return Boolean(parsedUser && (parsedUser.workEmail || parsedUser.name))
	} catch {
		localStorage.removeItem('user')
		return false
	}
}

const ProtectRoute = ({ children, redirectTo = '/login' }: ProtectRouteProps) => {
	const location = useLocation()

	if (!hasValidUserSession()) {
		return <Navigate replace state={{ from: location }} to={redirectTo} />
	}

	return <>{children}</>
}

export default ProtectRoute
