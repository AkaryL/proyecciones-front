import { useCallback, type MouseEvent } from 'react'
import { flushSync } from 'react-dom'
import { useLocation, useNavigate } from 'react-router-dom'
import { prefersReducedMotion } from './motion'

/** Pantalla de inicio de sesión: a ella lleva «cerrar sesión». */
export const RUTA_LOGIN = '/login'

/** Página a la que se entra al iniciar sesión. */
export const RUTA_INICIO = '/'

/**
 * Ruta de cada página del sitio, por la clave con que la nombran los datos del
 * motor. Las que el tablero original tenía y aquí todavía no existen (Monitoreo)
 * no están: un enlace a ellas se muestra sin destino.
 */
export const RUTA_DE_PAGINA: Record<string, string> = {
  mapa: '/',
  diputaciones: '/diputaciones',
  simulacion: '/simulacion',
  territorio: '/territorio',
  comparativo: '/comparativo',
  fuentes: '/fuentes',
}

/**
 * Navegación entre páginas con fundido: la página nueva aparece sobre la
 * anterior en vez de sustituirla de golpe, y siempre abre desde arriba.
 *
 * Usa la View Transitions API del navegador; donde no existe (o con «menos
 * movimiento») el cambio es inmediato. Necesita que el enrutador aplique el
 * cambio de ruta de forma síncrona (`useTransitions={false}` en App.tsx).
 */
export function useGo() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  return useCallback(
    (to: string) => {
      if (to === pathname) {
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
      const cambiar = () => {
        flushSync(() => navigate(to))
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
      if (typeof document.startViewTransition !== 'function' || prefersReducedMotion()) cambiar()
      else document.startViewTransition(cambiar)
    },
    [navigate, pathname],
  )
}

/** ¿Es un clic normal (botón principal, sin teclas para abrir en otra pestaña)? */
export const esClicNormal = (event: MouseEvent) => !event.defaultPrevented && event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey
