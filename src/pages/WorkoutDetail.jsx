import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function WorkoutDetail({ session }) {
  const { id } = useParams()
  const [workout, setWorkout] = useState(null)
  const [exercises, setExercises] = useState([])
  
  // Estados del formulario
  const [name, setName] = useState('')
  const [sets, setSets] = useState('')
  const [reps, setReps] = useState('')
  const [weight, setWeight] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // NUEVO: Estado para saber si estamos editando
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchWorkoutAndExercises()
  }, [id])

  const fetchWorkoutAndExercises = async () => {
    const { data: workoutData } = await supabase.from('workouts').select('*').eq('id', id).single()
    if (workoutData) setWorkout(workoutData)

    const { data: exercisesData } = await supabase.from('exercises').select('*').eq('workout_id', id).order('created_at', { ascending: true })
    if (exercisesData) setExercises(exercisesData)
  }

  // FUNCIÓN UNIFICADA: Crear o Actualizar
  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)

    const exerciseData = {
      name: name,
      sets: parseInt(sets),
      reps: reps,
      weight: weight ? parseFloat(weight) : null
    }

    if (editingId) {
      // Si hay un ID en edición, ACTUALIZAMOS
      const { error } = await supabase
        .from('exercises')
        .update(exerciseData)
        .eq('id', editingId)
        
      if (error) alert('Error al actualizar: ' + error.message)
    } else {
      // Si no hay ID, CREAMOS uno nuevo
      const { error } = await supabase
        .from('exercises')
        .insert([{ ...exerciseData, workout_id: id, user_id: session.user.id }])
        
      if (error) alert('Error al guardar: ' + error.message)
    }

    setIsSubmitting(false)
    // Limpiamos el formulario y salimos del modo edición
    setName('')
    setSets('')
    setReps('')
    setWeight('')
    setEditingId(null)
    fetchWorkoutAndExercises()
  }

  // NUEVA FUNCIÓN: Cargar los datos al formulario para editar
  const handleEditClick = (ex) => {
    setName(ex.name)
    setSets(ex.sets.toString())
    setReps(ex.reps)
    setWeight(ex.weight ? ex.weight.toString() : '')
    setEditingId(ex.id)
    window.scrollTo({ top: 0, behavior: 'smooth' }) // Sube la pantalla al formulario automáticamente
  }

  const handleDeleteExercise = async (exerciseId) => {
    if (!window.confirm('¿Seguro que quieres borrar este ejercicio?')) return
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId)
    if (error) alert('Error al borrar: ' + error.message)
    else fetchWorkoutAndExercises()
  }

  // NUEVA FUNCIÓN: Cancelar edición
  const cancelEdit = () => {
    setName('')
    setSets('')
    setReps('')
    setWeight('')
    setEditingId(null)
  }

  if (!workout) return <div className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center"><p className="animate-pulse text-orange-500">Cargando bitácora...</p></div>

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
        
        <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit">
          <h2 className="text-xl font-bold mb-6 text-emerald-400">
            {editingId ? '✏️ Editar Ejercicio' : 'Añadir Ejercicio'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Ejercicio (Ej. Press Inclinado)</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Series</label>
                <input type="number" required min="1" value={sets} onChange={(e) => setSets(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Peso (kg/lbs)</label>
                <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">Repeticiones (Ej. 12,10,8,Fallo)</label>
              <input type="text" required value={reps} onChange={(e) => setReps(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-white focus:outline-none focus:border-emerald-500" />
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button type="submit" disabled={isSubmitting} 
                className={`w-full font-bold py-3 rounded-lg transition-colors text-white ${editingId ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-orange-600 hover:bg-orange-500'}`}>
                {isSubmitting ? 'Guardando...' : (editingId ? 'Guardar Cambios' : '+ Registrar Serie')}
              </button>
              
              {editingId && (
                <button type="button" onClick={cancelEdit} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold py-2 rounded-lg transition-colors">
                  Cancelar Edición
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xl font-bold mb-6">Ejercicios Completados</h2>
          
          {exercises.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-slate-700 rounded-xl">
              <p className="text-slate-400">Sin ejercicios registrados.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {exercises.map((ex) => (
                <div key={ex.id} className={`group bg-slate-950 border p-4 rounded-xl flex justify-between items-center transition-all ${editingId === ex.id ? 'border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'border-slate-800 hover:border-slate-700'}`}>
                  <div>
                    <h3 className="text-lg font-bold text-white">{ex.name}</h3>
                    <p className="text-slate-400 text-sm">
                      <span className="text-emerald-400 font-medium">{ex.sets}</span> series • <span className="text-emerald-400 font-medium">{ex.reps}</span> reps
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="bg-slate-800 text-orange-400 font-extrabold px-4 py-2 rounded-lg text-lg">
                      {ex.weight ? `${ex.weight}` : '--'}
                    </span>
                    
                    <div className="flex flex-col sm:flex-row gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      {/* Botón Editar */}
                      <button onClick={() => handleEditClick(ex)} className="text-slate-500 hover:text-emerald-400 p-2 transition-colors" title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                      
                      {/* Botón Eliminar */}
                      <button onClick={() => handleDeleteExercise(ex.id)} className="text-slate-500 hover:text-red-500 p-2 transition-colors" title="Eliminar">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </div>
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