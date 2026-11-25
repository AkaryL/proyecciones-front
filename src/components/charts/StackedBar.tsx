import { useState, type CSSProperties } from 'react'
import { PARTY_NAME, TONE_PARTY, type BarSegment } from '../../data/parties'
import { usePartyHighlight } from '../parties/usePartyHighlight'
import './StackedBar.css'

type StackedBarProps = {
  segments: BarSegment[]
  /** `lg`: barras de distrito (47 px). `sm`: barras de la tabla por grupos (26 px). */
  size?: 'lg' | 'sm'
  /** Descripción para lectores de pantalla. */
  label?: string
}

const share = (value: number) => ({ '--v': value }) as CSSProperties

/**
 * Barra apilada de porcentajes por partido, con separadores blancos entre
 * segmentos. Al pasar el cursor muestra el partido y su cifra; si la leyenda
 * tiene un partido resaltado, atenúa los demás.
 */
export function StackedBar({ segments, size = 'lg', label }: StackedBarProps) {
  const { party: highlighted } = usePartyHighlight()
  const [hovered, setHovered] = useState<number | null>(null)
  const hasNotes = segments.some((segment) => segment.note)
  const dimmed = (segment: BarSegment) => highlighted !== null && TONE_PARTY[segment.tone] !== highlighted

  let tip: { text: string; center: number } | null = null
  if (hovered !== null && segments[hovered]) {
    const segment = segments[hovered]
    const before = segments.slice(0, hovered).reduce((sum, item) => sum + item.value, 0)
    const party = TONE_PARTY[segment.tone]
    tip = { text: `${party ? PARTY_NAME[party] : 'Otros'} · ${segment.value}%`, center: before + segment.value / 2 }
  }

  return (
    <div className={`stacked-bar stacked-bar--${size}`} role="img" aria-label={label}>
      <div className="stacked-bar__track" onMouseLeave={() => setHovered(null)}>
        {segments.map((segment, index) => (
          <span
            key={index}
            className={`stacked-bar__segment tone-${segment.tone}${dimmed(segment) ? ' is-dimmed' : ''}`}
            style={share(segment.value)}
            onMouseEnter={() => setHovered(index)}
          >
            {segment.label ? <span className="stacked-bar__label bl">{segment.label}</span> : null}
          </span>
        ))}
      </div>
      {hasNotes ? (
        <div className="stacked-bar__notes" aria-hidden="true">
          {segments.map((segment, index) => (
            <span key={index} className={`stacked-bar__note tone-${segment.tone}${dimmed(segment) ? ' is-dimmed' : ''}`} style={share(segment.value)}>
              {segment.note ? <span className="bl">{segment.note}</span> : null}
            </span>
          ))}
        </div>
      ) : null}
      {tip ? (
        <span className="stacked-bar__tip" style={{ '--at': tip.center } as CSSProperties} aria-hidden="true">
          {tip.text}
        </span>
      ) : null}
    </div>
  )
}
