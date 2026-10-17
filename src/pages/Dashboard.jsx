import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const WORKOUT_OPTIONS = {
  sistemas: [
    { id: 'Push', label: 'Push', desc: 'Pecho, Hombro, Tríceps', emoji: '🔥' },
    { id: 'Pull', label: 'Pull', desc: 'Espalda, Bíceps', emoji: '🦍' },
    { id: 'Legs', label: 'Legs', desc: 'Pierna Completa', emoji: '🦵' },
    { id: 'Upper', label: 'Upper', desc: 'Torso Completo', emoji: '💪' },
    { id: 'Lower', label: 'Lower', desc: 'Tren Inferior', emoji: '👖' },
    { id: 'Heavy Duty', label: 'Heavy Duty', desc: '1 Serie al Fallo', emoji: '☠️' },
    { id: 'Full Body', label: 'Full Body', desc: 'Cuerpo Completo', emoji: '⚡' },
  ],
  musculos: [
    { id: 'Pierna y Glúteo', label: 'Pierna y Glúteo', desc: 'Enfoque inferior', emoji: '🍑' },
    { id: 'Brazo Completo', label: 'Brazo', desc: 'Bíceps y Tríceps', emoji: '🦾' },
    { id: 'Espalda', label: 'Espalda', desc: 'Amplitud y grosor', emoji: '🦇' },
    { id: 'Pecho', label: 'Pecho', desc: 'Enfoque directo', emoji: '🛡️' },
    { id: 'Hombro y Abdomen', label: 'Hombro y Core', desc: 'Estabilidad', emoji: '🎯' },
  ],
  cardio: [
    { id: 'Caminadora', label: 'Caminadora', desc: 'Caminata o trote', emoji: '🚶' },
    { id: 'Correr', label: 'Correr', desc: 'Carrera continua', emoji: '🏃' },
    { id: 'Bicicleta', label: 'Bicicleta', desc: 'Estática o de spinning', emoji: '🚴' },
    { id: 'Escaladora', label: 'Escaladora', desc: 'Stairmaster', emoji: '🪜' },
    { id: 'Elíptica', label: 'Elíptica', desc: 'Bajo impacto', emoji: '⛷️' },
    { id: 'Cardio Libre', label: 'Cardio Libre', desc: 'Saltar cuerda, burpees...', emoji: '💦' },
  ]
}

