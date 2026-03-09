import { useEffect, useMemo, useState } from 'react'
import { changeMyPassword, getMySettingsProfile, updateMySettingsProfile } from '../../../../../services/settings'

type SettingsPanelProps = {
	isActive: boolean
	sections?: string[]
}

type SettingsTab = 'Profile' | 'Security'

const defaultProfileForm = {
	name: '',
	workEmail: '',
}

const SettingsPanel = ({ isActive, sections }: SettingsPanelProps) => {
	const availableTabs = useMemo<SettingsTab[]>(() => {
		const normalized = (sections ?? []).filter((section) => section === 'Profile' || section === 'Security') as SettingsTab[]
		return normalized.length > 0 ? normalized : ['Profile', 'Security']
	}, [sections])

	const [activeTab, setActiveTab] = useState<SettingsTab>('Profile')
	const [isLoadingProfile, setIsLoadingProfile] = useState(false)
	const [hasFetchedProfile, setHasFetchedProfile] = useState(false)
	const [profileForm, setProfileForm] = useState(defaultProfileForm)
	const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
	const [isSavingProfile, setIsSavingProfile] = useState(false)
	const [passwordForm, setPasswordForm] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	})
	const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
	const [isSavingPassword, setIsSavingPassword] = useState(false)

	useEffect(() => {
		if (!availableTabs.includes(activeTab)) {
			setActiveTab(availableTabs[0] ?? 'Profile')
		}
	}, [activeTab, availableTabs])

	useEffect(() => {
		if (!isActive || hasFetchedProfile) {
			return
		}

		let isMounted = true
		setIsLoadingProfile(true)
		setProfileMessage(null)

		void getMySettingsProfile()
			.then((user) => {
				if (!isMounted) {
					return
				}
				setProfileForm({
					name: user.name ?? '',
					workEmail: user.workEmail ?? '',
				})
				setHasFetchedProfile(true)
			})
			.catch((error) => {
				if (!isMounted) {
					return
				}
				setProfileMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to load profile' })
			})
			.finally(() => {
				if (isMounted) {
					setIsLoadingProfile(false)
				}
			})

		return () => {
			isMounted = false
		}
	}, [hasFetchedProfile, isActive])

	const handleSaveProfile = async () => {
		setProfileMessage(null)

		const name = profileForm.name.trim()
		const workEmail = profileForm.workEmail.trim()
		if (!name || !workEmail) {
			setProfileMessage({ type: 'error', text: 'Name and work email are required.' })
			return
		}

		setIsSavingProfile(true)
		try {
			const updatedProfile = await updateMySettingsProfile({ name, workEmail })
			setProfileForm({
				name: updatedProfile.name,
				workEmail: updatedProfile.workEmail,
			})
			setProfileMessage({ type: 'success', text: 'Profile updated successfully.' })
		} catch (error) {
			setProfileMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update profile' })
		} finally {
			setIsSavingProfile(false)
		}
	}

	const handleChangePassword = async () => {
		setPasswordMessage(null)

		if (!passwordForm.currentPassword || !passwordForm.newPassword) {
			setPasswordMessage({ type: 'error', text: 'Current and new password are required.' })
			return
		}

		if (passwordForm.newPassword.length < 8) {
			setPasswordMessage({ type: 'error', text: 'New password must be at least 8 characters long.' })
			return
		}

		if (passwordForm.newPassword !== passwordForm.confirmPassword) {
			setPasswordMessage({ type: 'error', text: 'New password and confirmation do not match.' })
			return
		}

		setIsSavingPassword(true)
		try {
			await changeMyPassword({
				currentPassword: passwordForm.currentPassword,
				newPassword: passwordForm.newPassword,
			})
			setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
			setPasswordMessage({ type: 'success', text: 'Password updated successfully.' })
		} catch (error) {
			setPasswordMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to update password' })
		} finally {
			setIsSavingPassword(false)
		}
	}

	return (
		<div className={`ceo-panel ${isActive ? 'active' : ''}`}>
			<div className="ceo-section-head">
				<h2>Settings</h2>
			</div>
			<div className="ceo-settings-layout">
				<aside className="ceo-settings-nav">
					{availableTabs.map((section) => (
						<button
							className={activeTab === section ? 'active' : ''}
							key={section}
							onClick={() => setActiveTab(section)}
							type="button"
						>
							{section}
						</button>
					))}
				</aside>

				<article className="ceo-settings-content">
					{activeTab === 'Profile' && (
						<section>
							<h3>Profile Information</h3>
							{isLoadingProfile ? (
								<p className="ceo-settings-message">Loading profile...</p>
							) : (
								<>
									{profileMessage && (
										<p className={`ceo-settings-message ${profileMessage.type === 'error' ? 'error' : 'success'}`}>
											{profileMessage.text}
										</p>
									)}
									<label>
										Name
										<input
											onChange={(event) => setProfileForm((prev) => ({ ...prev, name: event.target.value }))}
											type="text"
											value={profileForm.name}
										/>
									</label>
									<label>
										Work Email
										<input
											onChange={(event) => setProfileForm((prev) => ({ ...prev, workEmail: event.target.value }))}
											type="email"
											value={profileForm.workEmail}
										/>
									</label>
									<button className="ceo-btn-primary" disabled={isSavingProfile} onClick={() => void handleSaveProfile()} type="button">
										{isSavingProfile ? 'Saving...' : 'Save Changes'}
									</button>
								</>
							)}
						</section>
					)}

					{activeTab === 'Security' && (
						<section>
							<h3>Security</h3>
							{passwordMessage && (
								<p className={`ceo-settings-message ${passwordMessage.type === 'error' ? 'error' : 'success'}`}>
									{passwordMessage.text}
								</p>
							)}
							<label>
								Current Password
								<input
									onChange={(event) => setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))}
									type="password"
									value={passwordForm.currentPassword}
								/>
							</label>
							<label>
								New Password
								<input
									onChange={(event) => setPasswordForm((prev) => ({ ...prev, newPassword: event.target.value }))}
									type="password"
									value={passwordForm.newPassword}
								/>
							</label>
							<label>
								Confirm New Password
								<input
									onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
									type="password"
									value={passwordForm.confirmPassword}
								/>
							</label>
							<button className="ceo-btn-primary" disabled={isSavingPassword} onClick={() => void handleChangePassword()} type="button">
								{isSavingPassword ? 'Updating...' : 'Update Password'}
							</button>
						</section>
					)}
				</article>
			</div>
		</div>
	)
}

export default SettingsPanel
