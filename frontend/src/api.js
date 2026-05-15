const BASE = 'https://passwordmanager-owfm.onrender.com'

async function request(path, options = {}, attempt = 0) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 100000)
    try {
        const res = await fetch(`${BASE}${path}`, {
            ...options,
            signal: controller.signal,
            credentials: 'include',
        })
        clearTimeout(timer)
        const data = await res.json()
        if (res.status === 401) throw Object.assign(new Error('UNAUTHORIZED'), { status: 401 })
        if (res.status === 429) throw new Error('Too many attempts. Please wait a minute and try again.')
        if (!res.ok) throw new Error(data.detail || data.error || 'Request failed')
        return data
    } catch (err) {
        clearTimeout(timer)
        const isNetwork = err.name === 'AbortError' || err.message === 'Failed to fetch'
        if (isNetwork && attempt < 2) {
            await new Promise(r => setTimeout(r, 8000))
            return request(path, options, attempt + 1)
        }
        if (isNetwork) {
            throw new Error('Unable to reach the server. Please try refreshing the page.')
        }
        throw err
    }
}

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

export function login(email, password) {
    return request('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    })
}

export function logout() {
    return request('/auth/logout', { method: 'POST' })
}

export function getPasswords() {
    return request('/passwords')
}

export function createPassword(entry) {
    return request('/passwords', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
    })
}

export function updatePassword(id, entry) {
    return request(`/passwords/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
    })
}

export function deletePassword(id) {
    return request(`/passwords/${id}`, { method: 'DELETE' })
}

export function getDeletedPasswords() {
    return request('/passwords/deleted')
}

export function restorePassword(id) {
    return request(`/passwords/${id}/restore`, { method: 'POST' })
}

export function permanentDeletePassword(id) {
    return request(`/passwords/${id}/permanent`, { method: 'DELETE' })
}

export function clearAllDeleted() {
    return request('/passwords/trash', { method: 'DELETE' })
}

export function getMe() {
    return request('/me')
}

export function updateMe(firstName, lastName) {
    return request('/me', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName, last_name: lastName }),
    })
}

export function changePassword(currentPassword, newPassword, confirm) {
    return request('/me/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword, confirm }),
    })
}
