/**
 * Voto por partido: barra, tabla, leyenda y rótulos. Los partidos van UNO POR
 * UNO en su orden fijo (MC, Morena, PT, PVEM, Hagamos/Futuro, PAN, PRI, Otros),
 * sin agruparlos por coalición; quién va adelante se dice aparte, por coalición.
 *
 * `P` es lo que devuelve la capa de datos (partidos, partidosDistrito,
 * partidosZona, partidosSeccion…).
 */
import { N, T, color, colorSobre, colorTexto, compacto, enFrase, esNum, lim, lista, num, pct, r2, type Json } from '../../../motor'
import { Icono } from './base'
import { Logo } from './tarjetas'
import { ROTULO_MIN, normPartidos, tallaRotulo, tip, type ItemPartido } from './util'

/** Rótulo visible: quién va adelante se calcula por coalición, como en 2024. */
export const RotuloCandidatura = ({ boleta, chico }: { boleta: string; chico?: boolean }) => (
  <p className={`pp-rcand${chico ? ' pp-rcand--chico' : ''}`}>
    <Icono nombre="balanza" tam={chico ? 13 : 15} />
    <span>{N.rotulo_candidatura(boleta || 'ayun')}</span>
  </p>
)

/** Etiqueta de la naturaleza de las cifras: «Estimación del motor» o «Reparto estimado por partido · cálculo propio». */
export function Naturaleza({ de, nota }: { de: Json; nota?: string }) {
  const nat: string = typeof de === 'string' ? de : de?.naturaleza || ''
  const ayuda = nota ?? (de && typeof de === 'object' ? de.nota : null)
  const reparto = nat === N.NATURALEZA?.REPARTO
  if (!nat) return null
  const mayuscula = nat.charAt(0).toUpperCase() + nat.slice(1)
  return (
    <span className={`pp-nat${reparto ? ' pp-nat--rep' : ''}`} {...tip(ayuda)}>
      <Icono nombre={reparto ? 'intercambio' : 'matraz'} tam={12} />
      {reparto ? `${mayuscula} · ${N.NATURALEZA?.CALCULO || 'cálculo propio'}` : mayuscula}
    </span>
  )
}

/**
 * Con cifras del motor tal cual, la mediana de una coalición es la suya propia
 * y no la suma de las medianas de sus partidos: pueden diferir en una o dos
 * décimas. Cuando pasa, se dice (con los repartos no pasa: suman exacto).
 */
export function NotaSuma({ P }: { P: Json }) {
  if (!P || P.naturaleza !== N.NATURALEZA.MOTOR) return null
  const distintas = lista(P.candidaturas).filter((c) => c.partidos.length > 1 && c.total && esNum(c.total.p50) && esNum(c.suma_partidos) && Math.abs(N.red(c.suma_partidos, 1) - c.total.p50) >= 0.05)
  if (!distintas.length) return null
  return (
    <span className="pp-nota pp-nota--12">
      {`${distintas.map((c) => `Los partidos de ${enFrase(c.clave)} suman ${N.num(c.suma_partidos, 1)} y la coalición ${N.num(c.total.p50, 1)}`).join(' · ')}: cada una es su propia mediana de las corridas, y la suma de medianas no es la mediana de la suma.`}
    </span>
  )
}

/** Logotipo (MC, Morena) o placa de color con la sigla (los demás) y, al lado, el nombre (`largo`: «Movimiento Ciudadano»). */
export function MarcaPartido({ clave, alto = 18, largo }: { clave: string; alto?: number; largo?: boolean }) {
  const lg = N.logo(clave)
  const nom: string = largo ? N.nombre_largo(clave) : N.nombre(clave)
  // placa que ya dice el nombre («PT») o lo empieza («Otros» → «Otros y nulos»): una sola pieza, sin repetirlo
  if (lg.tipo === 'texto' && nom.indexOf(lg.txt) === 0) {
    return (
      <span className="pp-mpart">
        <span className="pp-logo pp-logo--texto pp-logo--placa" style={{ ['--pp-logo-alto' as string]: `calc(${alto} * var(--tu))`, background: color(clave), color: colorSobre(clave) }}>
          {nom}
        </span>
      </span>
    )
  }
  return (
    <span className="pp-mpart">
      {lg.tipo === 'img' ? <Logo clave={clave} alto={alto} sufijo={false} /> : <Logo clave={clave} alto={alto} placa />}
      <span className="pp-mpart__n">{nom}</span>
    </span>
  )
}

/** Leyenda de los partidos de la boleta, uno por uno (con `largo`, su nombre completo), con su nota opcional. */
export function LeyendaPartidos({ boleta, nota, largo }: { boleta: string; nota?: string; largo?: boolean }) {
  const partidos = (
    <div className="pp-lpart" role="list" aria-label="Partidos">
      {normPartidos(null, boleta || 'ayun').items.map((x) => (
        <span key={x.clave} className={`pp-lpart__i${x.clave === 'OTROS' ? ' pp-lpart__i--otros' : ''}`} role="listitem">
          <i className="pp-ley__p" style={{ background: color(x.clave) }} />
          <MarcaPartido clave={x.clave} largo={largo} />
        </span>
      ))}
    </div>
  )
  if (nota == null) return partidos
  return (
    <div className="pp-ley-barra">
      {partidos}
      <span className="pp-nota">{nota}</span>
    </div>
  )
}

