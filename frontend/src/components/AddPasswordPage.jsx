import { useState } from 'react'

function getStrength(password) {
  if (!password) return null
  let score = 0
  if (password.length >= 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  if (score <= 2) return { label: 'Weak', level: 1, color: '#ef4444' }
  if (score <= 3) return { label: 'Fair', level: 2, color: '#f59e0b' }
  return { label: 'Strong', level: 3, color: '#22c55e' }
}

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
)


function StrengthBar({ password }) {
  const strength = getStrength(password)
  if (!strength) return null
  return (
    <div className="strength-bar-wrap">
      <div className="strength-bars">
        {[1, 2, 3].map(n => (
          <div
            key={n}
            className="strength-segment"
            style={{ background: n <= strength.level ? strength.color : 'var(--border)' }}
          />
        ))}
      </div>
      <span className="strength-label" style={{ color: strength.color }}>{strength.label}</span>
    </div>
  )
}

function generatePassword(opts) {
  const lower = 'abcdefghijklmnopqrstuvwxyz'
  const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const digits = '0123456789'
  const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'

  let pool = lower
  const guaranteed = []

  if (opts.upper) {
    pool += upper
    guaranteed.push(upper[Math.floor(Math.random() * upper.length)])
  }
  if (opts.numbers) {
    pool += digits
    guaranteed.push(digits[Math.floor(Math.random() * digits.length)])
  }
  if (opts.symbols) {
    pool += symbols
    guaranteed.push(symbols[Math.floor(Math.random() * symbols.length)])
  }

  const fill = Array.from(
    { length: Math.max(0, opts.length - guaranteed.length) },
    () => pool[Math.floor(Math.random() * pool.length)]
  )

  const all = [...guaranteed, ...fill]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return all.join('')
}

export default function AddPasswordPage({ onSave, onCancel }) {
  const [form, setForm] = useState({ site: '', username: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  function handleGenerate() {
    const pwd = generatePassword({ length: 16, upper: true, numbers: true, symbols: true })
    setForm(f => ({ ...f, password: pwd, confirm: pwd }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 10) {
      setError('Password must be at least 10 characters')
      return
    }
    if (!/[0-9]/.test(form.password)) {
      setError('Password must include at least one number')
      return
    }
    if (!/[^A-Za-z0-9]/.test(form.password)) {
      setError('Password must include at least one special character')
      return
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await onSave({ site: form.site, username: form.username, password: form.password })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="add-page">
      <header className="add-page-header">
        <button className="btn-ghost" onClick={onCancel}>← Back</button>
        <h1>Add Password</h1>
        <div />
      </header>

      <div className="add-page-body">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Site</label>
            <input
              placeholder="e.g. github.com"
              value={form.site}
              onChange={e => setForm(f => ({ ...f, site: e.target.value }))}
              required
              autoFocus
            />
          </div>

          <div className="field">
            <label>Username or Email</label>
            <input
              placeholder="e.g. john@email.com"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>

          <div className="field">
            <div className="field-label-row">
              <label>Password</label>
              <button type="button" className="btn-generate" onClick={handleGenerate}>
                Generate Strong Password
              </button>
            </div>

            <div className="input-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
              <button type="button" className="btn-icon input-eye" onClick={() => setShowPassword(v => !v)}>
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
            <p className="field-hint"><strong>Important:</strong> Your password must be 10 characters minimum, include at least 1 number, and 1 special character</p>
            <StrengthBar password={form.password} />
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <div className="input-wrap">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter password"
                value={form.confirm}
                onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
                required
              />
              <button type="button" className="btn-icon input-eye" onClick={() => setShowConfirm(v => !v)}>
                {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>

          {error && <p className="error">{error}</p>}

          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
            <button type="submit" disabled={submitting}>
              {submitting ? 'Saving...' : 'Save Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
