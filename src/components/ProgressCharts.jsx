import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase"; 
import Model from "react-body-highlighter";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Dumbbell,
  Weight,
  Flame,
  TrendingUp,
  BarChart3,
  Activity
} from "lucide-react";

const COLORS = {
  fire: "#f97316", // Demon Slayer (Hinokami Kagura)
  cyan: "#06b6d4", // Tron / Solo Leveling System
  grid: "#083344", // Cyan muy oscuro para el grid
  axis: "#164e63",
};

const SPLIT_TO_MUSCLES = {
  'Push': ['chest', 'triceps', 'front-deltoids'],
  'Pull': ['upper-back', 'lower-back', 'biceps'],
  'Legs': ['gluteal', 'hamstring', 'quadriceps', 'calves'],
  'Upper': ['chest', 'upper-back', 'front-deltoids', 'biceps', 'triceps'],
  'Lower': ['gluteal', 'hamstring', 'quadriceps', 'calves'],
  'Heavy Duty': ['chest', 'upper-back', 'quadriceps', 'hamstring'], 
  'Full Body': ['chest', 'upper-back', 'quadriceps', 'hamstring', 'biceps', 'triceps', 'abs'],
  'Pecho': ['chest'],
  'Espalda': ['upper-back', 'lower-back'],
  'Pierna y Glúteo': ['gluteal', 'hamstring', 'quadriceps', 'calves'],
  'Brazo Completo': ['biceps', 'triceps', 'forearm'],
  'Hombro y Abdomen': ['front-deltoids', 'back-deltoids', 'abs', 'obliques'],
};

