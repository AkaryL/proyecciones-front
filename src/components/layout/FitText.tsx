import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

type FitTextProps = {
  children: string
  /** Ancho que debe ocupar el texto (px del diseño). */
  width: number
  /** Cuerpo máximo (px del diseño). */
  max: number
  className?: string
}

const DESIGN_WIDTH = 1440
const PROBE = 100

/**
 * Texto de una línea cuyo cuerpo se ajusta para ocupar un ancho dado, como los
 * títulos del diseño, que van de lado a lado de la franja. El cuerpo queda en
 * --size (px del diseño) para que el CSS lo use.
 */
export function FitText({ children, width, max, className }: FitTextProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [size, setSize] = useState(max)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    let vivo = true
    const medir = () => {
      const frame = el.closest('.frame')
      if (!vivo || !frame) return
      // se mide con un cuerpo de prueba y se lleva a px del diseño
      const previo = el.style.getPropertyValue('--size')
      el.style.setProperty('--size', String(PROBE))
      const ancho = (el.getBoundingClientRect().width / frame.getBoundingClientRect().width) * DESIGN_WIDTH
      el.style.setProperty('--size', previo)
      if (ancho > 0) setSize(Math.min(max, Number(((PROBE * width) / ancho).toFixed(2))))
    }
    medir()
    document.fonts.ready.then(medir)
    return () => {
      vivo = false
    }
  }, [children, width, max])

  return (
    <span ref={ref} className={className} style={{ '--size': size } as CSSProperties}>
      {children}
    </span>
  )
}
