import { useState } from 'react'
import { login, register } from '../api'

// onLogin is passed in from App.jsx — we call it when login succeeds
export default function AuthPage({ onLogin }) {

  // tracks whether we're showing the login or register form
  const [mode, setMode] = useState('login')

  // controlled inputs — React tracks what's typed in each field
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // error message to show below the form if something goes wrong
  const [error, setError] = useState('')

  // true while waiting for the API response — disables the button
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    // prevent the browser from refreshing the page on form submit
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // if registering, create the account first
      if (mode === 'register') {
        await register(email, password)
      }
      // then log in either way — backend returns { access_token }
      const { access_token } = await login(email, password)
      // pass the token up to App.jsx so it can store it
      onLogin(access_token)
    } catch (err) {
      setError(err.status === 401 ? 'Invalid username or password' : err.message)
    } finally {
      setLoading(false)
    }
  }

  function toggleMode() {
    // switch between login and register, and clear any old errors
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Password Manager</h1>
        <h2>{mode === 'login' ? 'Sign in' : 'Create account'}</h2>

        <form onSubmit={handleSubmit}>
          {/* onChange keeps the state in sync with what the user types */}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            autoFocus
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />

          {/* only renders if there's an error */}
          {error && <p className="error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Register'}
          </button>
        </form>

        {/* toggle link at the bottom to switch between login and register */}
        <p className="auth-toggle">
          {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button type="button" onClick={toggleMode}>
            {mode === 'login' ? 'Register' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  )
}
