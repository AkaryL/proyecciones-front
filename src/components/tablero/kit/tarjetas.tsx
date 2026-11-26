/**
 * Tarjetas, logotipos, indicadores y leyendas del sistema de componentes del
 * tablero. Mismo marcado que el tablero original.
 */
import type { CSSProperties, ReactNode } from 'react'
import logoMc from '../../../assets/img/tablero/logo_mc.png'
import logoMorena from '../../../assets/img/tablero/logo_morena.png'
import { Fragment } from 'react'
import { N, color, colorSobre, colorTexto, esNum, lim, num, r2, techo } from '../../../motor'
import { Aviso, Insignia, Kicker } from './base'
import { BarraApilada } from './barras'
import { tip, tu, type Parte } from './util'

/** Imágenes de los logotipos que nombres.js pide por archivo. */
const IMAGENES: Record<string, string> = { 'img/logo_mc.png': logoMc, 'img/logo_morena.png': logoMorena }

type TarjetaProps = {
  children?: ReactNode
  /** Una o varias: 'g', '24', 'plana', 'suave', 'navy', 'noche', 'sin-relleno'. */
  variante?: string
  clase?: string
  id?: string
  estilo?: CSSProperties
}

export function Tarjeta({ children, variante, clase, id, estilo }: TarjetaProps) {
  const v = variante
    ? variante
        .split(/\s+/)
        .map((x) => ` pp-tarjeta--${x}`)
        .join('')
    : ''
  return (
    <div className={`pp-tarjeta${v}${clase ? ` ${clase}` : ''}`} id={id} style={estilo}>
      {children}
    </div>
  )
}

/** Cabecera de tarjeta: insignia redonda + rótulo en versales (+ aviso), título y subtítulo. `aviso`: true = «PRELIMINAR», o su texto. */
export function CabTarjeta({ icono, kicker, aviso, titulo, sub }: { icono?: string; kicker?: string; aviso?: boolean | string | null; titulo?: ReactNode; sub?: string }) {
  return (
    <>
      <div className="pp-tarjeta__cab">
        {icono ? <Insignia icono={icono} /> : null}
        {kicker != null ? <Kicker variante="">{kicker}</Kicker> : null}
        {aviso ? <Aviso>{aviso === true ? undefined : aviso}</Aviso> : null}
      </div>
      {titulo != null ? <span className="pp-tarjeta__t">{titulo}</span> : null}
      {sub != null ? <span className="pp-tarjeta__s">{sub}</span> : null}
    </>
  )
}

/** Recuadro oscuro de lectura («Cómo leer esto.»). */
export const ComoLeer = ({ titulo, children }: { titulo?: string; children: ReactNode }) => (
  <Tarjeta variante="noche">
    <p>
      {titulo ? <strong>{titulo}</strong> : null}
      {titulo ? ' ' : null}
      {children}
    </p>
  </Tarjeta>
)

/** Tarjetas teal con insignia circular 1-2-3 (hallazgos). */
export const Numeradas = ({ items }: { items: ReactNode[] }) => (
  <div className="pp-numeradas">
    {items.map((it, i) => (
      <div key={i} className="pp-tnum">
        <div className="pp-tnum__n" aria-hidden="true">
          <span>{i + 1}</span>
        </div>
        <p>{it}</p>
      </div>
    ))}
  </div>
)

type DistritoProps = { nombre: string; chip?: string | null; id?: string; pie?: ReactNode; children?: ReactNode }

/** Tarjeta de distrito: a la izquierda insignia, nombre y chip; a la derecha sus filas y el pie. */
export function TarjetaDistrito({ nombre, chip, id, pie, children }: DistritoProps) {
  return (
    <div className="pp-tarjeta pp-tdist" id={id}>
      <div className="pp-tdist__izq">
        <Insignia icono="pin" tam={44} />
        <span className="pp-tdist__n">{nombre}</span>
        {chip != null ? <span className="pp-chip pp-chip--gris pp-tdist__chip">{chip}</span> : null}
      </div>
      <div className="pp-tdist__der">
        {children}
        {pie ? <div className="pp-tdist__pie">{pie}</div> : null}
      </div>
    </div>
  )
}

