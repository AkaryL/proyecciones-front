type SemiGaugeProps = {
  /** Proporción a mostrar (0–1). */
  share: number
  /** Color del avance (cualquier color CSS); por defecto, el de Morena como en el diseño. */
  color?: string
  className?: string
}

/* Geometría del diseño: radio 104.75 px y trazo de 26 px con remates redondos. */
const RADIUS = 104.75
const STROKE = 26
const CENTER = RADIUS + STROKE / 2
const WIDTH = CENTER * 2
const HEIGHT = CENTER + STROKE / 2

/** Medidor semicircular (media dona). */
export function SemiGauge({ share, color = 'var(--morena)', className }: SemiGaugeProps) {
  const clamped = Math.min(Math.max(share, 0), 1)
  const angle = Math.PI * clamped
  const endX = CENTER - RADIUS * Math.cos(angle)
  const endY = CENTER - RADIUS * Math.sin(angle)
  const arc = (x: number, y: number) => `M${STROKE / 2} ${CENTER}A${RADIUS} ${RADIUS} 0 0 1 ${x} ${y}`
  return (
    <svg className={className} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} fill="none" aria-hidden="true" focusable="false">
      <path d={arc(WIDTH - STROKE / 2, CENTER)} stroke="var(--track)" strokeWidth={STROKE} strokeLinecap="round" />
      {clamped > 0 ? (
        <path d={arc(Number(endX.toFixed(3)), Number(endY.toFixed(3)))} stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      ) : null}
    </svg>
  )
}
