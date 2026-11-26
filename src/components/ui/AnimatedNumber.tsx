import { useEffect, useRef, useState } from 'react'
import { DUR, duracion } from '../../lib/motion'

type AnimatedNumberProps = {
  value: number
  /** Cómo se escribe la cifra en cada cuadro («41.1%», «87%», «+1.5»…). */
  format: (value: number) => string
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3

/**
 * Cifra que, al cambiar, recorre los valores intermedios en vez de saltar. Así
 * se ve qué cambió y hacia dónde. Al cargar muestra el valor tal cual, y si un
 * cambio llega a medio camino continúa desde donde iba. Con «menos movimiento»
 * pasa directo al valor nuevo.
 */
export function AnimatedNumber({ value, format }: AnimatedNumberProps) {
  const [shown, setShown] = useState(value)
  const current = useRef(value)

  useEffect(() => {
    const from = current.current
    if (from === value) return
    const ms = duracion(DUR.large)
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = ms === 0 ? 1 : Math.min(1, (now - start) / ms)
      const next = t === 1 ? value : from + (value - from) * easeOutCubic(t)
      current.current = next
      setShown(next)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value])

  return <>{format(shown)}</>
}
