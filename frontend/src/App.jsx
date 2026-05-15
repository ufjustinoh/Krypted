import { useState, useEffect } from 'react'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import UnlockScreen from './components/UnlockScreen'
import { getMe, logout } from './api'
import { loadKeyFromSession, saveKeyToSession, clearKeyFromSession } from './vaultCrypto'
import './App.css'

function App() {
  const [authed, setAuthed] = useState(null)
  const [user, setUser] = useState(null)
  const [vaultKey, setVaultKey] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const u = await getMe()
        setUser(u)
        setAuthed(true)
        const key = await loadKeyFromSession()
        if (key) setVaultKey(key)
      } catch {
        setAuthed(false)
      }
    }
    init()
  }, [])

  async function handleLogin(userData, key) {
    setUser(userData)
    setVaultKey(key)
    await saveKeyToSession(key)
    setAuthed(true)
  }

  async function handleUnlock(key) {
    setVaultKey(key)
    await saveKeyToSession(key)
  }

  function handleKeyError() {
    clearKeyFromSession()
    setVaultKey(null)
  }

  function handleLogout() {
    clearKeyFromSession()
    logout().catch(() => {}).finally(() => {
      setAuthed(false)
      setUser(null)
      setVaultKey(null)
    })
  }

  async function handleVaultKeyUpdate(newKey) {
    setVaultKey(newKey)
    await saveKeyToSession(newKey)
  }

  if (authed === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100svh', color: 'var(--text)' }}>
        Loading...
      </div>
    )
  }

  if (!authed) return <AuthPage onLogin={handleLogin} />

  if (!vaultKey) return <UnlockScreen user={user} onUnlock={handleUnlock} onLogout={handleLogout} />

  return (
    <Dashboard
      user={user}
      vaultKey={vaultKey}
      onVaultKeyUpdate={handleVaultKeyUpdate}
      onKeyError={handleKeyError}
      onUserUpdate={setUser}
      onLogout={handleLogout}
    />
  )
}

export default App
