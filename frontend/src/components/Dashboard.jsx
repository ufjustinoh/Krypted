import { useState, useEffect } from 'react'
import { getPasswords, createPassword, updatePassword, deletePassword } from '../api'

// token is the JWT from login, onLogout is called when the user clicks logout
export default function Dashboard({ token, onLogout }) {

  // the list of saved passwords fetched from the backend
  const [passwords, setPasswords] = useState([])

  // true while the initial fetch is happening
  const [loading, setLoading] = useState(true)

  // top-level error message (e.g. fetch failed)
  const [error, setError] = useState('')

  // controls whether the add password form is visible
  const [showForm, setShowForm] = useState(false)

  // the three fields in the add password form
  const [form, setForm] = useState({ site: '', username: '', password: '' })

  // error message shown inside the add form
  const [formError, setFormError] = useState('')

  // true while the add form is being submitted
  const [submitting, setSubmitting] = useState(false)

  // tracks which password rows have their password visible (by id)
  const [visibleIds, setVisibleIds] = useState(new Set())

  // id of the row currently being edited, null if none
  const [editingId, setEditingId] = useState(null)

  // live values of the edit form fields
  const [editForm, setEditForm] = useState({ site: '', username: '', password: '' })

  // true while the edit save request is in flight
  const [saving, setSaving] = useState(false)

  // fetch passwords once when the component first loads
  useEffect(() => {
    loadPasswords()
  }, [])

  async function loadPasswords() {
    try {
      const data = await getPasswords(token)
      setPasswords(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      // send the new entry to the backend, get back the saved entry with its id
      const entry = await createPassword(token, form)
      // add it to the list without refetching everything
      setPasswords(prev => [...prev, entry])
      // reset form and hide it
      setForm({ site: '', username: '', password: '' })
      setShowForm(false)
    } catch (err) {
      setFormError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deletePassword(token, id)
      // remove it from the list locally so the UI updates instantly
      setPasswords(prev => prev.filter(p => p.id !== id))
      // also remove it from the visible set if it was shown
      setVisibleIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } catch (err) {
      setError(err.message)
    }
  }

  function handleEdit(p) {
    setEditingId(p.id)
    setEditForm({ site: p.site, username: p.username, password: p.password })
  }

  function handleCancelEdit() {
    setEditingId(null)
  }

  async function handleSave(id) {
    setSaving(true)
    try {
      const updated = await updatePassword(token, id, editForm)
      setPasswords(prev => prev.map(p => p.id === id ? updated : p))
      setEditingId(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleVisible(id) {
    // add the id if it's hidden, remove it if it's already visible
    setVisibleIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Password Vault</h1>
        <button className="btn-ghost" onClick={onLogout}>Logout</button>
      </header>

      <div className="dashboard-body">
        <div className="toolbar">
          <span>{passwords.length} saved password{passwords.length !== 1 ? 's' : ''}</span>
          <button onClick={() => setShowForm(f => !f)}>
            {showForm ? 'Cancel' : '+ Add Password'}
          </button>
        </div>

        {/* add password form — only shown when showForm is true */}
        {showForm && (
          <form className="add-form" onSubmit={handleAdd}>
            <input
              placeholder="Site (e.g. github.com)"
              value={form.site}
              onChange={e => setForm(f => ({ ...f, site: e.target.value }))}
              required
              autoFocus
            />
            <input
              placeholder="Username / Email"
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
            {formError && <p className="error">{formError}</p>}
            <div className="form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        )}

        {loading && <p className="muted">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {/* empty state */}
        {!loading && passwords.length === 0 && (
          <p className="muted empty">No passwords saved yet. Add one above.</p>
        )}

        {/* password table — only renders when there's at least one entry */}
        {passwords.length > 0 && (
          <table className="password-table">
            <thead>
              <tr>
                <th>Site</th>
                <th>Username</th>
                <th>Password</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {passwords.map(p => (
                <tr key={p.id}>
                  {editingId === p.id ? (
                    <>
                      <td><input value={editForm.site} onChange={e => setEditForm(f => ({ ...f, site: e.target.value }))} /></td>
                      <td><input value={editForm.username} onChange={e => setEditForm(f => ({ ...f, username: e.target.value }))} /></td>
                      <td><input value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} /></td>
                      <td className="row-actions">
                        <button onClick={() => handleSave(p.id)} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
                        <button className="btn-ghost" onClick={handleCancelEdit}>Cancel</button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td>{p.site}</td>
                      <td>{p.username}</td>
                      <td>
                        <span className="password-cell">
                          {visibleIds.has(p.id) ? p.password : '••••••••'}
                          <button className="btn-ghost small" onClick={() => toggleVisible(p.id)}>
                            {visibleIds.has(p.id) ? 'Hide' : 'Show'}
                          </button>
                        </span>
                      </td>
                      <td className="row-actions">
                        <button className="btn-ghost small" onClick={() => handleEdit(p)}>Edit</button>
                        <button className="btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
