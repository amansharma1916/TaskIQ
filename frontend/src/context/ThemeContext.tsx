import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type ThemeMode = 'light' | 'dark'

type ThemeContextValue = {
	theme: ThemeMode
	toggleTheme: () => void
	setTheme: (theme: ThemeMode) => void
}

const THEME_STORAGE_KEY = 'taskiq:theme'

const ThemeContext = createContext<ThemeContextValue | null>(null)

const getInitialTheme = (): ThemeMode => {
	if (typeof window === 'undefined') {
		return 'light'
	}

	const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY)
	if (storedTheme === 'dark' || storedTheme === 'light') {
		return storedTheme
	}

	return 'light'
}

type ThemeProviderProps = {
	children: ReactNode
}

export const ThemeProvider = ({ children }: ThemeProviderProps) => {
	const [theme, setThemeState] = useState<ThemeMode>(getInitialTheme)

	useEffect(() => {
		if (typeof window === 'undefined') {
			return
		}

		window.localStorage.setItem(THEME_STORAGE_KEY, theme)
		document.documentElement.dataset.theme = theme
		document.documentElement.style.colorScheme = theme
	}, [theme])

	const value = useMemo<ThemeContextValue>(
		() => ({
			theme,
			toggleTheme: () => setThemeState((currentTheme) => (currentTheme === 'light' ? 'dark' : 'light')),
			setTheme: (nextTheme: ThemeMode) => setThemeState(nextTheme),
		}),
		[theme],
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export const useTheme = () => {
	const context = useContext(ThemeContext)

	if (!context) {
		throw new Error('useTheme must be used within a ThemeProvider')
	}

	return context
}