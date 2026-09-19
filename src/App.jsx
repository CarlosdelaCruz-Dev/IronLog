import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import WorkoutDetail from './pages/WorkoutDetail' // <-- Nueva página

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })
    return () => subscription.unsubscribe()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">
      <p className="text-xl text-orange-500 font-bold tracking-widest animate-pulse">Cargando IronLog...</p>
    </div>
  )

  return (
    <Router>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/" element={session ? <Dashboard session={session} /> : <Navigate to="/login" />} />
        {/* Nueva ruta dinámica para ver el detalle de cada entrenamiento */}
        <Route path="/workout/:id" element={session ? <WorkoutDetail session={session} /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App