export default function Dashboard({ session }) {
  const [workouts, setWorkouts] = useState([])
  const [splitType, setSplitType] = useState('Push')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('sistemas')

  const metaName = session?.user?.user_metadata?.nombre_usuario;
  const rawName = metaName || session?.user?.email?.split('@')[0] || 'Atleta';
  const formattedName = rawName.charAt(0).toUpperCase() + rawName.slice(1);

  useEffect(() => {
    fetchWorkouts()
  }, [])

  const fetchWorkouts = async () => {
    const { data, error } = await supabase.from('workouts').select('*').order('created_at', { ascending: false })
    if (!error) setWorkouts(data)
  }

  const handleCreateWorkout = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    const { error } = await supabase.from('workouts').insert([{ user_id: session.user.id, split_type: splitType, notes: notes }])
    setIsSubmitting(false)
    if (error) alert('Error del Sistema: ' + error.message)
    else { setNotes(''); fetchWorkouts() }
  }

  const handleCloneWorkout = async (originalWorkout) => {
    if (!window.confirm('SISTEMA: ¿Clonar protocolo de entrenamiento?')) return
    setIsSubmitting(true)
    try {
      const { data: newWorkout, error: workoutError } = await supabase.from('workouts')
        .insert([{ user_id: session.user.id, split_type: originalWorkout.split_type, notes: `Copia de registro [${new Date(originalWorkout.date).toLocaleDateString('es-ES')}]` }])
        .select().single()

      if (workoutError) throw workoutError

      const { data: oldExercises, error: fetchError } = await supabase.from('exercises').select('*').eq('workout_id', originalWorkout.id)
      if (fetchError) throw fetchError

      if (oldExercises && oldExercises.length > 0) {
        const exercisesToInsert = oldExercises.map(ex => ({
          user_id: session.user.id, workout_id: newWorkout.id, name: ex.name, sets: ex.sets, reps: ex.reps, weight: ex.weight
        }))
        const { error: insertError } = await supabase.from('exercises').insert(exercisesToInsert)
        if (insertError) throw insertError
      }
      fetchWorkouts()
    } catch (error) {
      alert('Fallo de clonación: ' + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWorkout = async (workoutId) => {
    if (!window.confirm('SISTEMA: ¿Eliminar registro permanentemente?')) return
    const { error } = await supabase.from('workouts').delete().eq('id', workoutId)
    if (!error) fetchWorkouts()
  }

  return (
    <div className="min-h-screen bg-[#030305] text-slate-100 p-4 sm:p-8 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d41a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d41a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col sm:flex-row justify-between items-center mb-8 border-b border-cyan-900/50 pb-6 gap-4">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] flex items-center gap-2">
            IRONLOG <span className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">🏋️‍♂️</span>
          </h1>
          
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <Link 
              to="/progress" 
              className="flex items-center gap-2 px-5 py-2.5 bg-cyan-950/30 border border-cyan-500/30 text-cyan-300 text-sm font-bold uppercase tracking-wider hover:bg-cyan-900/40 hover:border-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)]"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 drop-shadow-[0_0_5px_rgba(6,182,212,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Estado Atleta
            </Link>

            <p className="text-cyan-600 text-xs font-mono uppercase tracking-widest hidden sm:block">
              Usuario: <span className="text-cyan-300 font-bold drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]">{formattedName}</span>
            </p>

            <button 
              onClick={async () => {
                const newPassword = window.prompt("SISTEMA: Ingresa tu nueva clave de acceso (mínimo 6 caracteres):");
                if (newPassword) {
                  if (newPassword.length < 6) return alert("Error: La clave debe tener al menos 6 caracteres.");
                  const { error } = await supabase.auth.updateUser({ password: newPassword });
                  if (error) alert("Error del Sistema: " + error.message);
                  else alert("SISTEMA: Clave de acceso actualizada exitosamente.");
                }
              }}
              className="px-4 py-2 border border-emerald-900/50 bg-emerald-950/20 hover:bg-emerald-900/40 hover:border-emerald-500/50 text-emerald-400 text-xs font-mono uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(16,185,129,0.1)]"
            >
              ⚙️ Cambiar Clave
            </button>
            
            <button 
              onClick={() => supabase.auth.signOut()}
              className="px-4 py-2 border border-red-900/50 bg-red-950/20 hover:bg-red-900/40 hover:border-red-500/50 text-red-400 text-xs font-mono uppercase tracking-widest transition-all shadow-[0_0_10px_rgba(239,68,68,0.1)]"
            >
              Desconectar
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PANEL IZQUIERDO: MISIÓN NUEVA */}
          <div className="lg:col-span-1 rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-6 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)] h-fit">
            <h2 className="flex items-center gap-2 text-lg font-bold text-cyan-400 uppercase tracking-wider mb-6 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]">
              Iniciar Protocolo
            </h2>
            
            <form onSubmit={handleCreateWorkout} className="space-y-6">
              <div className="space-y-3">
                <div className="flex bg-[#030305] p-1 border border-cyan-900/50">
                  <button type="button" onClick={() => setActiveTab('sistemas')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'sistemas' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-cyan-700 hover:text-cyan-400'}`}>Sistemas</button>
                  <button type="button" onClick={() => setActiveTab('musculos')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'musculos' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-cyan-700 hover:text-cyan-400'}`}>Músculo</button>
                  <button type="button" onClick={() => setActiveTab('cardio')} className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'cardio' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-cyan-700 hover:text-cyan-400'}`}>Cardio</button>
                </div>

                <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1">
                  {WORKOUT_OPTIONS[activeTab].map((opt) => (
                    <button
                      key={opt.id} type="button" onClick={() => setSplitType(opt.id)}
                      className={`text-left p-3 border transition-all flex flex-col gap-1 hover:scale-[1.02] active:scale-95 ${
                        splitType === opt.id 
                          ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                          : 'border-cyan-900/50 bg-[#030305] hover:border-cyan-500/50 hover:shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                      }`}
                    >
                      <span className="text-2xl mb-1 filter drop-shadow-md">{opt.emoji}</span>
                      <span className={`font-bold text-sm uppercase tracking-wide ${splitType === opt.id ? 'text-orange-400 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]' : 'text-cyan-100'}`}>
                        {opt.label}
                      </span>
                      <span className="text-xs text-cyan-600/70 font-mono leading-tight">
                        {opt.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-2">Registro de Misión (Notas)</label>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Estado actual, lesiones, energía..." className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all resize-none h-20 placeholder-cyan-900" />
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest py-3.5 px-4 rounded-none transition-all disabled:opacity-50 shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] border border-orange-400/50">
                {isSubmitting ? 'Procesando...' : '🔥 Ejecutar Protocolo'}
              </button>
            </form>
          </div>

          {/* PANEL DERECHO: HISTORIAL / REGISTRO DEL SISTEMA */}
          <div className="lg:col-span-2 rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-6 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)]">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-6 drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">Bitácora del Sistema</h2>
            
            {workouts.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-cyan-900/50 bg-[#030305]/50">
                <p className="text-cyan-700 font-mono text-sm uppercase tracking-widest">Base de datos vacía. Esperando registros.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {workouts.map((workout) => (
                  <div key={workout.id} className="group bg-[#030305]/80 border border-cyan-900/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-cyan-500/50 hover:shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] transition-all">
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="bg-orange-950/40 text-orange-400 border border-orange-500/30 font-bold px-2 py-0.5 text-xs uppercase tracking-wider shadow-[0_0_8px_rgba(249,115,22,0.2)]">
                          {workout.split_type}
                        </span>
                        <span className="text-cyan-500/60 font-mono text-xs uppercase">
                          {new Date(workout.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      {workout.notes && <p className="text-cyan-100/70 mt-2 text-sm font-mono border-l-2 border-cyan-800 pl-2">{workout.notes}</p>}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Link to={`/workout/${workout.id}`} className="text-cyan-300 hover:text-white text-xs font-bold uppercase tracking-wider whitespace-nowrap bg-cyan-950/30 px-4 py-2 border border-cyan-700/50 hover:border-cyan-400 hover:bg-cyan-900/60 hover:shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-all">
                        Desplegar →
                      </Link>
                      
                      <button onClick={() => handleCloneWorkout(workout)} className="text-cyan-700 hover:text-cyan-300 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2" title="Clonar Protocolo">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                      </button>

                      <button onClick={() => handleDeleteWorkout(workout.id)} className="text-red-900 hover:text-red-500 transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100 p-2 hover:drop-shadow-[0_0_5px_rgba(239,68,68,0.8)]" title="Purgar">
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
    </div>
  )
}