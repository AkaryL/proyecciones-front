import { useEffect, useRef, type ReactNode } from 'react'
import bgDiputaciones from '../../assets/img/bg-diputaciones.png'
import bgMapa from '../../assets/img/bg-mapa.png'
import bgSimulacion from '../../assets/img/bg-simulacion.png'
import { PaginaLista, prefersReducedMotion, useAfterMount } from '../../lib/motion'
import { BackToTop } from './BackToTop'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import './PageShell.css'

export type PageVariant = 'mapa' | 'diputaciones' | 'simulacion' | 'documento' | 'login'

const BACKGROUNDS: Record<PageVariant, string> = {
  mapa: bgMapa,
  diputaciones: bgDiputaciones,
  simulacion: bgSimulacion,
  // páginas largas sin fondo propio en el diseño: el de Simulación, que es el más alto
  documento: bgSimulacion,
  // inicio de sesión: una sola pantalla, con el fondo más corto
  login: bgMapa,
}

const SITIO = 'PE 2027 · Proyecciones Electorales'

type PageShellProps = {
  variant: PageVariant
  /** Nombre de la página para la pestaña del navegador y el historial. */
  title: string
  children: ReactNode
}

/**
 * Los bloques marcados con `data-reveal` que quedan debajo de la primera
 * pantalla aparecen con un fundido la primera vez que se llega a ellos. Lo que
 * ya está a la vista al cargar no se anima.
 */
function useReveal(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const container = root.current
    if (!container || prefersReducedMotion() || !('IntersectionObserver' in window)) return
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-reveal', '')
          observer.unobserve(entry.target)
        }
      },
      // sin umbral por porcentaje: un bloque muy alto (una sección larga) nunca llegaría a cumplirlo
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    )
    for (const element of container.querySelectorAll('[data-reveal]')) {
      if (element.getBoundingClientRect().top < window.innerHeight * 0.94) continue
      element.setAttribute('data-reveal', 'pendiente')
      observer.observe(element)
    }
    return () => observer.disconnect()
  }, [root])
}

/** Marco común de cada página: fondo facetado, menú superior y pie. */
export function PageShell({ variant, title, children }: PageShellProps) {
  const ref = useRef<HTMLDivElement>(null)
  const lista = useAfterMount()
  useReveal(ref)
  useEffect(() => {
    document.title = `${title} · ${SITIO}`
  }, [title])

  return (
    <div ref={ref} className={`page page--${variant}`}>
      <img className="page__bg" src={BACKGROUNDS[variant]} alt="" aria-hidden="true" />
      {/* en el inicio de sesión la banda va sin enlaces: todavía no se ha entrado */}
      <Navbar links={variant !== 'login'} />
      <main className="page__main">
        <PaginaLista value={lista}>{children}</PaginaLista>
      </main>
      <Footer />
      <BackToTop />
    </div>
  )
}
