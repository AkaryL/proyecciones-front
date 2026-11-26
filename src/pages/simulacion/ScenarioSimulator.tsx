import { useState, type CSSProperties } from 'react'
import { DATOS, escenarioPorId, type Ambito, type Bloque, type Boleta } from '../../api'
import { BLOQUE, BLOQUES, textoVeredicto, veredicto } from '../../lib/electoral'
import { AnimatedNumber } from '../../components/ui/AnimatedNumber'
import { Swap } from '../../components/ui/Swap'
import { conSigno, intervalo, porcentaje } from '../../lib/format'
import './ScenarioSimulator.css'

const BOLETAS: { clave: Boleta; label: string }[] = [
  { clave: 'ayun', label: 'Alcaldía' },
  { clave: 'dip', label: 'Dip. local' },
  { clave: 'fed', label: 'Dip. federal' },
]

const AMBITOS = [{ clave: '', label: 'Guadalajara' }, ...DATOS.distritos.map((d) => ({ clave: d.id, label: `D${d.id}` }))]

/** Tope de la escala de las barras (% de la votación válida). */
const ESCALA = 60
const CENTRAL = DATOS.meta.central

type ScenarioSimulatorProps = {
  /** Escenario con el que abre (el elegido en el encabezado de la página). */
  initialScenario: string
}

/**
 * Simulador de escenarios: se elige boleta, ámbito y escenario, y se ve el voto
 * proyectado de cada candidatura, quién va adelante y cuánto cambia frente al
 * escenario central. Todas las cifras son las del motor; aquí no se calcula nada.
 */
export function ScenarioSimulator({ initialScenario }: ScenarioSimulatorProps) {
  const [scenarioId, setScenarioId] = useState(initialScenario)
  const [boleta, setBoleta] = useState<Boleta>('dip')
  const [ambito, setAmbito] = useState('')

  // la alcaldía se decide en toda la ciudad: por distrito solo hay diputaciones
  const ambitos = boleta === 'ayun' ? AMBITOS.slice(0, 1) : AMBITOS
  const scope = boleta === 'ayun' ? '' : ambito
  const escenario = escenarioPorId(scenarioId)
  const datosDe = (id: string): Ambito => {
    const b = escenarioPorId(id).boletas[boleta]
    return scope ? b.distritos[scope] : b
  }
  const datos = datosDe(scenarioId)
  const base = datosDe(CENTRAL)
  const v = veredicto(datos.gana)
  const distrito = DATOS.distritos.find((d) => d.id === scope)
  const esCentral = scenarioId === CENTRAL
  const mueve = escenario.afecta.length === 0 || escenario.afecta.includes(boleta)
  const delta = (bloque: Bloque) => datos.bloques[bloque][1] - base.bloques[bloque][1]
  const veredictoTexto = distrito?.franja ? `Más votos: ${BLOQUE[v.lider].nombre}` : textoVeredicto(v)

  return (
    <div className="simulator">
      <div className="simulator__window">
        <header className="simulator__header">
          <h3>Elige un escenario y mira cómo se mueve el voto</h3>
        </header>

        <div className="simulator__controls">
          <div className="simulator__control">
            <span className="simulator__control-label">Boleta</span>
            <div className="simulator__segments" role="group" aria-label="Boleta">
              {BOLETAS.map((item) => (
                <button key={item.clave} type="button" aria-pressed={boleta === item.clave} onClick={() => setBoleta(item.clave)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
          <div className="simulator__control">
            <span className="simulator__control-label">Ámbito</span>
            <div className="simulator__segments" role="group" aria-label="Ámbito">
              {ambitos.map((item) => (
                <button key={item.clave} type="button" aria-pressed={scope === item.clave} onClick={() => setAmbito(item.clave)}>
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="simulator__body">
          <ul className="simulator__list" aria-label="Escenarios">
            {DATOS.escenarios.map((item) => (
              <li key={item.id}>
                <button type="button" aria-pressed={item.id === scenarioId} onClick={() => setScenarioId(item.id)}>
                  <b>{item.id}</b>
                  <span>{item.rotulo}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="simulator__result" aria-live="polite">
            {/* los textos que cambian con la elección entran con un fundido corto */}
            <Swap key={escenario.id} className="simulator__kicker">
              {`${escenario.id} · ${escenario.rotulo}`}
            </Swap>
            <Swap key={veredictoTexto} className="simulator__verdict" style={{ '--tone': v.nivel === 'empate' ? '#f3f8fb' : BLOQUE[v.lider].color } as CSSProperties}>
              {veredictoTexto}
            </Swap>
            <p className="simulator__odds">
              {`${BLOQUE[v.lider].nombre} queda primero en `}
              <AnimatedNumber value={v.p} format={porcentaje} />
              {` de las corridas${distrito?.franja ? ' · solo la franja de Guadalajara, no elige diputado por sí sola' : ''}`}
            </p>

            <div className="simulator__rows">
              {BLOQUES.map((bloque) => {
                const [p10, p50, p90] = datos.bloques[bloque]
                const d = delta(bloque)
                const sube = Number(d.toFixed(1)) > 0
                const baja = Number(d.toFixed(1)) < 0
                return (
                  <div key={bloque} className="simulator__row">
                    <span className="simulator__name">{BLOQUE[bloque].nombre}</span>
                    <span className="simulator__value">
                      <AnimatedNumber value={p50} format={porcentaje} />
                    </span>
                    <span className="simulator__track">
                      <span className="simulator__fill" style={{ '--v': (Math.min(p50, ESCALA) / ESCALA) * 100, background: BLOQUE[bloque].color } as CSSProperties} />
                      {!esCentral ? (
                        <span className="simulator__mark" style={{ '--v': (Math.min(base.bloques[bloque][1], ESCALA) / ESCALA) * 100 } as CSSProperties} title={`Escenario central: ${porcentaje(base.bloques[bloque][1])}`} />
                      ) : null}
                    </span>
                    <span className="simulator__range">entre {intervalo(p10, p90)}</span>
                    {!esCentral ? (
                      <span className={`simulator__delta${sube ? ' is-up' : baja ? ' is-down' : ''}`}>{conSigno(d)} pts</span>
                    ) : null}
                  </div>
                )
              })}
            </div>

            <p className="simulator__note">
              {esCentral
                ? 'Este es el escenario central: contra él se comparan los demás.'
                : mueve
                  ? `Cambio frente al escenario central (${CENTRAL}); la marca blanca señala dónde estaba.`
                  : 'Este escenario no mueve esta boleta: las cifras son las del central.'}
            </p>
            <p className="simulator__definition">{escenario.definicion}</p>
          </div>
        </div>

        <p className="simulator__footer">
          Motor {DATOS.meta.motor} · corte {DATOS.meta.corte} · {DATOS.meta.corridas.toLocaleString('es-MX')} corridas · estimación condicional, no pronóstico
        </p>
      </div>
    </div>
  )
}
