import { NavLink } from 'react-router-dom'
import './Navbar.css'

type NavItem = {
  label: string
  /** Ruta de la sección; las secciones aún sin diseño no navegan. */
  to?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'MAPA', to: '/' },
  { label: 'DIPUTACIONES', to: '/diputaciones' },
  { label: 'COMPARATIVO' },
  { label: 'TERRITORIO' },
  { label: 'SIMULACIÓN', to: '/simulacion' },
  { label: 'FUENTES' },
]

/** Menú superior: banda a todo lo ancho con los enlaces repartidos en la ventana. */
export function Navbar() {
  return (
    <header className="navbar">
      <nav className="navbar__nav" aria-label="Secciones">
        {NAV_ITEMS.map((item) =>
          item.to ? (
            <NavLink key={item.label} to={item.to} end className="navbar__link bl f-bold">
              {item.label}
            </NavLink>
          ) : (
            <span key={item.label} className="navbar__link navbar__link--soon bl f-bold" aria-disabled="true" title="Próximamente">
              {item.label}
            </span>
          ),
        )}
      </nav>
    </header>
  )
}
