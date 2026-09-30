import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Link } from 'react-router'
import BrandMark from '../components/BrandMark'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceArea, Legend,
} from 'recharts'

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  navy:    '#07111F',
  navy2:   '#122741',
  navy3:   '#0d1e34',
  gold:    '#D8AD57',
  goldSoft:'#F4E6C8',
  paper:   '#F4F6F8',
  green:   '#71D6A3',
  orange:  '#E8732A',
  red:     '#D9534F',
  muted:   '#7A8FA8',
  line:    'rgba(255,255,255,.1)',
  cardBg:  '#0f1e31',
}

// ─── TYPES ────────────────────────────────────────────────────────────────────
type SHMSection = 'resumen'|'comportamiento'|'eventos'|'sensores'|'alertas'|'informes'|'config'
type SensorStatus = 'ok'|'warning'|'offline'|'critical'
interface Sensor {
  id: string; label: string; floorIndex: number; floorNum: string
  status: SensorStatus; battery: string|null; signal: number
  temp: number; lastComm: string; accel: string
  maintenance: string[]
}

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const SENSORS: Sensor[] = [
  { id:'S-01', label:'Cubierta',  floorIndex:0, floorNum:'CUB',  status:'ok',       battery:'94%', signal:-65, temp:28.4, lastComm:'Hace 12 s', accel:'0.0023 g', maintenance:['2024-03-10 — Revisión rutinaria','2023-09-05 — Calibración inicial'] },
  { id:'S-02', label:'Piso 7',    floorIndex:2, floorNum:'P7',   status:'ok',       battery:'87%', signal:-71, temp:26.1, lastComm:'Hace 12 s', accel:'0.0031 g', maintenance:['2024-01-22 — Revisión rutinaria'] },
  { id:'S-03', label:'Piso 5',    floorIndex:4, floorNum:'P5',   status:'warning',  battery:'23%', signal:-80, temp:25.8, lastComm:'Hace 34 s', accel:'0.0027 g', maintenance:['2023-11-15 — Cambio de batería recomendado'] },
  { id:'S-04', label:'Piso 3',    floorIndex:6, floorNum:'P3',   status:'ok',       battery:'76%', signal:-69, temp:25.3, lastComm:'Hace 12 s', accel:'0.0018 g', maintenance:['2024-02-08 — Revisión rutinaria'] },
  { id:'S-05', label:'Sótano',    floorIndex:8, floorNum:'SOT',  status:'ok',       battery:null,  signal:-62, temp:22.1, lastComm:'Hace 12 s', accel:'0.0011 g', maintenance:['2024-03-01 — Revisión rutinaria','2023-09-05 — Instalación'] },
]

const SEISMIC_EVENTS = [
  { id:'EV-001', date:'2024-04-14', time:'07:23:41', pga:0.23, drift:0.8,  dur:18, level:'Bajo',   inspect:false, sensors:['S-01','S-02','S-03','S-04','S-05'] },
  { id:'EV-002', date:'2024-02-28', time:'14:05:12', pga:0.07, drift:0.2,  dur:8,  level:'Bajo',   inspect:false, sensors:['S-01','S-02'] },
  { id:'EV-003', date:'2023-12-09', time:'03:48:55', pga:0.11, drift:0.35, dur:11, level:'Bajo',   inspect:false, sensors:['S-01','S-02','S-03','S-04'] },
]

const TREND_DATA = [
  { mes:'Ene', t:1.20 }, { mes:'Feb', t:1.21 }, { mes:'Mar', t:1.21 },
  { mes:'Abr', t:1.22 }, { mes:'May', t:1.23 }, { mes:'Jun', t:1.22 },
  { mes:'Jul', t:1.26 }, { mes:'Ago', t:1.29 }, { mes:'Sep', t:1.32 },
  { mes:'Oct', t:1.35 }, { mes:'Nov', t:1.37 }, { mes:'Dic', t:1.38 },
]

const BASELINE = 1.22
const TOLERANCE_HI = 1.30
const TOLERANCE_LO = 1.14

const KPI_ITEMS = [
  { label:'Periodo fundamental', value:'1,22', unit:'s',    delta:'+0,02 s vs. línea base', status:'ok'      as const, spark:[1.20,1.21,1.21,1.22,1.23,1.22,1.26] },
  { label:'Frecuencia natural',  value:'0,82', unit:'Hz',   delta:'−0,01 Hz vs. línea base',status:'ok'      as const, spark:[0.83,0.83,0.83,0.82,0.82,0.83,0.82] },
  { label:'PGA último evento',   value:'0,05', unit:'g',    delta:'Nivel de registro normal',status:'ok'      as const, spark:[0.02,0.03,0.05,0.04,0.05,0.05,0.05] },
  { label:'Deriva máxima',       value:'0,18', unit:'%',    delta:'Límite de servicio: 0,5%',status:'ok'      as const, spark:[0.10,0.12,0.18,0.15,0.18,0.17,0.18] },
  { label:'Amortiguamiento',     value:'4,6',  unit:'%',    delta:'+0,4% vs. línea base',   status:'warning' as const, spark:[4.2,4.3,4.5,4.6,4.7,4.6,4.6] },
  { label:'Sensores operativos', value:'5/5',  unit:'',     delta:'Sin alertas activas',     status:'ok'      as const, spark:[5,5,5,5,5,5,5] },
]

