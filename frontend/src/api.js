// Base URL of your FastAPI backend
const BASE = 'https://passwordmanager-owfm.onrender.com'

// Reusable helper — all API functions use this instead of writing fetch() every time
async function request(path, options = {}) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
        const res = await fetch(`${BASE}${path}`, { ...options, signal: controller.signal })
        const data = await res.json()
        if (res.status === 401) throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 })
        if (!res.ok) throw new Error(data.detail || 'Request failed')
        return data
    } catch (err) {
        if (err.name === 'AbortError') throw new Error('Request timed out — the server may be waking up, please try again')
        throw err
    } finally {
        clearTimeout(timer)
    }
}

// Calls POST /auth/register with email + password
export function forgotPassword(email) {
    return request('/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })
}

export function resetPassword(token, newPassword, confirm) {
    return request('/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: newPassword, confirm }),
    })
}

export function lookupUser(email) {
    return request('/auth/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
    })
}

export function register(firstName, lastName, email, password, confirm) {
    return request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName, email, password, confirm }),
    })
}

// Calls POST /auth/login — backend returns { access_token, token_type }
export function login(email, password) {
    return request('/auth/login', {  
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
}

// Calls GET /passwords — requires the JWT token to prove who you are
export function getPasswords(token) {
    return request('/passwords', {
        headers: { Authorization: `Bearer ${token}` },
    })
}

// Calls POST /passwords — entry is { site, username, password }
export function createPassword(token, entry) {
    return request('/passwords', { 
        method: 'POST',
        headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
    })
} 

// Calls PUT /passwords/{id} — updates site, username, and password for an entry
export function updatePassword(token, id, entry) {
    return request(`/passwords/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(entry),
    })
}

// Calls DELETE /passwords/{id} — removes a specific password entry by its id
export function deletePassword(token, id) {
    return request(`/passwords/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    })
}

export function getMe(token) {
    return request('/me', {
        headers: { Authorization: `Bearer ${token}` },
    })
}

export function updateMe(token, firstName, lastName) {
    return request('/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    })
}

export function changePassword(token, currentPassword, newPassword, confirm) {
    return request('/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, confirm }),
    })
}