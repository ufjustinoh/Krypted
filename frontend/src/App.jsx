import { useState, useEffect } from 'react'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import { getMe } from './api'
import './App.css'

function App() {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (token) {
      getMe(token).then(setUser).catch((err) => {
        if (err.status === 401) {
          localStorage.removeItem('token')
          setToken(null)
        }
      })
    }
  }, [token])

  function handleLogin(accessToken) {
    localStorage.setItem('token', accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }

  return token
    ? <Dashboard token={token} user={user} onUserUpdate={setUser} onLogout={handleLogout} />
    : <AuthPage onLogin={handleLogin} />
}

export default App