const NAV_ITEMS: { id: SHMSection; label: string; icon: string }[] = [
  { id:'resumen',        label:'Resumen',       icon:'⊡' },
  { id:'comportamiento', label:'Comportamiento', icon:'〜' },
  { id:'eventos',        label:'Eventos',        icon:'⚡' },
  { id:'sensores',       label:'Sensores',       icon:'◎' },
  { id:'alertas',        label:'Alertas',        icon:'△' },
  { id:'informes',       label:'Informes',       icon:'📄' },
  { id:'config',         label:'Configuración',  icon:'⚙' },
]

// ─── GENERATE LIVE ACCEL DATA ─────────────────────────────────────────────────
function genAccelData(n = 80) {
  return Array.from({ length: n }, (_, i) => ({
    t: i,
    x: +(Math.sin(i * 0.23) * 0.0032 + (Math.random() - 0.5) * 0.003).toFixed(4),
    y: +(Math.cos(i * 0.18) * 0.0025 + (Math.random() - 0.5) * 0.0025).toFixed(4),
    z: +(Math.sin(i * 0.31) * 0.0014 + (Math.random() - 0.5) * 0.0015).toFixed(4),
  }))
}

// ─── STATUS HELPERS ───────────────────────────────────────────────────────────
function statusColor(s: SensorStatus | 'ok' | 'warning' | 'critical') {
  if (s === 'ok')       return C.green
  if (s === 'warning')  return '#F59E0B'
  if (s === 'critical') return C.red
  return C.muted
}
function statusLabel(s: SensorStatus) {
  if (s === 'ok')       return 'Operativo'
  if (s === 'warning')  return 'Requiere revisión'
  if (s === 'critical') return 'Evento crítico'
  return 'Sin conexión'
}
function kpiStatusColor(s: 'ok'|'warning'|'critical') {
  if (s === 'ok')       return C.green
  if (s === 'warning')  return C.orange
  return C.red
}

