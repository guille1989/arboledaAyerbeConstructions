import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router'

const HERO_IMG =
  'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1800&h=900&fit=crop&auto=format'

const SERVICES = [
  { n: '01', title: 'Levantamiento as-built', desc: 'Geometría, configuración estructural y documentación del estado existente para establecer una base técnica confiable.' },
  { n: '02', title: 'Inventario de daños', desc: 'Inspección visual, registro fotográfico, clasificación de afectaciones y mapeo detallado de fisuras.' },
  { n: '03', title: 'Caracterización de materiales', desc: 'Núcleos de concreto, esclerometría, ultrasonido, detección de refuerzo y evaluación de procesos de deterioro.' },
  { n: '04', title: 'Geotecnia y cimentaciones', desc: 'Apiques, sondeos, verificación de cimentaciones e integración de la información del suelo con el análisis estructural.' },
  { n: '05', title: 'Modelación estructural', desc: 'Construcción y calibración de modelos, análisis de sobreesfuerzos, flexibilidad, derivas y respuesta sísmica.' },
  { n: '06', title: 'Vulnerabilidad y diagnóstico', desc: 'Integración de evidencias para establecer condición, riesgo, estabilidad, habitabilidad y posibles nexos causales.' },
  { n: '07', title: 'Demanda sísmica', desc: 'Evaluación de escenarios normativos, comparación de resultados y reverificación ante cambios de criterios.' },
  { n: '08', title: 'Diseño de reforzamiento', desc: 'Selección de alternativas, diseño, verificación, detalles constructivos, memorias y planos para licencia.' },
  { n: '09', title: 'Presupuesto y APU', desc: 'Cantidades de obra, análisis de precios unitarios y presupuesto discriminado para planear la intervención.' },
]

const STEPS = [
  { n: '01', title: 'Recopilar', desc: 'Revisamos planos, memorias, antecedentes, intervenciones y condiciones conocidas del inmueble.' },
  { n: '02', title: 'Inspeccionar y medir', desc: 'Levantamos geometría, daños y variables de campo con registro ordenado y trazable.' },
  { n: '03', title: 'Ensayar y modelar', desc: 'Caracterizamos materiales, verificamos hipótesis y evaluamos el comportamiento de la estructura.' },
  { n: '04', title: 'Concluir y diseñar', desc: 'Convertimos los hallazgos en diagnóstico, alternativas, planos, memorias y presupuesto de intervención.' },
]

const DELIVERABLES = [
  'Planos as-built', 'Registro fotográfico', 'Mapas de fisuras', 'Resultados de ensayos',
  'Modelo estructural', 'Memoria de cálculo', 'Informe de diagnóstico', 'Planos de reforzamiento',
  'Especificaciones', 'Presupuesto y APU',
]

const SECTORS = [
  'Edificaciones residenciales', 'Equipamientos institucionales', 'Edificios comerciales',
  'Estructuras industriales', 'Cambios de uso', 'Daños y patologías',
  'Reforzamientos', 'Actualización normativa',
]

const FAQS = [
  { q: '¿Todos los proyectos requieren ensayos?', a: 'No necesariamente. La necesidad y el tipo de ensayo dependen de la información existente, la condición observada y las hipótesis que deban verificarse.' },
  { q: '¿Se puede contratar solo una etapa?', a: 'Sí. El alcance puede concentrarse en levantamiento, inspección, modelación, diagnóstico, diseño o presupuesto, siempre que la información de entrada sea suficiente.' },
  { q: '¿Los ítems adicionales forman parte del alcance base?', a: 'Las reverificaciones por cambios normativos y las corridas adicionales del modelo se definen expresamente en cada propuesta para evitar ambigüedades.' },
]

const REQUEST_TEXT = `Hola, deseo solicitar una propuesta para una evaluación estructural.

Proyecto / tipo de edificación:
Ubicación:
Área aproximada y número de pisos:
Motivo del estudio:
Documentación disponible:
Plazo esperado:`

function useReveal() {
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.classList.add('visible'); obs.disconnect() } },
      { threshold: 0.1 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])
  return ref
}

