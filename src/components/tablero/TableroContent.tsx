import { useEffect, useRef, type MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import type { TableroSection } from '../../api'
import logoMorena from '../../assets/img/logo-morena.png'
import logoMc from '../../assets/svg/logo-mc-horizontal.svg'
import '../../styles/tablero.css'
import './TableroContent.css'

export type { TableroSection }

const LOGOS: Record<string, string> = { logo_mc: logoMc, logo_morena: logoMorena }

/** Rutas que ya existen en el sitio; un enlace a otra página todavía no lleva a ningún lado. */
const RUTAS = new Set(['/', '/diputaciones', '/simulacion', '/fuentes'])

/**
 * Pinta secciones tomadas tal cual del tablero del motor (su HTML con sus
 * componentes pp-*, ver scripts/snapshot-tablero.mjs) y les devuelve lo que allí
 * hacía su JavaScript: los grupos de botones que alternan paneles y los
 * enlaces entre páginas.
 */
export function TableroContent({ sections }: { sections: TableroSection[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // logotipos del diseño en lugar de los del tablero
  useEffect(() => {
    for (const img of ref.current?.querySelectorAll<HTMLImageElement>('img[data-logo]') ?? []) {
      const src = LOGOS[img.dataset.logo ?? '']
      if (src) img.src = src
    }
    for (const a of ref.current?.querySelectorAll<HTMLAnchorElement>('a[data-ruta]') ?? []) {
      if (!RUTAS.has(new URL(a.href).pathname)) {
        a.setAttribute('aria-disabled', 'true')
        a.title = 'Próximamente'
      }
    }
  }, [sections])

  const onClick = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement

    // botones que eligen qué panel se ve
    const boton = target.closest<HTMLElement>('[data-pp-filtro]')
    const grupo = boton?.closest<HTMLElement>('[data-pp-filtros]')
    if (boton && grupo) {
      const clave = grupo.dataset.ppFiltros
      const valor = boton.dataset.ppFiltro
      for (const otro of grupo.querySelectorAll('[data-pp-filtro]')) otro.setAttribute('aria-pressed', String(otro === boton))
      for (const panel of ref.current?.querySelectorAll<HTMLElement>(`[data-fue-panel="${clave}"]`) ?? []) panel.hidden = panel.dataset.fueValor !== valor
      return
    }

    // enlaces a otras páginas del sitio: sin recargar
    const enlace = target.closest<HTMLAnchorElement>('a[data-ruta]')
    if (enlace) {
      event.preventDefault()
      const url = new URL(enlace.href)
      if (RUTAS.has(url.pathname)) {
        navigate(url.pathname + url.hash)
        window.scrollTo({ top: 0 })
      }
    }
  }

  return (
    <div ref={ref} className="tablero pp-main" onClick={onClick}>
      {sections.map((section) => (
        // contenido generado por el propio tablero (ya escapado por él) y guardado en el repositorio
        <section key={section.id} id={section.id} className="pp-sec" dangerouslySetInnerHTML={{ __html: section.html }} />
      ))}
    </div>
  )
}