/** Tarjeta de advertencia: signo «!», título, aviso ámbar (true = «PRELIMINAR», o su texto) y notas en columnas de `min` px. */
export function TarjetaAviso({ titulo, aviso, notas, min = 240 }: { titulo: string; aviso?: boolean | string; notas: { t: ReactNode; x: ReactNode }[]; min?: number }) {
  return (
    <Tarjeta variante="24 plana">
      <div className="pp-cab">
        <span className="pp-aviso__signo" aria-hidden="true">
          !
        </span>
        <h2 className="pp-h2 pp-h2--chico">{titulo}</h2>
        {aviso ? <Aviso>{aviso === true ? undefined : aviso}</Aviso> : null}
      </div>
      <div className="pp-rej" style={tu({ '--pp-min': min, '--pp-gap': 22 })}>
        {notas.map((n, i) => (
          <div key={i} className="pp-notas__i">
            <span className="pp-notas__t">{n.t}</span>
            <p className="pp-notas__x">{n.x}</p>
          </div>
        ))}
      </div>
    </Tarjeta>
  )
}

/** Estado vacío o pendiente (borde punteado). */
export const Vacio = ({ k, t, x, chico }: { k?: string | null; t?: string; x?: string; chico?: boolean }) => (
  <div className={`pp-vacio${chico ? ' pp-vacio--chico' : ''}`}>
    {k != null ? <span className="pp-vacio__k">{k}</span> : null}
    {t != null ? <span className="pp-vacio__t">{t}</span> : null}
    {x != null ? <span className="pp-vacio__x">{x}</span> : null}
  </div>
)

type LogoProps = { clave: string; alto?: number; placa?: boolean; sufijo?: boolean | 'abajo' }

/** Logotipo: imagen para MC y Morena; texto (o placa de color) con la sigla para el resto. */
export function Logo({ clave, alto = 28, placa, sufijo }: LogoProps) {
  const lg = N.logo(clave)
  if (lg.tipo === 'img') {
    // el emblema de MC es casi cuadrado: necesita más alto para pesar lo mismo
    const h = lg.ancho / lg.alto > 3 ? alto : Math.round(alto * 1.9)
    return (
      <span className={`pp-logo${sufijo === 'abajo' ? ' pp-logo--col' : ''}`} style={tu({ '--pp-logo-alto': h })}>
        <img src={IMAGENES[lg.src] ?? lg.src} alt={lg.alt} style={tu({ width: Math.round((h * lg.ancho) / lg.alto), height: h })} />
        {lg.sufijo && sufijo !== false ? <span className="pp-logo__suf">{lg.sufijo}</span> : null}
      </span>
    )
  }
  if (placa) {
    return (
      <span className="pp-logo pp-logo--texto pp-logo--placa" style={{ ...tu({ '--pp-logo-alto': alto }), background: color(clave), color: colorSobre(clave) }}>
        {lg.txt}
      </span>
    )
  }
  return (
    <span className="pp-logo pp-logo--texto" style={{ ...tu({ '--pp-logo-alto': alto }), color: colorTexto(clave) }}>
      {lg.txt}
    </span>
  )
}

type KpiProps = { partido?: string; valor: ReactNode; rotulo?: ReactNode; sub?: string; variante?: 'claro' | 'navy' | 'teal'; tip?: string | null }

