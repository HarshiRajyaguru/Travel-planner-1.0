import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/AuthContext'

export default function Admin() {
  const { user, logout } = useAuth()
  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState([])
  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function load() {
      setLoading(true)
      setError('')

      try {
        const [statsData, usersData, tripsData] = await Promise.all([
          api.getAdminStats(),
          api.getAdminUsers(),
          api.getAdminTrips(),
        ])

        if (!active) return
        setStats(statsData)
        setUsers(usersData)
        setTrips(tripsData)
      } catch (err) {
        if (!active) return
        setError(err.message || 'Could not load admin panel')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  if (loading) {
    return <div className="admin-wrap"><p>Loading admin data...</p></div>
  }

  return (
    <div className="admin-wrap">
      <header className="admin-header">
        <div>
          <h1>Admin Panel</h1>
          <p>Welcome, {user?.name}</p>
        </div>
        <div className="admin-actions">
          <Link className="btn btn--ghost" to="/dashboard">User Dashboard</Link>
          <button className="btn btn--cancel" onClick={handleLogout}>Logout</button>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {stats && (
        <section className="admin-stats-grid">
          <article className="admin-stat-card"><h3>Users</h3><p>{stats.users}</p></article>
          <article className="admin-stat-card"><h3>Admins</h3><p>{stats.admins}</p></article>
          <article className="admin-stat-card"><h3>Total Trips</h3><p>{stats.trips}</p></article>
          <article className="admin-stat-card"><h3>Total Budget</h3><p>{Number(stats.totalBudget).toLocaleString()}</p></article>
        </section>
      )}

      <section className="admin-section">
        <h2>Users</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Trips</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.email}</td>
                  <td>{item.role}</td>
                  <td>{item.tripCount}</td>
                  <td>{Number(item.totalBudget).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <h2>Recent Trips</h2>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Country</th>
                <th>Owner</th>
                <th>Dates</th>
                <th>Budget</th>
              </tr>
            </thead>
            <tbody>
              {trips.map((item) => (
                <tr key={item.id}>
                  <td>{item.destination}</td>
                  <td>{item.country}</td>
                  <td>{item.ownerEmail}</td>
                  <td>{item.startDate} to {item.endDate}</td>
                  <td>{item.currency} {Number(item.budget || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

