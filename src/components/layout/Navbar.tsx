import { NavLink } from 'react-router-dom'
import { cerrarSesion } from '../../api/sesion'
import { esClicNormal, RUTA_LOGIN, useGo } from '../../lib/navigation'
import { Icon } from '../icons/Icon'
import './Navbar.css'

const NAV_ITEMS: { label: string; to: string }[] = [
  { label: 'MAPA', to: '/' },
  { label: 'DIPUTACIONES', to: '/diputaciones' },
  { label: 'COMPARATIVO', to: '/comparativo' },
  { label: 'TERRITORIO', to: '/territorio' },
  { label: 'SIMULACIÓN', to: '/simulacion' },
  { label: 'FUENTES', to: '/fuentes' },
]

type NavbarProps = {
  /** `false` deja solo la banda, sin enlaces ni «cerrar sesión» (pantalla de inicio de sesión). */
  links?: boolean
}

/**
 * Menú superior: banda a todo lo ancho con los enlaces repartidos en la
 * ventana. Bajo el último enlace cuelga el ícono de cerrar sesión.
 */
export function Navbar({ links = true }: NavbarProps) {
  const go = useGo()
  const salir = async () => {
    await cerrarSesion()
    go(RUTA_LOGIN)
  }

  return (
    <header className="navbar">
      {links ? (
        <nav className="navbar__nav" aria-label="Secciones">
          {NAV_ITEMS.map((item, index) => (
            <span key={item.label} className="navbar__item">
              <NavLink
                to={item.to}
                end
                className="navbar__link bl f-bold"
                onClick={(event) => {
                  // el cambio de página lleva fundido; con Ctrl/⌘ el enlace abre en otra pestaña como siempre
                  if (!esClicNormal(event)) return
                  event.preventDefault()
                  go(item.to)
                }}
              >
                {item.label}
              </NavLink>
              {index === NAV_ITEMS.length - 1 ? (
                <button type="button" className="navbar__logout" title="Cerrar sesión" aria-label="Cerrar sesión" onClick={() => void salir()}>
                  <Icon name="logout" />
                </button>
              ) : null}
            </span>
          ))}
        </nav>
      ) : null}
    </header>
  )
}
