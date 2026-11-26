/** Piezas chicas que comparten las secciones de Territorio. */
import { T, type Json } from '../../motor'
import { Etiqueta, Kicker } from '../../components/tablero/kit/base'
import { PildoraGana } from '../../components/tablero/kit/barras'
import { BarraPartidos, Naturaleza, NotaSuma } from '../../components/tablero/kit/partidos'
import { Vacio } from '../../components/tablero/kit/tarjetas'
import { etqBoleta, type Modelo } from './modelo'

/** Etiqueta con la boleta y el escenario de un bloque («Alcaldía · S1»); ámbar si la boleta es preliminar. */
export const EtqBoleta = ({ m, extra }: { m: Modelo; extra?: string }) => <Etiqueta tipo={m.prelim ? 'ambar' : ''}>{etqBoleta(m, extra)}</Etiqueta>

/** Estado vacío de un bloque que no tiene datos para la boleta elegida. */
export const SinDatos = ({ m, k, t, x }: { m: Modelo; k?: string | null; t: string; x?: string }) => <Vacio chico k={k ?? m.bol.chip} t={t} x={x} />

type FilaPartidosProps = { rotulo: string; etiqueta?: string; etiquetaTipo?: 'ambar' | 'gris' | ''; P: Json; pg?: Record<string, unknown> | null; alto?: 24 | 22 | 20 | 16 }

/**
 * Fila de tarjeta con la barra por partidos y, a la derecha, quién va adelante
 * (por coalición). `P` = lo que devuelve la capa de datos (partidosDistrito,
 * partidosZona…).
 */
export function FilaPartidos({ rotulo, etiqueta, etiquetaTipo, P, pg, alto = 20 }: FilaPartidosProps) {
  if (!P) return null
  return (
    <div className="pp-fbol">
      <div className="pp-fbol__barra">
        <div className="pp-fbol__cab">
          <Kicker variante="chico">{rotulo}</Kicker>
          {etiqueta ? <Etiqueta tipo={etiquetaTipo}>{etiqueta}</Etiqueta> : null}
          <Naturaleza de={P} />
        </div>
        <BarraPartidos P={P} alto={alto} />
        <NotaSuma P={P} />
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

/** La encuesta MURAL va siempre con su advertencia. */
export const MarcaMural = ({ textos }: { textos: unknown[] }) => (textos.some((t) => /MURAL/.test(String(t))) ? <Etiqueta tipo="ambar">Encuesta MURAL: sin cotejar con el original</Etiqueta> : null)
