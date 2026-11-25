import type { CSSProperties, Ref } from 'react'
import { DATOS } from '../../api'
import chevron from '../../assets/svg/select-chevron.svg'
import ring from '../../assets/svg/select-ring.svg'
import { CAPAS_ELECTORALES, CAPAS_TEMATICAS, type CapaClave, type Unidad } from '../../lib/mapLayers'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import './FilterPanel.css'

/** Líneas base de cada texto dentro del panel (px del diseño, desde su borde superior). */
const BASES = {
  electoral: { titulo: 196.2, opciones: [235.4, 266.6, 298.2, 329.4] },
  tematico: { titulo: 372.8, opciones: [410.6, 443, 475.3, 507.7, 540, 573.3] },
  vista: { titulo: 618.2, opciones: [658.6, 686.2] },
}

const VISTAS: { clave: Unidad; label: string }[] = [
  { clave: 'dist', label: 'Distritos' },
  { clave: 'secc', label: 'Secciones' },
]

/** Ámbitos del selector: todo el municipio o uno de sus distritos locales. */
const AMBITOS: DropdownOption<string>[] = [
  { value: '', label: 'Guadalajara', hint: `Todo el municipio · ${DATOS.secciones} secciones` },
  ...DATOS.distritos.map((distrito) => ({
    value: distrito.id,
    label: `Distrito ${distrito.id}`,
    hint: `${distrito.secciones} secciones${distrito.franja ? ' · solo su franja de Guadalajara' : ''}`,
  })),
]

const at = (base: number) => ({ '--base': base }) as CSSProperties

export type FilterPanelProps = {
  /** Ámbito elegido en el selector: '' = todo el municipio, o la clave de un distrito. */
  ambito: string
  onAmbito: (ambito: string) => void
  /** Capa que colorea el mapa (una a la vez entre los dos grupos «Filtrar»). */
  capa: CapaClave | null
  onCapa: (capa: CapaClave) => void
  /** La capa «Sentimiento Digital» existe en el diseño pero no tiene dato por sección. */
  onSinDato: () => void
  vista: Unidad | null
  onVista: (vista: Unidad) => void
  ref?: Ref<HTMLElement>
}

/** Panel de filtros que flota sobre el mapa (selector de ámbito, filtros y vista). */
export function FilterPanel({ ambito, onAmbito, capa, onCapa, onSinDato, vista, onVista, ref }: FilterPanelProps) {
  const actual = AMBITOS.find((option) => option.value === ambito) ?? AMBITOS[0]
  const opcion = (label: string, base: number, seleccionada: boolean, onClick: () => void, extra = '') => (
    <button
      key={label}
      type="button"
      className={`filter-panel__option bl f-book${seleccionada ? ' is-selected' : ''}${extra}`}
      style={at(base)}
      aria-pressed={seleccionada}
      onClick={onClick}
    >
      {label}
    </button>
  )

  return (
    <aside ref={ref} className="filter-panel" aria-label="Filtros del mapa">
      <div className="filter-panel__body">
        <Dropdown className="filter-panel__select" label="Ámbito del mapa" options={AMBITOS} value={ambito} onChange={onAmbito}>
          <img className="filter-panel__ring" src={ring} alt="" aria-hidden="true" />
          <span className="filter-panel__select-label bl f-bold">{actual.label}</span>
          <img className="filter-panel__chevron" src={chevron} alt="" aria-hidden="true" />
        </Dropdown>

        <div className="filter-panel__group" role="group" aria-label="Filtrar: resultado y proyección electoral">
          <h2 className="filter-panel__title bl f-bold" style={at(BASES.electoral.titulo)}>
            Filtrar
          </h2>
          {CAPAS_ELECTORALES.map((item, index) => opcion(item.label, BASES.electoral.opciones[index], capa === item.clave, () => onCapa(item.clave)))}
        </div>

        <div className="filter-panel__group" role="group" aria-label="Filtrar: capas temáticas por sección">
          <h2 className="filter-panel__title bl f-bold" style={at(BASES.tematico.titulo)}>
            Filtrar
          </h2>
          {CAPAS_TEMATICAS.map((item, index) => {
            const clave = item.clave
            return opcion(item.label, BASES.tematico.opciones[index], clave !== null && capa === clave, clave === null ? onSinDato : () => onCapa(clave))
          })}
        </div>

        <div className="filter-panel__group filter-panel__group--view" role="group" aria-label="Vista">
          <h2 className="filter-panel__title bl f-bold" style={at(BASES.vista.titulo)}>
            Vista
          </h2>
          {VISTAS.map((item, index) => opcion(item.label, BASES.vista.opciones[index], vista === item.clave, () => onVista(item.clave)))}
        </div>
      </div>
    </aside>
  )
}
