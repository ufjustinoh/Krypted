import { useState } from 'react'
import { login, register } from '../api'

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

export default function AuthPage({ onLogin }) {
  const [step, setStep] = useState('email')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState(() => localStorage.getItem('rememberedEmail') || '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [rememberEmail, setRememberEmail] = useState(() => !!localStorage.getItem('rememberedEmail'))

  function handleContinue(e) {
    e.preventDefault()
    setError('')
    if (rememberEmail) {
      localStorage.setItem('rememberedEmail', email)
    } else {
      localStorage.removeItem('rememberedEmail')
    }
    setStep('password')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'register') {
        await register(email, password)
      }
      const { access_token } = await login(email, password)
      onLogin(access_token)
    } catch (err) {
      setError(err.status === 401 ? 'Invalid email or password' : err.message)
    } finally {
      setLoading(false)
    }
  }

  function goBack() {
    setStep('email')
    setPassword('')
    setError('')
  }

  function toggleMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    setError('')
  }

  if (step === 'email') {
    return (
      <div className="auth-page">
        <div className="auth-navbar">
          <span className="auth-brand">Krypted</span>
        </div>
        <div className="auth-content">
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
              <button type="button" onClick={() => { setMode('register'); setStep('password') }}>
                Register
              </button>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <div className="auth-navbar">
        <span className="auth-brand">Krypted</span>
      </div>
      <div className="auth-content">
        <h2 className="auth-heading">
          {mode === 'login'
            ? `Welcome back, ${email.split('@')[0]}`
            : 'Create your password'}
        </h2>
        <div className="auth-card">
          <button className="auth-back" onClick={goBack}>← {email}</button>
          <form onSubmit={handleSubmit}>
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
              {loading ? 'Loading...' : mode === 'login' ? 'Sign in' : 'Register'}
            </button>
          </form>
          <p className="auth-toggle">
            {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}{' '}
            <button type="button" onClick={toggleMode}>
              {mode === 'login' ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
