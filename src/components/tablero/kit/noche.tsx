/**
 * Panel oscuro del tablero: la gráfica (serie por mes o dispersión por fecha) y
 * la tabla oscura que va debajo. Mismo marcado y mismas cuentas que el tablero
 * original.
 *
 * Un punto de la gráfica y una fila de la tabla con el mismo `id` se resaltan
 * juntos al pasar el cursor, al enfocar o al tocar cualquiera de los dos, y el
 * pie de la gráfica escribe el detalle del punto.
 */
import { createContext, useContext, useState, type CSSProperties, type ReactNode } from 'react'
import { N, T, esNum, lim, pp, r2, signo } from '../../../motor'
import { anchoNecesario, tip, tu } from './util'
import type { Columna } from './tablas'

/** Id del punto o de la fila que se está señalando dentro del panel (o null). */
const Senalado = createContext<string | null>(null)

/* ------------------------------------------------------------------ */
/* Tabla oscura                                                        */
/* ------------------------------------------------------------------ */

/** Celda: un nodo, o un nodo con su clase ('num' = cifra a la derecha; 'fuerte'), color, alineación o tooltip. */
export type CeldaDatos = { c: ReactNode; clase?: 'num' | 'fuerte'; color?: string | null; der?: boolean; tip?: string | null }
export type CeldaOscura = ReactNode | CeldaDatos
/** `tenue` = confianza baja; `fuera` = no pasa el filtro; `id` la enlaza con el punto de la gráfica que tenga ese id. */
export type FilaOscura = { id?: string; tenue?: boolean; fuera?: boolean; celdas: CeldaOscura[] }
export type GrupoOscuro = { titulo?: string; realce?: boolean; filas: FilaOscura[] }

const esCelda = (x: CeldaOscura): x is CeldaDatos => typeof x === 'object' && x !== null && 'c' in x
/** Los anchos de columna vienen en px del tablero dentro de la plantilla de la rejilla: se escalan. */
const escala = (ancho: string) => ancho.replace(/(\d*\.?\d+)px/g, (_, n: string) => `calc(${n} * var(--tu))`)
/** «Hagamos/Futuro» puede partirse después de la diagonal en una columna estrecha. */
const conCorte = (t: string) =>
  t.split('/').flatMap((parte, i, todas) => (i < todas.length - 1 ? [`${parte}/`, <wbr key={i} />] : [parte]))

/** Punto o fila que está bajo el cursor o tiene el foco. */
const idDe = (t: EventTarget | null) => {
  const el = t instanceof Element ? t.closest('[data-pp-punto],[data-pp-fila]') : null
  return el ? (el.getAttribute('data-pp-punto') ?? el.getAttribute('data-pp-fila')) : null
}

type TablaOscuraProps = {
  columnas: Columna[]
  grupos: GrupoOscuro[]
  /** Ancho que la tabla necesita para leerse bien, en px del tablero; si hay menos, se encoge entera para caber (no se desliza). */
  minAncho?: number
  aria?: string
  /** La gráfica que va encima de la tabla, dentro del mismo panel. */
  arriba?: ReactNode
}

/** Tabla oscura: cabecera con degradado, títulos de grupo y filas atenuables. La primera columna va en blanco y negrita. */
export function TablaOscura({ columnas, grupos, minAncho = 820, aria, arriba }: TablaOscuraProps) {
  const [senalado, setSenalado] = useState<string | null>(null)
  const plantilla = columnas.map((c) => (c.ancho ? escala(c.ancho) : 'minmax(0,1fr)')).join(' ')
  // 12 y 24: la separación entre columnas y el margen lateral de las filas (.pp-tosc__f en styles/tablero.css)
  const necesita = anchoNecesario(columnas, minAncho, 12, 24)
  return (
    <div
      className="pp-noche"
      onMouseOver={(ev) => setSenalado(idDe(ev.target))}
      onMouseLeave={() => setSenalado(null)}
      onFocus={(ev) => setSenalado(idDe(ev.target))}
      onBlur={() => setSenalado(null)}
    >
      <Senalado.Provider value={senalado}>{arriba}</Senalado.Provider>
      <div className="pp-desliza">
        <div className="pp-tosc" role="table" aria-label={aria ?? ''} style={{ '--pp-cols': plantilla, '--pp-min-n': necesita, ...tu({ '--pp-min-ancho': necesita }) } as CSSProperties}>
          <div className="pp-tosc__cab" role="row">
            {columnas.map((c, i) => (
              <span key={i} role="columnheader" className={c.der ? 'pp-der' : undefined} {...tip(c.tip)}>
                {conCorte(c.t)}
              </span>
            ))}
          </div>
          {grupos.map((g, gi) => (
            <Grupo key={gi} grupo={g} columnas={columnas.length} senalado={senalado} />
          ))}
        </div>
      </div>
    </div>
  )
}

