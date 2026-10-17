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
  
  // Estado para saber si estamos editando
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
      const { error } = await supabase.from('exercises').update(exerciseData).eq('id', editingId)
      if (error) alert('Error del sistema: ' + error.message)
    } else {
      const { error } = await supabase.from('exercises').insert([{ ...exerciseData, workout_id: id, user_id: session.user.id }])
      if (error) alert('Error del sistema: ' + error.message)
    }

    setIsSubmitting(false)
    setName('')
    setSets('')
    setReps('')
    setWeight('')
    setEditingId(null)
    fetchWorkoutAndExercises()
  }

  const handleEditClick = (ex) => {
    setName(ex.name)
    setSets(ex.sets.toString())
    setReps(ex.reps)
    setWeight(ex.weight ? ex.weight.toString() : '')
    setEditingId(ex.id)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDeleteExercise = async (exerciseId) => {
    if (!window.confirm('SISTEMA: ¿Purgar este ejercicio de la base de datos?')) return
    const { error } = await supabase.from('exercises').delete().eq('id', exerciseId)
    if (error) alert('Error al borrar: ' + error.message)
    else fetchWorkoutAndExercises()
  }

  const cancelEdit = () => {
    setName('')
    setSets('')
    setReps('')
    setWeight('')
    setEditingId(null)
  }

  if (!workout) return (
    <div className="min-h-screen bg-[#030305] text-cyan-400 p-8 flex items-center justify-center font-mono font-bold tracking-widest uppercase">
      <p className="animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">Sincronizando Misión...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#030305] text-slate-100 p-4 sm:p-8 relative overflow-hidden">
      {/* Fondo Holográfico */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d41a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d41a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 max-w-6xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center gap-6 border-b border-cyan-900/50 pb-6">
          <Link to="/" className="flex items-center gap-2 px-5 py-2.5 bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-xs font-bold uppercase tracking-wider hover:bg-cyan-900/40 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] w-fit">
            ← Base Principal
          </Link>
          <div>
            <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(249,115,22,0.5)]">
              Misión: <span className="text-white">{workout.split_type}</span>
            </h1>
            <p className="text-cyan-500/70 font-mono text-sm uppercase tracking-widest mt-1">
              Registro Estelar: {new Date(workout.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PANEL IZQUIERDO: FORMULARIO */}
          <div className="lg:col-span-1 rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-6 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)] h-fit">
            <h2 className={`text-lg font-bold uppercase tracking-wider mb-6 flex items-center gap-2 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)] ${editingId ? 'text-cyan-400' : 'text-orange-500'}`}>
              {editingId ? '⚡ Reconfigurar Carga' : '⚙️ Registrar Acción'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Nombre (Ej. Press Inclinado)</label>
                <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-cyan-900/50 uppercase" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Series</label>
                  <input type="number" required min="1" value={sets} onChange={(e) => setSets(e.target.value)}
                    className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Peso (Kg/Lbs)</label>
                  <input type="number" step="0.5" value={weight} onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Repeticiones (Ej. 12,10,8)</label>
                <input type="text" required value={reps} onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all uppercase placeholder-cyan-900/50" />
              </div>

              <div className="pt-4 flex flex-col gap-3">
                <button type="submit" disabled={isSubmitting} 
                  className={`w-full font-black uppercase tracking-widest py-3.5 px-4 rounded-none transition-all disabled:opacity-50 border ${
                    editingId 
                      ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-[0_0_15px_rgba(6,182,212,0.4)] hover:shadow-[0_0_25px_rgba(6,182,212,0.6)] border-cyan-400/50' 
                      : 'bg-orange-600 hover:bg-orange-500 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] border-orange-400/50'
                  }`}>
                  {isSubmitting ? 'Procesando...' : (editingId ? 'Guardar Modificación' : '🔥 Insertar al Sistema')}
                </button>
                
                {editingId && (
                  <button type="button" onClick={cancelEdit} className="w-full bg-[#030305] hover:bg-cyan-950/50 text-cyan-500 border border-cyan-900 hover:border-cyan-500 font-bold uppercase tracking-widest py-2.5 rounded-none transition-colors">
                    Abortar Edición
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* PANEL DERECHO: LISTA DE EJERCICIOS */}
          <div className="lg:col-span-2 rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-6 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)]">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Estado de Batalla (Ejercicios)</h2>
            
            {exercises.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-cyan-900/50 bg-[#030305]/50">
                <p className="text-cyan-700 font-mono text-sm uppercase tracking-widest">A la espera de comandos de ataque.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {exercises.map((ex) => (
                  <div key={ex.id} className={`group bg-[#030305]/80 border p-4 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all ${editingId === ex.id ? 'border-cyan-400 shadow-[inset_0_0_15px_rgba(6,182,212,0.2)]' : 'border-cyan-900/30 hover:border-cyan-500/50 hover:shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]'}`}>
                    
                    <div className="w-full sm:w-auto text-center sm:text-left">
                      <h3 className="text-lg font-bold text-white uppercase tracking-wide">{ex.name}</h3>
                      <p className="text-cyan-500/60 font-mono text-sm mt-1 uppercase">
                        <span className="text-cyan-400 font-bold">{ex.sets}</span> series <span className="mx-2 text-cyan-900">|</span> <span className="text-cyan-400 font-bold">{ex.reps}</span> reps
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <span className="bg-orange-950/40 text-orange-400 border border-orange-500/30 font-black px-4 py-2 text-lg uppercase tracking-wider shadow-[0_0_10px_rgba(249,115,22,0.2)]">
                        {ex.weight ? `${ex.weight} kg` : 'N/A'}
                      </span>
                      
                      <div className="flex flex-col sm:flex-row gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditClick(ex)} className="text-cyan-700 hover:text-cyan-400 p-2 transition-colors" title="Hackear/Editar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                        </button>
                        <button onClick={() => handleDeleteExercise(ex.id)} className="text-red-900 hover:text-red-500 hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)] p-2 transition-all" title="Purgar">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
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
    </div>
  )
}