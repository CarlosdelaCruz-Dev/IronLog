import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'

export default function Dashboard({ session }) {
  const [workouts, setWorkouts] = useState([])
  const [splitType, setSplitType] = useState('Push')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Cargar los entrenamientos al iniciar
  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error('Error cargando historial:', error)
    else setWorkouts(data)
  }

  const handleCreateWorkout = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from('workouts')
      .insert([
        { 
          user_id: session.user.id, 
          split_type: splitType, 
          notes: notes 
        }
      ])

    setIsSubmitting(false)

    if (error) {
      alert('Hubo un error al guardar: ' + error.message)
    } else {
      setNotes('') // Limpiamos el formulario
      fetchWorkouts() // Recargamos la lista
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      {/* Barra de navegación superior */}
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-4 gap-4">
        <h1 className="text-3xl font-extrabold text-orange-500 tracking-wide flex items-center gap-2">
          IronLog 🏋️‍♂️
        </h1>
        
        <div className="flex items-center gap-4">
          <p className="text-slate-400 text-sm">
            Atleta: <span className="text-emerald-400 font-medium">{session?.user?.email}</span>
          </p>
          <button 
            onClick={() => supabase.auth.signOut()}
            className="px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-200 text-sm font-medium transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Formulario para registrar el día */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6 text-emerald-400">Registrar Entrenamiento</h2>
          
          <form onSubmit={handleCreateWorkout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Rutina (Split)</label>
              <select 
                value={splitType}
                onChange={(e) => setSplitType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                <option value="Push">Push (Empuje)</option>
                <option value="Pull">Pull (Jalón)</option>
                <option value="Legs">Legs (Pierna)</option>
                <option value="Upper">Torso</option>
                <option value="Lower">Pierna (Lower)</option>
                <option value="Full Body">Cuerpo Completo</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Notas del día (Opcional)</label>
              <textarea 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej. Me sentí fuerte hoy, dormí 8 horas..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none h-24"
              />
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : 'Iniciar Entrenamiento'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Historial de entrenamientos */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6">Tu Historial</h2>
          
          {workouts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400">Aún no hay entrenamientos registrados.</p>
              <p className="text-sm text-slate-500 mt-2">Usa el formulario para registrar tu primer día.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div key={workout.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-600 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-slate-800 text-orange-400 font-bold px-3 py-1 rounded-md text-sm">
                        {workout.split_type}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">
                        {new Date(workout.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    {workout.notes && <p className="text-slate-300 mt-2 text-sm">{workout.notes}</p>}
                  </div>
                  <button className="text-emerald-400 hover:text-emerald-300 text-sm font-medium whitespace-nowrap">
                    <Link 
                    to={`/workout/${workout.id}`} 
                    className="text-emerald-400 hover:text-emerald-300 text-sm font-medium whitespace-nowrap bg-slate-900 px-3 py-2 rounded-lg border border-slate-700 hover:border-emerald-500 transition-all"
                    >
                    Ver Ejercicios →
                    </Link>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </main>
    </div>
  )
}