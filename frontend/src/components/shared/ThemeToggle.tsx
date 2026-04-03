import { useTheme } from '../../context/ThemeContext'

type ThemeToggleProps = {
	className?: string
}

const ThemeToggle = ({ className = '' }: ThemeToggleProps) => {
	const { theme, toggleTheme } = useTheme()
	const nextThemeLabel = theme === 'light' ? 'Dark' : 'Light'

	return (
		<button
			className={`theme-toggle-button${className ? ` ${className}` : ''}`}
			type="button"
			onClick={toggleTheme}
			aria-label={`Switch to ${nextThemeLabel.toLowerCase()} theme`}
		>
			<span className="theme-toggle-label">Theme</span>
			<span className="theme-toggle-value">{nextThemeLabel}</span>
		</button>
	)
}

export default ThemeToggle