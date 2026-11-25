import { useMemo, useState, type CSSProperties } from 'react'
import { escenarioPorId } from '../api'
import logoMcEagle from '../assets/svg/logo-mc-eagle.svg'
import { Donut } from '../components/charts/Donut'
import { StackedBar } from '../components/charts/StackedBar'
import { Icon } from '../components/icons/Icon'
import { PageHero } from '../components/layout/PageHero'
import { PageShell } from '../components/layout/PageShell'
import { PartyHighlightProvider } from '../components/parties/PartyHighlightProvider'
import { PartyLegend } from '../components/parties/PartyLegend'
import { IconBadge } from '../components/ui/IconBadge'
import { SectionTag } from '../components/ui/SectionTag'
import { AGE_ANALYSIS, GROUP_MAP, INTEREST_FORMULA, KPIS, LEADERS_KPI, MEDIA_LEGEND, QUICK_READS, SIMULATOR, type GroupCell } from '../data/simulacion'
import { AGE_GROUP_ROWS, type AgeGroupRow } from '../data/simulacionGrupos'
import { DEFAULT_SCENARIO, SCENARIO_OPTIONS, scenarioLabel, verdict as buildVerdict, type ProjectedVote, type Verdict } from './simulacion/model'
import { ScenarioSimulator } from './simulacion/ScenarioSimulator'
import './SimulacionPage.css'

const vars = (values: Record<string, number | string>) => values as CSSProperties

/**
 * Enlace entre el mapa de grupos y la tabla: el grupo (género y edad) señalado
 * en uno se resalta en el otro.
 */
type GroupFocus = {
  /** Grupo bajo el cursor en el mapa de grupos: resalta sus filas en la tabla. */
  fromMap: string | null
  onMap: (group: string | null) => void
  /** Grupo de la fila bajo el cursor en la tabla: resalta su celda en el mapa. */
  fromTable: string | null
  onTable: (group: string | null) => void
}

/** Identificador de fila de la tabla para llegar a ella desde el mapa de grupos. */
const rowId = (group: string) => `grupo-${group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`

/* ------------------------------------------------------------------ */
/* Veredicto del motor                                                 */
/* ------------------------------------------------------------------ */

function VoteRow({ vote, index, axisMax }: { vote: ProjectedVote; index: number; axisMax: number }) {
  const percent = (value: number) => (value / axisMax) * 100
  return (
    <div className={`vote vote--${vote.party} tone-${vote.tone}`} style={vars({ '--row': index })}>
      {vote.party === 'morena' ? (
        <>
          <span className="vote__wordmark bl f-black">morena</span>
          <span className="vote__allies bl f-medium">y aliados</span>
        </>
      ) : null}
      {vote.party === 'mc' ? (
        <>
          <img className="vote__eagle" src={logoMcEagle} alt="" />
          <span className="vote__mc bl f-black">MC</span>
        </>
      ) : null}
      {vote.party === 'pan-pri' ? (
        <>
          <span className="vote__pan">
            <span className="bl f-black">PAN</span>
          </span>
          <span className="vote__pri">
            <span className="bl f-black">PRI</span>
          </span>
        </>
      ) : null}

      <span className="vote__value bl f-black">{vote.label}</span>
      {vote.delta ? <span className="vote__delta bl f-bold">{vote.delta}</span> : null}

      <div className="vote__plot">
        <span className="vote__track" />
        {vote.range ? (
          <span className="vote__range" style={vars({ '--from': percent(vote.range[0]), '--to': percent(vote.range[1]) })}>
            <span className="vote__range-label bl f-medium">{vote.rangeLabel}</span>
          </span>
        ) : null}
        <span className="vote__dot" style={vars({ '--at': percent(vote.value) })} />
      </div>
    </div>
  )
}