function Grupo({ grupo, columnas, senalado }: { grupo: GrupoOscuro; columnas: number; senalado: string | null }) {
  return (
    <>
      {grupo.titulo != null ? (
        <div className={`pp-tosc__g${grupo.realce ? ' pp-tosc__g--realce' : ''}`} role="row">
          <span role="columnheader" aria-colspan={columnas}>
            {grupo.titulo}
          </span>
        </div>
      ) : null}
      {grupo.filas.map((f, fi) => (
        <div
          key={f.id ?? fi}
          className={`pp-tosc__f${f.fuera ? ' pp-tosc__f--fuera' : f.tenue ? ' pp-tosc__f--tenue' : ''}`}
          role="row"
          data-pp-fila={f.id}
          data-pp-activo={f.id != null && f.id === senalado ? '' : undefined}
        >
          {f.celdas.map((celda, i) => {
            const x = esCelda(celda) ? celda : { c: celda }
            const clase = `pp-tosc__c${i === 0 && !x.clase ? ' pp-tosc__c--1' : ''}${x.clase ? ` pp-tosc__c--${x.clase}` : ''}${x.der ? ' pp-der' : ''}`
            return (
              <span key={i} role="cell" className={clase} style={x.color ? { color: x.color } : undefined} {...tip(x.tip)}>
                {x.c}
              </span>
            )
          })}
        </div>
      ))}
    </>
  )
}

