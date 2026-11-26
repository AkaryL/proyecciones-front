/**
 * Tablas de ranking, filtros en píldora, fórmulas y lecturas del sistema de
 * componentes del tablero. Mismo marcado que el tablero original.
 */
import { Fragment, type CSSProperties, type ReactNode } from 'react'
import { N, color, colorSobre, tintaSobre } from '../../../motor'
import { Etiqueta, Icono, Insignia, Kicker } from './base'
import { anchoNecesario, tip, tu } from './util'
import { Tarjeta } from './tarjetas'

export type Columna = { t: string; ancho?: string; tip?: string | null; der?: boolean }
/** Celda: un nodo, o un nodo con su tooltip, alineación o color. */
export type Celda = ReactNode | { c: ReactNode; tip?: string | null; der?: boolean; color?: string }

const esCelda = (x: Celda): x is { c: ReactNode; tip?: string | null; der?: boolean; color?: string } => typeof x === 'object' && x !== null && 'c' in x

/** Los anchos de columna vienen en px del tablero dentro de la plantilla de la rejilla: se escalan. */
const escala = (ancho: string) => ancho.replace(/(\d*\.?\d+)px/g, (_, n: string) => `calc(${n} * var(--tu))`)

/** «Hagamos/Futuro» puede partirse después de la diagonal en una columna estrecha. */
const conCorte = (t: string) =>
  t.split('/').map((parte, i, todas) => (
    <Fragment key={i}>
      {parte}
      {i < todas.length - 1 ? (
        <>
          /<wbr />
        </>
      ) : null}
    </Fragment>
  ))

/** `minAncho` = ancho que la tabla necesita para leerse bien, en px del tablero; si hay menos, se encoge entera para caber (no se desliza). */
type RankingProps = { columnas: Columna[]; filas: Celda[][]; minAncho?: number; aria?: string }

/** Tabla clara de ranking dentro de una tarjeta; las columnas con explicación la muestran al tocarlas. */
export function TablaRanking({ columnas, filas, minAncho = 940, aria }: RankingProps) {
  const plantilla = columnas.map((c) => (c.ancho ? escala(c.ancho) : 'minmax(0,1fr)')).join(' ')
  // 14 y 20: la separación entre columnas y el margen lateral de las filas (.pp-trank__f en styles/tablero.css)
  const necesita = anchoNecesario(columnas, minAncho, 14, 20)
  return (
    <Tarjeta variante="sin-relleno plana">
      <div className="pp-desliza">
        <div className="pp-trank" role="table" aria-label={aria ?? ''} style={{ '--pp-cols': plantilla, '--pp-min-n': necesita, ...tu({ '--pp-min-ancho': necesita }) } as CSSProperties}>
          <div className="pp-trank__cab" role="row">
            {columnas.map((c, i) => (
              <span key={i} role="columnheader" className={c.der ? 'pp-der' : undefined} {...tip(c.tip)}>
                {conCorte(c.t)}
              </span>
            ))}
          </div>
          {filas.map((fila, f) => (
            <div key={f} className="pp-trank__f" role="row">
              {fila.map((celda, i) => {
                const x = esCelda(celda) ? celda : { c: celda }
                return (
                  <span key={i} role="cell" className={`pp-trank__c${x.der ? ' pp-der' : ''}`} style={x.color ? { color: x.color } : undefined} {...tip(x.tip)}>
                    {x.c}
                  </span>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </Tarjeta>
  )
}

/* Piezas de las celdas del ranking. */
export const RankNumero = ({ n }: { n: number }) => <Insignia texto={n} tam={28} />

export function RankNombre({ nombre, sub, etiqueta, etiquetaTipo }: { nombre: ReactNode; sub?: string; etiqueta?: string; etiquetaTipo?: 'ambar' | 'gris' | '' }) {
  return (
    <div className="pp-trank__nom">
      <b>{nombre}</b>
      {sub != null || etiqueta != null ? (
        <span>
          {sub ?? ''}
          {etiqueta != null ? <Etiqueta tipo={etiquetaTipo}>{etiqueta}</Etiqueta> : null}
        </span>
      ) : null}
    </div>
  )
}

export const SinDetalle = ({ children }: { children: ReactNode }) => <span className="pp-trank__sin">{children}</span>

/** Tarjeta de fórmula «a × b × c = resultado». */
export function Formula({ titulo, terminos, resultado, nota }: { titulo?: string; terminos: string[]; resultado: string; nota?: string }) {
  return (
    <Tarjeta variante="plana" estilo={{ ...tu({ gap: 12 }), padding: 'calc(20 * var(--tu)) calc(22 * var(--tu))' }}>
      {titulo != null ? <Kicker>{titulo}</Kicker> : null}
      <div className="pp-formula">
        {terminos.map((t, i) => (
          <Fragment key={t}>
            {i > 0 ? (
              <span className="pp-formula__o" aria-hidden="true">
                ×
              </span>
            ) : null}
            <span className="pp-formula__t">{t}</span>
          </Fragment>
        ))}
        <span className="pp-formula__o" aria-hidden="true">
          =
        </span>
        <span className="pp-formula__r">{resultado}</span>
      </div>
      {nota != null ? (
        <span className="pp-nota pp-nota--12" style={{ fontWeight: 400 }}>
          {nota}
        </span>
      ) : null}
    </Tarjeta>
  )
}

export type Lectura = { clave?: string; color?: string; icono?: string; t: string; x: ReactNode }

/** Lista de hallazgos con un punto de color («Lectura rápida»). */
export function LecturaRapida({ items, titulo }: { items: Lectura[]; titulo?: string }) {
  return (
    <>
      {titulo ? <Kicker>{titulo}</Kicker> : null}
      <div className="pp-lectura">
        {items.map((it, i) => {
          const fondo = it.color || (it.clave ? color(it.clave) : N.DISENO.teal)
          const tinta = it.clave && !it.color ? colorSobre(it.clave) : tintaSobre(fondo)
          return (
            <div key={`${it.t}-${i}`} className="pp-lectura__i">
              <span className={`pp-lectura__p${it.icono ? ' pp-lectura__p--ico' : ''}`} aria-hidden="true" style={{ background: fondo, ...(it.icono ? { color: tinta } : {}) }}>
                {it.icono ? <Icono nombre={it.icono} tam={18} /> : null}
              </span>
              <div>
                <b>{it.t}</b>
                <span>{it.x}</span>
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

/** Renglones de lectura repartidos en columnas (cada uno es su propia lista). */
export const LecturasEnRejilla = ({ items }: { items: Lectura[] }) => (
  <div className="pp-rej" style={tu({ '--pp-min': 320, '--pp-gap': 18 })}>
    {items.map((it, i) => (
      <LecturaRapida key={`${it.t}-${i}`} items={[it]} />
    ))}
  </div>
)

export type Opcion<V extends string> = { v: V; t: string; tip?: string | null; inactivo?: boolean }
type FiltrosProps<V extends string> = { opciones: Opcion<V>[]; valor: V; aria: string; onChange: (valor: V) => void }

/** Filtros en píldora (uno elegido a la vez). */
export function Filtros<V extends string>({ opciones, valor, aria, onChange }: FiltrosProps<V>) {
  return (
    <div className="pp-filtros" role="group" aria-label={aria}>
      {opciones.map((o) => (
        <button key={o.v} type="button" className="pp-filtros__b" aria-pressed={o.v === valor} disabled={o.inactivo} onClick={() => onChange(o.v)} {...tip(o.tip)}>
          {o.t}
        </button>
      ))}
    </div>
  )
}
