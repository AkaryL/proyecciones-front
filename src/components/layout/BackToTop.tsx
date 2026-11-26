import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { DUR, usePresence } from '../../lib/motion'
import './BackToTop.css'

/** A partir de cuántas pantallas de desplazamiento aparece el botón. */
const PANTALLAS = 1.2

/**
 * Botón flotante para volver al inicio de la página. Aparece después de bajar
 * más de una pantalla (las páginas llegan a medir más de diez). Va fuera del
 * marco de la página para quedar fijo a la ventana.
 */
export function BackToTop() {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * PANTALLAS)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const { value, leaving } = usePresence(visible ? true : null, DUR.small)
  if (!value) return null
  return createPortal(
    <button
      type="button"
      className={`back-to-top${leaving ? ' is-leaving' : ''}`}
      aria-label="Volver arriba"
      title="Volver arriba"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
    />,
    document.body,
  )
}
