import { useState } from 'react'

export default function AddPasswordPage({ onSave, onCancel }) {
  const [form, setForm] = useState({ site: '', username: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
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
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <div className="field">
            <label>Confirm Password</label>
            <input
              type="password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
              required
            />
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