function Eyebrow({ children, light = false }: { children: string; light?: boolean }) {
  return (
    <p className="m-0 mb-3.5 text-xs font-extrabold tracking-[.16em] uppercase"
      style={{ color: light ? '#f1cf88' : '#9a6e1f' }}>
      {children}
    </p>
  )
}

function ServiceCard({ n, title, desc, delay }: { n: string; title: string; desc: string; delay: string }) {
  const ref = useReveal()
  return (
    <article ref={ref as React.RefObject<HTMLElement>}
      className={`reveal ${delay} group relative min-h-[260px] p-7 overflow-hidden border rounded-[18px] bg-white transition-all duration-300 hover:-translate-y-1.5`}
      style={{ borderColor: '#d9dee5' }}>
      <span className="absolute -right-14 -bottom-14 w-28 h-28 rotate-45 border border-[rgba(216,173,87,.3)] transition-all duration-300 group-hover:border-[rgba(216,173,87,.6)]" />
      <span className="absolute top-0 left-0 h-0.5 w-0 bg-[#d8ad57] transition-all duration-500 group-hover:w-full" />
      <span className="block mb-8 font-extrabold tracking-widest text-xs" style={{ color: '#9a6e1f' }}>{n}</span>
      <h3 className="mb-3 text-xl leading-snug tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{title}</h3>
      <p className="mb-0 text-sm leading-relaxed" style={{ color: '#5e6977' }}>{desc}</p>
    </article>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t" style={{ borderColor: '#d9dee5' }}>
      <button onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-5 py-5 text-left font-semibold cursor-pointer bg-transparent border-0 text-base"
        style={{ color: '#07111f' }}>
        {q}
        <span className="shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-lg font-light transition-transform duration-300"
          style={{ borderColor: '#d8ad57', color: '#9a6e1f', transform: open ? 'rotate(45deg)' : 'none' }}>
          +
        </span>
      </button>
      <div className="overflow-hidden" style={{ maxHeight: open ? '200px' : '0', opacity: open ? 1 : 0, transition: 'max-height .4s ease, opacity .3s ease' }}>
        <p className="pb-5 text-sm leading-relaxed" style={{ color: '#5e6977' }}>{a}</p>
      </div>
    </div>
  )
}

