/**
 * Movimiento: utilidades compartidas. Las duraciones repiten las de
 * styles/tokens.css para lo que se anima desde JavaScript.
 */
import { createContext, useEffect, useState } from 'react'

export const DUR = { micro: 120, small: 180, medium: 320, large: 520 }

/** La persona pidió menos movimiento en su sistema: los cambios van sin animación. */
export const prefersReducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Duración efectiva: cero con «menos movimiento». */
export const duracion = (ms: number) => (prefersReducedMotion() ? 0 : ms)

/**
 * Mantiene en pantalla lo que acaba de desaparecer el tiempo que dura su
 * animación de salida. Devuelve el último valor y si está saliendo.
 *
 * El valor debe conservar su identidad entre un pintado y el siguiente (un
 * texto, un booleano o un objeto que llega como propiedad); no sirve un objeto
 * creado en cada pintado.
 */
export function usePresence<T>(value: T | null | undefined, exitMs: number = DUR.small): { value: T | null; leaving: boolean } {
  const [last, setLast] = useState<T | null>(value ?? null)
  // mientras hay valor, se recuerda el más reciente (ajuste durante el pintado, sin efecto)
  if (value != null && value !== last) setLast(value)

  useEffect(() => {
    if (value != null || last == null) return
    const id = window.setTimeout(() => setLast(null), duracion(exitMs))
    return () => window.clearTimeout(id)
  }, [value, last, exitMs])

  return { value: value ?? last, leaving: value == null && last != null }
}

/** `true` una vez que la página ya se pintó por primera vez. */
export function useAfterMount(): boolean {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])
  return ready
}

/**
 * `true` cuando la página ya se pintó por primera vez. Lo usa `Swap` para no
 * animar lo que venía al cargar: la página abre tal cual el diseño y solo se
 * mueve lo que cambia después.
 */
export const PaginaLista = createContext(false)

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/**
 * Lleva la ventana hasta un elemento con un desplazamiento suave que sigue al
 * elemento aunque la página cambie de alto mientras tanto (p. ej. un acordeón
 * que se abre más arriba). `offset` es el aire que queda sobre el elemento.
 */
export function scrollToElement(element: Element, { offset = 24, ms = 600 }: { offset?: number; ms?: number } = {}): void {
  const destino = () => element.getBoundingClientRect().top + window.scrollY - offset
  if (prefersReducedMotion()) {
    window.scrollTo({ top: destino(), behavior: 'instant' })
    return
  }
  const inicio = window.scrollY
  const t0 = performance.now()
  const paso = (ahora: number) => {
    const t = Math.min(1, (ahora - t0) / ms)
    window.scrollTo({ top: inicio + (destino() - inicio) * easeOutCubic(t), behavior: 'instant' })
    if (t < 1) requestAnimationFrame(paso)
  }
  requestAnimationFrame(paso)
}