type BarraProps = { P: Json; alto?: 24 | 22 | 20 | 16; min?: number; totales?: boolean }

/** Barra apilada por partidos; debajo (si `totales`), la lista con la cifra de cada uno. */
export function BarraPartidos({ P, alto, min = ROTULO_MIN, totales }: BarraProps) {
  const Np = normPartidos(P)
  const votos = Np.unidad === 'votos'
  const dec = votos ? 0 : 1
  const its = Np.items.filter((x): x is ItemPartido & { p50: number } => esNum(x.p50) && x.p50 > 0)
  const escala = (votos ? its.reduce((s, x) => s + x.p50, 0) : 100) || 1
  const cifra = (v: number) => (votos ? `${num(v, dec)} votos` : pct(v, dec))
  const corta = (v: number) => (votos ? compacto(v) : num(v, dec))
  const usado = its.reduce((s, x) => s + (x.p50 / escala) * 100, 0)
  const lectura = its.map((x) => `${x.nombre} ${cifra(x.p50)}`)
  const segs = its.map((x) => {
    const w = (x.p50 / escala) * 100
    const lg = N.logo(x.clave)
    const largo = `${lg.tipo === 'texto' ? lg.txt : x.nombre} ${corta(x.p50)}`
    return (
      <div key={x.clave} className="pp-apil__s" style={{ flexBasis: `${r2(w)}%`, background: color(x.clave), color: colorSobre(x.clave) }} {...tip(`${x.nombre} ${cifra(x.p50)}`)}>
        {w >= min ? (
          <span className={`pp-apil__l pp-apil__l--${tallaRotulo(largo)}`} data-c={corta(x.p50)}>
            {largo}
          </span>
        ) : null}
      </div>
    )
  })
  return (
    <div className={`pp-bpart${alto && alto !== 24 ? ` pp-bpart--${alto}` : ''}`}>
      <div className="pp-bpart__barra" role="img" aria-label={lectura.join('; ')}>
        {segs}
        {!votos && usado < 99.5 ? <div className="pp-apil__s pp-bpart__resto" style={{ flexBasis: `${r2(100 - usado)}%` }} {...tip(`${T.RESTO} ${pct((escala * (100 - usado)) / 100, dec)}`)} /> : null}
      </div>
      {totales !== false ? (
        <div className="pp-bpart__tot">
          {Np.items
            .filter((x) => esNum(x.p50))
            .map((x) => (
              <span key={x.clave} className={`pp-bpart__t${x.clave === 'OTROS' ? ' pp-bpart__t--otros' : ''}`}>
                <i style={{ background: color(x.clave) }} />
                {x.nombre} <b>{cifra(x.p50 as number)}</b>
              </span>
            ))}
        </div>
      ) : null}
    </div>
  )
}

/** Tabla con una fila por partido: marca, cifra, rango (si lo hay) y barrita. */
export function TablaPartidos({ P, aria }: { P: Json; aria?: string }) {
  const Np = normPartidos(P)
  const votos = Np.unidad === 'votos'
  const dec = votos ? 0 : 1
  const conRango = Np.items.some((x) => esNum(x.p10) && esNum(x.p90))
  const max = votos ? Math.max(1, ...Np.items.map((x) => (esNum(x.p50) ? x.p50 : 0))) : 100
  return (
    <div className="pp-desliza">
      <table className="pp-tpart" aria-label={aria || 'Voto por partido'}>
        <thead>
          <tr>
            <th scope="col">{T.PARTIDO || 'Partido'}</th>
            <th scope="col">{votos ? 'Votos' : 'Voto'}</th>
            {conRango ? <th scope="col">Rango</th> : null}
            <th scope="col">
              <span className="pp-solo-lector">Barra</span>
            </th>
          </tr>
        </thead>
        <tbody className="pp-tpart__g">
          {Np.items.map((x) => (
            <tr key={x.clave} className="pp-tpart__f">
              <th scope="row">
                <MarcaPartido clave={x.clave} alto={16} />
              </th>
              <td className="pp-tpart__v" style={{ color: esNum(x.p50) ? colorTexto(x.clave) : 'inherit' }}>
                {esNum(x.p50) ? (votos ? num(x.p50, 0) : pct(x.p50, dec)) : T.SIN_DATO}
              </td>
              {conRango ? <td className="pp-tpart__r">{esNum(x.p10) && esNum(x.p90) ? N.rango(x.p10, x.p90, dec) : T.SIN_RANGO}</td> : null}
              <td className="pp-tpart__b" aria-hidden="true">
                <span className="pp-tpart__pista">
                  <span style={{ width: `${r2(esNum(x.p50) ? lim((x.p50 / max) * 100, 0, 100) : 0)}%`, background: color(x.clave) }} />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
