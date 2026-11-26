type DonutProps = {
  /** Proporción a mostrar (0–1). */
  share: number
  /** Radio de la línea central del anillo (px del diseño). */
  radius: number
  /** Grosor del anillo (px del diseño). */
  stroke: number
  /** Color del avance (cualquier color CSS). */
  color: string
  className?: string
}

/** Al cambiar el valor, el arco crece o se recoge hasta el nuevo; el color cambia con un fundido. */
const TRANSITION = 'stroke-dasharray var(--dur-large) var(--ease-out), stroke var(--dur-small) var(--ease-out)'

/**
 * Dona de avance. Como en el diseño, el arco arranca a las 9 en punto y avanza
 * en el sentido de las manecillas, con remates redondos.
 */
export function Donut({ share, radius, stroke, color, className }: DonutProps) {
  const size = (radius + stroke / 2) * 2
  const center = size / 2
  const circumference = 2 * Math.PI * radius
  const dash = Math.min(Math.max(share, 0), 1) * circumference
  return (
    <svg className={className} viewBox={`0 0 ${size} ${size}`} fill="none" aria-hidden="true" focusable="false">
      <circle cx={center} cy={center} r={radius} stroke="var(--track)" strokeWidth={stroke} />
      <circle
        cx={center}
        cy={center}
        r={radius}
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash.toFixed(2)} ${circumference.toFixed(2)}`}
        transform={`rotate(180 ${center} ${center})`}
        style={{ transition: TRANSITION }}
      />
    </svg>
  )
}
