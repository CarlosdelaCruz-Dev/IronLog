import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function WorkoutDetail({ session }) {
  const { id } = useParams()
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  
  // Estados para el formulario
  const [name, setName] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetchWorkoutAndExercises()
  }, [id])

  const fetchWorkoutAndExercises = async () => {
    // 1. Obtener la info del día
    const { data: workoutData } = await supabase.from('workouts').select('*').eq('id', id).single()
    if (workoutData) setWorkout(workoutData)

    // 2. Obtener los ejercicios de este día
    const { data: exercisesData } = await supabase.from('exercises').select('*').eq('workout_id', id).order('created_at', { ascending: true })
    if (exercisesData) setExercises(exercisesData)
  }

  const handleAddExercise = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase.from('exercises').insert([
      {
        workout_id: id,
        user_id: session.user.id,
        name: name,
        sets: parseInt(sets),
        reps: reps,
        weight: weight ? parseFloat(weight) : null
      }
    ])

    setIsSubmitting(false)
    if (error) {
      alert('Error al guardar: ' + error.message)
    } else {
      setName('')
      setSets('')
      setReps('')
      setWeight('')
      fetchWorkoutAndExercises() // Recargar la lista
    }
  }

  if (!workout) return <div className="min-h-screen bg-slate-950 text-white p-8">Cargando bitácora...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <header className="max-w-5xl mx-auto mb-8 flex items-center gap-4 border-b border-slate-800 pb-4">
        <Link to="/" className="text-slate-400 hover:text-white px-3 py-2 bg-slate-900 rounded-lg border border-slate-800 transition-colors">
          ← Volver
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold text-orange-500">
            Día de {workout.split_type}
          </h1>
          <p className="text-slate-400">
            {new Date(workout.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Columna Izquierda: Agregar Ejercicio */}
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6 text-emerald-400">Añadir Ejercicio</h2>
          
          <form onSubmit={handleAddExercise} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ejercicio (Ej. Press Inclinado)</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Series</label>
                <input type="number" required min="1" value={sets} onChange={(e) => setSets(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Peso (kg/lbs)</label>
                <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Repeticiones (Ej. 12,10,8,Fallo)</label>
              <input type="text" required value={reps} onChange={(e) => setReps(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-orange-500" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-lg transition-colors mt-2">
              {isSubmitting ? 'Guardando...' : '+ Registrar Serie'}
            </button>
          </form>
        </div>

        {/* Columna Derecha: Lista de Ejercicios del día */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6">Ejercicios Completados</h2>
          
          {exercises.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400">Sin ejercicios registrados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div key={ex.id} className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{ex.name}</h3>
                    <p className="text-slate-400 text-sm">
                      <span className="text-emerald-400 font-medium">{ex.sets}</span> series • <span className="text-emerald-400 font-medium">{ex.reps}</span> reps
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="bg-slate-800 text-orange-400 font-extrabold px-4 py-2 rounded-lg text-lg">
                      {ex.weight ? `${ex.weight}` : '--'}
                    </span>
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