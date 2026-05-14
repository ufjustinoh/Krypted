import { useState } from 'react'
import { login, register, lookupUser } from '../api'

function KeyIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="m21 2-9.6 9.6"/>
      <path d="m15.5 7.5 3 3L22 7l-3-3"/>
    </svg>
  )
}

function SSOIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
    </svg>
  )
}

function Navbar() {
  return (
    <div className="auth-navbar">
      <span className="auth-brand">Krypted</span>
    </div>
  )
}

function BackgroundKey() {
  return (
    <svg className="bg-key" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="7.5" cy="15.5" r="5.5"/>
      <path d="m21 2-9.6 9.6"/>
      <path d="m15.5 7.5 3 3L22 7l-3-3"/>
    </svg>
  )
}

export default function AuthPage({ onLogin }) {
  const [step, setStep] = useState('email')
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem('rememberedEmail'))
  const [lookedUpName, setLookedUpName] = useState('')

  // register-only fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirm, setConfirm] = useState('')

  async function handleContinue(e) {
    e.preventDefault()
    setError('')
    if (rememberEmail) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    try {
      const { first_name } = await lookupUser(email)
      setLookedUpName(first_name || '')
    } catch {
      setLookedUpName('')
    }
    setStep('password')
  }

  function goToRegister() {
    setError('')
    setStep('register')
  }

  function goBack() {
    setStep('email')
    setPassword('')
    setConfirm('')
    setError('')
  }

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { access_token } = await login(email, password)
      onLogin(access_token)
    } catch (err) {
      setError(err.status === 401 ? 'Invalid email or password' : err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await register(firstName, lastName, email, password, confirm)
      const { access_token } = await login(email, password)
      onLogin(access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (step === 'email') {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-content">
          <BackgroundKey />
          <h2 className="auth-heading">Log in to your Vault</h2>
          <div className="auth-card">
            <form onSubmit={handleContinue}>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
              <label className="remember-label">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={e => setRememberEmail(e.target.checked)}
                />
                Remember email
              </label>
              {error && <p className="error">{error}</p>}
              <button type="submit">Continue</button>
            </form>

            <div className="auth-divider"><span>or</span></div>

            <div className="auth-alt-buttons">
              <button className="btn-alt" type="button">
                <KeyIcon /> Log in with passkey
              </button>
              <button className="btn-alt" type="button">
                <SSOIcon /> Use single sign-on
              </button>
            </div>

            <p className="auth-toggle">
              Don't have an account?{' '}
              <button type="button" onClick={goToRegister}>Register</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'register') {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-content">
          <BackgroundKey />
          <h2 className="auth-heading">Create your account</h2>
          <div className="auth-card">
            <button className="auth-back" onClick={goBack}>← Back to Log in</button>
            <form onSubmit={handleRegister}>
              <div className="name-row">
                <input
                  type="text"
                  placeholder="First name"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  required
                  autoFocus
                />
                <input
                  type="text"
                  placeholder="Last name"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  required
                />
              </div>
              <input
                type="email"
                placeholder="Email address"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                required
              />
              {error && <p className="error">{error}</p>}
              <button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
            <p className="auth-toggle">
              Already have an account?{' '}
              <button type="button" onClick={goBack}>Sign in</button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-content">
        <h2 className="auth-heading">Welcome back, {lookedUpName || email.split('@')[0]}</h2>
        <div className="auth-card">
          <button className="auth-back" onClick={goBack}>← Back to Log in</button>
          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            {error && <p className="error">{error}</p>}
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          <p className="auth-toggle">
            Don't have an account?{' '}
            <button type="button" onClick={goToRegister}>Register</button>
          </p>
        </div>
      </div>
    </div>
  )
}
