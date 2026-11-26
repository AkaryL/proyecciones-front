/** Fuentes · 1: qué archivo alimenta cada parte del tablero, de dónde parte cada boleta y de dónde salen los datos de origen. */
import { Fragment } from 'react'
import { D, N, POR_COAL, T, esNum, listaDe as lista, type Boleta, type Json } from '../../motor'
import { Etiqueta, Fuente, Kicker, Mono, Rejilla, Seccion, SinCorte } from '../../components/tablero/kit/base'
import { RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { RankNombre, SinDetalle, TablaRanking } from '../../components/tablero/kit/tablas'
import { CabTarjeta, KpiMini, Tarjeta, Vacio } from '../../components/tablero/kit/tarjetas'
import {
  J,
  OTROS_ARCHIVOS,
  RAYA,
  anio,
  archivos,
  coal,
  enumera,
  fechaTxt,
  limpio,
  masMenos,
  mayus,
  nombraMural,
  num,
  obj,
  oficial,
  pct,
  plural,
  pp,
  proy,
  rotBoleta,
  seccion,
  sinCodigo,
  sinCotejar,
  val,
  type Archivo,
} from './modelo'
import { EnlacePagina, EtqMural, Puntos, Renglon, Sub } from './piezas'

function TablaArchivos({ ar }: { ar: Archivo[] }) {
  return (
    <TablaRanking
      aria="Archivos de datos del tablero"
      minAncho={980}
      columnas={[
        { t: 'Parte del tablero', ancho: 'minmax(220px,1.6fr)' },
        { t: 'Archivo', ancho: 'minmax(150px,.8fr)' },
        { t: 'Qué trae hoy', ancho: 'minmax(170px,1.1fr)' },
        { t: 'Datos al', ancho: '128px', tip: 'Fecha propia de cada archivo: hasta cuándo llegan sus datos.' },
        { t: 'Se ve en', ancho: 'minmax(150px,1fr)' },
      ]}
      filas={ar.map((x) => [
        { c: <RankNombre nombre={x.a.parte} sub={x.a.que} /> },
        { c: <Mono>{x.archivo}</Mono> },
        { c: x.cuenta || RAYA },
        {
          c:
            x.estado === 'falta' ? (
              <SinDetalle>no se pudo leer</SinDetalle>
            ) : x.estado === 'sin_fecha' ? (
              <SinDetalle>sin fecha propia</SinDetalle>
            ) : (
              <>
                <SinCorte>{fechaTxt(x.fecha)}</SinCorte>
                {x.estado === 'anterior' ? (
                  <>
                    {' '}
                    <Etiqueta tipo="ambar">anterior al corte</Etiqueta>
                  </>
                ) : null}
              </>
            ),
        },
        {
          c: x.a.pags
            .filter((p) => N.pagina(p))
            .map((p, i) => (
              <Fragment key={p}>
                {i ? ' · ' : null}
                <EnlacePagina pagina={p} />
              </Fragment>
            )),
        },
      ])}
    />
  )
}

/** Punto de partida de una boleta: el cómputo anterior más el cambio medio de sus anclas (sim_v8.json · _meta.linea_base). */
function TarjetaBase({ b }: { b: Boleta }) {
  const B: Json = N.BOLETA[b]
  const lb: Json = obj(obj((D.meta() || {}).linea_base)[b])
  const anc = lista(lb.anclas)
  const of = oficial(b)
  const s0: Json = D.boleta('S0', b)
  const cab = <CabTarjeta icono={B.icono} kicker={B.pildora} aviso={b === 'fed'} />
  if (!esNum(lb.margen_2024_oficial) || !esNum(lb.cambio_medio)) {
    return (
      <Tarjeta>
        {cab}
        <Vacio chico t={T.SIN_DATO} x="El motor no trae el punto de partida de esta boleta." />
      </Tarjeta>
    )
  }
  const m0: unknown = s0?.margen_mc_vs_morena_aliados ? s0.margen_mc_vs_morena_aliados.p50 : null
  const mOf = of && esNum(of.MC) && esNum(of.MORENA_ALIADOS) ? of.MC - of.MORENA_ALIADOS : null
  return (
    <Tarjeta variante="24">
      {cab}
      <Tarjeta variante="suave">
        <Renglon rotulo={`Margen de ${anio(of?.fecha)} con participación de elección intermedia`}>{pp(lb.margen_2024_oficial)}</Renglon>
        <Renglon rotulo={`Cambio medio que sugieren ${plural(anc.length, 'ancla', 'anclas')}`}>{pp(lb.cambio_medio)}</Renglon>
        <Renglon rotulo="Punto de partida (suma de los dos)">{pp(lb.margen_2024_oficial + lb.cambio_medio)}</Renglon>
        <span className="pp-nota pp-nota--12">{`Margen = puntos de ${N.nombre('MC')} menos puntos de la ${coal('MORENA_ALIADOS', b)}. Incertidumbre del punto de partida: ${masMenos(lb.sd)}${
          esNum(m0) ? `. Con todo el sorteo, el motor da en S0 una mediana de ${pp(m0)}` : ''
        }.`}</span>
      </Tarjeta>
      <Puntos
        titulo={`Anclas: qué dice cada una del cambio desde ${anio(of?.fecha)}`}
        items={anc.map((a) => ({
          clave: esNum(a.cambio) && a.cambio < 0 ? 'MORENA_ALIADOS' : 'MC',
          t: (
            <>
              {limpio(a.ancla).replace(/\.$/, '')}
              {nombraMural(a.ancla) || nombraMural(a.nota) ? (
                <>
                  {' '}
                  <EtqMural />
                </>
              ) : null}
            </>
          ),
          x: `Movería el margen ${pp(a.cambio)} · pesa ${pct(esNum(a.peso) ? a.peso * 100 : null, 0)} · confianza ${a.confianza || T.SIN_DATO}${a.nota ? `. ${sinCodigo(limpio(a.nota))}` : '.'}`,
        }))}
      />
      {of ? (
        <span className="pp-nota pp-nota--12">{`Resultado oficial de ${anio(of.fecha)}, ${POR_COAL} (así lo trae el tablero): ${N.nombre('MC')} ${pct(of.MC)} · ${N.nombre('MORENA_ALIADOS')} ${pct(of.MORENA_ALIADOS)} · ${N.nombre('PAN_PRI')} ${pct(of.PAN_PRI)}${
          esNum(mOf) ? ` (margen ${pp(mOf)} con la participación de ese año)` : ''
        }. ${limpio(of.fuente)}`}</span>
      ) : null}
      <RotuloCandidatura boleta={b} chico />
    </Tarjeta>
  )
}

export function Bloques() {
  const s = seccion('fue-bloques')
  const meta: Json = D.meta() || {}
  const corte: string = D.corte()
  const ar = archivos()
  const alCorte = ar.filter((x) => x.estado === 'corte')
  const ant = ar.filter((x) => x.estado === 'anterior')
  const sinF = ar.filter((x) => x.estado === 'sin_fecha')
  const faltan = ar.filter((x) => x.estado === 'falta')

  /* punto de partida por boleta */
  const lb: Json = obj(meta.linea_base)
  const frases = (N.BOLETAS as Boleta[])
    .map((b) => {
      const x: Json = obj(lb[b])
      const anc = lista(x.anclas)
      const mur = anc.find((a) => nombraMural(a.ancla))
      if (!esNum(x.margen_2024_oficial)) return ''
      return `en la ${rotBoleta(b)}, ${pp(x.margen_2024_oficial)} y ${pp(x.cambio_medio)} (${plural(anc.length, 'ancla', 'anclas')}${mur ? `; la encuesta MURAL, ${sinCotejar()}, pesa ${pct(mur.peso * 100, 0)}` : ''})`
    })
    .filter(Boolean)

  /* de dónde salen los datos del motor y cómo se verificó el monitoreo */
  const ins = lista(meta.insumos).map((t) => {
    const m = /^(.*?)\s*\(((?:data|web)\/[^()]+)\)\s*$/.exec(String(t))
    return {
      t: limpio(m ? m[1] : t).replace(/\.$/, ''),
      x: m ? (
        <>
          {'Archivo: '}
          <Mono>{m[2]}</Mono>
        </>
      ) : (
        'Sin archivo propio en la lista del motor.'
      ),
    }
  })
  const mm: Json = obj(obj(J('menciones'))._meta_monitoreo)
  const ci: Json = obj(mm.conteo_investigacion)
  const cn: Json = obj(obj(obj(J('dashboard')).encuestas).conteo)
  const revisados = esNum(ci.verificados) && esNum(ci.no_verificables) && esNum(ci.falsos) ? ci.verificados + ci.no_verificables + ci.falsos : null

  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      texto={
        <>
          {`De los ${plural(ar.length, 'archivo', 'archivos')} que abre esta página, `}
          <strong>{num(alCorte.length)}</strong>
          {` ${alCorte.length === 1 ? 'lleva' : 'llevan'} la fecha de corte del motor (`}
          <SinCorte>{fechaTxt(corte)}</SinCorte>
          {`).${
            ant.length ? ` ${mayus(enumera(ant.map((x) => `«${x.a.parte}» (al ${fechaTxt(x.fecha)})`)))} ${ant.length === 1 ? 'es anterior' : 'son anteriores'}: si citaran cifras del modelo, podrían no ser las vigentes.` : ''
          }${sinF.length ? ` ${mayus(enumera(sinF.map((x) => `«${x.a.parte}»`)))} no ${sinF.length === 1 ? 'trae' : 'traen'} fecha propia.` : ''}${
            faltan.length ? ` No se ${faltan.length === 1 ? 'pudo' : 'pudieron'} leer: ${enumera(faltan.map((x) => x.archivo))}.` : ''
          }`}
        </>
      }
    >
      <TablaArchivos ar={ar} />
      <Fuente titulo="Otros archivos.">
        {`Además, otras páginas usan ${plural(OTROS_ARCHIVOS.length, 'archivo', 'archivos')} que esta no abre: `}
        {OTROS_ARCHIVOS.map((o, i) => {
          const g: Json = N.pagina(o.pag)
          return (
            <Fragment key={o.archivo}>
              {i ? ', ' : null}
              <Mono>{o.archivo}</Mono>
              {` (${o.que}${g ? `; lo usa ${g.txt}` : ''})`}
            </Fragment>
          )
        })}
        .
      </Fuente>
      <Sub titulo="¿De dónde parte cada boleta?">
        {frases.length ? `El punto de partida de cada boleta sería el margen del cómputo anterior más el cambio que sugieren sus anclas: ${enumera(frases)}. Las anclas no coinciden entre sí: ese desacuerdo entra como incertidumbre.` : ''}
      </Sub>
      <Rejilla min={320}>
        {(N.BOLETAS as Boleta[]).map((b) => (
          <TarjetaBase key={b} b={b} />
        ))}
      </Rejilla>
      <Fuente titulo="Fuentes.">
        {`sim_v8.json · _meta.linea_base (margen del cómputo anterior, cambio medio, incertidumbre y anclas con su peso) y sim_evolucion.json · oficiales. El motor pesa cada sección con la participación de una elección intermedia (la que habrá en ${anio(
          val(obj(obj(proy('P7')).fecha_eleccion).fecha),
        )}), por eso su margen de partida no es igual al del resultado oficial. La ${String(N.BOLETA.fed.largo).toLowerCase()} es ${String(T.PRELIMINAR).toLowerCase()}.`}
      </Fuente>
      <Sub titulo="¿De dónde salen los datos de origen?">{`El motor declara ${plural(ins.length, 'insumo', 'insumos')}; el monitoreo solo deja entrar lo que se pudo verificar contra su fuente.`}</Sub>
      <Rejilla min={340}>
        <Tarjeta variante="plana">
          <Puntos items={ins} titulo="Datos de origen que declara el motor" />
        </Tarjeta>
        <Tarjeta variante="plana">
          <Kicker>Cómo se verificó el monitoreo de prensa, redes y encuestas</Kicker>
          {esNum(revisados) ? (
            <KpiMini
              rotulo="Hallazgos revisados"
              valor={num(revisados)}
              unidad="hallazgos"
              partes={[
                { nombre: 'verificados', valor: ci.verificados, color: N.DISENO.sube },
                { nombre: 'no verificables', valor: ci.no_verificables, color: N.DISENO.ambar },
                { nombre: 'falsos', valor: ci.falsos, color: N.DISENO.baja },
              ]}
              sub={`${num(ci.verificados)} verificados contra su fuente · ${num(ci.no_verificables)} no verificables (no entran) · ${num(ci.falsos)} falsos`}
            />
          ) : (
            <Vacio chico t={T.SIN_DATO} />
          )}
          <p className="pp-notas__x">{`${mm.regla ? limpio(mm.regla) : ''} De ahí salen ${plural(mm.noticias_total, 'nota', 'notas')} de prensa (${num(mm.noticias_nuevas)} de este corte y ${num(mm.noticias_anteriores)} anteriores), ${plural(
            mm.redes,
            'publicación',
            'publicaciones',
          )} de redes y ${plural(cn.fichas, 'ficha', 'fichas')} de encuestas que, sin repeticiones, son ${plural(cn.mediciones, 'medición', 'mediciones')}.`}</p>
        </Tarjeta>
      </Rejilla>
      <Fuente titulo="Fuentes.">sim_v8.json · _meta.insumos; sim_menciones.json · _meta_monitoreo; sim_dashboard.json · encuestas.conteo.</Fuente>
    </Seccion>
  )
}
