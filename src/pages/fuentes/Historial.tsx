/** Fuentes · 9: historial de cortes. Cómo ha cambiado el motor de un corte guardado a otro, en las tres boletas. */
import { D, N, T, enFrase, esNum, listaDe as lista, signo, type Boleta, type Json } from '../../motor'
import { Fuente, Mono, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { MiniLinea } from '../../components/tablero/kit/barras'
import { TablaOscura, type CeldaOscura, type GrupoOscuro } from '../../components/tablero/kit/noche'
import { RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { CabTarjeta, Tarjeta, Vacio } from '../../components/tablero/kit/tarjetas'
import { RAYA, fechaTxt, limpio, num, obj, plural, pp, proy, rotEsc, seccion, val } from './modelo'
import { EnlacePagina, Fijo, VacioSec } from './piezas'

export function Historial() {
  const s = seccion('fue-cortes')
  const P9 = proy('P9')
  const cen: string = D.central()
  if (!P9?.boletas) return <VacioSec s={s} x="Faltan los cortes guardados (proyecciones.json · P9)." />
  const cortes = lista(P9.cortes)
  const ids = [...new Set([cen, 'S0'])]
  const boletas = N.BOLETAS as Boleta[]
  const mc: string = N.nombre('MC')
  const federal = String(N.BOLETA.fed.corto).toLowerCase()
  const serieDe = (b: Boleta, eid: string): Json[] => lista(obj(obj(obj(P9.boletas[b]).escenarios)[eid]).serie)
  /** Margen de MC en una boleta, un escenario y un corte: mediana y, entre paréntesis, su rango. */
  const celdaBoleta = (b: Boleta, eid: string, etiqueta: string): CeldaOscura => {
    const c = serieDe(b, eid).reduce<Json>((r, x) => (x.etiqueta === etiqueta ? x : r), null)
    const m: Json = c?.margen ?? null
    if (!m || !esNum(m.p50)) return { c: 'no se proyectaba', tip: 'Ese corte no traía esta boleta.' }
    return {
      c: `${signo(m.p50)}${esNum(m.p10) && esNum(m.p90) ? `  (${signo(m.p10)} a ${signo(m.p90)})` : ''}`,
      clase: 'num',
      color: m.p50 === 0 ? null : N.color_texto(m.p50 > 0 ? 'MC' : 'MORENA_ALIADOS', 'oscuro'),
      tip: `${N.BOLETA[b].corto} · ${eid}: ${mc} ${num(val(c.mc_p50), 1)} · ${N.nombre('MORENA_ALIADOS')} ${num(val(c.morena_aliados_p50), 1)}`,
    }
  }
  const grupos: GrupoOscuro[] = ids.map((eid) => ({
    titulo: `${obj(obj(obj(P9.boletas.ayun).escenarios)[eid]).rotulo || rotEsc(eid)} · ${T.TODA_GDL} · margen de ${mc} frente a ${enFrase('MORENA_ALIADOS')}`,
    realce: eid === cen,
    filas: cortes.map((k) => ({
      celdas: [
        k.etiqueta || fechaTxt(k.corte),
        `${plural(val(k.n_escenarios), 'escenario', 'escenarios')}${k.con_federal ? ` · con ${federal}` : ` · sin ${federal}`}`,
        ...boletas.map((b) => celdaBoleta(b, eid, k.etiqueta)),
        { c: <Mono>{k.sha256 || RAYA}</Mono> },
      ],
    })),
  }))
  const uv: Json = obj(P9.ultimo_corte_vs_vigente)

  return (
    <Seccion id={s.id} tag={s.corto} n={s.n} titulo={s.titulo} texto={limpio(P9.lectura || '')}>
      <Fijo>{`${T.CTX_TODAS} · ${rotEsc(cen)} · ${T.TODA_GDL}`}</Fijo>
      <Rejilla min={300}>
        {boletas.map((b) => {
          const B: Json = obj(P9.boletas[b])
          const E: Json = obj(obj(B.escenarios)[cen])
          const serie = lista(E.serie)
          const cambio: Json = obj(E.cambio_total)
          const vals = serie.map((c) => (c.margen ? c.margen.p50 : null)).filter(esNum)
          if (!serie.length) {
            return (
              <Tarjeta key={b}>
                <CabTarjeta icono={N.BOLETA[b].icono} kicker={N.BOLETA[b].pildora} aviso={b === 'fed'} />
                <Vacio chico t={T.SIN_DATO} />
              </Tarjeta>
            )
          }
          return (
            <Tarjeta key={b} variante="24">
              <CabTarjeta icono={N.BOLETA[b].icono} kicker={N.BOLETA[b].pildora} aviso={b === 'fed' || B.preliminar === true} />
              <div className="pp-cab pp-cab--extremos">
                <span className="pp-tarjeta__t">{esNum(cambio.margen_pp) && cambio.margen_pp !== 0 ? pp(cambio.margen_pp) : 'sin cambio'}</span>
                <MiniLinea valores={vals} clave={vals.length && vals[vals.length - 1] > 0 ? 'MC' : 'MORENA_ALIADOS'} cero aria={`Margen de MC por corte: de ${num(vals[0], 1)} a ${num(vals[vals.length - 1], 1)}`} />
              </div>
              <span className="pp-tarjeta__s">{`Margen de ${mc}: ${pp(vals[0])} → ${pp(vals[vals.length - 1])} · ${plural(serie.length, 'corte guardado', 'cortes guardados')}`}</span>
              <p className="pp-notas__x">{limpio(B.lectura || '')}</p>
            </Tarjeta>
          )
        })}
      </Rejilla>
      <Fijo>{`${T.CTX_TODAS} · ${ids.join(' y ')} · ${T.TODA_GDL}`}</Fijo>
      <TablaOscura
        aria="Cortes guardados del motor: margen de MC por boleta"
        minAncho={940}
        columnas={[
          { t: 'Corte', ancho: 'minmax(170px,1.2fr)' },
          { t: 'Qué traía', ancho: 'minmax(150px,1fr)' },
          ...boletas.map((b) => ({ t: N.BOLETA[b].chip as string, ancho: 'minmax(150px,1fr)', der: true, tip: `Mediana del margen y, entre paréntesis, su rango de ${T.CORRIDAS_80}.` })),
          { t: 'Huella', ancho: '150px', tip: 'Código que identifica el archivo guardado de ese corte.' },
        ]}
        grupos={grupos}
      />
      <RotuloCandidatura boleta="ayun" chico />
      <EnlacePagina pagina="comparativo" className="pp-boton">{`Ver el detalle por corte en ${N.pagina('comparativo').txt} →`}</EnlacePagina>
      <Fuente titulo="Fuentes.">
        {`proyecciones.json · P9 (${plural(cortes.length, 'corte guardado', 'cortes guardados')}). Un corte es una foto del motor con los datos que había hasta esa fecha. ${limpio(P9.como_se_calcula || '')} ${limpio(P9.nota || '')} ${limpio(P9.nota_supuestos || '')}${
          uv.mismas_cifras === true ? ' El último corte guardado tiene las mismas cifras que el archivo vigente del motor.' : ''
        } La ${String(N.BOLETA.fed.largo).toLowerCase()} es ${String(T.PRELIMINAR).toLowerCase()}.`}
      </Fuente>
    </Seccion>
  )
}
