import { useState, useEffect } from 'react'
import { getPasswords, createPassword, updatePassword, deletePassword, getDeletedPasswords, restorePassword, permanentDeletePassword, clearAllDeleted } from '../api'
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

  // section filter: null = all, 'websites', 'wifi', 'deleted'
  const [section, setSection] = useState(null)
  const [deletedPasswords, setDeletedPasswords] = useState([])
  const [loadingDeleted, setLoadingDeleted] = useState(false)
  const [deletedError, setDeletedError] = useState('')
  const [confirmClearAll, setConfirmClearAll] = useState(false)

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
      if (err.status === 401) onLogout()
      else throw err
    }
  }

  async function loadDeletedPasswords() {
    setLoadingDeleted(true)
    setDeletedError('')
    try {
      const data = await getDeletedPasswords(token)
      setDeletedPasswords(data)
    } catch (err) {
      if (err.status === 401) onLogout()
      else setDeletedError(err.message)
    } finally {
      setLoadingDeleted(false)
    }
  }

  function handleSectionClick(s) {
    setError('')
    setSection(prev => {
      const next = prev === s ? null : s
      if (next === 'deleted') {
        loadDeletedPasswords()
      } else if (passwords.length === 0) {
        loadPasswords()
      }
      return next
    })
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

  async function handleRestore(id) {
    try {
      await restorePassword(token, id)
      const restored = deletedPasswords.find(p => p.id === id)
      setDeletedPasswords(prev => prev.filter(p => p.id !== id))
      if (restored) setPasswords(prev => [...prev, { ...restored, deleted_at: null }])
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handlePermanentDelete(id) {
    try {
      await permanentDeletePassword(token, id)
      setDeletedPasswords(prev => prev.filter(p => p.id !== id))
    } catch (err) {
      handleApiError(err)
    }
  }

  async function handleClearAll() {
    try {
      await clearAllDeleted(token)
      setDeletedPasswords([])
      setConfirmClearAll(false)
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

  const filtered = passwords.filter(p => {
    if (!p.site.toLowerCase().includes(search.toLowerCase())) return false
    if (section === 'websites') return p.category === 'website'
    if (section === 'wifi') return p.category === 'wifi'
    return true
  })

  if (showForm) {
    return <AddPasswordPage onSave={handleAdd} onCancel={() => setShowForm(false)} defaultCategory={section === 'wifi' ? 'wifi' : 'website'} />
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
            disabled={section === 'deleted'}
          />
          {section !== 'deleted' && (
            <button onClick={() => setShowForm(true)}>+ Add Password</button>
          )}
        </div>

        <div className="section-filters">
          <button
            className={`section-btn ${section === null ? 'active' : ''}`}
            onClick={() => { setSection(null); setError(''); if (passwords.length === 0) loadPasswords() }}
          >
            All
          </button>
          <button
            className={`section-btn ${section === 'websites' ? 'active' : ''}`}
            onClick={() => handleSectionClick('websites')}
          >
            🌐 Websites
          </button>
          <button
            className={`section-btn ${section === 'wifi' ? 'active' : ''}`}
            onClick={() => handleSectionClick('wifi')}
          >
            📶 Wi-Fi
          </button>
          <button
            className={`section-btn section-btn-danger ${section === 'deleted' ? 'active' : ''}`}
            onClick={() => handleSectionClick('deleted')}
          >
            🗑 Recently Deleted
          </button>
        </div>

        {loading && <p className="muted">Loading...</p>}
        {error && section !== 'deleted' && (
          <div className="error-row">
            <p className="error">{error}</p>
            <button className="btn-ghost small" onClick={() => { setError(''); loadPasswords() }}>Retry</button>
          </div>
        )}

        {/* Recently Deleted view */}
        {section === 'deleted' && (
          <>
            {loadingDeleted && <p className="muted">Loading...</p>}
            {deletedError && (
              <div className="error-row">
                <p className="error">{deletedError}</p>
                <button className="btn-ghost small" onClick={loadDeletedPasswords}>Retry</button>
              </div>
            )}
            {!loadingDeleted && !deletedError && deletedPasswords.length === 0 && (
              <p className="muted empty">No deleted passwords.</p>
            )}
            {!loadingDeleted && deletedPasswords.length > 0 && (
              <>
                <div className="deleted-toolbar">
                  <p className="muted deleted-hint">Deleted passwords are kept here until you remove them permanently.</p>
                  <button className="btn-danger" onClick={() => setConfirmClearAll(true)}>Clear All</button>
                </div>
                <table className="password-table">
                  <thead>
                    <tr>
                      <th>Site</th>
                      <th>Username</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedPasswords.map(p => (
                      <tr key={p.id}>
                        <td>
                          <span className="site-cell">
                            <img src={faviconUrl(p.site)} width="16" height="16" alt="" onError={e => { e.target.style.display = 'none' }} />
                            {capitalize(p.site)}
                          </span>
                        </td>
                        <td>{p.username}</td>
                        <td className="row-actions">
                          <button className="btn-ghost small" onClick={() => handleRestore(p.id)}>Restore</button>
                          <button className="btn-danger" onClick={() => handlePermanentDelete(p.id)}>Delete Permanently</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {/* Normal vault view */}
        {section !== 'deleted' && (
          <>
            {!loading && passwords.length === 0 && (
              <p className="muted empty">No passwords saved yet. Add one above.</p>
            )}

            {!loading && passwords.length > 0 && filtered.length === 0 && (
              <p className="muted empty">No entries match "{search}".</p>
            )}

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
          </>
        )}
      </div>

      {confirmDeleteId !== null && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Move to trash?</h2>
            <p>The entry for <strong>{passwords.find(p => p.id === confirmDeleteId)?.site}</strong> will be moved to Recently Deleted. You can restore it from there.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmDeleteId(null)}>Cancel</button>
              <button className="btn-danger" onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null) }}>Move to Trash</button>
            </div>
          </div>
        </div>
      )}

      {confirmClearAll && (
        <div className="modal-overlay" onClick={() => setConfirmClearAll(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Clear all deleted?</h2>
            <p>This will permanently delete all {deletedPasswords.length} items in your trash. This can't be undone.</p>
            <div className="modal-actions">
              <button className="btn-ghost" onClick={() => setConfirmClearAll(false)}>Cancel</button>
              <button className="btn-danger" onClick={handleClearAll}>Delete All Permanently</button>
            </div>
          </div>
        </div>
      )}
      </>)}
      </div>
    </div>
  )
}