/** Chip de confianza de la tabla oscura (baja, media-baja, media, media-alta, alta); otro texto, chip teal («Motor»). */
export function Confianza({ nivel }: { nivel: string }) {
  const k = String(nivel ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
  return <span className={`pp-conf${['baja', 'media-baja', 'media', 'media-alta', 'alta'].includes(k) ? ` pp-conf--${k}` : ''}`}>{nivel}</span>
}

/* ------------------------------------------------------------------ */
/* Gráfica oscura                                                      */
/* ------------------------------------------------------------------ */

/** Lienzo de la gráfica (unidades del dibujo), radio de los puntos y opacidades. */
const G = { ancho: 1000, alto: 300, izq: 50, der: 10, arriba: 20, abajo: 30, r: 7, opTenue: 0.55, opFuera: 0.22 }

/** Punto de una dispersión por fecha. `x1`–`x2` = periodo de levantamiento (barra detrás del punto). */
export type PuntoSerie = { x: string; y: number | null | undefined; x1?: string | null; x2?: string | null; id?: string; t?: string; tenue?: boolean; fuera?: boolean }

export type SerieDef = {
  t?: string
  /** 'linea' une los puntos; 'puntos' los deja sueltos; 'dispersion' sueltos, con periodo, cifra encima y color según el signo. */
  tipo: 'linea' | 'puntos' | 'dispersion'
  clave?: string
  color?: string | null
  rombo?: boolean
  /** Escribe la cifra encima de cada punto (la dispersión la lleva siempre). */
  cifras?: boolean
  /** Colorea cada punto según su signo: `pos` arriba del cero, `neg` abajo. */
  porSigno?: { pos?: string; neg?: string }
  rotPos?: string
  rotNeg?: string
  /** Eje por etiqueta: un valor por etiqueta (null = hueco) y, si se enlazan con la tabla, un id por valor. */
  valores?: (number | null | undefined)[]
  ids?: (string | null)[]
  /** Eje por fecha: cada punto en su día. */
  puntos?: PuntoSerie[]
}

type SerieProps = {
  /** Con etiquetas, el eje X es una etiqueta por valor («oct-26»…); sin ellas, por fecha. */
  etiquetas?: string[]
  series: SerieDef[]
  /** Rótulos de los dos lados del cero. */
  arriba?: string
  abajo?: string
  aria?: string
  dec?: number
}

/** Días desde 1970 (UTC) de 'AAAA-MM-DD' o 'AAAA-MM' (día 15); NaN si no es una fecha. */
const diaDe = (iso: unknown) => {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?/.exec(String(iso ?? ''))
  return m ? Date.UTC(+m[1], +m[2] - 1, m[3] ? +m[3] : 15) / 864e5 : Number.NaN
}
const colorOscuro = (k: string): string => N.color(k, 'oscuro')

type Marca = { y: number; i: number; dia: number; d1: number; d2: number; o: Partial<PuntoSerie> }

/**
 * Gráfica sobre panel oscuro: franja tenue arriba del cero, línea del cero,
 * rejilla punteada, leyenda y un pie que escribe el detalle del punto señalado.
 * Va dentro de `TablaOscura` (prop `arriba`).
 */
export function Serie({ etiquetas, series, arriba, abajo, aria, dec = 1 }: SerieProps) {
  const senalado = useContext(Senalado)
  const et = etiquetas ?? []
  const porFecha = !et.length
  const ys: number[] = []
  const dias: number[] = []
  const S = series.map((s) => {
    const pts: Marca[] = []
    if (porFecha) {
      for (const p of s.puntos ?? []) {
        if (!p || !esNum(p.y)) continue
        const q = { y: p.y, i: 0, o: p, dia: diaDe(p.x), d1: diaDe(p.x1), d2: diaDe(p.x2) }
        if (!Number.isFinite(q.dia)) continue
        pts.push(q)
        ys.push(q.y)
        dias.push(q.dia)
        if (Number.isFinite(q.d1)) dias.push(q.d1)
        if (Number.isFinite(q.d2)) dias.push(q.d2)
      }
    } else {
      ;(s.valores ?? []).forEach((v, i) => {
        if (!esNum(v)) return
        const id = s.ids?.[i]
        pts.push({ y: v, i, dia: Number.NaN, d1: Number.NaN, d2: Number.NaN, o: id != null ? { id } : {} })
        ys.push(v)
      })
    }
    return { s, pts }
  })
  const pieTxt: string = T.TOCA_PUNTO
  if (!ys.length) {
    return (
      <div className="pp-noche__graf">
        <div className="pp-noche__pie">{T.SIN_DATO}</div>
      </div>
    )
  }
  const lo = Math.min(0, ...ys)
  const hi = Math.max(0, ...ys)
  const paso = hi - lo > 30 ? 10 : hi - lo > 10 ? 5 : hi - lo > 5 ? 2 : 1
  const max = Math.ceil((hi + paso * 0.35) / paso) * paso
  const min = Math.floor((lo - paso * 0.35) / paso) * paso
  const x0 = G.izq
  const x1 = G.ancho - G.der
  const y0 = G.arriba
  const y1 = G.alto - G.abajo
  let d0 = 0
  let d1 = 1
  if (porFecha) {
    const dlo = Math.min(...dias)
    const dhi = Math.max(...dias)
    const aire = Math.max(10, (dhi - dlo) * 0.04)
    d0 = dlo - aire
    d1 = Math.max(dhi + aire, d0 + 1)
  }
  const X = (q: { dia: number; i: number }) => (porFecha ? x0 + ((q.dia - d0) / (d1 - d0)) * (x1 - x0) : et.length === 1 ? (x0 + x1) / 2 : x0 + 20 + (q.i * (x1 - x0 - 40)) / (et.length - 1))
  const XD = (d: number) => x0 + ((lim(d, d0, d1) - d0) / (d1 - d0)) * (x1 - x0)
  const Y = (v: number) => y0 + ((max - v) / (max - min || 1)) * (y1 - y0)
  const colPos = colorOscuro('MC')
  const colNeg = colorOscuro('MORENA_ALIADOS')
  const noche: string = N.DISENO.noche

  // rejilla: una raya por paso, con la del cero continua
  const rayas: number[] = []
  for (let t = Math.ceil(min / paso) * paso; t <= max + 1e-9; t += paso) rayas.push(t)
  // eje X por fecha: una marca por mes; la primera y cada enero llevan el año
  const meses: { d: number; rot: string }[] = []
  if (porFecha) {
    const f0 = new Date(d0 * 864e5)
    let an = f0.getUTCFullYear()
    let me = f0.getUTCMonth()
    const marcas: { d: number; a: number; m: number }[] = []
    for (let k = 0; k < 240; k++) {
      const dd = Date.UTC(an, me, 1) / 864e5
      if (dd > d1) break
      if (dd >= d0) marcas.push({ d: dd, a: an, m: me })
      me++
      if (me > 11) {
        me = 0
        an++
      }
    }
    const salto = Math.ceil(marcas.length / 12)
    marcas.forEach((q, i) => {
      if (i % salto) return
      meses.push({ d: q.d, rot: i === 0 || q.m === 0 ? N.mes(`${q.a}-${q.m < 9 ? '0' : ''}${q.m + 1}`, true) : N.MESES[q.m] })
    })
  }
  const cada = Math.ceil(et.length / 12)

  const leyenda: { color: string; rombo?: boolean; t: string }[] = []
  const lineas: ReactNode[] = []
  const puntos: ReactNode[] = []
  let detalle = ''
  S.forEach(({ s, pts: todos }, si) => {
    const disp = s.tipo === 'dispersion'
    const sueltos = disp || s.tipo === 'puntos'
    const col = s.color || (s.clave ? colorOscuro(s.clave) : N.DISENO.menta)
    const ps = s.porSigno || (disp && !s.color && !s.clave ? {} : null)
    const pts = porFecha ? [...todos].sort((a, b) => a.dia - b.dia) : todos
    if (!sueltos && pts.length > 1) {
      lineas.push(<polyline key={si} fill="none" stroke={col} strokeWidth="2.5" strokeLinejoin="round" points={pts.map((q) => `${r2(X(q))},${r2(Y(q.y))}`).join(' ')} />)
    }
    // los que no pasan el filtro, debajo
    for (const q of [...pts].sort((a, b) => (b.o.fuera ? 1 : 0) - (a.o.fuera ? 1 : 0))) {
      const o = q.o
      const cx = X(q)
      const cy = Y(q.y)
      const r = G.r
      const cp = ps ? (q.y >= 0 ? (ps.pos ? colorOscuro(ps.pos) : colPos) : ps.neg ? colorOscuro(ps.neg) : colNeg) : col
      const opa = o.fuera ? G.opFuera : o.tenue ? G.opTenue : 1
      const rotX: string = porFecha ? N.fecha(String(o.x)) : et[q.i]
      const det = o.t != null ? String(o.t) : `${s.t ? `${s.t} · ` : ''}${rotX} · ${pp(q.y, dec)}`
      const id = o.id != null ? String(o.id) : `·${si}·${porFecha ? o.x : q.i}`
      const activo = id === senalado
      if (activo && !detalle) detalle = det
      const hd = r * 1.2
      puntos.push(
        <g
          key={`${si}-${id}`}
          className={`pp-serie__pt${o.fuera ? ' pp-serie__pt--fuera' : ''}`}
          tabIndex={0}
          role="img"
          aria-label={det}
          data-pp-punto={id}
          data-pp-t={det}
          data-pp-activo={activo ? '' : undefined}
          opacity={opa < 1 ? r2(opa) : undefined}
        >
          {Number.isFinite(q.d1) && Number.isFinite(q.d2) && q.d2 > q.d1 ? (
            <line className="pp-serie__per" x1={r2(XD(q.d1))} x2={r2(XD(q.d2))} y1={r2(cy)} y2={r2(cy)} stroke={cp} strokeWidth="6" strokeLinecap="round" strokeOpacity=".45" />
          ) : null}
          {s.rombo ? (
            <path className="pp-serie__m" d={`M${r2(cx)} ${r2(cy - hd)}L${r2(cx + hd)} ${r2(cy)}L${r2(cx)} ${r2(cy + hd)}L${r2(cx - hd)} ${r2(cy)}Z`} fill={cp} stroke={noche} strokeWidth="2" />
          ) : (
            <circle className="pp-serie__m" cx={r2(cx)} cy={r2(cy)} r={r2(r)} fill={cp} stroke={noche} strokeWidth="2" />
          )}
          {(s.cifras ?? disp) && !o.fuera ? (
            <text className="pp-serie__val" x={r2(cx)} y={r2(cy - r - 7)} textAnchor="middle">
              {signo(q.y, dec)}
            </text>
          ) : null}
        </g>,
      )
    }
    if (ps) {
      leyenda.push({ color: ps.pos ? colorOscuro(ps.pos) : colPos, t: `${s.t ? `${s.t} · ` : ''}${s.rotPos || arriba || '+'}` })
      leyenda.push({ color: ps.neg ? colorOscuro(ps.neg) : colNeg, t: `${s.t ? `${s.t} · ` : ''}${s.rotNeg || abajo || '−'}` })
    } else if (s.t) leyenda.push({ color: col, rombo: s.rombo, t: s.t })
  })

  return (
    <div className="pp-noche__graf">
      <div className="pp-noche__ley">
        {leyenda.map((l, i) => (
          <span key={i}>
            <i className={l.rombo ? 'pp-rombo' : undefined} style={{ background: l.color }} />
            {l.t}
          </span>
        ))}
      </div>
      <div className="pp-desliza">
        <svg className="pp-serie" role="group" aria-label={aria ?? ''} viewBox={`0 0 ${G.ancho} ${G.alto}`}>
          {min < 0 && max > 0 ? <rect x="0" y="0" width={G.ancho} height={r2(Y(0))} fill={colPos} fillOpacity=".06" /> : null}
          {rayas.map((t) => (
            <g key={t}>
              <line x1={x0 - 10} x2={G.ancho} y1={r2(Y(t))} y2={r2(Y(t))} stroke="#fff" strokeOpacity={t === 0 ? '.5' : '.1'} strokeDasharray={t === 0 ? undefined : '3 5'} />
              <text x={x0 - 18} y={r2(Y(t) + 4)} textAnchor="end">
                {t === 0 ? '0' : signo(t, 0)}
              </text>
            </g>
          ))}
          {porFecha
            ? meses.map((q) => (
                <text key={q.d} x={r2(XD(q.d))} y={G.alto - 4} textAnchor="middle">
                  {q.rot}
                </text>
              ))
            : et.map((e, i) =>
                i % cada === 0 || i === et.length - 1 ? (
                  <text key={i} x={r2(X({ dia: 0, i }))} y={G.alto - 4} textAnchor="middle">
                    {e}
                  </text>
                ) : null,
              )}
          {arriba ? (
            <text x={x0 - 4} y={y0 - 2} style={{ fill: N.color_texto('MC', 'oscuro') }}>
              ↑ {arriba}
            </text>
          ) : null}
          {abajo ? (
            <text x={x0 - 4} y={y1 - 2} style={{ fill: N.color_texto('MORENA_ALIADOS', 'oscuro') }}>
              ↓ {abajo}
            </text>
          ) : null}
          {lineas}
          {puntos}
        </svg>
      </div>
      <div className="pp-noche__pie">{detalle || pieTxt}</div>
    </div>
  )
}
