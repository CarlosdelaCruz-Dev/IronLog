import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase"; // <-- Conexión real a tu base de datos
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
} from "lucide-react";

const COLORS = {
  orange: "#f97316",
  emerald: "#34d399",
  sky: "#38bdf8",
  grid: "#1e293b",
  axis: "#64748b",
};

function StatCard({ icon: Icon, label, value, unit, hint, accent }) {
  const accentStyles = accent === "orange" ? "bg-orange-500/10 text-orange-500 ring-orange-500/20" : "bg-emerald-400/10 text-emerald-400 ring-emerald-400/20";
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-5 transition-colors hover:border-slate-700">
      <div className={`pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-40 ${accent === "orange" ? "bg-orange-500" : "bg-emerald-400"}`} />
      <div className="relative flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-400">{label}</p>
          <p className="mt-2 flex items-baseline gap-1.5 text-3xl font-bold tracking-tight text-white">
            {value} {unit && <span className="text-base font-medium text-slate-500">{unit}</span>}
          </p>
          <p className="mt-1 text-xs text-slate-500">{hint}</p>
        </div>
        <div className={`rounded-xl p-2.5 ring-1 ${accentStyles}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Recibe la "session" que le acabamos de pasar en App.jsx
export default function ProgressCharts({ session }) {
  const [workouts, setWorkouts] = useState([]);
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.id) {
      fetchRealData();
    }
  }, [session]);

  const fetchRealData = async () => {
    // 1. Traer todos los entrenamientos de este usuario
    const { data: wData } = await supabase.from('workouts').select('*').eq('user_id', session.user.id).order('date', { ascending: true });
    
    // 2. Traer todos los ejercicios y unirlos con la fecha de su entrenamiento
    const { data: eData } = await supabase.from('exercises').select('*, workouts(date)').eq('user_id', session.user.id);

    if (wData) setWorkouts(wData);
    if (eData) {
      setExercises(eData);
      // Extraer nombres únicos para el menú desplegable automáticamente
      const uniqueNames = [...new Set(eData.map(e => e.name))];
      if (uniqueNames.length > 0) setSelectedExercise(uniqueNames[0]);
    }
    setLoading(false);
  };

  // --- CÁLCULOS AUTOMÁTICOS ---

  // Lista dinámica de ejercicios que has registrado
  const uniqueExercises = useMemo(() => {
    return [...new Set(exercises.map(e => e.name))].filter(Boolean);
  }, [exercises]);

  // Datos para la gráfica de línea (Evolución de peso del ejercicio seleccionado)
  const lineChartData = useMemo(() => {
    if (!selectedExercise) return [];
    const filtered = exercises.filter(e => e.name === selectedExercise && e.weight);
    
    // Ordenar por fecha cronológicamente
    filtered.sort((a, b) => new Date(a.workouts?.date) - new Date(b.workouts?.date));
    
    return filtered.map(e => ({
      fecha: new Date(e.workouts?.date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }),
      peso: e.weight
    }));
  }, [exercises, selectedExercise]);

  // Estadísticas del ejercicio seleccionado
  const exerciseStats = useMemo(() => {
    if (lineChartData.length === 0) return { max: 0, diff: 0, pct: 0 };
    const first = lineChartData[0].peso;
    const last = lineChartData[lineChartData.length - 1].peso;
    const diff = (last - first).toFixed(1);
    const pct = first > 0 ? ((diff / first) * 100).toFixed(1) : 0;
    const max = Math.max(...lineChartData.map((d) => d.peso));
    return { diff, pct, max };
  }, [lineChartData]);

  // Volumen Total (Aproximación de series x peso x reps estimadas)
  const totalVolume = useMemo(() => {
    return exercises.reduce((acc, ex) => {
      if (!ex.weight) return acc;
      // Intenta sumar las repeticiones (ej. "12,10,8" = 30). Si es texto, asume 10 reps por serie.
      const repsArray = ex.reps.split(',').map(r => parseInt(r.trim())).filter(r => !isNaN(r));
      const totalReps = repsArray.length > 0 ? repsArray.reduce((a,b) => a+b, 0) : (ex.sets * 10);
      return acc + (totalReps * ex.weight);
    }, 0);
  }, [exercises]);

  // Frecuencia de Tipos de Rutina (Gráfica de Barras)
  const frequencyData = useMemo(() => {
    const counts = {};
    workouts.forEach(w => {
      const type = w.split_type.split(':')[0].trim(); // Saca solo "Push", "Pierna y Glúteo", etc.
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ nombre: k, Sesiones: counts[k] }));
  }, [workouts]);

  if (loading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-orange-500 animate-pulse font-bold">Cargando tus estadísticas...</div>;

  return (
    <section className="min-h-screen bg-slate-950 px-4 py-6 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6 mb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-orange-500">IronLog</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">Tu progreso real</h1>
            <p className="mt-1 text-sm text-slate-400">Tus datos analizados directamente desde la base de datos.</p>
          </div>
          <Link to="/" className="flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 text-slate-200 text-sm font-medium transition-colors w-full sm:w-auto">
            ← Volver al Panel
          </Link>
        </header>

        {/* Tarjetas de Resumen */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Dumbbell} label="Entrenamientos totales" value={workouts.length} hint="Días registrados en la app" accent="orange" />
          <StatCard icon={Weight} label="Volumen total movido" value={(totalVolume / 1000).toLocaleString("es-MX", { maximumFractionDigits: 1 })} unit="ton" hint={`${totalVolume.toLocaleString("es-MX")} kg acumulados`} accent="emerald" />
          <StatCard icon={Flame} label="Ejercicios Diferentes" value={uniqueExercises.length} hint="Variedad en tus rutinas" accent="orange" />
        </div>

        {/* Gráfica de Línea: Progreso de Peso */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Evolución de fuerza
              </h2>
              {lineChartData.length > 0 ? (
                <p className="mt-1 text-sm text-slate-400">Mejor marca: <span className="font-semibold text-white">{exerciseStats.max} kg</span></p>
              ) : (
                <p className="mt-1 text-sm text-slate-400">No hay datos de peso para este ejercicio aún.</p>
              )}
            </div>
            
            {/* SELECTOR DINÁMICO */}
            <select 
              value={selectedExercise} 
              onChange={(e) => setSelectedExercise(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-sm focus:outline-none focus:border-orange-500"
            >
              {uniqueExercises.length === 0 && <option>Sin ejercicios registrados</option>}
              {uniqueExercises.map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {lineChartData.length > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400 ring-1 ring-emerald-400/20">
              <TrendingUp className="h-3.5 w-3.5" />
              {exerciseStats.diff >= 0 ? "+" : ""}{exerciseStats.diff} kg ({exerciseStats.pct}%) desde tu primer registro
            </div>
          )}

          <div className="mt-4 h-64 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineChartData} margin={{ top: 10, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="fecha" stroke={COLORS.axis} tick={{ fontSize: 12, fill: COLORS.axis }} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke={COLORS.axis} tick={{ fontSize: 12, fill: COLORS.axis }} tickLine={false} axisLine={false} unit=" kg" />
                <Tooltip contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }} itemStyle={{ color: '#f97316' }} />
                <Line type="monotone" dataKey="peso" name="Peso" stroke={COLORS.orange} strokeWidth={3} dot={{ r: 4, fill: "#0f172a", stroke: COLORS.orange, strokeWidth: 2 }} activeDot={{ r: 6, fill: COLORS.orange, stroke: "#fff", strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de Barras: Distribución de Rutinas */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-6">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
            <BarChart3 className="h-5 w-5 text-emerald-400" />
            Distribución de Entrenamientos
          </h2>
          <p className="mt-1 text-sm text-slate-400">Total histórico por tipo de rutina</p>

          <div className="mt-6 h-64 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={frequencyData} margin={{ top: 10, right: 12, left: -24, bottom: 0 }} barGap={4}>
                <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="nombre" stroke={COLORS.axis} tick={{ fontSize: 12, fill: COLORS.axis }} tickLine={false} axisLine={false} dy={8} />
                <YAxis stroke={COLORS.axis} tick={{ fontSize: 12, fill: COLORS.axis }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip cursor={{ fill: "rgba(148,163,184,0.08)" }} contentStyle={{ backgroundColor: '#020617', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="Sesiones" fill={COLORS.emerald} radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </section>
  );
}