export const getInitials = (name: string) => {
	const parts = name
		.trim()
		.split(/\s+/)
		.filter(Boolean)

	return parts
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}
