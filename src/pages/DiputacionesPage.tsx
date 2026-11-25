import { useMemo, useRef, useState, type CSSProperties } from 'react'
import { DATOS, escenarioPorId } from '../api'
import logoMorena from '../assets/img/logo-morena.png'
import logoMc from '../assets/svg/logo-mc-horizontal.svg'
import logoPan from '../assets/svg/logo-pan.svg'
import logoPri from '../assets/svg/logo-pri.svg'
import shadowCard from '../assets/svg/shadow-card.svg'
import { SemiGauge } from '../components/charts/SemiGauge'
import { StackedBar } from '../components/charts/StackedBar'
import { Icon } from '../components/icons/Icon'
import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import { FilterPanel } from '../components/map/FilterPanel'
import { MapChrome } from '../components/map/MapChrome'
import { MapView } from '../components/map/MapView'
import { useMapExplorer } from '../components/map/useMapExplorer'
import { PartyHighlightProvider } from '../components/parties/PartyHighlightProvider'
import { PartyLegend } from '../components/parties/PartyLegend'
import { IconBadge } from '../components/ui/IconBadge'
import { NumberedHeading } from '../components/ui/NumberedHeading'
import { SectionTag } from '../components/ui/SectionTag'
import { DEFAULT_OPEN_DISTRICT, DEFAULT_SCENARIO, DISTRICT_MAP_VIEW, FEDERAL_NOTES } from '../data/diputaciones'
import {
  chipLabel,
  councilGauge,
  councilRows,
  districtBallots,
  districts as buildDistricts,
  mayorBallot,
  type CouncilGauge,
  type CouncilRow,
  type District,
  type DistrictBallot,
  type MayorBallot,
} from './diputaciones/model'
import './DiputacionesPage.css'

/** Escenarios del selector; se avisa cuáles solo mueven la alcaldía. */
const SCENARIO_OPTIONS = DATOS.escenarios.map((escenario) => ({
  value: escenario.id,
  badge: escenario.id,
  label: escenario.rotulo,
  hint: escenario.afecta.length === 1 && escenario.afecta[0] === 'ayun' ? 'Solo mueve la alcaldía' : undefined,
}))

/* ------------------------------------------------------------------ */
/* Las tres boletas                                                    */
/* ------------------------------------------------------------------ */

function MayorBallotCard({ ballot }: { ballot: MayorBallot }) {
  return (
    <article className="ballot ballot--mayor card">
      <IconBadge className="ballot__icon" icon="building" size={56} iconSize={30} />
      <h3 className="ballot__title bl f-black">ALCALDÍA</h3>
      <span className="ballot__rule" />
      <p className="ballot__kicker bl f-black">PROYECCIÓN</p>

      <div className="ballot__leaders" aria-hidden="true">
        <span className="ballot__leader ballot__leader--morena" title="Morena y aliados">
          <span className="bl f-h-bold">{ballot.leaders[0]}</span>
        </span>
        <span className="ballot__leader ballot__leader--mc" title="MC">
          <span className="bl f-h-bold">{ballot.leaders[1]}</span>
        </span>
      </div>
      <p className={`ballot__share bl f-arial-black tone-${ballot.tone}`}>{ballot.winShare}</p>
      <p className="ballot__share-note f-h-medium">
        <span className="bl">{ballot.winShareNote[0]}</span>
        <span className="bl">{ballot.winShareNote[1]}</span>
      </p>

      <p className="ballot__headline bl f-h-bold">{ballot.headline}</p>
      <p className="ballot__note bl f-h-medium">{ballot.note}</p>
    </article>
  )
}