function VerdictCard({ verdict }: { verdict: Verdict }) {
  const ticks = Array.from({ length: verdict.axisMax / verdict.axisStep + 1 }, (_, index) => index * verdict.axisStep)
  return (
    <div className={`verdict card tone-${verdict.tone}`} aria-live="polite">
      <IconBadge className="verdict__icon" icon="trophy" size={56} iconSize={30} />
      <h2 className="verdict__title bl f-black">{verdict.title}</h2>

      <div className="verdict__odds">
        <Donut share={verdict.probability} radius={66} stroke={20} color="var(--tone)" className="verdict__donut" />
        <p className="verdict__odds-value bl f-black">{verdict.probabilityLabel}</p>
        <p className="verdict__odds-caption bl f-bold">{verdict.probabilityCaption}</p>
      </div>

      <span className="verdict__divider" />
      <p className="verdict__chart-title bl f-bold">{verdict.chartTitle}</p>

      <div className="verdict__axis" aria-hidden="true">
        {ticks.map((tick) => (
          <span key={tick} className="verdict__tick" style={vars({ '--at': (tick / verdict.axisMax) * 100 })}>
            <span className="bl f-medium">{`${tick}%`}</span>
          </span>
        ))}
      </div>

      {verdict.votes.map((vote, index) => (
        <VoteRow key={vote.party} vote={vote} index={index} axisMax={verdict.axisMax} />
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Grupos clave                                                        */
/* ------------------------------------------------------------------ */

function FormulaCard() {
  return (
    <div className="formula card">
      <p className="formula__title bl f-bold">{INTEREST_FORMULA.title}</p>
      {INTEREST_FORMULA.terms.map((term, index) => (
        <div key={term.label} className="formula__term" style={vars({ '--i': index })}>
          <IconBadge className="formula__badge" icon={term.icon} size={40} iconSize={24} />
          <span className={`formula__label formula__label--${index} bl f-black`}>
            {term.root ? <span className="formula__root">√</span> : null}
            {term.root ? ' ' : ''}
            {term.label}
          </span>
        </div>
      ))}
      <span className="formula__operator bl f-black" style={vars({ '--i': 0 })}>
        ×
      </span>
      <span className="formula__operator bl f-black" style={vars({ '--i': 1 })}>
        ×
      </span>
      <span className="formula__operator bl f-black" style={vars({ '--i': 2 })}>
        =
      </span>
      <div className="formula__result">
        <Icon name="star" />
        <span className="bl f-black">{INTEREST_FORMULA.result}</span>
      </div>
    </div>
  )
}

function KpiRow() {
  const total = LEADERS_KPI.mc + LEADERS_KPI.morena + LEADERS_KPI.other
  const kpi = (index: number) => KPIS[index]
  const plain = (index: number, slot: number) => (
    <article className="kpi card" style={vars({ '--slot': slot })}>
      <h3 className="kpi__label bl f-bold">{kpi(index).label}</h3>
      <p className="kpi__value bl f-black">{kpi(index).value}</p>
      <p className="kpi__note bl f-medium">{kpi(index).note}</p>
    </article>
  )
  return (
    <div className="kpis">
      {plain(0, 0)}
      {plain(1, 1)}
      <article className="kpi kpi--leaders card" style={vars({ '--slot': 2 })}>
        <h3 className="kpi__label bl f-bold">{LEADERS_KPI.label}</h3>
        <p className="kpi__versus f-black">
          <span className="kpi__versus-mc bl">{LEADERS_KPI.mc}</span>
          <span className="kpi__versus-dot bl">·</span>
          <span className="kpi__versus-morena bl">{LEADERS_KPI.morena}</span>
        </p>
        <span className="kpi__split" aria-hidden="true">
          <span className="tone-mc" style={vars({ '--v': (LEADERS_KPI.mc / total) * 100 })} />
          <span className="tone-morena" style={vars({ '--v': (LEADERS_KPI.morena / total) * 100 })} />
          <span className="tone-neutral" style={vars({ '--v': (LEADERS_KPI.other / total) * 100 })} />
        </span>
        <p className="kpi__caption bl f-medium">{LEADERS_KPI.note}</p>
      </article>
      {plain(2, 3)}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mapa de grupos                                                      */
/* ------------------------------------------------------------------ */

function GroupChip({ cell, group, fromTable, onMap }: { cell: GroupCell; group: string } & GroupFocus) {
  if (!cell) {
    return (
      <span className="group-chip group-chip--empty">
        <span className="bl f-medium">—</span>
      </span>
    )
  }
  // cada celda lleva a sus filas en la tabla «Análisis por grupos de edad»
  return (
    <button
      type="button"
      className={`group-chip tone-${cell.tone}${fromTable === group ? ' is-focus' : ''}`}
      title={`${group}: ver en la tabla por grupos de edad`}
      onMouseEnter={() => onMap(group)}
      onMouseLeave={() => onMap(null)}
      onFocus={() => onMap(group)}
      onBlur={() => onMap(null)}
      onClick={() => document.getElementById(rowId(group))?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
    >
      <span className="group-chip__title bl f-black">{cell.title}</span>
      <span className="group-chip__note bl f-medium">{cell.note}</span>
    </button>
  )
}

function GroupMap(props: GroupFocus) {
  return (
    <div className="group-map card">
      <h4 className="group-map__head group-map__head--men bl f-black">HOMBRES</h4>
      <h4 className="group-map__head group-map__head--women bl f-black">MUJERES</h4>
      <span className="group-map__divider" />
      {GROUP_MAP.map((row, index) => (
        <div key={row.age} className="group-map__row" style={vars({ '--i': index })}>
          <span className="group-map__age group-map__age--men bl f-black">{row.age}</span>
          <span className="group-map__cell group-map__cell--men">
            <GroupChip cell={row.men} group={`Hombres ${row.age}`} {...props} />
          </span>
          <span className="group-map__age group-map__age--women bl f-black">{row.age}</span>
          <span className="group-map__cell group-map__cell--women">
            <GroupChip cell={row.women} group={`Mujeres ${row.age}`} {...props} />
          </span>
        </div>
      ))}
    </div>
  )
}

function QuickReads() {
  return (
    <aside className="quick-reads card">
      <IconBadge className="quick-reads__icon" icon="bulb" size={40} iconSize={24} />
      <h4 className="quick-reads__title bl f-black">LECTURA RÁPIDA</h4>
      {QUICK_READS.map((item, index) => (
        <article key={item.title} className="quick-read" style={vars({ '--i': index })}>
          <IconBadge className="quick-read__icon" icon={item.icon} size={40} iconSize={24} tone={item.tone} />
          <h5 className="quick-read__title bl f-black">{item.title}</h5>
          <p className="quick-read__text f-medium">
            {item.lines.map((line) => (
              <span key={line} className="bl">
                {line}
              </span>
            ))}
          </p>
        </article>
      ))}
    </aside>
  )
}

/* ------------------------------------------------------------------ */
/* Análisis por grupos de edad                                         */
/* ------------------------------------------------------------------ */

function AgeRow({ row, index, first, fromMap, onTable }: { row: AgeGroupRow; index: number; first: boolean } & GroupFocus) {
  return (
    <li
      id={first ? rowId(row.name) : undefined}
      className={`age-row${index % 2 === 1 ? ' age-row--striped' : ''}${fromMap === row.name ? ' is-focus' : ''}`}
      style={vars({ '--dy': row.offsetY })}
      onMouseEnter={() => onTable(row.name)}
      onMouseLeave={() => onTable(null)}
    >
      <div className="age-row__content">
        <span className="age-row__number">
          <span className="bl f-black">{row.number}</span>
        </span>
        <p className="age-row__name bl f-black">{row.name}</p>
        <p className="age-row__voters bl f-medium">{row.voters}</p>

        <div className="age-row__bar">
          <StackedBar size="sm" segments={row.segments} label={`${row.name}: ${row.lead}`} />
        </div>

        <span className={`age-row__lead tone-${row.leadTone}`}>
          <span className="bl f-black">{row.lead}</span>
        </span>

        <span className="age-row__turnout">
          <Donut share={row.turnoutShare} radius={17} stroke={6} color="var(--teal)" />
          <span className="bl f-black">{row.turnout}</span>
        </span>

        <span className="age-row__media">
          {row.media.map((channel) => (
            <Icon key={channel} name={channel} />
          ))}
        </span>
      </div>
    </li>
  )
}

function AgeTable(props: GroupFocus) {
  return (
    <div className="age-table card">
      <div className="age-table__head f-black" aria-hidden="true">
        <span className="bl" style={vars({ '--x': 68 })}>
          GRUPO
        </span>
        <span className="bl" style={vars({ '--x': 376 })}>
          VOTO LOCAL · LÍNEA BASE
        </span>
        <span className="bl" style={vars({ '--x': 785.7 })}>
          LIDERA
        </span>
        <span className="bl" style={vars({ '--x': 992.6 })}>
          PARTIC.
        </span>
        <span className="bl" style={vars({ '--x': 1150 })}>
          MEDIOS
        </span>
      </div>
      <ol className="age-table__rows">
        {AGE_GROUP_ROWS.map((row, index) => (
          <AgeRow key={index} row={row} index={index} first={AGE_GROUP_ROWS.findIndex((other) => other.name === row.name) === index} {...props} />
        ))}
      </ol>
      <div className="age-table__legend f-medium">
        {MEDIA_LEGEND.map((item) => (
          <span key={item.icon} className="age-table__legend-item" style={vars({ '--x': item.x })}>
            <Icon name={item.icon} />
            <span className="bl">{item.label}</span>
          </span>
        ))}
        <span className="age-table__footnote bl">{AGE_ANALYSIS.footnote}</span>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export function SimulacionPage() {
  const [scenarioId, setScenarioId] = useState(DEFAULT_SCENARIO)
  const [fromMap, setFromMap] = useState<string | null>(null)
  const [fromTable, setFromTable] = useState<string | null>(null)
  const escenario = escenarioPorId(scenarioId)
  const verdict = useMemo(() => buildVerdict(escenarioPorId(scenarioId)), [scenarioId])
  const focus: GroupFocus = { fromMap, onMap: setFromMap, fromTable, onTable: setFromTable }

  return (
    <PageShell variant="simulacion">
      <div className="frame simulacion">
        <PageHero
          variant="simulacion"
          title="SIMULACIÓN 2027"
          banner="DIPUTACIÓN LOCAL · JUNIO 2027"
          chip={{
            icon: 'flask',
            text: scenarioLabel(escenario),
            font: 'gotham',
            select: { label: 'Escenario del motor', options: SCENARIO_OPTIONS, value: scenarioId, onChange: setScenarioId },
          }}
        />

        <section className="sim-verdict">
          <div className="sim__tag">
            <SectionTag width={250} textX={24.1}>
              VEREDICTO DEL MOTOR
            </SectionTag>
          </div>
          <VerdictCard verdict={verdict} />
        </section>

        <section className="sim-groups">
          <div className="sim__tag">
            <SectionTag width={170} textX={19.9}>
              GRUPOS CLAVE
            </SectionTag>
          </div>
          <h2 className="sim__heading bl f-black">Grupos de mayor interés estratégico</h2>
          <FormulaCard />
          <KpiRow />
          <h3 className="sim__subheading bl f-black">Mapa de grupos · quién lidera</h3>
          <div className="sim-groups__grid">
            <GroupMap {...focus} />
            <QuickReads />
          </div>
        </section>

        <PartyHighlightProvider>
          <section className="sim-ages">
            <h2 className="sim__heading bl f-black">{AGE_ANALYSIS.title}</h2>
            <p className="sim-ages__subtitle bl f-book">{AGE_ANALYSIS.subtitle}</p>
            <div className="sim-ages__legend">
              <PartyLegend scale={0.7243} className="sim-ages__parties" />
              <p className="sim-ages__legend-note bl f-medium">{AGE_ANALYSIS.legendNote}</p>
            </div>
            <AgeTable {...focus} />
          </section>
        </PartyHighlightProvider>

        <section className="sim-ai">
          <div className="sim__tag">
            <SectionTag width={170} textX={32}>
              SIMULADOR
            </SectionTag>
          </div>
          <h2 className="sim__heading bl f-black">Simulador de Escenarios Electorales</h2>
          <div className="sim-ai__grid">
            <ScenarioSimulator key={scenarioId} initialScenario={scenarioId} />
            <aside className="sim-ai__panel">
              <h3 className="sim-ai__panel-title f-black">
                {SIMULATOR.title.map((line) => (
                  <span key={line} className="bl">
                    {line}
                  </span>
                ))}
              </h3>
              {SIMULATOR.paragraphs.map((lines, index) => (
                <p key={index} className="sim-ai__panel-text f-medium">
                  {lines.map((line) => (
                    <span key={line} className="bl">
                      {line}
                    </span>
                  ))}
                </p>
              ))}
            </aside>
          </div>
        </section>
      </div>
    </PageShell>
  )
}
