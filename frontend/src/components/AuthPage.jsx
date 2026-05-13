import { useState } from 'react'
import { login, register } from '../api'

export default function AuthPage({ onLogin }) {
  const [step, setStep] = useState('email')
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleContinue(e) {
    e.preventDefault()
    setError('')
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
      <div className="auth-container">
        <h2 className="auth-heading">Log in to Krypted</h2>
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
            {error && <p className="error">{error}</p>}
            <button type="submit">Continue</button>
          </form>
          <p className="auth-toggle">
            Don't have an account?{' '}
            <button type="button" onClick={() => { setMode('register'); setStep('password') }}>
              Register
            </button>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <h2 className="auth-heading">{mode === 'login' ? 'Enter your password' : 'Create your password'}</h2>
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
  )
}
