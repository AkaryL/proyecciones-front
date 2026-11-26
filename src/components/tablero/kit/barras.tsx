/**
 * Barras, píldoras y medidores chicos del sistema de componentes del tablero.
 * Mismo marcado y mismas reglas de rotulado que el tablero original.
 */
import type { ReactNode } from 'react'
import { N, T, color, colorSobre, colorTexto, esNum, lim, num, partesParejo, pct, pctProb, pp, r2, signo, techo } from '../../../motor'
import { Etiqueta, Icono, Kicker } from './base'
import { ROTULO_MIN, partesDe, tallaRotulo, tip, tu, type Parte, type Partes } from './util'

type BarrasProps = {
  filas: (Parte | null | undefined)[]
  max?: number
  dec?: number
  /** '' = solo la cifra; otro texto = cifra + unidad; por defecto, porcentaje. */
  sufijo?: string
  chica?: boolean
}

/** Barras simples con el nombre a la izquierda y el valor a la derecha. */
export function Barras({ filas, max, dec = 1, sufijo, chica }: BarrasProps) {
  const fs = filas.filter((f): f is Parte & { valor: number } => Boolean(f) && esNum(f?.valor))
  const tope = max || techo(Math.max(...fs.map((f) => f.valor), 0))
  return (
    <div className={`pp-barras${chica ? ' pp-barras--chica' : ''}`} role="list">
      {fs.map((f, i) => {
        const col = f.color || color(f.clave ?? '')
        const nom = f.nombre ?? N.nombre(f.clave)
        const val = sufijo === '' ? num(f.valor, dec) : sufijo && sufijo !== '%' ? `${num(f.valor, dec)} ${sufijo}` : pct(f.valor, dec)
        return (
          <Fila key={`${nom}-${i}`}>
            <span className="pp-barras__n" role="listitem" style={{ color: f.clave && !chica ? colorTexto(f.clave) : 'inherit' }}>
              {nom}
            </span>
            <div className="pp-barras__p" aria-hidden="true">
              <div className="pp-barras__r" style={{ width: `${r2(lim((f.valor / tope) * 100, 0, 100))}%`, background: col }} />
            </div>
            <span className="pp-barras__v">{val}</span>
          </Fila>
        )
      })}
    </div>
  )
}
/** Las tres celdas de una fila van sueltas dentro de la rejilla de `.pp-barras`. */
const Fila = ({ children }: { children: ReactNode }) => <>{children}</>

export type ApiladaProps = {
  partes: Partes
  alto?: 24 | 22 | 20 | 6
  min?: number
  dec?: number
  /** `false` conserva el orden dado; por defecto va de mayor a menor. */
  orden?: boolean
  total?: number
  /** '%' (por defecto): porcentajes de 100. Otro texto: conteos («secciones», «votos»). */
  unidad?: string
  rotulos?: boolean
  nombres?: boolean
  /** Lista debajo las partes que no llevan su cifra dentro. */
  chicos?: boolean
  aria?: string
}

/** Barra apilada con las cifras dentro de los segmentos que alcanzan. */
export function BarraApilada({ partes, alto, min = ROTULO_MIN, dec = 1, orden, total, unidad = '%', rotulos, nombres, chicos, aria }: ApiladaProps) {
  const ps = partesDe(partes)
  if (orden !== false) ps.sort((a, b) => b.valor - a.valor)
  const suma = ps.reduce((s, x) => s + x.valor, 0)
  const tot = Math.max(total ?? (unidad === '%' ? 100 : suma), suma) || 1
  const cifra = (v: number) => (unidad === '%' ? pct(v, dec) : `${num(v, dec)} de ${num(tot, dec)}${unidad ? ` ${unidad}` : ''}`)
  const fuera: string[] = []
  const lectura: string[] = []
  const segs = ps.map((x, i) => {
    const v = num(x.valor, dec)
    const largo = `${nombres === false ? '' : `${x.nombre} `}${v}`
    lectura.push(`${x.nombre} ${cifra(x.valor)}`)
    const cabe = rotulos !== false && (x.valor / tot) * 100 >= min
    if (!cabe) fuera.push(`${x.nombre} ${v}`)
    return (
      <div key={`${x.nombre}-${i}`} className="pp-apil__s" style={{ flexBasis: `${r2((x.valor / tot) * 100)}%`, background: x.color, color: x.sobre }} {...tip(`${x.nombre} ${cifra(x.valor)}`)}>
        {cabe ? (
          <span className={`pp-apil__l pp-apil__l--${tallaRotulo(largo)}`} data-c={v}>
            {largo}
          </span>
        ) : null}
      </div>
    )
  })
  const resto = tot - suma
  if (resto > 0.05) lectura.push(`${T.RESTO} ${cifra(resto)}`)
  return (
    <>
      <div className={`pp-apil${alto && alto !== 24 ? ` pp-apil--${alto}` : ''}`} role="img" aria-label={aria || lectura.join(', ')}>
        {segs}
        {resto > 0.05 ? <div className="pp-apil__s" style={{ flexBasis: `${r2((resto / tot) * 100)}%`, background: N.DISENO.borde }} {...tip(`${T.RESTO} ${cifra(resto)}`)} /> : null}
      </div>
      {chicos ? <span className="pp-apil__chicos">{fuera.join(' · ')}</span> : null}
    </>
  )
}

