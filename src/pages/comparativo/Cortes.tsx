/** Comparativo · 8: cambios entre cortes del motor (P9). Un corte es una foto del motor con los datos que había hasta esa fecha. */
import { D, N, POR_COAL, T, cuantos, enFrase, esNum, listaDe as lista, num, pct, pts, type Boleta, type Estado, type Json } from '../../motor'
import { Col, Fuente, Kicker, Rejilla, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { TablaOscura, type FilaOscura, type GrupoOscuro } from '../../components/tablero/kit/noche'
import { Naturaleza, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import type { Columna } from '../../components/tablero/kit/tablas'
import { KpiMini, Vacio } from '../../components/tablero/kit/tarjetas'
import { RAYA, celdaPartido, coal, colM, corridas, f1, fechaTxt, llano, parejoMotor, partidosCols, pgCorte, proy, puntosTxt, reparto, rotEsc, sig, sigla, sinRutas, val } from './modelo'
import { VacioSec } from './piezas'

/** Un paso entre cortes que no movió nada. */
const quieto = (c: Json): boolean => !c || c.sin_cambio === true || ['mc_pp', 'morena_aliados_pp', 'margen_pp', 'p_gana_mc_pp'].every((k) => !esNum(c[k]) || c[k] === 0)

export function Cortes({ v }: { v: Estado }) {
  const id = 'cmp-cortes'
  const titulo = '¿Cómo se ha movido el motor de un corte a otro?'
  const P9 = proy('P9')
  const b9: Json = P9?.boletas?.[v.b] ?? null
  const cen: string = D.central()
  if (!b9?.escenarios) return <VacioSec id={id} tag="Cambios entre cortes" titulo={titulo} x="Faltan los cortes guardados (proyecciones.json · P9)." />
  // el escenario central, primero
  const ids = Object.keys(b9.escenarios).sort((a, c) => (a === cen ? 0 : 1) - (c === cen ? 0 : 1))
  const nomB: string = N.nombre('MORENA_ALIADOS')
  const coalicion = enFrase('MORENA_ALIADOS')
  const corteDe = (etq: string): Json => lista(P9.cortes).reduce<Json>((r, c) => (c.etiqueta === etq ? c : r), null)
  // Por partido: los cortes guardados solo traen MC y la coalición de Morena; sus partidos son un reparto estimado con la proporción
  // de cada uno dentro de la coalición que da el motor vigente en ese escenario. El último corte, si es el vigente, va tal cual.
  const colsP = partidosCols(v.b).filter((k) => N.candidatura(k) === 'MORENA_ALIADOS')
  const mismas = P9.ultimo_corte_vs_vigente?.mismas_cifras === true
  const porEscenario = ids.map((eid) => {
    const E: Json = b9.escenarios[eid]
    const serie = lista(E.serie)
    return {
      eid,
      E,
      cortes: serie.map((c, i) => {
        const ultimo = mismas && i === serie.length - 1
        return { c, i, ultimo, P: (ultimo ? D.partidosBoleta(eid, v.b) : reparto({ MC: val(c.mc_p50), MORENA_ALIADOS: val(c.morena_aliados_p50), PAN_PRI: null, OTROS: null }, eid, v.b)) as Json }
      }),
    }
  })
  const hayRep = porEscenario.some((x) => x.cortes.some((y) => !y.ultimo && y.P))
  const grupos: GrupoOscuro[] = porEscenario.map(({ eid, E, cortes }) => ({
    titulo: `${N.BOLETA[v.b].chip} · ${E.rotulo || rotEsc(eid)} · ${T.TODA_GDL}`,
    realce: eid === cen,
    filas: cortes.map(({ c, i, ultimo, P }): FilaOscura => {
      const k = corteDe(c.etiqueta)
      const cam: Json = i ? lista(E.cambios)[i - 1] : null
      const m: Json = c.margen || {}
      return {
        celdas: [
          fechaTxt(c.corte),
          `${k ? `${cuantos(val(k.n_escenarios), 'escenario', 'escenarios')}${k.con_federal ? ` · ya con la ${String(N.BOLETA.fed.primera).toLowerCase()}` : ''}` : RAYA}${ultimo ? '' : ` · partidos: ${T.REPARTO_ESTIMADO}`}`,
          { c: f1(val(c.mc_p50)), clase: 'num' },
          ...colsP.map((q) => {
            const x = celdaPartido(P, q, !ultimo)
            return { ...x, tip: `${x.tip || ''} ${nomB} en ese corte: ${f1(val(c.morena_aliados_p50))}.` }
          }),
          { c: sig(m.p50), clase: 'num', color: parejoMotor(pgCorte(c)) ? null : colM(m.p50) },
          esNum(m.p10) && esNum(m.p90) ? `${sig(m.p10)} a ${sig(m.p90)}` : T.SIN_RANGO,
          corridas(pgCorte(c)),
          i === 0 ? 'primer corte guardado' : quieto(cam) ? (cam?.mismo_corte ? 'mismo corte · sin cambio' : 'sin cambio') : `${pts(cam.margen_pp)} de margen`,
        ],
      }
    }),
  }))

  const E0: Json = b9.escenarios[ids[0]]
  const s0 = lista(E0.serie)
  const pri = s0[0]
  const ult = s0[s0.length - 1]
  const mov = lista(E0.cambios).filter((c) => !quieto(c))
  // la lectura del generador ya dice cuándo ocurrió el cambio («puntos», no «pp»)
  const lectura: string = b9.lectura
    ? puntosTxt(b9.lectura)
    : pri && ult
      ? `En ${E0.rotulo || rotEsc(ids[0])}, el margen de MC frente a ${coalicion} (${POR_COAL}) pasó de ${pts(pri.margen.p50)} en el corte del ${pri.etiqueta} a ${pts(ult.margen.p50)} en el del ${ult.etiqueta}. ${
          mov.length === 1
            ? `Todo el cambio (${pts(mov[0].margen_pp)}) ocurrió entre el corte del ${mov[0].de} y el del ${mov[0].a}; después no se movió.`
            : mov.length
              ? `Cambió en ${num(mov.length)} de los ${num(lista(E0.cambios).length)} pasos entre cortes.`
              : 'No se movió entre cortes.'
        }`
      : ''
  // dos cortes guardados con la misma fecha
  const porDia = new Map<string, Json[]>()
  for (const c of lista(P9.cortes)) porDia.set(c.corte, [...(porDia.get(c.corte) ?? []), c])
  const repetidos = [...porDia.keys()]
    .sort()
    .filter((f) => (porDia.get(f) as Json[]).length > 1)
    .map((f) => {
      const los = porDia.get(f) as Json[]
      return `Con fecha ${fechaTxt(f)} hay ${num(los.length)} cortes guardados (${los.map((c) => num(val(c.n_escenarios))).join(' y ')} escenarios).`
    })

  const columnas: Columna[] = [
    { t: 'Corte', ancho: 'minmax(0,1fr)' },
    { t: 'Qué traía el corte', ancho: 'minmax(0,1.5fr)' },
    { t: 'MC', ancho: '52px', der: true },
    ...colsP.map((k) => ({
      t: sigla(k),
      ancho: k === 'HAG_FUT' ? '104px' : k === 'MORENA' ? '62px' : '50px',
      der: true,
      tip: `${N.nombre_largo(k)} (de ${coalicion}). Corte vigente: estimación del motor; cortes anteriores: ${T.REPARTO_ESTIMADO}.`,
    })),
    { t: 'Margen · coalición', ancho: '72px', der: true, tip: `Puntos de MC menos puntos de la ${coal('MORENA_ALIADOS', v.b)} (mediana; ${POR_COAL}).` },
    { t: 'Rango del margen', ancho: '124px', tip: `Entre qué valores cae el margen en ${T.CORRIDAS_80}.` },
    {
      t: 'Quién queda primero',
      ancho: 'minmax(0,1.1fr)',
      tip: `Quién queda primero en más corridas del motor, contado ${POR_COAL}, y en qué parte de ellas; «${T.PAREJO}» si nadie llega a ${pct(N.UMBRAL.VENTAJA, 0)}: entonces van las dos partes.`,
    },
    { t: 'Frente al corte anterior', ancho: 'minmax(0,1.2fr)' },
  ]

  return (
    <Seccion id={id} tag="Cambios entre cortes" titulo={titulo} texto={lectura}>
      <RotuloFijo>{`${T.FIJO} ${N.BOLETA[v.b].corto} · ${ids.join(' y ')} · ${T.TODA_GDL} ${T.FIJO_SUFIJO}`}</RotuloFijo>
      <TablaOscura aria={`Motor por corte guardado · ${N.BOLETA[v.b].corto}`} minAncho={1160} columnas={columnas} grupos={grupos} />
      <div className="pp-chips">
        <Naturaleza de={N.NATURALEZA.MOTOR} />
        {hayRep ? (
          <Naturaleza de={N.NATURALEZA.REPARTO} nota={`Los cortes guardados solo traen MC y ${coalicion}: sus partidos se reparten con la proporción de cada uno dentro de la coalición que da el motor vigente en ese escenario.`} />
        ) : null}
      </div>
      <RotuloCandidatura boleta={v.b} chico />
      <Col>
        <Kicker variante="">{`Las tres boletas · cuánto cambió el margen de MC (${POR_COAL}) entre el primer corte guardado y el último`}</Kicker>
        <RotuloFijo>{`${T.FIJO} ${T.CTX_TODAS} · ${rotEsc(cen)} ${T.FIJO_SUFIJO}`}</RotuloFijo>
        <Rejilla min={260} gap={16}>
          {(N.BOLETAS as Boleta[]).map((b) => {
            const B9: Json = P9.boletas[b]
            const Ec: Json = B9?.escenarios ? B9.escenarios[cen] || B9.escenarios[Object.keys(B9.escenarios)[0]] : null
            if (!Ec?.cambio_total) return <Vacio key={b} chico k={N.BOLETA[b].chip} t={T.SIN_DATO} />
            const s = lista(Ec.serie)
            const a = s[0]
            const z = s[s.length - 1]
            const ct: Json = Ec.cambio_total
            return (
              <KpiMini
                key={b}
                rotulo={N.BOLETA[b].chip}
                valor={quieto(ct) ? 'sin cambio' : pts(ct.margen_pp)}
                sub={`Margen de MC: ${pts(a.margen.p50)} → ${pts(z.margen.p50)} · del corte ${ct.de} al ${ct.a}${B9.preliminar ? ` · ${String(T.PRELIMINAR).toLowerCase()}` : ''}`}
              />
            )
          })}
        </Rejilla>
      </Col>
      <Fuente titulo="Fuentes.">
        {`proyecciones.json · P9.boletas (cortes guardados del motor). Un corte es una foto del motor con los datos que había hasta esa fecha. ${llano(P9.como_se_calcula)} ${repetidos.join(' ')}${
          mismas ? ' El último corte guardado tiene las mismas cifras que el motor vigente.' : ''
        } ${sinRutas(P9.nota_supuestos || '') || 'Entre un corte y otro cambian los datos y también pueden cambiar supuestos del motor.'} Por eso aquí no se da la causa de cada cambio. La ${String(N.BOLETA.fed.largo).toLowerCase()} es ${String(
          T.PRELIMINAR,
        ).toLowerCase()}.`}
      </Fuente>
    </Seccion>
  )
}
