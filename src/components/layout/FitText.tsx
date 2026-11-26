import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react'

const DESIGN_WIDTH = 1440
const PROBE = 100

type FitTextProps = {
  children: string
  /** Ancho que debe ocupar el texto (px del diseño). */
  width: number
  /** Cuerpo máximo (px del diseño). */
  max: number
  className?: string
}

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

type FitLinesProps = {
  lines: string[]
  /** Ancho que debe ocupar cada línea (px del diseño). */
  width: number
  /** Cuerpo máximo (px del diseño). */
  max: number
  /** Espacio entre letras de la línea más larga, en em (las demás lo abren hasta llegar al ancho). */
  tracking?: number
  className?: string
}

/**
 * Título en una o varias líneas que forman un bloque: todas con el mismo cuerpo
 * y exactamente el mismo ancho. El cuerpo lo fija la línea más larga; las más
 * cortas abren el espacio entre sus letras hasta llegar al ancho, así el bloque
 * queda parejo por los dos lados y ninguna palabra pesa más que otra.
 */
export function FitLines({ lines, width, max, tracking = 0, className }: FitLinesProps) {
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const [fit, setFit] = useState<{ size: number; tracking: number[] }>({ size: max, tracking: lines.map(() => tracking) })
  const clave = lines.join('\n')

  useLayoutEffect(() => {
    let vivo = true
    const medir = () => {
      const spans = refs.current.filter((span): span is HTMLSpanElement => span !== null)
      const frame = spans[0]?.closest('.frame')
      if (!vivo || !frame || spans.length === 0) return
      const escala = DESIGN_WIDTH / frame.getBoundingClientRect().width
      // ancho natural de cada línea, en em: cuerpo de prueba y sin espacio entre letras
      const naturales = spans.map((span) => {
        const previo = { size: span.style.getPropertyValue('--size'), ls: span.style.letterSpacing }
        span.style.setProperty('--size', String(PROBE))
        span.style.letterSpacing = '0'
        const ancho = (span.getBoundingClientRect().width * escala) / PROBE
        span.style.setProperty('--size', previo.size)
        span.style.letterSpacing = previo.ls
        return { ancho, huecos: Math.max(1, Array.from(span.textContent ?? '').length - 1) }
      })
      if (naturales.some((linea) => linea.ancho <= 0)) return
      // el cuerpo con el que la línea más larga, con su espacio entre letras, ocupa el ancho
      const size = Math.min(max, ...naturales.map((linea) => width / (linea.ancho + linea.huecos * tracking)))
      setFit({
        size: Number(size.toFixed(2)),
        tracking: naturales.map((linea) => Number(((width / size - linea.ancho) / linea.huecos).toFixed(4))),
      })
    }
    medir()
    document.fonts.ready.then(medir)
    return () => {
      vivo = false
    }
  }, [clave, width, max, tracking])

  return (
    <>
      {lines.map((line, index) => {
        const espacio = fit.tracking[index] ?? tracking
        return (
          <span
            key={line}
            ref={(span) => {
              refs.current[index] = span
            }}
            className={className}
            // el espacio tras la última letra se descuenta: la caja mide lo que miden las letras
            style={{ '--size': fit.size, letterSpacing: `${espacio}em`, marginRight: `${-espacio}em` } as CSSProperties}
          >
            {line}
          </span>
        )
      })}
    </>
  )
}
