import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const FEATURES = [
  { icon: 'Map', title: 'Plan Trips', desc: 'Add destinations, dates, and trip types in one place.' },
  { icon: 'Edit', title: 'Edit Anytime', desc: 'Update trip details whenever your plans change.' },
  { icon: 'Star', title: 'Favourite Trips', desc: 'Star important trips and filter to them instantly.' },
  { icon: 'Budget', title: 'Track Budgets', desc: 'Set a budget per trip and monitor total spend.' },
  { icon: 'Search', title: 'Smart Filters', desc: 'Search, filter by type and status, and sort quickly.' },
  { icon: 'Cloud', title: 'Secure Backend', desc: 'Data is stored with login-based access and admin controls.' },
]

const CITY_POOL = [
  { name: 'Tokyo', country: 'Japan', region: 'Asia', lat: 35.6764, lon: 139.65, vibe: 'City', image: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Cape Town', country: 'South Africa', region: 'Africa', lat: -33.9249, lon: 18.4241, vibe: 'Nature', image: 'https://images.unsplash.com/photo-1576485290814-1c72aa4bbb8e?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Lisbon', country: 'Portugal', region: 'Europe', lat: 38.7223, lon: -9.1393, vibe: 'Culture', image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Bali', country: 'Indonesia', region: 'Asia', lat: -8.4095, lon: 115.1889, vibe: 'Beach', image: 'https://images.unsplash.com/photo-1537953773345-d172ccf13cf1?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Dubai', country: 'UAE', region: 'Middle East', lat: 25.2048, lon: 55.2708, vibe: 'Luxury', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Reykjavik', country: 'Iceland', region: 'Europe', lat: 64.1466, lon: -21.9426, vibe: 'Winter', image: 'https://images.unsplash.com/photo-1520769945061-0a448c463865?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Sydney', country: 'Australia', region: 'Oceania', lat: -33.8688, lon: 151.2093, vibe: 'Coastal', image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8d4a5?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Queenstown', country: 'New Zealand', region: 'Oceania', lat: -45.0312, lon: 168.6626, vibe: 'Adventure', image: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Vancouver', country: 'Canada', region: 'North America', lat: 49.2827, lon: -123.1207, vibe: 'Nature', image: 'https://images.unsplash.com/photo-1559511260-66a654ae982a?auto=format&fit=crop&w=1200&q=80' },
  { name: 'Rio de Janeiro', country: 'Brazil', region: 'South America', lat: -22.9068, lon: -43.1729, vibe: 'Beach', image: 'https://images.unsplash.com/photo-1544989164-31ac13a4f6f8?auto=format&fit=crop&w=1200&q=80' },
]

const CURRENCIES = ['USD', 'INR', 'EUR', 'GBP']
const SYMBOL = { USD: '$', INR: 'Rs ', EUR: 'EUR ', GBP: 'GBP ' }

function shuffle(list) {
  return [...list].sort(() => Math.random() - 0.5)
}

function weatherLabel(code) {
  if (code === 0) return 'Clear sky'
  if ([1, 2].includes(code)) return 'Partly cloudy'
  if (code === 3) return 'Cloudy'
  if ([45, 48].includes(code)) return 'Fog'
  if ([51, 53, 55, 56, 57].includes(code)) return 'Drizzle'
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'Rain'
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'Snow'
  if ([95, 96, 99].includes(code)) return 'Thunder'
  return 'Mixed'
}

function LogoMark() {
  return (
    <span className="logo__icon" aria-hidden="true">
      <svg viewBox="0 0 36 36" className="logo__svg">
        <defs>
          <linearGradient id="tpLogoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.98" />
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0.95" />
          </linearGradient>
        </defs>
        <circle cx="10" cy="11" r="4" fill="url(#tpLogoGrad)" />
        <path d="M8 25c5-7 11-10 18-10" fill="none" stroke="url(#tpLogoGrad)" strokeWidth="2.2" strokeLinecap="round" />
        <path d="M19 8l10 5-10 5 2.7-5z" fill="#ffffff" />
      </svg>
    </span>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const { isAuthenticated, isAdmin, logout } = useAuth()

  const [query, setQuery] = useState('')
  const [region, setRegion] = useState('All')
  const [currency, setCurrency] = useState('USD')
  const [activeSection, setActiveSection] = useState('places')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [places, setPlaces] = useState([])
  const [foods, setFoods] = useState([])
  const [rates, setRates] = useState({ USD: 1, INR: 83, EUR: 0.92, GBP: 0.78 })
  const [rateTime, setRateTime] = useState('')

  const loadDiscovery = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const selectedCities = shuffle(CITY_POOL).slice(0, 8)

      const weatherRequests = selectedCities.map(async (city) => {
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
        )
        if (!weatherRes.ok) throw new Error('Weather API failed')
        const weatherJson = await weatherRes.json()
        const current = weatherJson.current || {}

        return {
          ...city,
          temp: typeof current.temperature_2m === 'number' ? Math.round(current.temperature_2m) : null,
          wind: typeof current.wind_speed_10m === 'number' ? Math.round(current.wind_speed_10m) : null,
          weather: weatherLabel(current.weather_code),
          score: (4 + Math.random()).toFixed(1),
        }
      })

      const foodRequests = Array.from({ length: 8 }, () =>
        fetch('https://www.themealdb.com/api/json/v1/1/random.php')
          .then((res) => {
            if (!res.ok) throw new Error('Food API failed')
            return res.json()
          })
          .then((data) => data.meals?.[0])
      )

      const ratesRequest = fetch('https://open.er-api.com/v6/latest/USD').then((res) => {
        if (!res.ok) throw new Error('Rates API failed')
        return res.json()
      })

      const [weatherResult, foodResult, ratesResult] = await Promise.all([
        Promise.all(weatherRequests),
        Promise.all(foodRequests),
        ratesRequest,
      ])

      const uniqueFoods = []
      const seen = new Set()
      for (const meal of foodResult) {
        if (!meal || seen.has(meal.idMeal)) continue
        seen.add(meal.idMeal)
        uniqueFoods.push(meal)
      }

      setPlaces(weatherResult)
      setFoods(uniqueFoods.slice(0, 8))
      if (ratesResult?.rates) {
        setRates((prev) => ({ ...prev, ...ratesResult.rates }))
        if (ratesResult.time_last_update_utc) {
          setRateTime(ratesResult.time_last_update_utc)
        }
      }
    } catch (err) {
      setError(err.message || 'Could not load live suggestions')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDiscovery()
  }, [loadDiscovery])

  const regions = useMemo(() => ['All', ...new Set(places.map((p) => p.region))], [places])

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase()
    return places.filter((place) => {
      const matchesQuery = !q || `${place.name} ${place.country} ${place.vibe} ${place.weather}`.toLowerCase().includes(q)
      const matchesRegion = region === 'All' || place.region === region
      return matchesQuery && matchesRegion
    })
  }, [places, query, region])

  const packages = useMemo(() => {
    const rate = rates[currency] || 1
    return filteredPlaces.slice(0, 8).map((place, index) => {
      const baseUsd = 280 + index * 110 + (place.temp ? Math.max(0, place.temp) : 20) * 2
      const price = Math.round(baseUsd * rate)
      return {
        id: `${place.name}-${index}`,
        place: `${place.name}, ${place.country}`,
        type: `${place.vibe} Package`,
        days: 3 + (index % 5),
        includes: ['Stay', 'Local Transfer', 'Top Experience'],
        price,
      }
    })
  }, [filteredPlaces, rates, currency])

  const spotlight = useMemo(() => {
    if (!places.length) return null
    return places[Math.floor(Math.random() * places.length)]
  }, [places])

  const handleLogout = async () => {
    try {
      await logout()
    } finally {
      navigate('/login')
    }
  }

  return (
    <div className="home">
      <nav className="home-nav">
        <div className="home-nav__inner">
          <div className="logo">
            <LogoMark />
            <div className="logo__copy">
              <h1>Travel Planner</h1>
              <p>Routes, budgets, memories</p>
            </div>
          </div>

          <div className="header__actions">
            {isAuthenticated ? (
              <>
                <button className="btn btn--primary" onClick={() => navigate('/dashboard')}>
                  Open Dashboard
                </button>
                {isAdmin && (
                  <button className="btn btn--ghost" onClick={() => navigate('/admin')}>
                    Admin
                  </button>
                )}
                <button className="btn btn--cancel" onClick={handleLogout}>
                  Logout
                </button>
              </>
            ) : (
              <button className="btn btn--primary" onClick={() => navigate('/login')}>
                Login
              </button>
            )}
          </div>
        </div>
      </nav>

      <section className="hero">
        <div className="hero__content">
          <span className="hero__badge">Live Discovery Board</span>
          <h2 className="hero__title">Fresh travel and food suggestions on every refresh</h2>
          <p className="hero__sub">
            We now pull live weather, random meal ideas, and dynamic package estimates. Click refresh suggestions anytime.
          </p>
          <div className="hero__actions">
            <button className="btn btn--primary btn--lg" onClick={loadDiscovery}>
              Refresh Suggestions
            </button>
            <button
              className="btn btn--ghost btn--lg"
              onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}
            >
              {isAuthenticated ? 'Open Dashboard' : 'Get Started'}
            </button>
          </div>
        </div>
        <div className="hero__globe" style={{ backgroundImage: `url("${spotlight?.image || 'https://images.unsplash.com/photo-1503220317375-aaad61436b1b?auto=format&fit=crop&w=1400&q=80'}")` }}>
          <div className="hero-widget">
            <p className="hero-widget__label">Now Trending</p>
            <h4>{spotlight ? `${spotlight.name}, ${spotlight.country}` : 'Loading destination'}</h4>
            <p className="hero-widget__sub">
              {spotlight ? `${spotlight.weather} · ${spotlight.temp}°C · ${spotlight.vibe}` : 'Fetching live data...'}
            </p>
            <div className="hero-widget__chips">
              <span>Live Weather</span>
              <span>Food Picks</span>
              <span>Dynamic Packages</span>
            </div>
          </div>
        </div>
      </section>

      <section className="discover discover--live">
        <div className="discover__head discover__head--row">
          <div>
            <h3>Live Suggestions</h3>
            <p>Real-time weather, random food recommendations, and updated package pricing.</p>
          </div>
          <div className="discover-meta">
            <span>{loading ? 'Loading data...' : `Loaded ${filteredPlaces.length} places & ${foods.length} food picks`}</span>
            {rateTime && <span>Rates updated: {rateTime}</span>}
          </div>
        </div>

        {error && <div className="discover-error">{error}</div>}

        <div className="discover-switch">
          <button
            className={`discover-switch__btn ${activeSection === 'places' ? 'discover-switch__btn--active' : ''}`}
            onClick={() => setActiveSection('places')}
          >
            Suggested Locations
          </button>
          <button
            className={`discover-switch__btn ${activeSection === 'food' ? 'discover-switch__btn--active' : ''}`}
            onClick={() => setActiveSection('food')}
          >
            Food Picks
          </button>
          <button
            className={`discover-switch__btn ${activeSection === 'packages' ? 'discover-switch__btn--active' : ''}`}
            onClick={() => setActiveSection('packages')}
          >
            Packages
          </button>
        </div>

        {activeSection === 'places' && (
          <>
            <div className="discover-toolbar">
              <input
                type="text"
                className="discover-search"
                placeholder="Search by city, country, weather, or vibe"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select value={region} onChange={(e) => setRegion(e.target.value)}>
                {regions.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <h4 className="discover-title">Top Places Right Now</h4>
            <div className="discover-grid">
              {filteredPlaces.map((place) => (
                <article className="discover-card" key={place.name}>
                  <div className="discover-card__image" style={{ backgroundImage: `url("${place.image}")` }} />
                  <div className="discover-card__body">
                    <div className="discover-card__row">
                      <h4>{place.name}</h4>
                      <span>{place.score} / 5</span>
                    </div>
                    <p>{place.country} · {place.region}</p>
                    <div className="discover-card__chips">
                      <span>{place.vibe}</span>
                      <span className="chip-muted">{place.weather}</span>
                      {place.temp !== null && <span className="chip-muted">{place.temp}°C</span>}
                    </div>
                    <button className="btn btn--ghost" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
                      Plan This Trip
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {activeSection === 'food' && (
          <>
            <h4 className="discover-title">Food Suggestions (Random Every Refresh)</h4>
            <div className="food-grid">
              {foods.map((meal) => (
                <article className="food-card" key={meal.idMeal}>
                  <div className="food-card__image" style={{ backgroundImage: `url("${meal.strMealThumb}")` }} />
                  <div className="food-card__body">
                    <h4>{meal.strMeal}</h4>
                    <p>{meal.strArea} · {meal.strCategory}</p>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        {activeSection === 'packages' && (
          <>
            <div className="discover-toolbar discover-toolbar--packages">
              <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
              </select>
            </div>
            <h4 className="discover-title">Suggested Packages</h4>
            <div className="package-grid">
              {packages.map((pack) => (
                <article className="package-card" key={pack.id}>
                  <p className="package-card__type">{pack.type}</p>
                  <h4>{pack.place}</h4>
                  <p>{pack.days} days itinerary</p>
                  <p className="package-card__price">From {SYMBOL[currency]}{pack.price.toLocaleString()}</p>
                  <div className="discover-card__chips">
                    {pack.includes.map((item) => <span key={item}>{item}</span>)}
                  </div>
                  <button className="btn btn--primary" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
                    Select Package
                  </button>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      <section className="features">
        <h3 className="features__heading">Everything you need to plan trips</h3>
        <div className="features__grid">
          {FEATURES.map((f) => (
            <div key={f.title} className="feature-card">
              <span className="feature-card__icon">{f.icon}</span>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta">
        <h3>Ready to start exploring?</h3>
        <p>Your next adventure is one click away.</p>
        <button className="btn btn--primary btn--lg" onClick={() => navigate(isAuthenticated ? '/dashboard' : '/login')}>
          {isAuthenticated ? 'Go to Dashboard' : 'Login and Start'}
        </button>
      </section>

      <footer className="home-footer">
        <p>TravelPlanner - React + Firebase Auth + Firestore</p>
      </footer>
    </div>
  )
}