export default function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('inicio')
  const [copyStatus, setCopyStatus] = useState('')

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const sections = ['inicio', 'servicios', 'metodologia', 'entregables', 'solicitud']
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) setActiveSection(e.target.id) }) },
      { threshold: 0.35 }
    )
    sections.forEach((id) => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [])

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(REQUEST_TEXT)
      setCopyStatus('Texto copiado. Ya puede completarlo y enviarlo.')
    } catch {
      setCopyStatus('Seleccione el texto y cópielo manualmente.')
    }
    setTimeout(() => setCopyStatus(''), 4000)
  }, [])

  const navLinkClass = (id: string) =>
    `no-underline text-sm font-semibold transition-colors duration-200 ${activeSection === id ? 'text-[#d8ad57]' : 'text-[#eef3f8] hover:text-[#d8ad57]'}`

  const heroMetaRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!heroMetaRef.current) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { heroMetaRef.current?.classList.add('visible'); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(heroMetaRef.current)
    return () => obs.disconnect()
  }, [])

  const servRef = useReveal(), methodRef = useReveal(), delivRef = useReveal()
  const coverageRef = useReveal(), reqRef = useReveal(), faqRef = useReveal()

  return (
    <div className="min-h-screen" style={{ fontFamily: 'var(--font-sans)' }}>
      {/* HEADER */}
      <header className="fixed top-0 left-0 w-full z-50 transition-all duration-400"
        style={{
          background: scrolled ? 'rgba(7,17,31,.97)' : 'transparent',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(255,255,255,.1)' : '1px solid rgba(255,255,255,.12)',
          boxShadow: scrolled ? '0 4px 32px rgba(0,0,0,.35)' : 'none',
        }}>
        <nav className="flex items-center justify-between gap-6 min-h-[88px] w-[min(1160px,calc(100%-40px))] mx-auto">
          <a href="#inicio" className="flex items-center gap-3 no-underline" aria-label="Inicio">
            <svg width="38" height="38" viewBox="0 0 64 64" aria-hidden="true">
              <rect width="64" height="64" rx="10" fill="#07111f" />
              <path d="M10 50 27 14h10L21 50Zm23 0 13-27 12 27H47l-3-7H35l-3 7Z" fill="#d8ad57" />
            </svg>
            <div>
              <span className="block text-white font-extrabold text-sm leading-tight tracking-wide">Arboleda Averbe</span>
              <span className="block text-[10px] font-semibold tracking-[.1em] uppercase" style={{ color: 'rgba(216,173,87,.75)' }}>Construcciones S.A.S.</span>
            </div>
          </a>
          <div className="hidden md:flex items-center gap-7">
            <a href="#servicios" className={navLinkClass('servicios')}>Servicios</a>
            <a href="#metodologia" className={navLinkClass('metodologia')}>Metodología</a>
            <a href="#entregables" className={navLinkClass('entregables')}>Entregables</a>
            <Link to="/shm"
              className="inline-flex items-center gap-1.5 no-underline text-sm font-semibold transition-colors duration-200"
              style={{ color: '#71D6A3' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#71D6A3]" />
              Monitoreo SHM
            </Link>
            <a href="#solicitud"
              className="inline-flex items-center min-h-[44px] px-5 rounded-full font-bold text-sm no-underline transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: '#d8ad57', color: '#172033' }}>
              Solicitar propuesta
            </a>
          </div>
          <button className="md:hidden border-0 bg-transparent text-white cursor-pointer p-2"
            onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              {menuOpen
                ? <path d="M4 4l14 14M18 4L4 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                : <path d="M3 6h16M3 11h16M3 16h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />}
            </svg>
          </button>
        </nav>
        {menuOpen && (
          <div className="md:hidden absolute top-full left-4 right-4 rounded-2xl p-5 flex flex-col gap-4"
            style={{ background: 'rgba(7,17,31,.97)', border: '1px solid rgba(255,255,255,.14)', boxShadow: '0 20px 55px rgba(0,0,0,.4)' }}>
            {['servicios', 'metodologia', 'entregables'].map((id) => (
              <a key={id} href={`#${id}`} className={`${navLinkClass(id)} capitalize`} onClick={() => setMenuOpen(false)}>
                {id.charAt(0).toUpperCase() + id.slice(1)}
              </a>
            ))}
            <Link to="/shm" className="text-sm font-semibold no-underline flex items-center gap-2" style={{ color: '#71D6A3' }} onClick={() => setMenuOpen(false)}>
              <span className="w-1.5 h-1.5 rounded-full bg-[#71D6A3]" /> Monitoreo SHM
            </Link>
            <a href="#solicitud"
              className="inline-flex justify-center min-h-[44px] px-5 rounded-full font-bold text-sm no-underline items-center"
              style={{ background: '#d8ad57', color: '#172033' }}
              onClick={() => setMenuOpen(false)}>
              Solicitar propuesta
            </a>
          </div>
        )}
      </header>

      <main>
        {/* HERO */}
        <section id="inicio" className="relative min-h-[780px] overflow-hidden flex items-center" style={{ background: '#0b1a2c', color: 'white' }}>
          <img src={HERO_IMG} alt="Ingenieros realizando inspección técnica en estructura de concreto"
            className="absolute inset-0 w-full h-full object-cover object-center" style={{ opacity: .45 }} />
          <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(105deg, rgba(4,12,23,.98) 0%, rgba(4,12,23,.9) 40%, rgba(4,12,23,.4) 75%, rgba(4,12,23,.25) 100%), linear-gradient(0deg, rgba(5,13,24,.8) 0%, transparent 55%)' }} />
          <div className="absolute right-[6vw] bottom-[-160px] w-[500px] h-[500px] rotate-45 pointer-events-none" style={{ border: '1px solid rgba(216,173,87,.28)', boxShadow: '0 0 0 70px rgba(216,173,87,.03), 0 0 0 140px rgba(216,173,87,.02)' }} />
          <div className="relative z-[3] w-[min(1160px,calc(100%-40px))] mx-auto py-[180px] pb-[100px]">
            <Eyebrow light>Peritaje · vulnerabilidad · reforzamiento</Eyebrow>
            <h1 className="max-w-[740px] mb-6 font-normal leading-[1.06] tracking-tight"
              style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.7rem, 5.5vw, 5.4rem)' }}>
              Decisiones estructurales respaldadas por evidencia.
            </h1>
            <p className="max-w-[660px] text-[clamp(1.05rem,1.6vw,1.22rem)] leading-[1.72]" style={{ color: '#dfe7f0' }}>
              Integramos levantamiento, inspección, ensayos, modelación y diseño para entender el comportamiento real de una edificación y definir el siguiente paso con claridad.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <a href="#servicios" className="inline-flex items-center gap-2 min-h-[50px] px-6 rounded-full font-bold text-sm no-underline transition-all duration-200 hover:-translate-y-0.5" style={{ background: '#d8ad57', color: '#172033' }}>
                Conocer servicios <span aria-hidden="true">↓</span>
              </a>
              <Link to="/shm" className="inline-flex items-center gap-2 min-h-[50px] px-6 rounded-full font-bold text-sm no-underline border transition-all duration-200 hover:bg-white/10" style={{ borderColor: 'rgba(113,214,163,.45)', color: '#71D6A3' }}>
                <span className="w-2 h-2 rounded-full bg-[#71D6A3] animate-pulse" />
                Monitoreo SHM en vivo
              </Link>
            </div>
            <div ref={heroMetaRef} className="reveal mt-16 grid grid-cols-3 border"
              style={{ width: 'min(680px,100%)', borderColor: 'rgba(255,255,255,.18)', gap: '1px', background: 'rgba(255,255,255,.18)' }}>
              {[{ title: 'Campo', desc: 'Inspección, levantamiento y registro' }, { title: 'Análisis', desc: 'Ensayos, modelación y diagnóstico' }, { title: 'Solución', desc: 'Reforzamiento, planos y presupuesto' }].map((m) => (
                <div key={m.title} className="min-h-[96px] p-5" style={{ background: 'rgba(6,16,29,.74)', backdropFilter: 'blur(8px)' }}>
                  <strong className="block mb-1 text-sm font-bold" style={{ color: '#d8ad57' }}>{m.title}</strong>
                  <span className="text-xs leading-snug" style={{ color: '#d5dde8' }}>{m.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* SHM PROMO BAND */}
        <div style={{ background: '#07111F', borderBottom: '1px solid rgba(113,214,163,.18)' }}>
          <div className="w-[min(1160px,calc(100%-40px))] mx-auto py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-[#71D6A3]" style={{ boxShadow: '0 0 0 4px rgba(113,214,163,.2)' }} />
              <span className="text-sm font-semibold" style={{ color: '#dfe7f0' }}>
                <span style={{ color: '#71D6A3' }}>Nuevo —</span> Monitoreo Estructural en Tiempo Real (SHM) disponible para su edificio.
              </span>
            </div>
            <Link to="/shm" className="shrink-0 inline-flex items-center gap-2 min-h-[38px] px-4 rounded-full text-xs font-bold no-underline border transition-all duration-200 hover:bg-[rgba(113,214,163,.08)]" style={{ borderColor: 'rgba(113,214,163,.4)', color: '#71D6A3' }}>
              Explorar demo →
            </Link>
          </div>
        </div>

        {/* SERVICES */}
        <section id="servicios" className="py-[104px]" style={{ background: '#f5f6f8' }}>
          <div className="w-[min(1160px,calc(100%-40px))] mx-auto">
            <div ref={servRef as React.RefObject<HTMLDivElement>} className="reveal flex flex-col md:flex-row md:items-end md:justify-between gap-8 mb-12">
              <div>
                <Eyebrow>Capacidad integral</Eyebrow>
                <h2 className="max-w-[640px] mb-0 font-normal leading-[1.08] tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.8vw,3.5rem)' }}>
                  Del estado actual a una solución construible.
                </h2>
              </div>
              <p className="max-w-[360px] mb-1.5 text-sm leading-relaxed" style={{ color: '#5e6977' }}>
                Un alcance coordinado reduce vacíos entre la visita, el cálculo y las decisiones de intervención.
              </p>
            </div>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {SERVICES.map((s, i) => (
                <ServiceCard key={s.n} {...s} delay={`reveal-delay-${Math.min(i % 3 + 1, 6)}`} />
              ))}
            </div>
          </div>
        </section>

        {/* METHODOLOGY */}
        <section id="metodologia" className="py-[104px]" style={{ background: '#0b1a2c', color: 'white' }}>
          <div className="w-[min(1160px,calc(100%-40px))] mx-auto grid md:grid-cols-[.85fr_1.15fr] gap-16 lg:gap-20 items-start">
            <div ref={methodRef as React.RefObject<HTMLDivElement>} className="reveal md:sticky md:top-10">
              <Eyebrow light>Metodología</Eyebrow>
              <h2 className="font-normal leading-[1.08] tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem,3.5vw,3.2rem)' }}>
                Una ruta técnica, sin saltos entre disciplinas.
              </h2>
              <p className="text-sm leading-relaxed max-w-[460px]" style={{ color: '#cbd5e1' }}>
                Cada etapa aporta evidencia a la siguiente. El alcance se ajusta a la información disponible, la tipología de la edificación y la decisión que el cliente necesita tomar.
              </p>
            </div>
            <div style={{ borderTop: '1px solid rgba(255,255,255,.16)' }}>
              {STEPS.map((s, i) => (
                <article key={s.n} className="grid gap-5 py-8" style={{ gridTemplateColumns: '64px 1fr', borderBottom: '1px solid rgba(255,255,255,.16)' }}>
                  <span className="text-xs font-bold tracking-widest" style={{ color: '#d8ad57' }}>{s.n}</span>
                  <div>
                    <h3 className="text-2xl font-normal mb-2 tracking-tight" style={{ fontFamily: 'var(--font-display)' }}>{s.title}</h3>
                    <p className="mb-0 text-sm leading-relaxed" style={{ color: '#b8c5d4' }}>{s.desc}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* DELIVERABLES */}
        <section id="entregables" className="py-[104px]">
          <div className="w-[min(1160px,calc(100%-40px))] mx-auto grid md:grid-cols-[1.05fr_.95fr] gap-14 lg:gap-16 items-center">
            <div ref={delivRef as React.RefObject<HTMLDivElement>} className="reveal">
              <Eyebrow>Resultados utilizables</Eyebrow>
              <h2 className="font-normal leading-[1.08] tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.8vw,3.5rem)' }}>
                Entregables que permiten actuar.
              </h2>
              <p className="text-sm leading-relaxed max-w-[560px]" style={{ color: '#5e6977' }}>
                La documentación se organiza para que propietarios, diseñadores, revisores y constructores puedan seguir la evidencia, entender las conclusiones y ejecutar las decisiones.
              </p>
              <ul className="mt-7 p-0 list-none m-0" style={{ borderTop: '1px solid #d9dee5' }}>
                {['Alcance definido y criterios técnicos explícitos.', 'Hallazgos vinculados con registros, mediciones y ensayos.', 'Conclusiones priorizadas según condición y riesgo.', 'Recomendaciones compatibles con las siguientes fases del proyecto.'].map((item) => (
                  <li key={item} className="flex items-start gap-3 py-3.5 text-sm" style={{ borderBottom: '1px solid #d9dee5', color: '#07111f' }}>
                    <span className="shrink-0 mt-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold" style={{ background: 'rgba(216,173,87,.18)', color: '#9a6e1f' }}>✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative rounded-[24px] p-9 text-white overflow-hidden" style={{ background: 'linear-gradient(145deg, #10253e, #07111f)', boxShadow: '0 20px 55px rgba(7,17,31,.18)' }}>
              <div className="absolute top-0 left-9 w-[70px] h-1 rounded-b-sm" style={{ background: '#d8ad57' }} />
              <Eyebrow light>Según el alcance contratado</Eyebrow>
              <h3 className="text-2xl font-normal mb-5" style={{ fontFamily: 'var(--font-display)' }}>Paquete técnico</h3>
              <ul className="p-0 m-0 list-none grid grid-cols-2 gap-2.5">
                {DELIVERABLES.map((d) => (
                  <li key={d} className="px-3.5 py-3 rounded-xl text-xs font-medium border" style={{ borderColor: 'rgba(255,255,255,.13)', color: '#dce6ef' }}>{d}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* COVERAGE */}
        <section className="pb-[104px]">
          <div className="w-[min(1160px,calc(100%-40px))] mx-auto">
            <div ref={coverageRef as React.RefObject<HTMLDivElement>} className="reveal grid md:grid-cols-[1.2fr_.8fr] gap-10 p-12 rounded-[22px] border" style={{ background: '#fafbfc', borderColor: '#d9dee5' }}>
              <div>
                <Eyebrow>Aplicaciones</Eyebrow>
                <h2 className="font-normal leading-[1.08] tracking-tight mb-3" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(1.9rem,3vw,3rem)' }}>
                  Evaluaciones para edificios existentes y proyectos de intervención.
                </h2>
                <p className="text-sm leading-relaxed max-w-[480px]" style={{ color: '#5e6977' }}>
                  El alcance puede enfocarse en una pregunta puntual o integrar el ciclo completo de diagnóstico y reforzamiento.
                </p>
              </div>
              <div className="flex flex-wrap content-start gap-2.5 pt-1">
                {SECTORS.map((s) => (
                  <span key={s} className="px-3.5 py-2.5 rounded-full text-[.85rem] border bg-white transition-all duration-200 hover:border-[#d8ad57] hover:text-[#9a6e1f] cursor-default" style={{ borderColor: '#d9dee5', color: '#354153' }}>{s}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* REQUEST */}
        <section id="solicitud" className="py-[104px]" style={{ background: '#f4e6c8' }}>
          <div className="w-[min(1160px,calc(100%-40px))] mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div ref={reqRef as React.RefObject<HTMLDivElement>} className="reveal">
              <Eyebrow>Solicite una propuesta</Eyebrow>
              <h2 className="font-normal leading-[1.08] tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.8vw,3.5rem)' }}>
                Empecemos por entender la necesidad.
              </h2>
              <p className="text-sm leading-relaxed max-w-[500px]" style={{ color: '#5e6977' }}>
                Con esta información podemos orientar el alcance inicial y definir si se requiere visita, ensayos o documentación adicional.
              </p>
              <div className="grid grid-cols-2 gap-3 mt-7">
                {[{ label: 'Proyecto', desc: 'Uso, número de pisos y área.' }, { label: 'Ubicación', desc: 'Ciudad y condiciones de acceso.' }, { label: 'Motivo', desc: 'Daño, reforma, licencia o revisión.' }, { label: 'Documentos', desc: 'Planos, estudios e informes disponibles.' }].map((item) => (
                  <div key={item.label} className="p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,.55)', borderColor: 'rgba(91,66,20,.16)' }}>
                    <strong className="block mb-1 text-sm font-bold" style={{ color: '#07111f' }}>{item.label}</strong>
                    <span className="text-xs leading-snug" style={{ color: '#5e6977' }}>{item.desc}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-[22px] p-8 text-white flex flex-col gap-5" style={{ background: '#0b1a2c', boxShadow: '0 20px 55px rgba(7,17,31,.18)' }}>
              <div>
                <Eyebrow light>Mensaje inicial</Eyebrow>
                <h3 className="text-xl font-normal mb-2" style={{ fontFamily: 'var(--font-display)' }}>Prepare su solicitud</h3>
                <p className="text-sm leading-relaxed mb-4" style={{ color: '#cbd5e1' }}>
                  Copie este texto, complételo y envíenoslo directamente por cualquiera de estos canales:
                </p>
                <pre className="text-xs leading-relaxed p-4 rounded-xl whitespace-pre-line mb-4" style={{ background: 'rgba(255,255,255,.06)', border: '1px solid rgba(255,255,255,.13)', color: '#e8edf3', fontFamily: 'var(--font-sans)' }}>
                  {REQUEST_TEXT}
                </pre>
                <button onClick={handleCopy}
                  className="inline-flex items-center gap-2 min-h-[46px] px-5 rounded-full font-bold text-sm cursor-pointer border-0 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-110"
                  style={{ background: '#d8ad57', color: '#172033' }}>
                  Copiar texto de solicitud
                </button>
                {copyStatus && <p className="mt-3 text-xs" style={{ color: '#f2d28f' }} aria-live="polite">{copyStatus}</p>}
              </div>

              {/* Contact channels */}
              <div className="border-t pt-5" style={{ borderColor: 'rgba(255,255,255,.1)' }}>
                <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: 'rgba(216,173,87,.7)' }}>Canales de contacto</p>
                <div className="flex flex-col gap-2.5">
                  {/* WhatsApp */}
                  <a href="https://wa.me/573001234567" target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl no-underline border transition-colors duration-200 hover:bg-white/5"
                    style={{ borderColor: 'rgba(255,255,255,.1)' }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(37,211,102,.15)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white m-0">WhatsApp</p>
                      <p className="text-xs m-0" style={{ color: '#9eacbc' }}>+57 300 123 4567</p>
                    </div>
                    <svg className="ml-auto shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5l7-7M3 2.5h6.5V9" stroke="#5e6977" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </a>
                  {/* Email */}
                  <a href="mailto:contacto@arboledaaverbe.com"
                    className="flex items-center gap-3 px-4 py-3 rounded-xl no-underline border transition-colors duration-200 hover:bg-white/5"
                    style={{ borderColor: 'rgba(255,255,255,.1)' }}>
                    <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(216,173,87,.12)' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="2" y="4" width="20" height="16" rx="2" stroke="#d8ad57" strokeWidth="1.5"/><path d="M2 8l10 7 10-7" stroke="#d8ad57" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white m-0">Correo electrónico</p>
                      <p className="text-xs m-0 truncate" style={{ color: '#9eacbc' }}>contacto@arboledaaverbe.com</p>
                    </div>
                    <svg className="ml-auto shrink-0" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 9.5l7-7M3 2.5h6.5V9" stroke="#5e6977" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-[104px]" style={{ background: '#f5f6f8' }}>
          <div className="w-[min(1160px,calc(100%-40px))] mx-auto grid md:grid-cols-[.7fr_1.3fr] gap-16">
            <div ref={faqRef as React.RefObject<HTMLDivElement>} className="reveal">
              <Eyebrow>Preguntas frecuentes</Eyebrow>
              <h2 className="font-normal leading-[1.08] tracking-tight" style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem,3.5vw,3.2rem)' }}>
                Antes de iniciar.
              </h2>
            </div>
            <div>
              {FAQS.map((faq) => <FaqItem key={faq.q} {...faq} />)}
              <div style={{ borderBottom: '1px solid #d9dee5' }} />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="py-10 pb-7" style={{ background: '#050c16', color: 'white' }}>
        <div className="w-[min(1160px,calc(100%-40px))] mx-auto grid md:grid-cols-[1.1fr_.9fr] gap-8 items-end">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <svg width="44" height="44" viewBox="0 0 64 64" aria-hidden="true" className="shrink-0">
              <rect width="64" height="64" rx="10" fill="#0b1a2c" />
              <path d="M10 50 27 14h10L21 50Zm23 0 13-27 12 27H47l-3-7H35l-3 7Z" fill="#d8ad57" />
            </svg>
            <p className="mb-0 text-sm leading-relaxed" style={{ color: '#9eacbc', maxWidth: '360px' }}>
              Servicios técnicos para conocer, evaluar y transformar estructuras existentes.
            </p>
          </div>
          <div className="md:text-right">
            <strong className="block text-sm font-bold" style={{ color: '#f0d293' }}>Arboleda Averbe Construcciones S.A.S.</strong>
            <span className="text-xs" style={{ color: '#9eacbc' }}>Construyendo futuro · {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