/** Píldora «Gana X · N %» (solo donde se elige un cargo). `pg` = % de corridas en que cada coalición queda primero. */
export function PildoraGana({ pg, chica }: { pg: Record<string, unknown>; chica?: boolean }) {
  const v = N.veredicto(pg)
  const ch = chica ? ' pp-gana--chica' : ''
  if (!v.lider) return <span className={`pp-gana pp-gana--empate${ch}`}>{v.txt}</span>
  // casi empate: en gris, sin el color ni la cifra de uno solo; las dos partes
  if (v.nivel === 'empate') {
    return (
      <span className={`pp-gana pp-gana--parejo${ch}`} style={{ whiteSpace: 'normal' }} {...tip(v.detalle)}>
        <Icono nombre="empate" tam={14} />
        {v.txt}
        <b style={{ whiteSpace: 'normal' }}>{partesParejo(pg, { corto: true })}</b>
      </span>
    )
  }
  return (
    <span className={`pp-gana${ch}`} style={{ background: color(v.lider), color: colorSobre(v.lider) }} {...tip(v.detalle)}>
      <Icono nombre={v.nivel === 'gana' ? 'trofeo' : 'flecha'} tam={14} />
      {v.txt}
      <b>{pctProb(v.p)}</b>
    </span>
  )
}

type LiderProps = { clave?: string | null; t?: string; valor?: string | null; parejo?: boolean; tip?: string | null }

/** Píldora chica con el color de quien va adelante donde NO se elige cargo («MC +20.8»); «Parejo» en gris. */
export function PildoraLider({ clave, t, valor, parejo, tip: ayuda }: LiderProps) {
  if (parejo) {
    return (
      <span className="pp-gana pp-gana--chica pp-gana--parejo" {...tip(ayuda)}>
        {t ?? T.PAREJO}
        {valor != null ? <> <b>{valor}</b></> : null}
      </span>
    )
  }
  if (!clave) {
    return (
      <span className="pp-gana pp-gana--chica" style={{ background: N.DISENO.sin_dato, color: N.DISENO.tinta }}>
        {T.SIN_DATO}
      </span>
    )
  }
  return (
    <span className="pp-gana pp-gana--chica" style={{ background: color(clave), color: colorSobre(clave) }}>
      {t ?? N.nombre(clave)}
      {valor != null ? <> <b>{valor}</b></> : null}
    </span>
  )
}

type FilaBoletaProps = { rotulo: string; etiqueta?: string; etiquetaTipo?: 'ambar' | 'gris' | ''; partes: ApiladaProps['partes']; apilada?: Omit<ApiladaProps, 'partes'>; pg?: Record<string, unknown> | null }

/** Fila de la tarjeta de distrito: rótulo + etiqueta, barra apilada y, a la derecha, quién va adelante. */
export function FilaBoleta({ rotulo, etiqueta, etiquetaTipo, partes, apilada, pg }: FilaBoletaProps) {
  return (
    <div className="pp-fbol">
      <div className="pp-fbol__barra">
        <div className="pp-fbol__cab">
          <Kicker variante="chico">{rotulo}</Kicker>
          {etiqueta ? <Etiqueta tipo={etiquetaTipo}>{etiqueta}</Etiqueta> : null}
        </div>
        <BarraApilada chicos partes={partes} {...apilada} />
      </div>
      {pg ? (
        <div className="pp-fbol__gana">
          <Kicker variante="chico" estilo={{ letterSpacing: '.12em' }}>
            {T.ADELANTE_CORRIDAS}
          </Kicker>
          <PildoraGana pg={pg} />
        </div>
      ) : null}
    </div>
  )
}

/** Barrita con degradado y el valor al lado (columnas «electores», «interés» de los rankings). */
export function Lineal({ valor, max, dec = 1 }: { valor: unknown; max?: number; dec?: number }) {
  if (!esNum(valor)) return <span className="pp-lin__v">{T.SIN_DATO}</span>
  return (
    <div className="pp-lin">
      <div className="pp-lin__p">
        <div className="pp-lin__r" style={{ width: `${r2(lim((valor / (max || valor || 1)) * 100, 0, 100))}%` }} />
      </div>
      <span className="pp-lin__v">{num(valor, dec)}</span>
    </div>
  )
}

const ANILLO = { caja: 34, r: 14 }

/** Anillo chico de porcentaje con su cifra. */
export function Anillo({ p, tam = 26, dec = 0 }: { p: unknown; tam?: number; dec?: number }) {
  const c = ANILLO.caja / 2
  const largo = 2 * Math.PI * ANILLO.r
  return (
    <span className="pp-anillo">
      <svg aria-hidden="true" style={tu({ width: tam, height: tam })} viewBox={`0 0 ${ANILLO.caja} ${ANILLO.caja}`}>
        <circle className="pp-anillo__pista" cx={c} cy={c} r={ANILLO.r} />
        {esNum(p) && p > 0 ? <circle className="pp-anillo__arco" cx={c} cy={c} r={ANILLO.r} strokeDasharray={`${r2((largo * lim(p, 0, 100)) / 100)} ${r2(largo * 2)}`} transform={`rotate(-90 ${c} ${c})`} /> : null}
      </svg>
      <span className="pp-anillo__v">{esNum(p) ? pct(p, dec) : '—'}</span>
    </span>
  )
}

