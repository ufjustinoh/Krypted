import { useState } from 'react'
import { deriveKey } from '../vaultCrypto'

export default function UnlockScreen({ user, onUnlock, onLogout }) {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const key = await deriveKey(password, user.email)
      onUnlock(key)
    } catch {
      setError('Failed to unlock vault. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-navbar">
        <span className="auth-brand">Krypted</span>
      </div>
      <div className="auth-content">
        <div className="lock-wrapper">
          <div className="lock-shackle">
            <span className="lock-heading">Unlock your vault</span>
          </div>
          <div className="auth-card">
            <p className="muted" style={{ marginTop: 0, marginBottom: 16, fontSize: 14 }}>
              Your session was restored. Enter your master password to continue.
            </p>
            <form onSubmit={handleSubmit}>
              <input
                type="password"
                placeholder="Master password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoFocus
              />
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={loading}>
                {loading ? 'Unlocking...' : 'Unlock vault'}
              </button>
            </form>
            <p className="auth-toggle">
              <button type="button" onClick={onLogout}>Sign out instead</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
