/** Piezas chicas que comparten las secciones de Comparativo. */
import { Component, type ReactNode } from 'react'
import { N, T, type Json } from '../../motor'
import { Etiqueta, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { Vacio } from '../../components/tablero/kit/tarjetas'
import { RAYA, SIN_COTEJAR, avisoDe, prelim } from './modelo'

/** Resalta una cifra o un término dentro de un párrafo. */
export const B = ({ children }: { children: ReactNode }) => <strong>{children}</strong>

/** La encuesta MURAL va siempre marcada «sin cotejar con el original». */
export const MarcaPrelim = ({ q }: { q: Json }) =>
  prelim(q) ? (
    <>
      {' '}
      <Etiqueta tipo="ambar">{SIN_COTEJAR}</Etiqueta>
    </>
  ) : null

/** Encuesta con un aviso del generador (p. ej. la que el monitoreo no pudo volver a verificar). */
export const MarcaAviso = ({ q }: { q: Json }) =>
  avisoDe(q) ? (
    <>
      {' '}
      <Etiqueta tipo="ambar">con aviso</Etiqueta>
    </>
  ) : null

/** Enlace a la publicación de una medición; una raya si no trae dirección. */
export const Enlace = ({ url, casa }: { url: unknown; casa: string }) =>
  /^https?:\/\//.test(String(url || '')) ? (
    <a href={String(url)} target="_blank" rel="noopener noreferrer" aria-label={`Abrir la fuente de ${casa}`}>
      fuente&nbsp;↗
    </a>
  ) : (
    <>{RAYA}</>
  )

/** Sección que no se puede armar porque falta su dato. */
export const VacioSec = ({ id, tag, titulo, x }: { id: string; tag: string; titulo: string; x: string }) => (
  <Seccion id={id} tag={tag} titulo={titulo}>
    <Vacio chico k="Sin datos" t={T.SIN_DATO} x={x} />
  </Seccion>
)

/** Rótulo de los bloques de encuestas: son de la alcaldía y no siguen el escenario elegido. */
export const FijoEncuestas = () => <RotuloFijo>{`${T.FIJO} ${N.BOLETA.ayun.corto} · encuestas publicadas ${T.FIJO_SUFIJO}`}</RotuloFijo>

/**
 * Si una sección falla con los datos cargados (un JSON con otra forma), se
 * rotula ella sola y el resto de la página sigue a la vista.
 */
export class Bloque extends Component<{ id: string; children: ReactNode }, { roto: boolean }> {
  state = { roto: false }

  static getDerivedStateFromError() {
    return { roto: true }
  }

  componentDidCatch(error: unknown) {
    console.error(`Comparativo · ${this.props.id}:`, error)
  }

  render() {
    if (!this.state.roto) return this.props.children
    return (
      <Seccion id={this.props.id}>
        <Vacio chico k="Bloque sin pintar" t={T.SIN_DATO} x="Este bloque no se pudo armar con los datos cargados." />
      </Seccion>
    )
  }
}
