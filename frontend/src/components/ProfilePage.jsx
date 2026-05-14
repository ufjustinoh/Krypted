import { useState, useEffect } from 'react'
import { updateMe, changePassword } from '../api'

export default function ProfilePage({ token, user, onUserUpdate }) {
  const [firstName, setFirstName] = useState(user?.first_name || '')
  const [lastName, setLastName] = useState(user?.last_name || '')

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '')
      setLastName(user.last_name || '')
    }
  }, [user])
  const [profileMsg, setProfileMsg] = useState('')
  const [profileError, setProfileError] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  async function handleProfileSave(e) {
    e.preventDefault()
    setProfileMsg('')
    setProfileError('')
    setProfileLoading(true)
    try {
      const updated = await updateMe(token, firstName, lastName)
      onUserUpdate(updated)
      setProfileMsg('Profile updated.')
    } catch (err) {
      setProfileError(err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPasswordMsg('')
    setPasswordError('')
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }
    setPasswordLoading(true)
    try {
      await changePassword(token, currentPassword, newPassword, confirmPassword)
      setPasswordMsg('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setPasswordError(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="profile-page">
      <header className="dashboard-header">
        <h1><strong>Profile</strong></h1>
      </header>

      <div className="profile-body">
      <section className="profile-section">
        <h2>Personal information</h2>
        <form onSubmit={handleProfileSave}>
          <div className="profile-field">
            <label>Email</label>
            <input type="email" value={user?.email || ''} disabled />
          </div>
          <div className="name-row">
            <div className="profile-field">
              <label>First name</label>
              <input
                type="text"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="profile-field">
              <label>Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
              />
            </div>
          </div>
          {profileError && <p className="error">{profileError}</p>}
          {profileMsg && <p className="success-msg">{profileMsg}</p>}
          <button type="submit" disabled={profileLoading}>
            {profileLoading ? 'Saving...' : 'Save changes'}
          </button>
        </form>
      </section>

      <section className="profile-section">
        <h2>Change master password</h2>
        <form onSubmit={handlePasswordChange}>
          <div className="profile-field">
            <label>Current password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div className="profile-field">
            <label>New password (max 16 characters)</label>
            <input
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              maxLength={16}
              required
            />
          </div>
          <div className="profile-field">
            <label>Confirm new password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              maxLength={16}
              required
            />
          </div>
          {passwordError && <p className="error">{passwordError}</p>}
          {passwordMsg && <p className="success-msg">{passwordMsg}</p>}
          <button type="submit" disabled={passwordLoading}>
            {passwordLoading ? 'Updating...' : 'Update password'}
          </button>
        </form>
      </section>
      </div>
    </div>
  )
}
