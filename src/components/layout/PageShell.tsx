import type { ReactNode } from 'react'
import bgDiputaciones from '../../assets/img/bg-diputaciones.png'
import bgMapa from '../../assets/img/bg-mapa.png'
import bgSimulacion from '../../assets/img/bg-simulacion.png'
import { Footer } from './Footer'
import { Navbar } from './Navbar'
import './PageShell.css'

export type PageVariant = 'mapa' | 'diputaciones' | 'simulacion' | 'documento'

const BACKGROUNDS: Record<PageVariant, string> = {
  mapa: bgMapa,
  diputaciones: bgDiputaciones,
  simulacion: bgSimulacion,
  // páginas largas sin fondo propio en el diseño: el de Simulación, que es el más alto
  documento: bgSimulacion,
}

type PageShellProps = {
  variant: PageVariant
  children: ReactNode
}

/** Marco común de cada página: fondo facetado, menú superior y pie. */
export function PageShell({ variant, children }: PageShellProps) {
  return (
    <div className={`page page--${variant}`}>
      <img className="page__bg" src={BACKGROUNDS[variant]} alt="" aria-hidden="true" />
      <Navbar />
      <main className="page__main">{children}</main>
      <Footer />
    </div>
  )
}
