import { useState } from 'react'
import { login, register, lookupUser, forgotPassword, resetPassword } from '../api'

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

function ForgotForm({ email, setEmail, onToken }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { token } = await forgotPassword(email)
      if (token) {
        onToken(token)
      } else {
        setSent(true)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return <p className="muted" style={{ textAlign: 'center', padding: '12px 0' }}>No account found with that email.</p>
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email address"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoFocus
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Sending...' : 'Send reset code'}
      </button>
    </form>
  )
}

function ResetForm({ token, onDone }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword !== confirm) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, newPassword, confirm)
      onDone()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="password"
        placeholder="New password (max 16 characters)"
        value={newPassword}
        onChange={e => setNewPassword(e.target.value)}
        maxLength={16}
        required
        autoFocus
      />
      <input
        type="password"
        placeholder="Confirm new password"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        maxLength={16}
        required
      />
      {error && <p className="error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Resetting...' : 'Reset password'}
      </button>
    </form>
  )
}

function LockCard({ heading, children }) {
  return (
    <div className="lock-wrapper">
      <div className="lock-shackle">
        <span className="lock-heading">{heading}</span>
      </div>
      <div className="auth-card">{children}</div>
    </div>
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

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [confirm, setConfirm] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [resetEmail, setResetEmail] = useState('')

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
          <LockCard heading="Log in to your Vault">
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
          </LockCard>
        </div>
      </div>
    )
  }

  if (step === 'register') {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-content">
          <LockCard heading="Create your account">
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
                placeholder="Password (max 16 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                maxLength={16}
                required
              />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                maxLength={16}
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
          </LockCard>
        </div>
      </div>
    )
  }

  if (step === 'forgot') {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-content">
          <LockCard heading="Reset your password">
            <button className="auth-back" onClick={goBack}>← Back to Log in</button>
            <ForgotForm
              email={resetEmail}
              setEmail={setResetEmail}
              onToken={token => { setResetToken(token); setStep('reset') }}
            />
          </LockCard>
        </div>
      </div>
    )
  }

  if (step === 'reset') {
    return (
      <div className="auth-page">
        <Navbar />
        <div className="auth-content">
          <LockCard heading="Set new password">
            <ResetForm
              token={resetToken}
              onDone={() => { setStep('email'); setPassword('') }}
            />
          </LockCard>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-page">
      <Navbar />
      <div className="auth-content">
        <LockCard heading={`Welcome back, ${lookedUpName || email.split('@')[0]}`}>
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
            <button type="button" onClick={() => { setResetEmail(email); setStep('forgot') }}>
              Forgot your password?
            </button>
          </p>
        </LockCard>
      </div>
    </div>
  )
}
