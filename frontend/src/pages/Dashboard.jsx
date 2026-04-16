import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'
import { useAuth } from '../context/useAuth'

const TRIP_TYPES = ['Adventure', 'Beach', 'City', 'Culture', 'Nature', 'Road Trip', 'Other']
const CURRENCIES = ['USD', 'EUR', 'GBP', 'INR', 'AUD', 'CAD', 'JPY', 'CHF']

function getStatus(startDate, endDate) {
  const now = new Date()
  if (now < new Date(startDate)) return 'upcoming'
  if (now > new Date(endDate)) return 'completed'
  return 'ongoing'
}

function getDuration(s, e) {
  return Math.ceil((new Date(e) - new Date(s)) / 86400000)
}

function fmt(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function LogoMark() {
  return (
    <span className="logo__icon" aria-hidden="true">
      <svg viewBox="0 0 36 36" className="logo__svg">
        <defs>
          <linearGradient id="tpLogoGradDash" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <circle cx="10" cy="11" r="4" fill="url(#tpLogoGradDash)" />
        <path d="M8 25c5-7 11-10 18-10" fill="none" stroke="url(#tpLogoGradDash)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M19 8l10 5-10 5 2.7-5z" fill="#ffffff" />
      </svg>
    </span>
  )
}

function TripCard({ trip, onDelete, onEdit, onToggleFav }) {
  const status = getStatus(trip.startDate, trip.endDate)
  const duration = getDuration(trip.startDate, trip.endDate)

  return (
    <div className={`trip-card trip-card--${status}`}>
      <button
        className={`fav-btn ${trip.favorite ? 'fav-btn--on' : ''}`}
        onClick={() => onToggleFav(trip)}
        title={trip.favorite ? 'Remove from favourites' : 'Add to favourites'}
      >
        *
      </button>

      <div className="trip-card__header">
        <span className="type-badge">{trip.type}</span>
        <span className={`status-badge status-badge--${status}`}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </span>
      </div>

      <div className="trip-card__destination">
        <h2>{trip.destination}</h2>
        <p>{trip.country}</p>
      </div>

      <div className="trip-card__dates">
        <div className="date-block">
          <span className="date-label">FROM</span>
          <span className="date-value">{fmt(trip.startDate)}</span>
        </div>
        <span className="date-arrow">to</span>
        <div className="date-block">
          <span className="date-label">TO</span>
          <span className="date-value">{fmt(trip.endDate)}</span>
        </div>
      </div>

      <div className="trip-card__meta">
        <span className="meta-pill">{duration} day{duration !== 1 ? 's' : ''}</span>
        {trip.budget > 0 && (
          <span className="meta-pill">{trip.currency} {Number(trip.budget).toLocaleString()}</span>
        )}
      </div>

      {trip.notes && <p className="trip-card__notes">"{trip.notes}"</p>}

      <div className="trip-card__actions">
        <button className="edit-btn" onClick={() => onEdit(trip)}>Edit</button>
        <button className="delete-btn" onClick={() => onDelete(trip.id)}>Delete</button>
      </div>
    </div>
  )
}

const EMPTY_FORM = {
  destination: '', country: '', type: 'City',
  startDate: '', endDate: '', budget: '', currency: 'USD', notes: '', favorite: false,
}

function TripModal({ initial, onSave, onClose }) {
  const isEdit = Boolean(initial)
  const [form, setForm] = useState(initial ?? EMPTY_FORM)
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.destination.trim()) e.destination = 'Required'
    if (!form.country.trim()) e.country = 'Required'
    if (!form.startDate) e.startDate = 'Required'
    if (!form.endDate) e.endDate = 'Required'
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      e.endDate = 'Must be after start date'
    }
    return e
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onSave(form)
  }

  const updateField = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal__header">
          <h2>{isEdit ? 'Edit Trip' : 'Add New Trip'}</h2>
          <button className="close-btn" onClick={onClose}>x</button>
        </div>

        <form onSubmit={handleSubmit} className="trip-form">
          <div className="form-row">
            <div className="form-group">
              <label>Destination City *</label>
              <input name="destination" value={form.destination} onChange={updateField} placeholder="e.g. Paris" />
              {errors.destination && <span className="form-error">{errors.destination}</span>}
            </div>
            <div className="form-group">
              <label>Country *</label>
              <input name="country" value={form.country} onChange={updateField} placeholder="e.g. France" />
              {errors.country && <span className="form-error">{errors.country}</span>}
            </div>
          </div>

          <div className="form-group">
            <label>Trip Type</label>
            <select name="type" value={form.type} onChange={updateField}>
              {TRIP_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" value={form.startDate} onChange={updateField} />
              {errors.startDate && <span className="form-error">{errors.startDate}</span>}
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" name="endDate" value={form.endDate} onChange={updateField} />
              {errors.endDate && <span className="form-error">{errors.endDate}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Budget (optional)</label>
              <input type="number" name="budget" value={form.budget} onChange={updateField} placeholder="0" min="0" />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select name="currency" value={form.currency} onChange={updateField}>
                {CURRENCIES.map((currency) => <option key={currency}>{currency}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Notes (optional)</label>
            <textarea name="notes" value={form.notes} onChange={updateField} placeholder="Trip notes" rows={3} />
          </div>

          <label className="checkbox-label">
            <input type="checkbox" name="favorite" checked={!!form.favorite} onChange={updateField} />
            Mark as favourite
          </label>

          <div className="form-actions">
            <button type="button" className="btn btn--cancel" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn--primary">
              {isEdit ? 'Save Changes' : 'Add Trip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, isAdmin, logout } = useAuth()

  const [trips, setTrips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('All')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterFav, setFilterFav] = useState(false)
  const [sortBy, setSortBy] = useState('newest')

  const loadTrips = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await api.getTrips()
      setTrips(data.map((t) => ({ ...t, favorite: Boolean(t.favorite) })))
    } catch (err) {
      if (err.status === 401) {
        logout()
        navigate('/login', { replace: true })
        return
      }
      setError(err.message || 'Could not fetch trips')
    } finally {
      setLoading(false)
    }
  }, [logout, navigate])

  useEffect(() => {
    loadTrips()
  }, [loadTrips])

  const handleSave = async (form) => {
    try {
      if (modal && modal.id) {
        const updated = await api.updateTrip(modal.id, form)
        setTrips((prev) => prev.map((trip) => trip.id === updated.id ? { ...updated, favorite: Boolean(updated.favorite) } : trip))
      } else {
        const created = await api.addTrip(form)
        setTrips((prev) => [{ ...created, favorite: Boolean(created.favorite) }, ...prev])
      }
      setModal(null)
    } catch (err) {
      setError(err.message || 'Failed to save trip')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this trip?')) return

    try {
      await api.deleteTrip(id)
      setTrips((prev) => prev.filter((trip) => trip.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete trip')
    }
  }

  const handleToggleFav = async (trip) => {
    try {
      const updated = await api.updateTrip(trip.id, { ...trip, favorite: !trip.favorite })
      setTrips((prev) => prev.map((item) => item.id === updated.id ? { ...updated, favorite: Boolean(updated.favorite) } : item))
    } catch (err) {
      setError(err.message || 'Failed to update favourite')
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login', { replace: true })
    }
  }

  const filtered = trips
    .filter((trip) => {
      const query = search.toLowerCase()
      return (
        (trip.destination.toLowerCase().includes(query) || trip.country.toLowerCase().includes(query)) &&
        (filterType === 'All' || trip.type === filterType) &&
        (filterStatus === 'All' || getStatus(trip.startDate, trip.endDate) === filterStatus.toLowerCase()) &&
        (!filterFav || trip.favorite)
      )
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.createdAt) - new Date(a.createdAt)
      if (sortBy === 'oldest') return new Date(a.createdAt) - new Date(b.createdAt)
      if (sortBy === 'az') return a.destination.localeCompare(b.destination)
      if (sortBy === 'za') return b.destination.localeCompare(a.destination)
      if (sortBy === 'budgetHi') return Number(b.budget) - Number(a.budget)
      if (sortBy === 'budgetLo') return Number(a.budget) - Number(b.budget)
      if (sortBy === 'startDate') return new Date(a.startDate) - new Date(b.startDate)
      return 0
    })

  const stats = {
    total: trips.length,
    upcoming: trips.filter((trip) => getStatus(trip.startDate, trip.endDate) === 'upcoming').length,
    ongoing: trips.filter((trip) => getStatus(trip.startDate, trip.endDate) === 'ongoing').length,
    completed: trips.filter((trip) => getStatus(trip.startDate, trip.endDate) === 'completed').length,
    favs: trips.filter((trip) => trip.favorite).length,
    budget: trips.reduce((sum, trip) => sum + Number(trip.budget || 0), 0),
  }
  const featuredTrip = trips.find((trip) => getStatus(trip.startDate, trip.endDate) === 'upcoming') || trips[0] || null
  const daysToFeatured = featuredTrip ? Math.max(0, Math.ceil((new Date(featuredTrip.startDate) - new Date()) / 86400000)) : 0

  return (
    <div className="app">
      <header className="header">
        <div className="header__inner">
          <div className="logo">
            <LogoMark />
            <div className="logo__copy">
              <h1>Travel Planner</h1>
              <p>{user?.email}</p>
            </div>
          </div>

          <div className="header__actions">
            <button className="btn btn--ghost" onClick={() => navigate('/')}>Home</button>
            {isAdmin && <button className="btn btn--ghost" onClick={() => navigate('/admin')}>Admin</button>}
            <button className="btn btn--cancel" onClick={handleLogout}>Logout</button>
            <button className="btn btn--primary btn--add" onClick={() => setModal('add')}>Add Trip</button>
          </div>
        </div>
      </header>

      <main className="main">
        {error && (
          <div className="error-banner">
            {error}
            <button onClick={() => setError('')}>x</button>
          </div>
        )}

        {!loading && (
          <section className="journey-spotlight">
            <div className="journey-spotlight__content">
              <p className="journey-spotlight__eyebrow">Journey Pulse</p>
              {featuredTrip ? (
                <>
                  <h2>{featuredTrip.destination}, {featuredTrip.country}</h2>
                  <p>
                    {daysToFeatured > 0
                      ? `${daysToFeatured} day${daysToFeatured > 1 ? 's' : ''} to go`
                      : 'Trip is active now'} · {fmt(featuredTrip.startDate)} to {fmt(featuredTrip.endDate)}
                  </p>
                </>
              ) : (
                <>
                  <h2>Start your first journey</h2>
                  <p>Add a trip to see a live travel spotlight here.</p>
                </>
              )}
            </div>
            <div className="journey-spotlight__tags">
              <span>Curated Plan</span>
              <span>Budget Watch</span>
              <span>Memory Lane</span>
            </div>
          </section>
        )}

        {!loading && trips.length > 0 && (
          <div className="stats-bar">
            <div className="stat"><span className="stat__num">{stats.total}</span><span className="stat__label">Total</span></div>
            <div className="stat"><span className="stat__num stat__num--blue">{stats.upcoming}</span><span className="stat__label">Upcoming</span></div>
            <div className="stat"><span className="stat__num stat__num--green">{stats.ongoing}</span><span className="stat__label">Ongoing</span></div>
            <div className="stat"><span className="stat__num stat__num--gray">{stats.completed}</span><span className="stat__label">Completed</span></div>
            <div className="stat"><span className="stat__num stat__num--gold">{stats.favs}</span><span className="stat__label">Favourites</span></div>
            {stats.budget > 0 && (
              <div className="stat"><span className="stat__num">{stats.budget.toLocaleString()}</span><span className="stat__label">Total Budget</span></div>
            )}
          </div>
        )}

        <div className="controls">
          <input
            type="text"
            className="search-input"
            placeholder="Search destinations or countries"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="filter-group">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="All">All Types</option>
              {TRIP_TYPES.map((type) => <option key={type}>{type}</option>)}
            </select>

            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              <option value="Upcoming">Upcoming</option>
              <option value="Ongoing">Ongoing</option>
              <option value="Completed">Completed</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="startDate">By Start Date</option>
              <option value="az">Name A-Z</option>
              <option value="za">Name Z-A</option>
              <option value="budgetHi">Budget High-Low</option>
              <option value="budgetLo">Budget Low-High</option>
            </select>

            <button
              className={`fav-filter-btn ${filterFav ? 'fav-filter-btn--on' : ''}`}
              onClick={() => setFilterFav((prev) => !prev)}
            >
              Fav Only
            </button>
          </div>
        </div>

        {loading ? (
          <div className="loading-state">
            <div className="spinner" />
            <p>Loading trips...</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="trips-grid">
            {filtered.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                onDelete={handleDelete}
                onEdit={setModal}
                onToggleFav={handleToggleFav}
              />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state__icon">Trips</div>
            <h2>{trips.length === 0 ? 'No trips planned yet' : 'No trips match your filters'}</h2>
            <p>{trips.length === 0 ? 'Start by adding your first trip.' : 'Try adjusting your search or filters.'}</p>
            {trips.length === 0 ? (
              <button className="btn btn--primary" onClick={() => setModal('add')}>Plan Your First Trip</button>
            ) : (
              <button
                className="btn btn--cancel"
                onClick={() => {
                  setSearch('')
                  setFilterType('All')
                  setFilterStatus('All')
                  setFilterFav(false)
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        )}
      </main>

      {modal && (
        <TripModal
          initial={modal === 'add' ? null : { ...modal, favorite: Boolean(modal.favorite), budget: modal.budget || '' }}
          onSave={handleSave}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

