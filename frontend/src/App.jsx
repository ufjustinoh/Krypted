import { useState } from 'react'
import AuthPage from './components/AuthPage'
import Dashboard from './components/Dashboard'
import './App.css'

function App() {
  // initialize token from localStorage so the user stays logged in on refresh
  const [token, setToken] = useState(() => localStorage.getItem('token'))

  function handleLogin(accessToken) {
    // save to localStorage so it persists across page refreshes
    localStorage.setItem('token', accessToken)
    setToken(accessToken)
  }

  function handleLogout() {
    localStorage.removeItem('token')
    setToken(null)
  }

  // if we have a token, show the dashboard — otherwise show the login/register page
  return token
    ? <Dashboard token={token} onLogout={handleLogout} />
    : <AuthPage onLogin={handleLogin} />
}

export default App
