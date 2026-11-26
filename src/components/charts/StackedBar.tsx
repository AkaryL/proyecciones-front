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

/**
 * Barra apilada de porcentajes por partido, con separadores blancos entre
 * segmentos. Al pasar el cursor muestra el partido y su cifra; si la leyenda
 * tiene un partido resaltado, atenúa los demás.
 *
 * Cada segmento se coloca con su inicio y su ancho, y conserva su identidad
 * (su partido) entre cambios: cuando llegan cifras nuevas, cada partido se
 * desliza y crece o encoge hasta su nuevo lugar en vez de saltar o cambiar de
 * color. Para eso el orden en el DOM es fijo; el orden visual lo da la posición.
 */
export function StackedBar({ segments, size = 'lg', label }: StackedBarProps) {
  const { party: highlighted } = usePartyHighlight()
  const [hovered, setHovered] = useState<string | null>(null)
  const hasNotes = segments.some((segment) => segment.note)

  const layout = segments.map((segment, index) => ({
    segment,
    // dónde empieza: la suma de los segmentos que tiene antes
    start: segments.slice(0, index).reduce((sum, previous) => sum + previous.value, 0),
    last: index === segments.length - 1,
    id: TONE_PARTY[segment.tone] ?? `otro-${index}`,
  }))
  const stable = [...layout].sort((a, b) => a.id.localeCompare(b.id))
  const dimmed = (segment: BarSegment) => highlighted !== null && TONE_PARTY[segment.tone] !== highlighted
  const place = (item: (typeof layout)[number]) => ({ '--x': item.start, '--v': item.segment.value }) as CSSProperties

  const active = layout.find((item) => item.id === hovered)
  const party = active ? TONE_PARTY[active.segment.tone] : null

  return (
    <div className={`stacked-bar stacked-bar--${size}`} role="img" aria-label={label}>
      <div className="stacked-bar__track" onMouseLeave={() => setHovered(null)}>
        {stable.map((item) => (
          <span
            key={item.id}
            className={`stacked-bar__segment tone-${item.segment.tone}${item.last ? ' is-last' : ''}${dimmed(item.segment) ? ' is-dimmed' : ''}`}
            style={place(item)}
            onMouseEnter={() => setHovered(item.id)}
          >
            {item.segment.label ? <span className="stacked-bar__label bl">{item.segment.label}</span> : null}
          </span>
        ))}
      </div>
      {hasNotes ? (
        <div className="stacked-bar__notes" aria-hidden="true">
          {stable.map((item) => (
            <span key={item.id} className={`stacked-bar__note tone-${item.segment.tone}${dimmed(item.segment) ? ' is-dimmed' : ''}`} style={place(item)}>
              {item.segment.note ? <span className="bl">{item.segment.note}</span> : null}
            </span>
          ))}
        </div>
      ) : null}
      {active ? (
        <span className="stacked-bar__tip" style={{ '--at': active.start + active.segment.value / 2 } as CSSProperties} aria-hidden="true">
          {`${party ? PARTY_NAME[party] : 'Otros'} · ${active.segment.value}%`}
        </span>
      ) : null}
    </div>
  )
}
