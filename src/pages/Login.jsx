import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')

  const handleAuth = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        if (!name.trim()) {
          alert("Sistema: Requiere identificación de Atleta (Nombre).");
          setLoading(false);
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nombre_usuario: name.trim()
            }
          }
        })
        if (error) throw error
        
        alert('SISTEMA: Registro exitoso. Ingresa tus credenciales para acceder.')
        setIsLogin(true)
      }
    } catch (error) {
      alert("Error del Sistema: " + (error.error_description || error.message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#030305] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Fondo Holográfico */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d41a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d41a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      <div className="relative z-10 bg-[#0a0f1c]/80 border border-cyan-900/50 p-8 rounded-xl shadow-[0_0_30px_rgba(6,182,212,0.1)] backdrop-blur-md w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(249,115,22,0.5)] mb-2 flex items-center justify-center gap-2">
            IRONLOG <span className="text-orange-500 drop-shadow-[0_0_10px_rgba(249,115,22,0.8)]">🏋️‍♂️</span>
          </h1>
          <p className="text-cyan-400/70 font-mono text-sm tracking-widest uppercase">
            {isLogin ? 'Inicialización de Sistema' : 'Registro de Nuevo Atleta'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Identificación (Nombre)</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="ATLETA-01"
                className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all uppercase placeholder-cyan-900"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Enlace de Red (Correo)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="atleta@sistema.com"
              required
              className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-cyan-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-cyan-500 uppercase tracking-wider mb-1">Clave de Acceso</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full bg-[#030305] border border-cyan-800 rounded-none p-3 text-cyan-100 font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all placeholder-cyan-900 tracking-[0.5em]"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black uppercase tracking-widest py-3.5 px-4 rounded-none transition-all mt-6 disabled:opacity-50 shadow-[0_0_15px_rgba(249,115,22,0.4)] hover:shadow-[0_0_25px_rgba(249,115,22,0.6)] border border-orange-400/50"
          >
            {loading ? 'Sincronizando...' : (isLogin ? 'Acceder al Sistema' : 'Despertar Sistema')}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-cyan-900/50 pt-4">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-600 hover:text-cyan-400 text-xs font-mono tracking-widest uppercase transition-colors"
          >
            {isLogin ? '>> Solicitar acceso nuevo <<' : '>> Retornar a nodo principal <<'}
          </button>
        </div>
      </div>
    </div>
  )
}