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

/** Media circunferencia de izquierda a derecha; el avance es un tramo de ella. */
const ARC = `M${STROKE / 2} ${CENTER}A${RADIUS} ${RADIUS} 0 0 1 ${WIDTH - STROKE / 2} ${CENTER}`
const LENGTH = 100

/**
 * Medidor semicircular (media dona). El avance se dibuja como un tramo del
 * mismo arco, así al cambiar el valor se desliza hasta el nuevo en vez de saltar.
 */
export function SemiGauge({ share, color = 'var(--morena)', className }: SemiGaugeProps) {
  const clamped = Math.min(Math.max(share, 0), 1)
  return (
    <svg className={className} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} fill="none" aria-hidden="true" focusable="false">
      <path d={ARC} stroke="var(--track)" strokeWidth={STROKE} strokeLinecap="round" />
      <path
        d={ARC}
        pathLength={LENGTH}
        stroke={color}
        strokeWidth={STROKE}
        strokeLinecap="round"
        strokeDasharray={`${(clamped * LENGTH).toFixed(3)} ${LENGTH * 2}`}
        style={{
          opacity: clamped > 0 ? 1 : 0,
          transition: 'stroke-dasharray var(--dur-large) var(--ease-out), stroke var(--dur-small) var(--ease-out), opacity var(--dur-small) var(--ease-out)',
        }}
      />
    </svg>
  )
}