// ─── SPARKLINE ────────────────────────────────────────────────────────────────
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const w = 72, h = 26
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 2) - 1}`).join(' ')
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  )
}

// ─── PULSING DOT ─────────────────────────────────────────────────────────────
function PulsingDot({ color = C.green }: { color?: string }) {
  return (
    <span className="relative inline-flex">
      <span className="absolute inset-0 rounded-full animate-ping opacity-60" style={{ background: color }} />
      <span className="relative w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    </span>
  )
}

// ─── TOP BAR ─────────────────────────────────────────────────────────────────
function TopBar({ onMenuToggle }: { onMenuToggle: () => void }) {
  const [tick, setTick] = useState(12)
  useEffect(() => {
    const id = setInterval(() => setTick(t => t < 60 ? t + 1 : 12), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <header className="flex items-center justify-between gap-3 px-4 md:px-6 h-14 shrink-0 border-b" style={{ background: C.navy, borderColor: C.line }}>
      {/* Left: mobile menu + building */}
      <div className="flex items-center gap-3 min-w-0">
        <button className="md:hidden border-0 bg-transparent text-white p-1.5 cursor-pointer shrink-0" onClick={onMenuToggle} aria-label="Menú">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="white" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <BrandMark height={18} color="#ffffff" className="shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-sm text-white truncate">Edificio Torre Central</span>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="shrink-0"><path d="M2 3.5l3 3 3-3" stroke={C.muted} strokeWidth="1.5" strokeLinecap="round"/></svg>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <PulsingDot />
              <span className="text-xs font-medium" style={{ color: C.green }}>Monitoreo activo</span>
              <span className="text-xs hidden sm:inline" style={{ color: C.muted }}>· Hace {tick} s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button className="hidden sm:inline-flex items-center gap-2 min-h-[34px] px-4 rounded-lg text-xs font-bold border-0 cursor-pointer transition-all hover:brightness-110"
          style={{ background: C.gold, color: '#172033' }}>
          Generar informe
        </button>
        {/* Notifications */}
        <button className="relative w-9 h-9 rounded-lg flex items-center justify-center border-0 cursor-pointer transition-colors hover:bg-white/5" style={{ background: 'rgba(255,255,255,.06)' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 1.5a5 5 0 0 1 5 5v2.5l1 2H1l1-2V6.5a5 5 0 0 1 5-5Zm0 0V.5m0 14a1.5 1.5 0 0 0 3 0" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full" style={{ background: C.red }} />
        </button>
        {/* Profile */}
        <button className="w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs border-0 cursor-pointer" style={{ background: C.gold, color: '#172033' }}>
          AA
        </button>
        {/* Demo badge */}
        <span className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase border" style={{ borderColor: C.gold, color: C.gold, background: 'rgba(216,173,87,.07)' }}>
          Demo
        </span>
      </div>
    </header>
  )
}

// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({ active, onChange, mobile, onClose }: { active: SHMSection; onChange: (s: SHMSection) => void; mobile?: boolean; onClose?: () => void }) {
  return (
    <aside className={mobile
      ? 'fixed inset-0 z-40 flex'
      : 'hidden md:flex flex-col w-[220px] shrink-0 border-r overflow-y-auto'}
      style={{ background: C.navy, borderColor: C.line }}>
      {mobile && <div className="absolute inset-0 bg-black/50" onClick={onClose} />}
      <div className={mobile ? 'relative z-10 flex flex-col w-[220px] h-full border-r overflow-y-auto' : 'flex flex-col h-full'} style={{ background: C.navy, borderColor: C.line }}>
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 h-14 border-b shrink-0" style={{ borderColor: C.line }}>
          <BrandMark height={18} color="#ffffff" className="shrink-0" />
          <span className="text-white font-bold text-sm leading-tight">SHM Panel</span>
        </div>
        {/* Nav items */}
        <nav className="flex-1 py-4 px-3">
          {NAV_ITEMS.map(item => (
            <button key={item.id}
              onClick={() => { onChange(item.id); onClose?.() }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-left border-0 cursor-pointer transition-all duration-150"
              style={{
                background: active === item.id ? 'rgba(216,173,87,.13)' : 'transparent',
                color: active === item.id ? C.gold : C.muted,
                fontWeight: active === item.id ? 600 : 400,
              }}>
              <span className="text-base w-5 text-center shrink-0" aria-hidden="true">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {item.id === 'alertas' && (
                <span className="ml-auto w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0" style={{ background: C.orange, color: 'white' }}>1</span>
              )}
            </button>
          ))}
        </nav>
        {/* Back link */}
        <div className="px-3 py-4 border-t shrink-0" style={{ borderColor: C.line }}>
          <Link to="/" className="flex items-center gap-2 px-3 py-2.5 rounded-lg no-underline text-sm transition-colors hover:bg-white/5" style={{ color: C.muted }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
            Volver al sitio
          </Link>
        </div>
      </div>
    </aside>
  )
}

// ─── BOTTOM NAV (mobile) ──────────────────────────────────────────────────────
function BottomNav({ active, onChange }: { active: SHMSection; onChange: (s: SHMSection) => void }) {
  const items = NAV_ITEMS.slice(0, 5)
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex border-t" style={{ background: C.navy, borderColor: C.line }}>
      {items.map(item => (
        <button key={item.id} onClick={() => onChange(item.id)}
          className="flex-1 flex flex-col items-center gap-1 py-2.5 border-0 cursor-pointer transition-colors min-h-[56px]"
          style={{ background: 'transparent', color: active === item.id ? C.gold : C.muted }}>
          <span className="text-base leading-none" aria-hidden="true">{item.icon}</span>
          <span className="text-[10px] font-medium leading-none">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

// ─── KPI CARD ────────────────────────────────────────────────────────────────
function KPICard({ label, value, unit, delta, status, spark }: typeof KPI_ITEMS[0]) {
  const sc = kpiStatusColor(status)
  return (
    <div className="rounded-xl p-4 flex flex-col gap-3 border" style={{ background: C.cardBg, borderColor: C.line }}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium leading-snug" style={{ color: C.muted }}>{label}</span>
        <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: sc, boxShadow: `0 0 0 3px ${sc}22` }} aria-label={status === 'ok' ? 'Normal' : status === 'warning' ? 'Advertencia' : 'Alerta'} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div>
          <span className="text-2xl font-bold text-white tabular-nums">{value}</span>
          {unit && <span className="ml-1 text-sm font-medium" style={{ color: C.muted }}>{unit}</span>}
        </div>
        <Sparkline data={spark} color={sc} />
      </div>
      <span className="text-[11px] leading-tight" style={{ color: sc === C.green ? C.muted : sc }}>{delta}</span>
    </div>
  )
}

// ─── ACCELERATION CHART ───────────────────────────────────────────────────────
function AccelerationChart() {
  const [range, setRange] = useState<'live'|'1h'|'24h'|'7d'>('live')
  const [sensor, setSensor] = useState('S-01')
  const [data, setData] = useState(() => genAccelData())

  useEffect(() => {
    if (range !== 'live') return
    const id = setInterval(() => {
      setData(prev => {
        const next = [...prev.slice(1)]
        const last = prev[prev.length - 1]
        next.push({
          t: last.t + 1,
          x: +(Math.sin(last.t * 0.23) * 0.0032 + (Math.random() - 0.5) * 0.003).toFixed(4),
          y: +(Math.cos(last.t * 0.18) * 0.0025 + (Math.random() - 0.5) * 0.0025).toFixed(4),
          z: +(Math.sin(last.t * 0.31) * 0.0014 + (Math.random() - 0.5) * 0.0015).toFixed(4),
        })
        return next
      })
    }, 1000)
    return () => clearInterval(id)
  }, [range])

  const rangeLabels: Record<typeof range, string> = { live:'En vivo', '1h':'1 hora', '24h':'24 horas', '7d':'7 días' }

  return (
    <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-white m-0">Señal de aceleración</h3>
            {range === 'live' && (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: 'rgba(113,214,163,.12)', color: C.green }}>
                <PulsingDot /> Datos en vivo
              </span>
            )}
          </div>
          <span className="text-xs" style={{ color: C.muted }}>Aceleración absoluta — m/s²</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={sensor} onChange={e => setSensor(e.target.value)}
            className="border rounded-lg px-3 h-8 text-xs cursor-pointer"
            style={{ background: C.navy2, borderColor: C.line, color: 'white' }}>
            {SENSORS.map(s => <option key={s.id} value={s.id}>{s.id} — {s.label}</option>)}
          </select>
          <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: C.line }}>
            {(['live','1h','24h','7d'] as const).map(r => (
              <button key={r} onClick={() => { setRange(r); if (r !== 'live') setData(genAccelData()) }}
                className="px-3 h-8 text-xs font-medium border-0 cursor-pointer transition-colors"
                style={{ background: range === r ? C.gold : 'transparent', color: range === r ? '#172033' : C.muted }}>
                {rangeLabels[r]}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 420, height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="t" tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} interval={19} />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} tickFormatter={v => `${v}g`} domain={['auto','auto']} />
              <Tooltip
                contentStyle={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: C.muted }}
                itemStyle={{ color: 'white' }}
                formatter={(v) => [`${v} g`]}
              />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} formatter={v => <span style={{ color: C.muted }}>{v}</span>} />
              <Line type="monotone" dataKey="x" name="Eje X" stroke={C.gold}   strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="y" name="Eje Y" stroke="#6CB4F5"  strokeWidth={1.5} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="z" name="Eje Z" stroke={C.green}  strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─── TREND CHART ──────────────────────────────────────────────────────────────
function TrendChart() {
  const warningStartIdx = TREND_DATA.findIndex(d => d.t > TOLERANCE_HI)
  return (
    <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h3 className="text-sm font-semibold text-white m-0 mb-1">Tendencia estructural — Periodo fundamental</h3>
          <span className="text-xs" style={{ color: C.muted }}>Últimos 12 meses · Línea base 1,22 s</span>
        </div>
        <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(232,115,42,.12)', color: C.orange }}>
          △ Variación relevante
        </span>
      </div>
      {/* Warning message */}
      <div className="flex items-start gap-2 mt-3 mb-4 p-3 rounded-lg" style={{ background: 'rgba(232,115,42,.1)', border: `1px solid rgba(232,115,42,.25)` }}>
        <span style={{ color: C.orange }}>△</span>
        <p className="text-xs leading-relaxed m-0" style={{ color: '#F5A672' }}>
          <strong>Variación relevante detectada.</strong> El periodo fundamental ha aumentado un 13,1% respecto a la línea base en los últimos 6 meses. Se recomienda revisión técnica.
        </p>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={TREND_DATA} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
            <XAxis dataKey="mes" tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} domain={[1.10, 1.45]} tickFormatter={v => `${v.toFixed(2)}`} />
            <Tooltip
              contentStyle={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }}
              labelStyle={{ color: C.muted }}
              formatter={(v) => [`${Number(v).toFixed(2)} s`, 'Periodo']}
            />
            {/* Tolerance band */}
            <ReferenceArea y1={TOLERANCE_LO} y2={TOLERANCE_HI} fill="rgba(113,214,163,.06)" />
            {/* Warning zone */}
            <ReferenceArea y1={TOLERANCE_HI} y2={1.45} fill="rgba(232,115,42,.06)" />
            {/* Baseline */}
            <ReferenceLine y={BASELINE} stroke={C.muted} strokeDasharray="4 3" label={{ value:'Línea base', fill: C.muted, fontSize: 10, position:'right' }} />
            <ReferenceLine y={TOLERANCE_HI} stroke={C.orange} strokeDasharray="3 2" strokeOpacity={0.5} />
            <Line type="monotone" dataKey="t" name="Periodo (s)" stroke={C.gold} strokeWidth={2} dot={(props) => {
              const { cx, cy, payload } = props
              return <circle key={`dot-${payload.mes}`} cx={cx} cy={cy} r={3} fill={payload.t > TOLERANCE_HI ? C.orange : C.gold} stroke="none" />
            }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="flex flex-wrap items-center gap-4 mt-3">
        {[{ color: C.green, opacity:.5, label:'Banda de tolerancia (±8%)' }, { color: C.orange, opacity:.4, label:'Zona de variación relevante' }, { color: C.gold, label:'Periodo medido' }, { color: C.muted, dash: true, label:'Línea base (1,22 s)' }].map(l => (
          <span key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
            <span className="w-5 h-0.5 inline-block rounded" style={{ background: l.color, opacity: l.opacity ?? 1, borderTop: l.dash ? `1px dashed ${l.color}` : undefined, height: l.dash ? 0 : undefined }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── BUILDING MODEL ───────────────────────────────────────────────────────────
function BuildingModel({ selectedId, onSelect }: { selectedId: string|null; onSelect: (id: string) => void }) {
  const FLOORS = 9
  const FH = 36
  const BW = 100
  const BX = 48
  const svgH = FLOORS * FH + 48

  const floorLabels = ['CUB','P8','P7','P6','P5','P4','P3','P2','SOT']

  return (
    <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
      <h3 className="text-sm font-semibold text-white m-0 mb-1">Modelo del edificio</h3>
      <p className="text-xs mb-4" style={{ color: C.muted }}>Seleccione un sensor para ver detalles</p>
      <div className="flex justify-center">
        <svg width={BX + BW + 60} height={svgH} viewBox={`0 0 ${BX + BW + 60} ${svgH}`} aria-label="Esquema del edificio con sensores">
          {/* Building floors */}
          {Array.from({ length: FLOORS }, (_, i) => (
            <g key={i}>
              <rect x={BX} y={i * FH + 24} width={BW} height={FH}
                fill={i % 2 === 0 ? '#0d1e34' : '#0b1a2c'}
                stroke="rgba(255,255,255,.1)" strokeWidth="0.5" />
              <text x={BX - 6} y={i * FH + 24 + FH / 2 + 4} textAnchor="end" fontSize="9" fill={C.muted}>{floorLabels[i]}</text>
            </g>
          ))}
          {/* Sensors */}
          {SENSORS.map(s => {
            const cy = s.floorIndex * FH + 24 + FH / 2
            const cx = BX + BW + 16
            const col = statusColor(s.status)
            const selected = selectedId === s.id
            return (
              <g key={s.id} onClick={() => onSelect(s.id)} style={{ cursor: 'pointer' }} role="button" aria-label={`Sensor ${s.id} — ${s.label}`}>
                {/* Connection line */}
                <line x1={BX + BW} y1={cy} x2={cx - 8} y2={cy} stroke={col} strokeWidth="1" strokeOpacity={0.5} strokeDasharray="3 2" />
                {/* Sensor dot */}
                {selected && <circle cx={cx} cy={cy} r={13} fill="transparent" stroke={col} strokeWidth="1.5" strokeOpacity={0.4} />}
                <circle cx={cx} cy={cy} r={8} fill={selected ? col : 'transparent'} stroke={col} strokeWidth="2" />
                <circle cx={cx} cy={cy} r={3} fill={selected ? 'white' : col} />
                <text x={cx + 14} y={cy + 4} fontSize="9" fill={C.muted}>{s.id}</text>
              </g>
            )
          })}
          {/* Ground */}
          <rect x={BX - 8} y={FLOORS * FH + 24} width={BW + 16} height={4} fill={C.muted} rx="1" fillOpacity={0.3} />
        </svg>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-3 justify-center">
        {([['ok','Operativo'],['warning','Revisión'],['offline','Sin señal'],['critical','Crítico']] as [SensorStatus,string][]).map(([st, lb]) => (
          <span key={st} className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColor(st) }} />
            {lb}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── SENSOR DETAIL PANEL ─────────────────────────────────────────────────────
function SensorPanel({ sensor, onClose }: { sensor: Sensor; onClose: () => void }) {
  const sc = statusColor(sensor.status)
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: C.cardBg, borderColor: C.line }}>
      <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.line }}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white">{sensor.id}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${sc}20`, color: sc }}>{statusLabel(sensor.status)}</span>
          </div>
          <span className="text-xs" style={{ color: C.muted }}>{sensor.label}</span>
        </div>
        <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center border-0 cursor-pointer" style={{ background: 'rgba(255,255,255,.06)', color: C.muted }}>✕</button>
      </div>
      <div className="p-5 grid grid-cols-2 gap-3">
        {[
          { label: 'Ubicación',       value: sensor.label },
          { label: 'Alimentación',    value: sensor.battery ?? 'Cableado (AC)' },
          { label: 'Señal (dBm)',     value: `${sensor.signal} dBm` },
          { label: 'Temperatura',     value: `${sensor.temp} °C` },
          { label: 'Última com.',     value: sensor.lastComm },
          { label: 'Aceleración',     value: sensor.accel },
        ].map(row => (
          <div key={row.label}>
            <p className="text-[10px] m-0 mb-0.5" style={{ color: C.muted }}>{row.label}</p>
            <p className="text-xs font-semibold text-white m-0">{row.value}</p>
          </div>
        ))}
      </div>
      <div className="px-5 pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-wider mb-2" style={{ color: C.muted }}>Historial de mantenimiento</p>
        <ul className="m-0 p-0 list-none flex flex-col gap-1.5">
          {sensor.maintenance.map(m => (
            <li key={m} className="flex items-start gap-2 text-xs" style={{ color: '#9ab' }}>
              <span style={{ color: C.gold }}>—</span>{m}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// ─── SEISMIC EVENT CARD ──────────────────────────────────────────────────────
function SeismicEventCard({ ev }: { ev: typeof SEISMIC_EVENTS[0] }) {
  const pgaWarning = ev.pga >= 0.15
  const pgaAlert   = ev.pga >= 0.30
  const color = pgaAlert ? C.red : pgaWarning ? C.orange : C.green
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: C.cardBg, borderColor: color, borderLeftWidth: 3 }}>
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b" style={{ borderColor: C.line }}>
        <div className="flex items-center gap-3">
          <span className="text-xl" aria-hidden="true">⚡</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Evento detectado</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${color}20`, color }}>
                Respuesta {ev.level}
              </span>
            </div>
            <span className="text-xs" style={{ color: C.muted }}>{ev.date} — {ev.time} · Duración: {ev.dur} s</span>
          </div>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-lg" style={{ background: ev.inspect ? 'rgba(217,83,79,.15)' : 'rgba(113,214,163,.1)', color: ev.inspect ? C.red : C.green }}>
          {ev.inspect ? 'Inspección requerida' : 'Sin inspección requerida'}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-px" style={{ background: C.line }}>
        {[
          { label:'PGA',           value:`${ev.pga} g`,  color: pgaWarning ? color : 'white' },
          { label:'Deriva máxima', value:`${ev.drift} %`, color: 'white' },
          { label:'Sensores',      value:`${ev.sensors.length}/5`, color: 'white' },
        ].map(m => (
          <div key={m.label} className="px-5 py-4" style={{ background: C.cardBg }}>
            <p className="text-[10px] m-0 mb-1" style={{ color: C.muted }}>{m.label}</p>
            <p className="text-xl font-bold m-0 tabular-nums" style={{ color: m.color }}>{m.value}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 px-5 py-4">
        <button className="inline-flex items-center min-h-[34px] px-4 rounded-lg text-xs font-semibold border-0 cursor-pointer transition-all hover:brightness-110" style={{ background: C.gold, color: '#172033' }}>
          Ver análisis completo
        </button>
        <button className="inline-flex items-center min-h-[34px] px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-colors hover:bg-white/5" style={{ borderColor: C.line, color: C.muted }}>
          Descargar informe
        </button>
        <button className="inline-flex items-center min-h-[34px] px-4 rounded-lg text-xs font-semibold border cursor-pointer transition-colors hover:bg-white/5" style={{ borderColor: C.line, color: C.muted }}>
          Comparar con línea base
        </button>
      </div>
    </div>
  )
}

// ─── TECH DISCLAIMER ─────────────────────────────────────────────────────────
function TechDisclaimer() {
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl border" style={{ background: 'rgba(7,17,31,.6)', borderColor: 'rgba(255,255,255,.08)' }}>
      <span className="shrink-0 text-base" style={{ color: C.muted }}>ℹ</span>
      <p className="text-xs leading-relaxed m-0" style={{ color: C.muted }}>
        <strong style={{ color: '#9ab' }}>Aviso técnico:</strong> Este sistema no predice terremotos. Detecta movimientos en tiempo real y proporciona información para la evaluación postevento. Los datos presentados son de carácter informativo y deben ser interpretados por un ingeniero estructural calificado. Los umbrales y protocolos se calibran específicamente para cada edificio.
      </p>
    </div>
  )
}

// ─── DEMO BANNER ─────────────────────────────────────────────────────────────
function DemoBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg border mb-5" style={{ background: 'rgba(216,173,87,.06)', borderColor: 'rgba(216,173,87,.22)' }}>
      <span className="text-xs font-bold tracking-widest uppercase px-2 py-0.5 rounded" style={{ background: C.gold, color: '#172033' }}>Demostración</span>
      <span className="text-xs" style={{ color: C.muted }}>Datos simulados para fines ilustrativos. No corresponden a un edificio real.</span>
    </div>
  )
}

// ─── SUMMARY VIEW ─────────────────────────────────────────────────────────────
function SummaryView() {
  const [selectedSensor, setSelectedSensor] = useState<string|null>(null)
  const sensor = SENSORS.find(s => s.id === selectedSensor) ?? null
  return (
    <div className="flex flex-col gap-5">
      <DemoBanner />

      {/* KPI row */}
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.muted }}>Indicadores en tiempo real</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
          {KPI_ITEMS.map(k => <KPICard key={k.label} {...k} />)}
        </div>
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-5">
        <AccelerationChart />
        <TrendChart />
      </div>

      {/* Building model + sensor detail */}
      <div className="grid lg:grid-cols-[240px_1fr] gap-5">
        <BuildingModel selectedId={selectedSensor} onSelect={setSelectedSensor} />
        <div className="flex flex-col gap-5">
          {sensor
            ? <SensorPanel sensor={sensor} onClose={() => setSelectedSensor(null)} />
            : (
              <div className="rounded-xl border flex items-center justify-center p-10 text-center flex-1" style={{ background: C.cardBg, borderColor: C.line }}>
                <div>
                  <p className="text-2xl mb-2" aria-hidden="true">◎</p>
                  <p className="text-sm font-medium text-white mb-1">Seleccione un sensor</p>
                  <p className="text-xs m-0" style={{ color: C.muted }}>Haga clic en cualquier nodo del edificio para ver su estado detallado.</p>
                </div>
              </div>
            )
          }
          <SeismicEventCard ev={SEISMIC_EVENTS[0]} />
        </div>
      </div>

      <TechDisclaimer />
    </div>
  )
}

// ─── BEHAVIOR VIEW ────────────────────────────────────────────────────────────
function BehaviorView() {
  const freqData = useMemo(() => Array.from({ length: 40 }, (_, i) => ({
    f: +(i * 0.1).toFixed(1),
    amp: i === 8 ? 1.0 : i === 9 ? 0.72 : i === 21 ? 0.38 : i === 22 ? 0.28 : +(Math.random() * 0.07).toFixed(3),
  })), [])
  return (
    <div className="flex flex-col gap-5">
      <DemoBanner />
      <div className="grid sm:grid-cols-3 gap-3">
        {[
          { label:'1er modo', value:'0,82 Hz', sub:'Periodo: 1,22 s', color: C.gold },
          { label:'2do modo', value:'2,14 Hz', sub:'Periodo: 0,47 s', color: '#6CB4F5' },
          { label:'3er modo', value:'4,31 Hz', sub:'Periodo: 0,23 s', color: C.green },
        ].map(m => (
          <div key={m.label} className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line, borderLeftWidth: 3, borderLeftColor: m.color }}>
            <p className="text-xs m-0 mb-2" style={{ color: C.muted }}>{m.label}</p>
            <p className="text-2xl font-bold text-white m-0">{m.value}</p>
            <p className="text-xs m-0 mt-1" style={{ color: C.muted }}>{m.sub}</p>
          </div>
        ))}
      </div>
      <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
        <h3 className="text-sm font-semibold text-white m-0 mb-4">Espectro de frecuencias (FRF)</h3>
        <div style={{ height: 220 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={freqData} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,.06)" />
              <XAxis dataKey="f" tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} label={{ value:'Hz', position:'right', fill: C.muted, fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10, fill: C.muted }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: C.navy2, border: `1px solid ${C.line}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: C.muted }} formatter={(v) => [`${v}`, 'Amplitud']} />
              <ReferenceLine x={0.82} stroke={C.gold} strokeDasharray="3 2" label={{ value:'0,82 Hz', fill: C.gold, fontSize: 9 }} />
              <ReferenceLine x={2.14} stroke="#6CB4F5" strokeDasharray="3 2" label={{ value:'2,14 Hz', fill: '#6CB4F5', fontSize: 9 }} />
              <Line type="monotone" dataKey="amp" stroke={C.green} strokeWidth={1.5} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ─── EVENTS VIEW ─────────────────────────────────────────────────────────────
