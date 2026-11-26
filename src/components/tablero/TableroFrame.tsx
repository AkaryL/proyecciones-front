import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from '../../lib/motion'
import { useGo } from '../../lib/navigation'
import './TableroFrame.css'

/** Páginas del tablero del motor y la ruta que les corresponde en este sitio. */
const RUTAS: Record<string, string | null> = {
  index: '/',
  diputaciones: '/diputaciones',
  comparativo: '/comparativo',
  territorio: '/territorio',
  simulacion: '/simulacion',
  fuentes: '/fuentes',
  monitoreo: null, // todavía no existe aquí
}

/** Ancho con el que se pinta el tablero por dentro (px reales suyos); luego se escala al sitio. */
const ANCHO_INTERIOR = 1068

/** Lo del tablero que aquí sobra: su menú, su encabezado y su pie (los pone este sitio). */
const ESTILO = `
  .pp-saltar, .pp-nav, .pp-heroe, .pp-pie { display: none !important; }
  html, body, .pp-pagina, .pp-cuerpo { background: transparent !important; }
  html, body { overflow: hidden !important; }
  /* sin sus márgenes laterales: el contenido mide lo mismo que las tarjetas de las demás páginas */
  .pp-cuerpo { padding-top: 0 !important; padding-left: 0 !important; padding-right: 0 !important; }
`

type TableroFrameProps = {
  /** Página del tablero: «territorio», «comparativo»… */
  pagina: string
  /** Rótulos del encabezado, leídos del tablero al cargar. */
  onTitulos?: (titulos: { titulo: string; franja: string }) => void
}

/**
 * Muestra una página del tablero del motor tal como es (su propio código, con
 * sus datos y sus filtros) dentro del marco de este sitio. Va en un iframe para
 * que sus estilos y scripts no se mezclen con los del sitio; aquí se le quita su
 * menú, se ajusta su alto al contenido y se atienden sus enlaces.
 */
export function TableroFrame({ pagina, onTitulos }: TableroFrameProps) {
  const cajaRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  const [alto, setAlto] = useState(900)
  const [escala, setEscala] = useState(1)
  const [listo, setListo] = useState(false)
  const go = useGo()
  const vivo = useRef({ go, onTitulos, escala })
  useEffect(() => {
    vivo.current = { go, onTitulos, escala }
  })

  // la escala sigue al ancho disponible en el sitio
  useEffect(() => {
    const caja = cajaRef.current
    if (!caja) return
    const observer = new ResizeObserver(() => setEscala(caja.clientWidth / ANCHO_INTERIOR))
    observer.observe(caja)
    return () => observer.disconnect()
  }, [])

  const alCargar = () => {
    const frame = frameRef.current
    const doc = frame?.contentDocument
    if (!frame || !doc) return

    const style = doc.createElement('style')
    style.textContent = ESTILO
    doc.head.append(style)

    // el alto del iframe sigue al de su contenido
    const medir = () => setAlto(Math.ceil(doc.documentElement.scrollHeight))
    new ResizeObserver(medir).observe(doc.body)
    medir()

    const leerTitulos = () => {
      const titulo = doc.querySelector('.pp-heroe__t')?.textContent?.trim()
      const franja = doc.querySelector('.pp-heroe__p')?.textContent?.trim()
      if (titulo && franja) vivo.current.onTitulos?.({ titulo, franja })
      return Boolean(titulo)
    }
    if (!leerTitulos()) {
      const espera = new MutationObserver(() => leerTitulos() && espera.disconnect())
      espera.observe(doc.body, { childList: true, subtree: true })
    }

    doc.addEventListener('click', (event) => {
      const enlace = (event.target as Element | null)?.closest?.('a[href]')
      if (!enlace) return
      const href = enlace.getAttribute('href') ?? ''
      // ancla dentro de la página: se desplaza la ventana del sitio, no el iframe
      if (href.startsWith('#') && !href.includes('=')) {
        event.preventDefault()
        const destino = doc.getElementById(decodeURIComponent(href.slice(1)))
        if (destino) {
          const y = frame.getBoundingClientRect().top + window.scrollY + destino.getBoundingClientRect().top * vivo.current.escala
          window.scrollTo({ top: y - 24, behavior: prefersReducedMotion() ? 'instant' : 'smooth' })
        }
        return
      }
      // otra página del tablero: se va a la ruta de este sitio
      const interna = /^([a-z]+)\.html/.exec(href)
      if (interna && interna[1] in RUTAS) {
        event.preventDefault()
        const ruta = RUTAS[interna[1]]
        if (ruta && interna[1] !== pagina) vivo.current.go(ruta)
        return
      }
      if (/^https?:/.test(href)) {
        event.preventDefault()
        window.open(href, '_blank', 'noopener,noreferrer')
      }
    })
    setListo(true)
  }

  return (
    <div ref={cajaRef} className="tablero-frame" style={{ height: alto * escala }} aria-busy={!listo}>
      {/* mientras el tablero carga sus datos se ve un aviso, no un hueco en blanco */}
      <p className={`tablero-frame__loading${listo ? ' is-done' : ''}`} aria-hidden={listo}>
        Cargando…
      </p>
      <iframe
        ref={frameRef}
        className={`tablero-frame__doc${listo ? ' is-ready' : ''}`}
        src={`${import.meta.env.BASE_URL}tablero/${pagina}.html`}
        title={`Tablero: ${pagina}`}
        style={{ width: ANCHO_INTERIOR, height: alto, transform: `scale(${escala})` }}
        onLoad={alCargar}
      />
    </div>
  )
}
