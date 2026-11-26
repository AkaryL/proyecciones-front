import { useEffect, useRef, type ReactNode } from 'react'
import { lim } from '../../../motor'

/** ms que dura el tooltip abierto con el dedo, y ventana en que se ignora el ratón que el navegador simula tras un toque. */
const TOQUE = { dura: 4000, eco: 800 }

/**
 * Contenedor de una página del tablero con su tooltip: cualquier elemento de
 * dentro con `data-pp-tip="…"` lo muestra al pasar el cursor, al recibir el
 * foco del teclado o al tocarlo (con el dedo se queda unos segundos). Se cierra
 * con Escape, al desplazar la página o al cambiar el tamaño de la ventana.
 *
 * El globo es un solo elemento que se mueve; se coloca con `left`/`top`
 * relativos a este contenedor, porque dentro del `.frame` de la página un
 * elemento fijo no se ancla a la ventana.
 */
export function TipLayer({ className, children }: { className?: string; children: ReactNode }) {
  const cajaRef = useRef<HTMLDivElement>(null)
  const globoRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const caja = cajaRef.current
    const globo = globoRef.current
    if (!caja || !globo) return
    let reloj = 0
    let ultimoToque = 0
    let dueno: Element | null = null

    const quita = () => {
      window.clearTimeout(reloj)
      globo.hidden = true
      globo.textContent = ''
      dueno = null
    }
    /** `x`,`y` = posición del cursor; sin ellos se ancla al elemento (teclado o toque). */
    const pon = (el: Element, x?: number, y?: number, dura?: number) => {
      const texto = el.getAttribute('data-pp-tip')
      if (!texto) return quita()
      window.clearTimeout(reloj)
      globo.textContent = texto
      globo.hidden = false
      dueno = el
      const base = caja.getBoundingClientRect()
      const w = globo.offsetWidth
      const h = globo.offsetHeight
      const vw = document.documentElement.clientWidth
      const vh = document.documentElement.clientHeight
      let px: number
      let py: number
      if (x == null || y == null) {
        // encima del elemento y, si no cabe, debajo: así no tapa lo que se tocó
        const r = el.getBoundingClientRect()
        px = r.left + r.width / 2 - w / 2
        py = r.top - h - 8
        if (py < 8) py = r.bottom + 8
      } else {
        px = x - w / 2
        py = y - h - 12
        if (py < 8) py = y + 18
      }
      px = lim(px, 8, Math.max(8, vw - w - 8))
      py = lim(py, 8, Math.max(8, vh - h - 8))
      globo.style.left = `${Math.round(px - base.left)}px`
      globo.style.top = `${Math.round(py - base.top)}px`
      if (dura) reloj = window.setTimeout(quita, dura)
    }
    const conTip = (t: EventTarget | null) => (t instanceof Element ? t.closest('[data-pp-tip]') : null)
    const ecoDeToque = () => Date.now() - ultimoToque < TOQUE.eco

    const alMover = (ev: MouseEvent) => {
      if (ecoDeToque()) return
      const el = conTip(ev.target)
      if (el) pon(el, ev.clientX, ev.clientY)
      else if (dueno) quita()
    }
    const alSalir = () => {
      if (!ecoDeToque()) quita()
    }
    const alEnfocar = (ev: FocusEvent) => {
      if (ecoDeToque()) return
      const el = conTip(ev.target)
      if (el && el.matches(':focus-visible')) pon(el)
    }
    const alTocar = (ev: TouchEvent) => {
      ultimoToque = Date.now()
      const el = conTip(ev.target)
      if (!el || el === dueno) quita()
      else pon(el, undefined, undefined, TOQUE.dura)
    }
    const alTeclear = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') quita()
    }

    caja.addEventListener('mousemove', alMover)
    caja.addEventListener('mouseleave', alSalir)
    caja.addEventListener('focusin', alEnfocar)
    caja.addEventListener('focusout', quita)
    caja.addEventListener('touchstart', alTocar, { passive: true })
    document.addEventListener('keydown', alTeclear)
    window.addEventListener('scroll', quita, { passive: true, capture: true })
    window.addEventListener('resize', quita)
    return () => {
      quita()
      caja.removeEventListener('mousemove', alMover)
      caja.removeEventListener('mouseleave', alSalir)
      caja.removeEventListener('focusin', alEnfocar)
      caja.removeEventListener('focusout', quita)
      caja.removeEventListener('touchstart', alTocar)
      document.removeEventListener('keydown', alTeclear)
      window.removeEventListener('scroll', quita, { capture: true })
      window.removeEventListener('resize', quita)
    }
  }, [])

  return (
    <div ref={cajaRef} className={className}>
      {children}
      <div ref={globoRef} className="pp-tip" role="tooltip" hidden />
    </div>
  )
}
