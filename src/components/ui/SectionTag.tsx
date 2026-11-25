import type { CSSProperties } from 'react'
import './ui.css'

type SectionTagProps = {
  children: string
  /** Ancho de la píldora en px del diseño. */
  width: number
  /** Posición horizontal del texto dentro de la píldora (px del diseño). */
  textX: number
  /** Familia del texto: Helvetica Neue (Diputaciones) o Gotham Black (Simulación). */
  font?: 'helvetica' | 'gotham'
}

/** Píldora con degradado que encabeza cada bloque ("3 BOLETAS", "GRUPOS CLAVE"…). */
export function SectionTag({ children, width, textX, font = 'gotham' }: SectionTagProps) {
  return (
    <p className="section-tag" style={{ '--w': width, '--x': textX } as CSSProperties}>
      <span className={`section-tag__text bl ${font === 'helvetica' ? 'f-h-bold' : 'f-black'}`}>{children}</span>
    </p>
  )
}