function EventsView() {
  return (
    <div className="flex flex-col gap-5">
      <DemoBanner />
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-white m-0">Registro de eventos sísmicos</h2>
        <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(255,255,255,.06)', color: C.muted }}>{SEISMIC_EVENTS.length} eventos · Últimos 12 meses</span>
      </div>
      <div className="flex flex-col gap-4">
        {SEISMIC_EVENTS.map(ev => <SeismicEventCard key={ev.id} ev={ev} />)}
      </div>
      <TechDisclaimer />
    </div>
  )
}

// ─── SENSORS VIEW ─────────────────────────────────────────────────────────────
function SensorsView() {
  const [sel, setSel] = useState<string|null>(null)
  const sensor = SENSORS.find(s => s.id === sel) ?? null
  return (
    <div className="flex flex-col gap-5">
      <DemoBanner />
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {SENSORS.map(s => {
          const sc = statusColor(s.status)
          return (
            <button key={s.id} onClick={() => setSel(sel === s.id ? null : s.id)}
              className="text-left rounded-xl border p-5 cursor-pointer transition-all hover:border-opacity-60"
              style={{ background: C.cardBg, borderColor: sel === s.id ? sc : C.line, borderWidth: sel === s.id ? 2 : 1 }}>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-sm text-white">{s.id}</span>
                <span className="flex items-center gap-1.5 text-xs font-medium" style={{ color: sc }}>
                  <span className="w-2 h-2 rounded-full" style={{ background: sc }} />
                  {statusLabel(s.status)}
                </span>
              </div>
              <p className="text-base font-semibold text-white m-0 mb-3">{s.label}</p>
              <div className="grid grid-cols-2 gap-2">
                {[['Aceleración', s.accel], ['Señal', `${s.signal} dBm`], ['Batería', s.battery ?? 'AC'], ['Temp.', `${s.temp} °C`]].map(([k, v]) => (
                  <div key={k}>
                    <p className="text-[10px] m-0" style={{ color: C.muted }}>{k}</p>
                    <p className="text-xs font-semibold text-white m-0">{v}</p>
                  </div>
                ))}
              </div>
            </button>
          )
        })}
      </div>
      {sensor && <SensorPanel sensor={sensor} onClose={() => setSel(null)} />}
      <TechDisclaimer />
    </div>
  )
}

