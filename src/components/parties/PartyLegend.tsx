import type { CSSProperties } from 'react'
import logoMorena from '../../assets/img/logo-morena.png'
import badgePan from '../../assets/svg/badge-pan.svg'
import badgePri from '../../assets/svg/badge-pri.svg'
import logoMc from '../../assets/svg/logo-mc-horizontal.svg'
import { PARTY_NAME, type PartyKey } from '../../data/parties'
import { usePartyHighlight } from './usePartyHighlight'
import './PartyLegend.css'

/**
 * Leyenda de partidos. Las posiciones son las del diseño, medidas desde el
 * primer punto de color; `scale` permite reutilizarla más pequeña (Simulación).
 * Cada partido es un botón: al tocarlo, las barras de la sección lo resaltan.
 */
type LegendItem = {
  key: PartyKey
  /** Posición del punto de color. */
  dotX: number
  /** Posición del nombre bajo el logotipo. */
  nameX: number
  /** Zona sensible del botón: inicio y ancho. */
  hit: [number, number]
}

const ITEMS: LegendItem[] = [
  { key: 'mc', dotX: 0, nameX: 21.3, hit: [-10, 184] },
  { key: 'morena', dotX: 206, nameX: 247, hit: [196, 132] },
  { key: 'pan', dotX: 357.6, nameX: 396.7, hit: [347.6, 104] },
  { key: 'pri', dotX: 483.3, nameX: 524, hit: [473.3, 104] },
  { key: 'pvem', dotX: 609.1, nameX: 615.1, hit: [599.1, 104] },
  { key: 'pt', dotX: 735, nameX: 725.1, hit: [718, 126] },
]

type PartyLegendProps = {
  scale?: number
  className?: string
}

export function PartyLegend({ scale = 1, className }: PartyLegendProps) {
  const { party: highlighted, toggle } = usePartyHighlight()
  return (
    <ul
      className={`party-legend${highlighted ? ' party-legend--filtering' : ''}${className ? ` ${className}` : ''}`}
      style={{ '--legend-scale': scale } as CSSProperties}
      aria-label="Partidos: toca uno para resaltarlo en las barras"
    >
      {ITEMS.map((item) => (
        <li
          key={item.key}
          className={`party-legend__item party-legend__item--${item.key}${highlighted === item.key ? ' is-active' : ''}`}
          onClick={() => toggle(item.key)}
        >
          <button
            type="button"
            className="party-legend__hit"
            style={{ '--x': item.hit[0], '--w': item.hit[1] } as CSSProperties}
            aria-pressed={highlighted === item.key}
            aria-label={`Resaltar ${PARTY_NAME[item.key]}`}
            title={highlighted === item.key ? 'Quitar el resaltado' : `Resaltar ${PARTY_NAME[item.key]} en las barras`}
          />
          <span className="party-legend__dot" style={{ '--x': item.dotX } as CSSProperties} />
          {item.key === 'mc' ? <img className="party-legend__logo" src={logoMc} alt="" /> : null}
          {item.key === 'morena' ? <img className="party-legend__logo" src={logoMorena} alt="" /> : null}
          {item.key === 'pan' ? <img className="party-legend__logo" src={badgePan} alt="" /> : null}
          {item.key === 'pri' ? <img className="party-legend__logo" src={badgePri} alt="" /> : null}
          {item.key === 'pvem' ? (
            <span className="party-legend__logo party-legend__chip" aria-hidden="true">
              <span className="bl f-arial-black">PVEM</span>
            </span>
          ) : null}
          {item.key === 'pt' ? (
            <span className="party-legend__logo party-legend__chip" aria-hidden="true">
              <span className="bl f-arial-black">PT</span>
            </span>
          ) : null}
          <span className="party-legend__name bl f-h-medium" style={{ '--x': item.nameX } as CSSProperties}>
            {PARTY_NAME[item.key]}
          </span>
        </li>
      ))}
    </ul>
  )
}
