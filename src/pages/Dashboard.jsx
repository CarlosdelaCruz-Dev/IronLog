import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'


export default function Dashboard({ session }) {
  const [workouts, setWorkouts] = useState([])
  const [splitType, setSplitType] = useState('Push')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
      .insert([{ user_id: session.user.id, split_type: splitType, notes: notes }])

    setIsSubmitting(false)

    if (error) {
      alert('Hubo un error al guardar: ' + error.message)
    } else {
      setNotes('')
      fetchWorkouts()
    }
  }

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('¿Seguro que quieres borrar este día de entrenamiento? Se borrarán todos los ejercicios que registraste dentro.')) return

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', workoutId)

    if (error) {
      alert('Error al borrar: ' + error.message)
    } else {
      fetchWorkouts()
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-slate-800 pb-4 gap-4">
        <h1 className="text-3xl font-extrabold text-orange-500 tracking-wide flex items-center gap-2">
          IronLog 🏋️‍♂️
        </h1>
        
        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link 
            to="/progress" 
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 text-sm font-medium transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            Ver Progreso
          </Link>

          <p className="text-slate-400 text-sm hidden sm:block">
            Atleta: <span className="text-orange-400 font-medium">{session?.user?.email}</span>
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
        
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6 text-emerald-400">Registrar Entrenamiento</h2>
          
          <form onSubmit={handleCreateWorkout} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Tipo de Rutina</label>
              
              {/* NUEVO MENÚ CON CATEGORÍAS */}
              <select value={splitType} onChange={(e) => setSplitType(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors">
                
                <optgroup label="Sistemas Estructurados">
                  <option value="Push">Push: Empuje (Pecho, Hombro, Tríceps)</option>
                  <option value="Pull">Pull: Jalón (Espalda, Bíceps)</option>
                  <option value="Legs">Legs: Pierna Completa</option>
                  <option value="Upper">Upper: Torso Completo</option>
                  <option value="Lower">Lower: Tren Inferior</option>
                  <option value="Heavy Duty">Heavy Duty: 1 Serie al Fallo</option>
                  <option value="Full Body">Full Body: Cuerpo Completo</option>
                </optgroup>

                <optgroup label="Por Grupo Muscular (Directo)">
                  <option value="Pierna y Glúteo">🦵 Pierna y Glúteo</option>
                  <option value="Brazo Completo">💪 Brazo Completo</option>
                  <option value="Espalda">🦇 Espalda</option>
                  <option value="Pecho">🦍 Pecho</option>
                  <option value="Hombro y Abdomen">🛡️ Hombro y Abdomen</option>
                </optgroup>

              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Notas del día (Opcional)</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej. Me sentí fuerte hoy, dormí 8 horas..." className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none h-24" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50">
              {isSubmitting ? 'Guardando...' : 'Iniciar Entrenamiento'}
            </button>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6">Tu Historial</h2>
          
          {workouts.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400">Aún no hay entrenamientos registrados.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {workouts.map((workout) => (
                <div key={workout.id} className="group bg-slate-950 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-700 transition-all">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="bg-slate-800 text-orange-400 font-bold px-3 py-1 rounded-md text-sm">
                        {/* Como el splitType guardado puede ser largo, mostramos solo la primera parte o el emoji */}
                        {workout.split_type.split(':')[0]}
                      </span>
                      <span className="text-slate-400 text-sm font-medium">
                        {new Date(workout.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                    </div>
                    {workout.notes && <p className="text-slate-300 mt-2 text-sm">{workout.notes}</p>}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Link to={`/workout/${workout.id}`} className="text-emerald-400 hover:text-emerald-300 text-sm font-medium whitespace-nowrap bg-slate-900 px-4 py-2 rounded-lg border border-slate-700 hover:border-emerald-500 transition-all">
                      Ver Ejercicios →
                    </Link>
                    
                    <button 
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="text-slate-600 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 ml-2"
                      title="Eliminar entrenamiento"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </main>
    </div>
  )
}