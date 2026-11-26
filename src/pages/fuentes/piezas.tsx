/** Piezas de disposición que comparten las secciones de Fuentes (con las clases del sistema de componentes del tablero). */
import { Component, useState, type ReactNode } from 'react'
import { N, T, color } from '../../motor'
import { Col, Etiqueta, H3, Kicker, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { Tarjeta, Vacio } from '../../components/tablero/kit/tarjetas'
import { tu } from '../../components/tablero/kit/util'
import { RUTA_DE_PAGINA, esClicNormal, useGo } from '../../lib/navigation'
import { RAYA, dominio, esUrl, sinCotejar, type Sec } from './modelo'

/** Subtítulo dentro de una sección, con su párrafo de entrada. */
export const Sub = ({ titulo, children }: { titulo: string; children?: ReactNode }) => (
  <Col gap={6}>
    <H3 titulo>{titulo}</H3>
    {children ? <p className="pp-lead">{children}</p> : null}
  </Col>
)

export type Punto = { t: ReactNode; x: ReactNode; color?: string; clave?: string }

/** Lista con punto de color; el texto puede llevar etiquetas y enlaces. */
export const Puntos = ({ items, titulo }: { items: Punto[]; titulo?: string }) => (
  <>
    {titulo ? <Kicker>{titulo}</Kicker> : null}
    <div className="pp-lectura">
      {items.map((it, i) => (
        <div key={i} className="pp-lectura__i">
          <span className="pp-lectura__p" aria-hidden="true" style={{ background: it.color || (it.clave ? color(it.clave) : N.DISENO.teal) }} />
          <div>
            <b>{it.t}</b>
            <span>{it.x}</span>
          </div>
        </div>
      ))}
    </div>
  </>
)

export type Nota = { t: ReactNode; x: ReactNode }

/** Rejilla de notas con título (`min` = ancho mínimo de columna en px del tablero). */
export const Notas = ({ items, min = 260 }: { items: Nota[]; min?: number }) => (
  <div className="pp-rej" style={tu({ '--pp-min': min, '--pp-gap': 22 })}>
    {items.map((n, i) => (
      <div key={i} className="pp-notas__i">
        <span className="pp-notas__t">{n.t}</span>
        <p className="pp-notas__x">{n.x}</p>
      </div>
    ))}
  </div>
)

/**
 * «rótulo ……… valor». Si el valor es largo, el renglón se parte y el valor baja
 * a la línea siguiente, alineado a la derecha; solo se corta dentro de sí mismo
 * si ni así cabe.
 */
export const Renglon = ({ rotulo, children }: { rotulo: string; children: ReactNode }) => (
  <div className="pp-cab pp-cab--extremos" style={{ flexWrap: 'wrap', alignItems: 'baseline', ...tu({ columnGap: 12 }) }}>
    <span className="pp-nota pp-nota--12" style={{ minWidth: 0 }}>
      {rotulo}
    </span>
    <span className="pp-h3" style={{ marginLeft: 'auto', textAlign: 'right', minWidth: 0, maxWidth: '100%', overflowWrap: 'anywhere' }}>
      {children}
    </span>
  </div>
)

type FichaProps = { fijo?: string; kicker: string; valor?: string | null; sub?: string | null; children?: ReactNode }

/** Tarjeta de un dato: rótulo, cifra, aclaración y texto. */
export const Ficha = ({ fijo, kicker, valor, sub, children }: FichaProps) => (
  <Tarjeta variante="plana">
    {fijo ? <RotuloFijo>{fijo}</RotuloFijo> : null}
    <Kicker>{kicker}</Kicker>
    {valor != null ? <span className="pp-tarjeta__t">{valor}</span> : null}
    {sub != null ? <span className="pp-tarjeta__s">{sub}</span> : null}
    {children ? <p className="pp-notas__x">{children}</p> : null}
  </Tarjeta>
)

/**
 * Contenido de una pestaña. Todos los paneles van en la página y se ve el
 * elegido; el que entra lo hace con un fundido corto (el que ya se veía al
 * cargar la página, no).
 */
export function Panel({ grupo, valor, activo, children }: { grupo: string; valor: string; activo: string; children: ReactNode }) {
  const visible = valor === activo
  const [previo, setPrevio] = useState(visible)
  const [entra, setEntra] = useState(false)
  if (visible !== previo) {
    setPrevio(visible)
    setEntra(visible)
  }
  return (
    <div className={`pp-col${entra ? ' swap-in' : ''}`} style={tu({ '--pp-gap': 18 })} data-fue-panel={grupo} data-fue-valor={valor} hidden={!visible}>
      {children}
    </div>
  )
}

/** Sección que no se puede armar porque falta su dato. */
export const VacioSec = ({ s, x }: { s: Sec; x: string }) => (
  <Seccion id={s.id} tag={s.corto} n={s.n ?? undefined} titulo={s.titulo}>
    <Vacio chico k="Sin datos" t={T.SIN_DATO} x={x} />
  </Seccion>
)

/** Rótulo de un bloque que no sigue los filtros de arriba. */
export const Fijo = ({ children }: { children: string }) => <RotuloFijo>{`${T.FIJO} ${children} ${T.FIJO_SUFIJO}`}</RotuloFijo>

/** La encuesta MURAL va siempre con su advertencia. */
export const EtqMural = () => <Etiqueta tipo="ambar">{sinCotejar()}</Etiqueta>

/** Enlace a una publicación (abre en otra pestaña); sin dirección, solo el texto. */
export const EnlaceExterno = ({ url, texto }: { url: unknown; texto?: string }) =>
  esUrl(url) ? (
    <a href={url} target="_blank" rel="noopener noreferrer">
      {texto || dominio(url)}
      {' ↗'}
    </a>
  ) : (
    <>{texto || RAYA}</>
  )

/** Enlace a otra página del sitio, por su clave («comparativo»). Las que todavía no existen se nombran sin destino. */
export function EnlacePagina({ pagina, className, children }: { pagina: string; className?: string; children?: ReactNode }) {
  const go = useGo()
  const ruta = RUTA_DE_PAGINA[pagina]
  const texto = children ?? N.pagina(pagina)?.txt ?? pagina
  if (!ruta) {
    return (
      <a className={className} aria-disabled="true" title="Próximamente">
        {texto}
      </a>
    )
  }
  return (
    <a
      className={className}
      href={ruta}
      onClick={(ev) => {
        if (!esClicNormal(ev)) return
        ev.preventDefault()
        go(ruta)
      }}
    >
      {texto}
    </a>
  )
}

/**
 * Si una sección falla con los datos cargados (un JSON con otra forma), se
 * rotula ella sola y el resto de la página sigue a la vista.
 */
export class Bloque extends Component<{ s: Sec; children: ReactNode }, { roto: boolean }> {
  state = { roto: false }

  static getDerivedStateFromError() {
    return { roto: true }
  }

  componentDidCatch(error: unknown) {
    console.error(`Fuentes · ${this.props.s.id}:`, error)
  }

  render() {
    const { s, children } = this.props
    if (!this.state.roto) return children
    return (
      <Seccion id={s.id} tag={s.corto} n={s.n ?? undefined} titulo={s.titulo}>
        <Vacio chico k="Bloque sin pintar" t={T.SIN_DATO} x="Este bloque no se pudo armar con los datos cargados." />
      </Seccion>
    )
  }
}