function DistrictBallotCard({ ballot, onDistrict }: { ballot: DistrictBallot; onDistrict: (id: string) => void }) {
  return (
    <article className={`ballot ballot--${ballot.kind} card`}>
      <IconBadge className="ballot__icon" icon={ballot.icon} size={56} iconSize={30} />
      <h3 className="ballot__title bl f-black">{ballot.title}</h3>
      <p className="ballot__kicker bl f-black">PROYECCIÓN</p>

      <ul className="ballot__districts">
        {ballot.districts.map((district) => (
          <li key={district.id}>
            {/* cada círculo lleva a la tarjeta de su distrito */}
            <button type="button" className={`ballot__district tone-${district.tone}`} title={`${district.title}. Ver el distrito`} onClick={() => onDistrict(district.id)}>
              <span className="ballot__district-dot">
                <span className="bl f-h-bold">{`D${district.id}`}</span>
              </span>
              <span className="ballot__district-odds bl f-h-bold">{district.probability}</span>
            </button>
          </li>
        ))}
      </ul>

      <p className="ballot__headline ballot__headline--districts bl f-h-bold">
        <em className={`tone-${ballot.headlineTone}`}>{ballot.headline[0]}</em>
        {ballot.headline[1]}
      </p>
      <p className="ballot__note ballot__note--districts bl f-h-medium">{ballot.note}</p>
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Ayuntamiento                                                        */
/* ------------------------------------------------------------------ */

function CouncilCard({ rows, gauge }: { rows: CouncilRow[]; gauge: CouncilGauge }) {
  return (
    <div className="council card">
      <p className="council__label council__label--party bl f-h-bold">PROYECCIÓN</p>
      <p className="council__label council__label--bar bl f-h-bold">{`CORTE ${DATOS.meta.corte}`}</p>

      {rows.map((row, index) => (
        <div key={row.party} className={`council__row council__row--${row.party}`} style={{ '--row': index } as CSSProperties}>
          {row.party === 'morena' ? (
            <>
              <img className="council__logo council__logo--morena" src={logoMorena} alt="Morena" />
              <span className="council__allies bl f-h-medium">y aliados</span>
            </>
          ) : null}
          {row.party === 'mc' ? <img className="council__logo council__logo--mc" src={logoMc} alt="Movimiento Ciudadano" /> : null}
          {row.party === 'pan-pri' ? (
            <>
              <img className="council__logo council__logo--pan" src={logoPan} alt="PAN" />
              <img className="council__logo council__logo--pri" src={logoPri} alt="PRI" />
            </>
          ) : null}
          <span className="council__track">
            <span className={`council__fill tone-${row.tone}`} style={{ '--w': row.barWidth } as CSSProperties} />
          </span>
          <span className="council__value bl f-ultra">{row.label}</span>
        </div>
      ))}

      <div className={`council__gauge tone-${gauge.tone}`}>
        <SemiGauge share={gauge.share} color="var(--tone)" className="council__gauge-arc" />
        <p className="council__gauge-value bl f-arial-black">{gauge.label}</p>
        <p className="council__gauge-caption bl f-black">{gauge.caption}</p>
        <p className="council__gauge-sub bl f-h-medium">{gauge.subcaption}</p>
        <p className={`council__chip${gauge.chip.tie ? '' : ' council__chip--firm'}`}>
          <Icon name={gauge.chip.icon} />
          <span className="bl f-h-bold">{gauge.chip.text}</span>
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Distritos                                                           */
/* ------------------------------------------------------------------ */

/** Mapa desplegable de una tarjeta de distrito, con su propio panel de filtros. */
function DistrictMap({ district, scenario }: { district: string; scenario: string }) {
  const explorer = useMapExplorer({ escenario: scenario, distrito: district })
  const panelRef = useRef<HTMLElement>(null)
  const chromeRef = useRef<HTMLDivElement>(null)
  return (
    <div className="district__map">
      <MapView
        center={DISTRICT_MAP_VIEW.center}
        zoom={DISTRICT_MAP_VIEW.zoom}
        tileZoom={DISTRICT_MAP_VIEW.tileZoom}
        zoomControl={false}
        mapa={explorer.mapa}
        pintura={explorer.pintura}
        seleccion={explorer.seleccion}
        onSeleccion={explorer.seleccionar}
        destacado={explorer.destacado}
        encuadre={explorer.encuadre}
        evitar={[panelRef, chromeRef]}
        onActivar={explorer.activar}
      />
      <MapChrome ref={chromeRef} leyenda={explorer.leyenda} ficha={explorer.ficha} onCerrarFicha={() => explorer.seleccionar(null)} />
      {explorer.aviso ? (
        <p className="map-notice" role="status">
          {explorer.aviso}
        </p>
      ) : null}
      <div className="district__panel">
        <FilterPanel
          ref={panelRef}
          ambito={explorer.ambito}
          onAmbito={explorer.elegirAmbito}
          capa={explorer.capa}
          onCapa={explorer.elegirCapa}
          onSinDato={explorer.avisarSinDato}
          vista={explorer.vista}
          onVista={explorer.elegirVista}
        />
      </div>
    </div>
  )
}

type DistrictCardProps = {
  district: District
  scenario: string
  open: boolean
  onToggle: () => void
}

function DistrictCard({ district, scenario, open, onToggle }: DistrictCardProps) {
  const { tune } = district
  // Cada ajuste solo se emite si la tarjeta lo define; el resto usa el valor base del CSS.
  const vars: Record<string, number> = {}
  const set = (name: string, value: number | undefined) => {
    if (value !== undefined) vars[name] = value
  }
  set('--card-x', tune.cardX)
  set('--bars-dy', tune.barsDy)
  set('--head-dy', tune.headDy)
  set('--head-x', tune.headX)
  set('--button-x', tune.buttonX)
  set('--button-y', tune.buttonY)
  set('--button-w', tune.buttonWidth)
  set('--divider-x', tune.dividerX)
  set('--divider-y', tune.dividerY)
  set('--gap-before', tune.gapBefore)
  set('--shadow-dy', tune.shadowDy)

  const mapId = `mapa-distrito-${district.id}`
  return (
    <article id={`distrito-${district.id}`} className={`district${open ? ' district--open' : ''}`} style={vars as CSSProperties}>
      <img className="district__shadow" src={shadowCard} alt="" aria-hidden="true" />

      <div className="district__card card">
        <div className="district__head">
          <IconBadge className="district__icon" icon="pin" size={63.2} iconSize={33.8} />
          <h3 className="district__name bl f-h-bold">{district.name}</h3>
          <Icon name="grid" className="district__grid" />
          <p className="district__sections bl f-h-bold">{district.sections}</p>
        </div>
        <button type="button" className="district__map-button" aria-expanded={open} aria-controls={mapId} onClick={onToggle}>
          <span className="bl f-h-bold">Mapa</span>
        </button>
        <span className="district__divider" />

        <div className="district__bars">
          <p className="district__bar-label bl f-h-bold">DIPUTACIÓN LOCAL</p>
          <StackedBar segments={district.local} label={`${district.name}, diputación local`} />
          <p className="district__bar-label district__bar-label--federal bl f-h-bold">DIPUTACIÓN FEDERAL</p>
          <StackedBar segments={district.federal} label={`${district.name}, diputación federal`} />
        </div>
      </div>

      {open ? (
        <div className="district__drawer" id={mapId}>
          <DistrictMap district={district.id} scenario={scenario} />
        </div>
      ) : null}
    </article>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export function DiputacionesPage() {
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO)
  const [openDistrict, setOpenDistrict] = useState<string | null>(DEFAULT_OPEN_DISTRICT)

  const view = useMemo(() => {
    const escenario = escenarioPorId(scenarioId)
    return {
      chip: chipLabel(escenario),
      mayor: mayorBallot(escenario),
      ballots: districtBallots(escenario),
      rows: councilRows(escenario),
      gauge: councilGauge(escenario),
      districts: buildDistricts(escenario),
    }
  }, [scenarioId])

  /** Desde un círculo de las boletas: abre el mapa del distrito y lleva la página hasta su tarjeta. */
  const goToDistrict = (id: string) => {
    setOpenDistrict(id)
    window.requestAnimationFrame(() => document.getElementById(`distrito-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
  }

  return (
    <PageShell variant="diputaciones">
      <div className="frame diputaciones">
        <PageHero
          variant="diputaciones"
          title="DIPUTACIONES 2027"
          banner="AYUNTAMIENTO Y DIPUTACIONES"
          chip={{
            icon: 'calendar',
            text: view.chip,
            font: 'helvetica',
            select: { label: 'Escenario del motor', options: SCENARIO_OPTIONS, value: scenarioId, onChange: setScenarioId },
          }}
        />

        <section className="ballots">
          <div className="ballots__tag">
            <SectionTag width={150} textX={30.8} font="helvetica">
              3 BOLETAS
            </SectionTag>
          </div>
          <h2 className="ballots__title bl f-bold">Las tres boletas que se renuevan en Guadalajara</h2>
          <div className="ballots__grid">
            <MayorBallotCard ballot={view.mayor} />
            {view.ballots.map((ballot) => (
              <DistrictBallotCard key={ballot.kind} ballot={ballot} onDistrict={goToDistrict} />
            ))}
          </div>
        </section>

        <section className="council-section">
          <NumberedHeading number={1}>Ayuntamiento de Guadalajara</NumberedHeading>
          <CouncilCard rows={view.rows} gauge={view.gauge} />
        </section>

        <PartyHighlightProvider>
          <section className="districts">
            <NumberedHeading number={2}>Diputación local y federal · por distrito</NumberedHeading>
            <PartyLegend className="districts__legend" />
            {view.districts.map((district) => (
              <DistrictCard
                key={district.id}
                district={district}
                scenario={scenarioId}
                open={openDistrict === district.id}
                onToggle={() => setOpenDistrict((current) => (current === district.id ? null : district.id))}
              />
            ))}
          </section>
        </PartyHighlightProvider>

        <section className="federal-notes card">
          <span className="federal-notes__alert">
            <Icon name="warning" />
          </span>
          <h2 className="federal-notes__title bl f-h-bold">Sobre la diputación federal</h2>
          <div className="federal-notes__grid">
            {FEDERAL_NOTES.map((note) => (
              <article key={note.title} className="federal-note">
                <IconBadge className="federal-note__icon" icon={note.icon} size={44} iconSize={24} />
                <h3 className="federal-note__title bl f-bold">{note.title}</h3>
                <p className="federal-note__text f-h-medium">
                  {note.lines.map((line) => (
                    <span key={line} className="bl">
                      {line}
                    </span>
                  ))}
                </p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </PageShell>
  )
}