/** Tarjeta KPI. Con `partido` lleva su logotipo; 'navy' cifra blanca; 'teal' cifra en menta. */
export function Kpi({ partido, valor, rotulo, sub, variante, tip: ayuda }: KpiProps) {
  const v = variante ?? (partido ? 'claro' : 'navy')
  return (
    <div className={`pp-kpi pp-kpi--${v}`} {...tip(ayuda)}>
      {partido ? (
        <span className="pp-kpi__logo">
          <Logo clave={partido} alto={26} sufijo />
        </span>
      ) : null}
      <span className="pp-kpi__v">{valor}</span>
      {rotulo != null ? <span className="pp-kpi__r">{rotulo}</span> : null}
      {sub != null ? <span className="pp-kpi__s">{sub}</span> : null}
    </div>
  )
}

type KpiMiniProps = { rotulo: string; valor: ReactNode; sub?: string; partes?: Parte[]; total?: number; unidad?: string }

/** KPI chico blanco: rótulo en versales, cifra, barrita apilada opcional (conteos) y nota. */
export function KpiMini({ rotulo, valor, sub, partes, total, unidad = '' }: KpiMiniProps) {
  return (
    <div className="pp-kpim">
      <Kicker estilo={{ letterSpacing: '.12em' }}>{rotulo}</Kicker>
      <span className="pp-kpim__v">{valor}</span>
      {partes ? <BarraApilada partes={partes} alto={6} rotulos={false} orden={false} total={total} unidad={unidad} dec={unidad === '%' ? 1 : 0} /> : null}
      {sub != null ? <span className="pp-kpim__s">{sub}</span> : null}
    </div>
  )
}

type PareadasProps = {
  /** Un renglón por concepto, con un valor por serie (null = sin dato). */
  filas: { t: string; valores: (number | null | undefined)[] }[]
  series: { t: string; color: string }[]
  /** Tope de la escala: 100 por defecto; si algún valor pasa de 100, la decena siguiente al mayor. */
  max?: number
  dec?: number
}

/** Dos barras por renglón para comparar dos series (encuestas frente al motor, partido por partido), con su leyenda. */
export function BarrasPareadas({ filas, series, max, dec = 1 }: PareadasProps) {
  const mayor = Math.max(0, ...filas.flatMap((f) => f.valores.filter(esNum)))
  const tope = max || (mayor <= 100 ? 100 : techo(mayor))
  return (
    <>
      <Leyenda items={series.map((s) => ({ t: s.t, color: s.color }))} />
      <div className="pp-barras pp-barras--chica" style={tu({ marginTop: 14 })}>
        {filas.map((f) => (
          <Fragment key={f.t}>
            <span className="pp-barras__n" style={{ gridRow: `span ${f.valores.length}` }}>
              {f.t}
            </span>
            {f.valores.map((v, i) => (
              <Fragment key={i}>
                <div className="pp-barras__p">
                  <div className="pp-barras__r" style={{ width: `${esNum(v) ? r2(lim((v / tope) * 100, 0, 100)) : 0}%`, background: series[i]?.color ?? N.DISENO.teal }} />
                </div>
                <span className="pp-barras__v">{num(v, dec)}</span>
              </Fragment>
            ))}
          </Fragment>
        ))}
      </div>
    </>
  )
}

export type ItemLeyenda = string | { clave?: string; t?: string; color?: string }
type LeyendaProps = { items: ItemLeyenda[]; cuadro?: boolean; nota?: string; barra?: boolean }

/** Leyenda de colores (puntos o cuadros) con su nota opcional. */
export function Leyenda({ items, cuadro, nota, barra }: LeyendaProps) {
  const lista = (
    <div className={`pp-ley${cuadro ? ' pp-ley--cuadro' : ''}`}>
      {items.map((it, i) => {
        const o = typeof it === 'string' ? { clave: it } : it
        return (
          <span key={i} className="pp-ley__i">
            <i className="pp-ley__p" style={{ background: o.color || color(o.clave ?? '') }} />
            {o.t ?? N.nombre(o.clave)}
          </span>
        )
      })}
    </div>
  )
  if (!barra && nota == null) return lista
  return (
    <div className="pp-ley-barra">
      {lista}
      {nota != null ? <span className="pp-nota">{nota}</span> : null}
    </div>
  )
}
