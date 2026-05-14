import { useState, useEffect } from 'react'
import { getPasswords, createPassword, updatePassword, deletePassword } from '../api'
import AddPasswordPage from './AddPasswordPage'
import EditPasswordPage from './EditPasswordPage'
import ProfilePage from './ProfilePage'

function faviconUrl(site) {
  let domain = site.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0]
  if (!domain.includes('.')) domain += '.com'
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

function capitalize(str) {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : str
}

export default function Dashboard({ token, user, onUserUpdate, onLogout }) {
  const [view, setView] = useState('vault')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // the list of saved passwords fetched from the backend
  const [passwords, setPasswords] = useState([])

  // true while the initial fetch is happening
  const [loading, setLoading] = useState(true)

  // top-level error message (e.g. fetch failed)
  const [error, setError] = useState('')

  // controls whether the add password page is visible
  const [showForm, setShowForm] = useState(false)

  // the entry currently being edited, null if none
  const [editingEntry, setEditingEntry] = useState(null)

  // tracks which password rows have their password visible (by id)
  const [visibleIds, setVisibleIds] = useState(new Set())

  // id of the row pending delete confirmation, null if none
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  // id of the row that just had its password copied (shows "Copied!" briefly)
  const [copiedId, setCopiedId] = useState(null)

  // search query for filtering the password list
  const [search, setSearch] = useState('')

  function handleApiError(err) {
    if (err.status === 401) {
      onLogout()
    } else {
      setError(err.message)
    }
  }

  // fetch passwords once when the component first loads
  useEffect(() => {
    loadPasswords()
  }, [])

  async function loadPasswords() {
    try {
      const data = await getPasswords(token)
      setPasswords(data)
    } catch (err) {
      handleApiError(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd(formData) {
    try {
      const entry = await createPassword(token, formData)
      setPasswords(prev => [...prev, entry])
      setShowForm(false)
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handleDelete(id) {
    try {
      await deletePassword(token, id)
      setPasswords(prev => prev.filter(p => p.id !== id))
      setVisibleIds(prev => { const s = new Set(prev); s.delete(id); return s })
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handleSave(id, formData) {
    try {
      const updated = await updatePassword(token, id, formData)
      setPasswords(prev => prev.map(p => p.id === id ? updated : p))
      setEditingEntry(null)
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handleCopy(id, password) {
    await navigator.clipboard.writeText(password)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  function toggleVisible(id) {
    // add the id if it's hidden, remove it if it's already visible
    setVisibleIds(prev => {
      const s = new Set(prev)
      s.has(id) ? s.delete(id) : s.add(id)
      return s
    })
  }

  const filtered = passwords.filter(p =>
    p.site.toLowerCase().includes(search.toLowerCase())
  )

  if (showForm) {
    return <AddPasswordPage onSave={handleAdd} onCancel={() => setShowForm(false)} />
  }

  if (editingEntry) {
    return (
      <EditPasswordPage
        entry={editingEntry}
        onSave={formData => handleSave(editingEntry.id, formData)}
        onCancel={() => setEditingEntry(null)}
      />
    )
  }

  return (
    <div className="dashboard">
      <aside className={`sidebar ${sidebarOpen ? '' : 'sidebar-collapsed'}`}>
        <div className="sidebar-brand">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          {sidebarOpen && <span className="sidebar-brand-text">Krypted</span>}
          <button className="sidebar-toggle" onClick={() => setSidebarOpen(o => !o)} title={sidebarOpen ? 'Collapse' : 'Expand'}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {sidebarOpen
                ? <><polyline points="15 18 9 12 15 6"/></>
                : <><polyline points="9 18 15 12 9 6"/></>}
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          <button className={`sidebar-item ${view === 'vault' ? 'active' : ''}`} onClick={() => setView('vault')} title="Vault">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
            {sidebarOpen && <span>Vault</span>}
          </button>
          <button className={`sidebar-item ${view === 'profile' ? 'active' : ''}`} onClick={() => setView('profile')} title="Profile">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
            {sidebarOpen && <span>Profile</span>}
          </button>
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-item" onClick={onLogout} title="Logout">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div className="dashboard-main">
      {view === 'profile' && (
        <ProfilePage token={token} user={user} onUserUpdate={onUserUpdate} />
      )}
      {view === 'vault' && (<>
      <header className="dashboard-header">
        <h1><strong>Vault</strong></h1>
      </header>

      <div className="dashboard-body">
        <div className="toolbar">
<input
            className="search-input"
            placeholder="Search by site..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button onClick={() => setShowForm(true)}>+ Add Password</button>
        </div>

        {loading && <p className="muted">Loading...</p>}
        {error && <p className="error">{error}</p>}

        {/* empty state */}
        {!loading && passwords.length === 0 && (
          <p className="muted empty">No passwords saved yet. Add one above.</p>
        )}

        {!loading && passwords.length > 0 && filtered.length === 0 && (
          <p className="muted empty">No entries match "{search}".</p>
        )}

        {/* password table — only renders when there's at least one match */}
        {filtered.length > 0 && (
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
              {filtered.map(p => (
                <tr key={p.id}>
                  <td>
                    <span className="site-cell">
                      <img
                        src={faviconUrl(p.site)}
                        width="16"
                        height="16"
                        alt=""
                        onError={e => { e.target.style.display = 'none' }}
                      />
                      {capitalize(p.site)}
                    </span>
                  </td>
                  <td>{p.username}</td>
                  <td>
                    <span className="password-cell">
                      <button className="btn-icon" title="Copy password" onClick={() => handleCopy(p.id, p.password)}>
                        {copiedId === p.id ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="2" width="6" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>
                        )}
                      </button>
                      {visibleIds.has(p.id) ? p.password : '••••••••'}
                      <button className="btn-ghost small" onClick={() => toggleVisible(p.id)}>
                        {visibleIds.has(p.id) ? 'Hide' : 'Show'}
                      </button>
                    </span>
                  </td>
                  <td className="row-actions">
                    <button className="btn-ghost small" onClick={() => setEditingEntry(p)}>Edit</button>
                    <button className="btn-danger" onClick={() => setConfirmDeleteId(p.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {confirmDeleteId !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Delete password?</h2>
            <p>This will permanently delete the entry for <strong>{passwords.find(p => p.id === confirmDeleteId)?.site}</strong>. This can't be undone.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null) }}>Delete</button>
            </div>
          </div>
        </div>
      )}
      </>)}
      </div>
    </div>
  )
}