// ─── ALERTS VIEW ─────────────────────────────────────────────────────────────
function AlertsView() {
  const [notif, setNotif] = useState({ app: true, email: true, whatsapp: false })
  const thresholds = [
    { pga:'< 0,05 g', label:'Registro normal',               color: C.green,  icon:'✓' },
    { pga:'0,05–0,15 g', label:'Aviso — revisión sugerida',  color: C.gold,   icon:'△' },
    { pga:'0,15–0,30 g', label:'Alerta técnica',             color: C.orange, icon:'⚠' },
    { pga:'> 0,30 g',    label:'Inspección inmediata',       color: C.red,    icon:'🔴' },
  ]
  return (
    <div className="flex flex-col gap-5">
      <DemoBanner />

      {/* Alert history */}
      <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
        <h3 className="text-sm font-semibold text-white m-0 mb-4">Historial de alertas recientes</h3>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(232,115,42,.08)', border: `1px solid rgba(232,115,42,.2)` }}>
            <span style={{ color: C.orange }}>⚠</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold m-0" style={{ color: C.orange }}>Batería baja — Sensor S-03</p>
              <p className="text-[10px] m-0" style={{ color: C.muted }}>Piso 5 · Batería al 23% · Requiere reemplazo</p>
            </div>
            <span className="text-[10px] shrink-0" style={{ color: C.muted }}>Hoy</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(113,214,163,.05)', border: `1px solid rgba(113,214,163,.12)` }}>
            <span style={{ color: C.green }}>✓</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold m-0" style={{ color: C.green }}>Evento sísmico registrado — Nivel bajo</p>
              <p className="text-[10px] m-0" style={{ color: C.muted }}>PGA 0,23 g · 14 abr 2024 · Sin inspección requerida</p>
            </div>
            <span className="text-[10px] shrink-0" style={{ color: C.muted }}>14 abr</span>
          </div>
        </div>
      </div>

      {/* Threshold scale */}
      <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
        <h3 className="text-sm font-semibold text-white m-0 mb-1">Escala de umbrales de PGA</h3>
        <p className="text-xs mb-4" style={{ color: C.muted }}>Valores ilustrativos. Los umbrales se calibran para cada edificio.</p>
        <div className="flex flex-col gap-2">
          {thresholds.map(t => (
            <div key={t.pga} className="flex items-center gap-4 px-4 py-3 rounded-lg border" style={{ background: `${t.color}0d`, borderColor: `${t.color}30` }}>
              <span className="text-base w-5 text-center shrink-0" aria-hidden="true">{t.icon}</span>
              <div className="flex-1 grid grid-cols-2 gap-2">
                <span className="text-sm font-bold tabular-nums" style={{ color: t.color }}>{t.pga}</span>
                <span className="text-sm" style={{ color: '#c5d0dc' }}>{t.label}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px] mt-4 leading-relaxed" style={{ color: C.muted }}>
          Valores ilustrativos. Los umbrales y protocolos se calibran específicamente para cada edificio según su tipología estructural, zona de amenaza sísmica y uso.
        </p>
      </div>

      {/* Notification config */}
      <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
        <h3 className="text-sm font-semibold text-white m-0 mb-4">Configuración de notificaciones</h3>
        <div className="flex flex-col gap-3">
          {([['app','Aplicación','Notificaciones push y en panel'],['email','Correo electrónico','Reporte automático por e-mail'],['whatsapp','WhatsApp','Mensaje de texto al responsable']] as const).map(([key, label, desc]) => (
            <label key={key} className="flex items-center justify-between gap-4 px-4 py-3 rounded-lg border cursor-pointer" style={{ borderColor: notif[key] ? C.gold : C.line, background: notif[key] ? 'rgba(216,173,87,.06)' : 'transparent' }}>
              <div>
                <p className="text-sm font-medium text-white m-0">{label}</p>
                <p className="text-[11px] m-0" style={{ color: C.muted }}>{desc}</p>
              </div>
              <div onClick={() => setNotif(n => ({ ...n, [key]: !n[key] }))}
                className="w-10 h-6 rounded-full relative shrink-0 transition-colors"
                style={{ background: notif[key] ? C.gold : 'rgba(255,255,255,.1)' }}
                role="switch" aria-checked={notif[key]}>
                <span className="absolute top-1 w-4 h-4 rounded-full bg-white transition-all" style={{ left: notif[key] ? 22 : 4 }} />
              </div>
            </label>
          ))}
        </div>
      </div>
      <TechDisclaimer />
    </div>
  )
}

// ─── REPORTS VIEW ─────────────────────────────────────────────────────────────
function ReportsView() {
  return (
    <div className="flex flex-col gap-5">
      <DemoBanner />
      <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
        <h3 className="text-sm font-semibold text-white m-0 mb-4">Generar informe</h3>
        <div className="grid sm:grid-cols-2 gap-4 mb-5">
          {[['Tipo de informe','Mensual de comportamiento'],['Período','Último mes (sep 2024)'],['Edificio','Edificio Torre Central'],['Formato','PDF ejecutivo']].map(([l,v]) => (
            <div key={l}>
              <p className="text-xs m-0 mb-1" style={{ color: C.muted }}>{l}</p>
              <select className="w-full h-9 rounded-lg px-3 border text-sm" style={{ background: C.navy2, borderColor: C.line, color: 'white' }}>
                <option>{v}</option>
              </select>
            </div>
          ))}
        </div>
        <button className="inline-flex items-center gap-2 min-h-[40px] px-5 rounded-lg font-bold text-sm border-0 cursor-pointer" style={{ background: C.gold, color: '#172033' }}>
          📄 Generar informe PDF
        </button>
      </div>
      <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
        <h3 className="text-sm font-semibold text-white m-0 mb-4">Informes anteriores</h3>
        <div className="flex flex-col gap-2">
          {[['Agosto 2024','Mensual','2,4 MB'],['Abril 2024','Poseventual','1,8 MB'],['Marzo 2024','Mensual','2,1 MB']].map(([date, type, size]) => (
            <div key={date} className="flex items-center justify-between px-4 py-3 rounded-lg border" style={{ borderColor: C.line }}>
              <div className="flex items-center gap-3">
                <span style={{ color: C.muted }}>📄</span>
                <div>
                  <p className="text-xs font-semibold text-white m-0">{date} — {type}</p>
                  <p className="text-[10px] m-0" style={{ color: C.muted }}>{size}</p>
                </div>
              </div>
              <button className="text-xs px-3 py-1.5 rounded-lg border cursor-pointer transition-colors hover:bg-white/5" style={{ borderColor: C.line, color: C.muted }}>Descargar</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── CONFIG VIEW ─────────────────────────────────────────────────────────────
function ConfigView() {
  return (
    <div className="flex flex-col gap-5">
      <DemoBanner />
      <div className="rounded-xl border p-5" style={{ background: C.cardBg, borderColor: C.line }}>
        <h3 className="text-sm font-semibold text-white m-0 mb-4">Configuración del sistema</h3>
        <div className="flex flex-col gap-4">
          {[['Nombre del edificio','Edificio Torre Central'],['Dirección','Calle 80 #14-32, Bogotá, Colombia'],['Propietario','Administración Torres Central S.A.S.'],['Ingeniero responsable','Ing. Carlos Arboleda — Arboleda Ayerbe Construcciones S.A.S.'],['Fecha de instalación','5 de septiembre de 2023'],['Frecuencia de muestreo','200 Hz'],['Protocolo de transmisión','MQTT / TLS 1.3']].map(([l,v]) => (
            <div key={l} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3 border-b" style={{ borderColor: C.line }}>
              <span className="text-xs font-medium" style={{ color: C.muted }}>{l}</span>
              <span className="text-xs text-white font-semibold">{v}</span>
            </div>
          ))}
        </div>
      </div>
      <TechDisclaimer />
    </div>
  )
}

// ─── SECTION ROUTER ───────────────────────────────────────────────────────────
function SectionContent({ section }: { section: SHMSection }) {
  switch (section) {
    case 'resumen':        return <SummaryView />
    case 'comportamiento': return <BehaviorView />
    case 'eventos':        return <EventsView />
    case 'sensores':       return <SensorsView />
    case 'alertas':        return <AlertsView />
    case 'informes':       return <ReportsView />
    case 'config':         return <ConfigView />
  }
}

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function SHMPage() {
  const [section, setSection] = useState<SHMSection>('resumen')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const mainRef = useRef<HTMLDivElement>(null)

  // Scroll to top on section change
  useEffect(() => { mainRef.current?.scrollTo(0, 0) }, [section])

  const sectionTitle = NAV_ITEMS.find(n => n.id === section)?.label ?? ''

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: C.navy, fontFamily: 'var(--font-sans)' }}>
      <TopBar onMenuToggle={() => setSidebarOpen(true)} />
      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <Sidebar active={section} onChange={setSection} />
        {/* Mobile sidebar overlay */}
        {sidebarOpen && <Sidebar active={section} onChange={setSection} mobile onClose={() => setSidebarOpen(false)} />}
        {/* Main content */}
        <main ref={mainRef} className="flex-1 overflow-y-auto pb-20 md:pb-6 px-4 md:px-6 py-5" style={{ background: '#0a1525' }}>
          <div className="max-w-[1200px] mx-auto">
            {/* Page header */}
            <div className="flex items-center justify-between mb-5">
              <div>
                <h1 className="text-lg font-bold text-white m-0">{sectionTitle}</h1>
                <p className="text-xs m-0" style={{ color: C.muted }}>Edificio Torre Central · Sistema SHM Arboleda Ayerbe</p>
              </div>
            </div>
            <SectionContent section={section} />
          </div>
        </main>
      </div>
      <BottomNav active={section} onChange={setSection} />
    </div>
  )
}
