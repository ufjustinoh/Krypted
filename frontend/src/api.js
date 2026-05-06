// Base URL of your FastAPI backend
const BASE = 'http://localhost:8000'

// Reusable helper — all API functions use this instead of writing fetch() every time 
async function request(path, options = {}) {   
    const res = await fetch(`${BASE}${path}`, options)
    const data = await res.json()
    // If the response status is 4xx/5xx, throw an error with the backend's message
    if (!res.ok) throw new Error(data.detail || 'Request failed')
        return data
}

// Calls POST /auth/register with email + password
export function register(email, password) { 
    return request('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }), 
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

// Calls DELETE /passwords/{id} — removes a specific password entry by its id
export function deletePassword(token, id) {
    return request(`/passwords/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
    })
}