function StatCard({ icon: Icon, label, value, unit, hint, accent }) {
  // Efectos de neón condicionales basados en el acento
  const accentStyles = accent === "fire" 
    ? "bg-orange-500/10 text-orange-500 ring-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]" 
    : "bg-cyan-500/10 text-cyan-400 ring-cyan-400/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]";
    
  return (
    <div className="group relative overflow-hidden rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-5 backdrop-blur-md transition-all duration-300 hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] hover:border-cyan-500/40">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${accent === "fire" ? "bg-orange-500" : "bg-cyan-400"}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold tracking-wider text-cyan-500/80 uppercase">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold tracking-tight text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">
            {value} {unit && <span className="text-base font-medium text-cyan-200/50">{unit}</span>}
          </p>
          <p className="mt-1 text-xs text-cyan-200/40">{hint}</p>
        </div>
        <div className={`rounded-lg p-2.5 ring-1 ${accentStyles}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export default function ProgressCharts({ session }) {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [loading, setLoading] = useState(true);
  const [bodyView, setBodyView] = useState("anterior");

  const metaName = session?.user?.user_metadata?.nombre_usuario?.toLowerCase() || '';
  const emailName = session?.user?.email?.toLowerCase() || '';
  const userGender = metaName.includes('paola') || emailName.includes('paola') ? "female" : "male";

  useEffect(() => {
    if (session?.user?.id) fetchRealData();
  }, [session]);

  const fetchRealData = async () => {
    const { data: wData } = await supabase.from('workouts').select('*').eq('user_id', session.user.id).order('date', { ascending: true });
    const { data: eData } = await supabase.from('exercises').select('*, workouts(date)').eq('user_id', session.user.id);
    if (wData) setWorkouts(wData);
    if (eData) {
      setExercises(eData);
      const uniqueNames = [...new Set(eData.map(e => e.name))];
      if (uniqueNames.length > 0) setSelectedExercise(uniqueNames[0]);
    }
    setLoading(false);
  };

  const uniqueExercises = useMemo(() => [...new Set(exercises.map(e => e.name))].filter(Boolean), [exercises]);

  const lineChartData = useMemo(() => {
    if (!selectedExercise) return [];
    const filtered = exercises.filter(e => e.name === selectedExercise && e.weight);
    filtered.sort((a, b) => new Date(a.workouts?.date) - new Date(b.workouts?.date));
    return filtered.map(e => ({
      fecha: new Date(e.workouts?.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      peso: e.weight
    }));
  }, [exercises, selectedExercise]);

  const exerciseStats = useMemo(() => {
    if (lineChartData.length === 0) return { max: 0, diff: 0, pct: 0 };
    const first = lineChartData[0].peso;
    const last = lineChartData[lineChartData.length - 1].peso;
    const diff = (last - first).toFixed(1);
    const pct = first > 0 ? ((diff / first) * 100).toFixed(1) : 0;
    const max = Math.max(...lineChartData.map((d) => d.peso));
    return { diff, pct, max };
  }, [lineChartData]);

  const totalVolume = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      if (!ex.weight) return acc;
      const repsArray = ex.reps.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
      const totalReps = repsArray.length > 0 ? repsArray.reduce((a,b) => a+b, 0) : (ex.sets * 10);
      return acc + (totalReps * ex.weight);
    }, 0);
  }, [exercises]);

  const frequencyData = useMemo(() => {
    const counts = {};
    workouts.forEach(w => {
      const isMuscle = ['Pierna y Glúteo', 'Brazo Completo', 'Espalda', 'Pecho', 'Hombro y Abdomen'].includes(w.split_type);
      if (!isMuscle) counts[w.split_type] = (counts[w.split_type] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ nombre: k, Sesiones: counts[k] }));
  }, [workouts]);

  const highlightedMuscles = useMemo(() => {
    const activeMuscles = new Set();
    workouts.forEach(w => {
      const musclesForSplit = SPLIT_TO_MUSCLES[w.split_type];
      if (musclesForSplit) musclesForSplit.forEach(m => activeMuscles.add(m));
    });
    return [{ name: 'Entrenados', muscles: Array.from(activeMuscles) }];
  }, [workouts]);

  if (loading) return <div className="min-h-screen bg-[#030305] flex items-center justify-center text-cyan-400 font-bold tracking-widest animate-pulse drop-shadow-[0_0_10px_rgba(6,182,212,0.8)]">INICIALIZANDO SISTEMA...</div>;

  return (
    <section className="min-h-screen bg-[#030305] px-4 py-6 text-slate-100 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Fondo de red holográfica sutil */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#06b6d41a_1px,transparent_1px),linear-gradient(to_bottom,#06b6d41a_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20 pointer-events-none" />
      
      <div className="mx-auto max-w-6xl space-y-6 relative z-10">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-cyan-900/50 pb-6 mb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500 drop-shadow-[0_0_5px_rgba(249,115,22,0.8)]">IronLog System</p>
            <h1 className="mt-1 text-2xl font-black tracking-tighter text-white sm:text-3xl uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]">Estado del Atleta</h1>
            <p className="mt-1 text-sm text-cyan-400/70 font-mono">Sincronización de progreso completa.</p>
          </div>
          <Link to="/" className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-950/30 border border-cyan-500/30 rounded-none hover:bg-cyan-900/40 hover:border-cyan-400 text-cyan-300 text-sm font-bold uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.1)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] w-full sm:w-auto">
            ← Volver al Panel
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Dumbbell} label="Sesiones Completadas" value={workouts.length} hint="Registros en la bitácora" accent="fire" />
          <StatCard icon={Weight} label="Volumen Desplegado" value={(totalVolume / 1000).toLocaleString("es-MX", { maximumFractionDigits: 1 })} unit="ton" hint={`${totalVolume.toLocaleString("es-MX")} kg totales`} accent="cyan" />
          <StatCard icon={Flame} label="Variantes de Ataque" value={uniqueExercises.length} hint="Ejercicios dominados" accent="fire" />
        </div>

        <div className="rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-4 sm:p-6 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-bold text-white uppercase tracking-wider">
                <TrendingUp className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                Evolución de Fuerza
              </h2>
              {lineChartData.length > 0 ? (
                <p className="mt-1 text-sm text-cyan-200/50 font-mono">Nivel máximo alcanzado: <span className="font-bold text-cyan-300">{exerciseStats.max} kg</span></p>
              ) : (
                <p className="mt-1 text-sm text-cyan-200/50 font-mono">Datos insuficientes para el análisis.</p>
              )}
            </div>
            <select 
              value={selectedExercise} 
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="bg-[#030305] border border-cyan-800 rounded-none p-2.5 text-cyan-100 text-sm font-mono focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition-all uppercase"
            >
              {uniqueExercises.length === 0 && <option>Sin registros</option>}
              {uniqueExercises.map(name => <option key={name} value={name}>{name}</option>)}
            </select>
          </div>

          {lineChartData.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-none bg-orange-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-orange-400 border border-orange-500/30 shadow-[0_0_10px_rgba(249,115,22,0.2)]">
              <TrendingUp className="h-3.5 w-3.5" />
              {exerciseStats.diff >= 0 ? "+" : ""}{exerciseStats.diff} kg ({exerciseStats.pct}%) ganancia
            </div>
          )}

          <div className="mt-6 h-64 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" stroke={COLORS.axis} tick={{ fontSize: 12, fill: COLORS.cyan, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke={COLORS.axis} tick={{ fontSize: 12, fill: COLORS.cyan, fontFamily: 'monospace' }} tickLine={false} axisLine={false} unit=" kg" />
                <Tooltip contentStyle={{ backgroundColor: '#030305', borderColor: '#06b6d4', borderRadius: '0px', boxShadow: '0 0 10px rgba(6,182,212,0.3)', color: '#fff', fontFamily: 'monospace' }} itemStyle={{ color: '#06b6d4', fontWeight: 'bold' }} />
                <Line type="monotone" dataKey="peso" name="Carga" stroke={COLORS.cyan} strokeWidth={3} dot={{ r: 4, fill: "#030305", stroke: COLORS.cyan, strokeWidth: 2 }} activeDot={{ r: 7, fill: COLORS.cyan, stroke: "#fff", strokeWidth: 2, className: "drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-4 sm:p-6 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)]">
            <h2 className="flex items-center gap-2 text-lg font-bold text-white uppercase tracking-wider mb-2">
              <BarChart3 className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
              Sistemas Ejecutados
            </h2>
            <p className="mb-6 text-sm text-cyan-200/50 font-mono">Frecuencia de rutinas base</p>
            <div className="h-64 w-full">
              {frequencyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={frequencyData} margin={{ top: 10, right: 12, left: -24, bottom: 0 }} barGap={4}>
                    <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="nombre" stroke={COLORS.axis} tick={{ fontSize: 11, fill: COLORS.cyan, fontFamily: 'monospace' }} tickLine={false} axisLine={false} dy={8} />
                    <YAxis stroke={COLORS.axis} tick={{ fontSize: 12, fill: COLORS.cyan, fontFamily: 'monospace' }} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip cursor={{ fill: "rgba(6,182,212,0.1)" }} contentStyle={{ backgroundColor: '#030305', borderColor: '#06b6d4', borderRadius: '0px', fontFamily: 'monospace' }} itemStyle={{ color: '#fff' }} />
                    <Bar dataKey="Sesiones" fill={COLORS.cyan} radius={[2, 2, 0, 0]} maxBarSize={40} className="drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center border border-cyan-900/50 bg-cyan-950/10">
                  <p className="text-cyan-600 font-mono text-sm uppercase">Esperando datos de sistema...</p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-cyan-900/50 bg-[#0a0f1c]/80 p-4 sm:p-6 backdrop-blur-md shadow-[0_0_20px_rgba(6,182,212,0.05)] flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4">
              <h2 className="flex items-center gap-2 text-lg font-bold text-white uppercase tracking-wider">
                <Activity className="h-5 w-5 text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]" />
                Mapa de Activación
              </h2>
              <div className="flex bg-[#030305] p-1 border border-cyan-900/50">
                <button onClick={() => setBodyView('anterior')} className={`px-4 py-1 text-xs font-bold uppercase tracking-wider transition-all ${bodyView === 'anterior' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-cyan-700 hover:text-cyan-400'}`}>Frontal</button>
                <button onClick={() => setBodyView('posterior')} className={`px-4 py-1 text-xs font-bold uppercase tracking-wider transition-all ${bodyView === 'posterior' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]' : 'text-cyan-700 hover:text-cyan-400'}`}>Dorsal</button>
              </div>
            </div>

            <div className="flex-1 w-full flex items-center justify-center p-2 bg-[#030305]/80 border border-cyan-900/30 relative shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]">
              {/* Efecto de luz de fondo para el holograma */}
              <div className="absolute inset-0 bg-cyan-500/5 blur-3xl rounded-full" />
              
              {highlightedMuscles.length > 0 && highlightedMuscles[0].muscles.length > 0 ? (
                <Model
                  data={highlightedMuscles}
                  style={{ width: '15rem', filter: 'drop-shadow(0 0 10px rgba(6,182,212,0.2))' }} 
                  type={bodyView}
                  gender={userGender}
                  color="#0f172a" // Color de armadura oscura para músculos inactivos
                  highlightedColors={["#f97316"]} // Fuego neón para músculos activos
                />
              ) : (
                <div className="h-full flex items-center justify-center w-full py-12">
                  <p className="text-cyan-600 font-mono text-sm uppercase text-center">Inicia una misión<br/>para encender el avatar.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}