const AUTH_KEY = 'travel_planner_auth'

export function getAuthData() {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed?.token || !parsed?.user) return null
    return parsed
  } catch {
    return null
  }
}

export function setAuthData(data) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(data))
}

export function clearAuthData() {
  localStorage.removeItem(AUTH_KEY)
}

export { AUTH_KEY }