/** «▼ S11 −8.9» en rojo o «▲ S4 +4.3» en verde: cuánto mueve a MC un escenario. */
export function Mueve({ valor, prefijo, dec = 1 }: { valor: unknown; prefijo?: string; dec?: number }) {
  if (!esNum(valor)) return <span className="pp-mueve">—</span>
  return (
    <span className={`pp-mueve pp-mueve--${valor < 0 ? 'baja' : 'sube'}`}>
      {valor < 0 ? '▼' : '▲'} {prefijo ? `${prefijo} ` : ''}
      {signo(valor, dec)}
    </span>
  )
}

type MiniLineaProps = { valores: (number | null | undefined)[]; clave?: string; color?: string; /** Dibuja la raya del cero si los valores la cruzan. */ cero?: boolean; aria?: string }

/** Mini-línea de trayectoria con su punto final (cómo se movió un margen de un corte a otro). */
export function MiniLinea({ valores, clave, color: tinta, cero, aria }: MiniLineaProps) {
  const vs = valores.filter(esNum)
  if (vs.length < 2) return <span className="pp-nota">{T.SIN_DATO}</span>
  const W = 120
  const H = 32
  const m = 4
  const todos = cero ? [...vs, 0] : vs
  const lo = Math.min(...todos)
  const hi = Math.max(...todos)
  const d = hi - lo || 1
  const col = tinta || (clave ? color(clave) : N.DISENO.teal)
  const X = (i: number) => r2(m + (i * (W - 2 * m)) / (vs.length - 1))
  const Y = (v: number) => r2(H - m - ((v - lo) / d) * (H - 2 * m))
  return (
    <svg className="pp-minilinea" role="img" aria-label={aria || `De ${num(vs[0], 1)} a ${num(vs[vs.length - 1], 1)}`} style={tu({ width: W, height: H })} viewBox={`0 0 ${W} ${H}`}>
      {cero && lo < 0 && hi > 0 ? <line x1={m} x2={W - m} y1={Y(0)} y2={Y(0)} stroke={N.DISENO.sin_dato} strokeDasharray="2 3" /> : null}
      <polyline fill="none" stroke={col} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" points={vs.map((v, i) => `${X(i)},${Y(v)}`).join(' ')} />
      <circle cx={X(vs.length - 1)} cy={Y(vs[vs.length - 1])} r="3" fill={col} stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

export type Escalon = { id: string; nombre?: string; margen: number }
type EscaleraProps = {
  items: (Escalon | null)[]
  /** Escenario elegido. */
  sel?: string
  aria?: string
  /** Escribe la cifra sin «pp» (cuando el rótulo de arriba ya dice «en puntos»). */
  sinUnidad?: boolean
  onElegir?: (id: string) => void
}

/** Escalera de escenarios: barras divergentes del margen (derecha, MC adelante; izquierda, la coalición de Morena). */
export function Escalera({ items, sel, aria, sinUnidad, onElegir }: EscaleraProps) {
  const pos = 'MC'
  const neg = 'MORENA_ALIADOS'
  const filas = items.filter((x): x is Escalon => Boolean(x) && esNum(x?.margen)).sort((a, b) => b.margen - a.margen)
  const max = techo(Math.max(0, ...filas.map((x) => Math.abs(x.margen))), 5)
  return (
    <div className="pp-esc" role="group" aria-label={aria || 'Escenarios ordenados por margen'}>
      <div className="pp-esc__eje" aria-hidden="true">
        <span />
        <div>
          <span style={{ color: colorTexto(neg) }}>← {N.nombre(neg)}</span>
          <span style={{ color: colorTexto(pos) }}>{N.nombre(pos)} →</span>
        </div>
        <span />
      </div>
      {filas.map((x) => {
        const k = x.margen >= 0 ? pos : neg
        const cifra = pp(x.margen, 1)
        return (
          <button key={x.id} type="button" className="pp-esc__f" aria-pressed={String(x.id) === String(sel)} onClick={() => onElegir?.(x.id)}>
            <span className="pp-esc__nom">
              <span className="pp-esc__id">{x.id}</span>
              <span className="pp-esc__txt" title={x.nombre}>
                {x.nombre ?? ''}
              </span>
            </span>
            <span className="pp-esc__p">
              <i className={`pp-esc__b pp-esc__b--${x.margen >= 0 ? 'pos' : 'neg'}`} style={{ width: `${r2(lim((Math.abs(x.margen) / max) * 50, 0, 50))}%`, background: color(k) }} />
            </span>
            <span className="pp-esc__v" style={{ color: colorTexto(k) }}>
              {sinUnidad ? cifra.replace(/[\s ]pp$/, '') : cifra}
            </span>
          </button>
        )
      })}
    </div>
  )
}
