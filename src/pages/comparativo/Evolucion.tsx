/** Comparativo · 2: evolución 2021–2027. Resultados oficiales y trayectoria mensual del motor. */
import { D, N, POR_COAL, T, enFrase, esNum, listaDe as lista, num, pct, pts, type Estado, type Json } from '../../motor'
import { Fuente, Seccion } from '../../components/tablero/kit/base'
import { Serie, TablaOscura, type FilaOscura, type SerieDef } from '../../components/tablero/kit/noche'
import { Naturaleza, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import type { Columna } from '../../components/tablero/kit/tablas'
import { RAYA, busca, celdaPartido, coal, colM, difMedOficial, f1, fechaTxt, llano, partidosCols, porFecha, puntosDe, rangoDe, reparto, rotEsc, sig, sigla } from './modelo'
import { VacioSec } from './piezas'

export function Evolucion({ v }: { v: Estado }) {
  const id = 'cmp-evolucion'
  const titulo = `¿De dónde viene y hacia dónde iría el margen de MC, contado ${POR_COAL}?`
  const ev: Json = D.evolucion(v.b)
  if (!ev?.disponible) return <VacioSec id={id} tag="Evolución" titulo={titulo} x={ev?.sin_serie || 'No hay serie de evolución para esta boleta (sim_evolucion.json).'} />
  const e1 = busca(ev.escenarios, v.e)
  if (!e1) return <VacioSec id={id} tag="Evolución" titulo={titulo} x={`La serie de evolución no trae ${rotEsc(v.e)}.`} />
  const meta: Json = ev.meta || {}
  const ofi = [...lista(ev.oficiales)].sort(porFecha)
  const cen: string = D.central()
  // otro escenario: se compara con el central
  const idCmp = v.e !== cen ? cen : null
  const e2 = idCmp ? busca(ev.escenarios, idCmp) : null
  const meses = puntosDe(e1, D.boleta(v.e, v.b), ev.eleccion)
  const meses2 = e2 && idCmp ? puntosDe(e2, D.boleta(idCmp, v.b), ev.eleccion) : []
  const rot = rotEsc(v.e)
  const nomBloque: string = N.nombre('MORENA_ALIADOS')
  const coalicion = enFrase('MORENA_ALIADOS')
  const k = ofi.length
  const hueco = (n: number): null[] => Array<null>(n).fill(null)

  const series: SerieDef[] = [
    {
      t: 'Resultado oficial',
      tipo: 'puntos',
      porSigno: { pos: 'MC', neg: 'MORENA_ALIADOS' },
      cifras: true,
      rotPos: 'ventaja MC',
      rotNeg: `ventaja ${nomBloque}`,
      valores: [...ofi.map(difMedOficial), ...hueco(meses.length)],
      ids: ofi.map((_, i) => `ofi-${i}`),
    },
    { t: `Motor · ${rot}`, tipo: 'linea', rombo: true, valores: [...hueco(k), ...meses.map((p) => p.margen)], ids: [...hueco(k), ...meses.map((_, i) => `mes-${i}`)] },
  ]
  if (meses2.length && idCmp) series.push({ t: `Para comparar · ${rotEsc(idCmp)}`, tipo: 'linea', color: N.DISENO.sin_dato, valores: [...hueco(k), ...meses2.map((p) => p.margen)] })

  // Por partido: el día de la elección, las cifras del motor tal cual; cada mes, el voto de cada coalición repartido entre sus
  // partidos con la proporción del motor en ese escenario (reparto estimado). Los oficiales que trae el tablero vienen por coalición.
  const Pfin: Json = D.partidosBoleta(v.e, v.b)
  const colsP = partidosCols(v.b).filter((p) => p !== 'MC')
  const filasOfi: FilaOscura[] = ofi.map((o, i) => {
    const m = difMedOficial(o)
    const porCand = `El resultado oficial que tiene el tablero viene ${POR_COAL}: ${N.nombre('MORENA_ALIADOS')} ${pct(o.MORENA_ALIADOS)} · ${N.nombre('PAN_PRI')} ${pct(o.PAN_PRI)}.`
    return {
      id: `ofi-${i}`,
      celdas: [
        o.etiqueta || fechaTxt(o.fecha),
        `${o.fuente ? `${llano(o.fuente)} · ` : ''}${POR_COAL}: ${N.nombre('MORENA_ALIADOS')} ${f1(o.MORENA_ALIADOS)} · ${N.nombre('PAN_PRI')} ${f1(o.PAN_PRI)}`,
        { c: f1(o.MC), clase: 'num' },
        { c: 'oficial', tip: 'Un resultado oficial no tiene rango.' },
        ...colsP.map(() => ({ c: RAYA, clase: 'num' as const, tip: porCand })),
        { c: sig(m), clase: 'num', color: colM(m), tip: `Puntos de MC menos puntos de ${coalicion}.` },
      ],
    }
  })
  const porMes = meses.map((p) => {
    const rep = !(p.fin && Pfin)
    return { p, rep, P: rep ? reparto({ MC: p.MC, MORENA_ALIADOS: p.MORENA_ALIADOS, PAN_PRI: p.PAN_PRI, OTROS: null }, v.e, v.b) : Pfin }
  })
  const Prep: Json = porMes.find((x) => x.rep && x.P)?.P ?? null
  const filasMes: FilaOscura[] = porMes.map(({ p, rep, P }, i) => {
    const que = p.fin ? `Día de la elección · ${num(meta.n_corridas)} corridas` : `${p.hoy ? 'Si la elección fuera hoy · ' : 'Si la elección fuera ese mes · '}${num(meta.n_corridas_trayectoria)} corridas`
    const tm: Json = p.MORENA_ALIADOS || {}
    return {
      id: `mes-${i}`,
      celdas: [
        p.fin ? `Elección · ${fechaTxt(p.fecha)}` : p.hoy ? `Hoy · ${fechaTxt(p.fecha)}` : N.mes(p.fecha),
        `${que}${rep ? ` · partidos: ${T.REPARTO_ESTIMADO}` : ''}`,
        { c: f1(p.MC?.p50), clase: 'num' },
        rangoDe(p.MC),
        ...colsP.map((partido) => celdaPartido(P, partido, rep)),
        {
          c: sig(p.margen),
          clase: 'num',
          color: colM(p.margen),
          tip: `${nomBloque} ${pct(tm.p50)}${esNum(tm.p10) && esNum(tm.p90) ? `, ${N.rango(tm.p10, tm.p90)}` : ''}. Margen = MC menos ${coalicion} (${POR_COAL}).`,
        },
      ],
    }
  })

  const hoy = meses[0]
  const fin = meses[meses.length - 1]
  let lectura = ofi.length ? `El margen oficial de MC frente a ${coalicion} fue de ${ofi.map((o) => `${pts(difMedOficial(o))} en ${String(o.fecha).slice(0, 4)}`).join(' y de ')}. ` : ''
  if (hoy && fin) lectura += `Si la elección fuera hoy, en ${rot} el motor daría ${pts(hoy.margen)}; el día de la elección daría ${pts(fin.margen)}${esNum(fin.m10) && esNum(fin.m90) ? `, ${N.rango(fin.m10, fin.m90)}` : ''}.`
  if (Pfin?.por.MORENA) lectura += ` Por partido, el día de la elección MC tendría ${pct(Pfin.por.MC.p50)} y ${N.nombre('MORENA')} ${pct(Pfin.por.MORENA.p50)}.`
  const anios = ofi.length ? `${String(ofi[0].fecha).slice(0, 4)}–${String(ev.eleccion || '').slice(0, 4)}` : ''

  const columnas: Columna[] = [
    { t: '', ancho: 'minmax(0,1.1fr)' },
    { t: 'Qué es', ancho: 'minmax(0,1.7fr)' },
    { t: 'MC', ancho: '48px', der: true },
    { t: 'Rango de MC', ancho: '98px', tip: `Entre qué valores cae MC en ${T.CORRIDAS_80} del motor.` },
    ...colsP.map((p) => ({
      t: sigla(p),
      ancho: p === 'HAG_FUT' ? '104px' : p === 'MORENA' ? '62px' : '50px',
      der: true,
      tip: `${N.nombre_largo(p)}${N.candidatura(p) && N.candidatura(p) !== p ? ` (de ${enFrase(N.candidatura(p))})` : ''}. Día de la elección: estimación del motor; cada mes: ${T.REPARTO_ESTIMADO}.`,
    })),
    { t: 'Margen', ancho: '64px', der: true, tip: `Puntos de MC menos puntos de la ${coal('MORENA_ALIADOS', v.b)}. Positivo: MC adelante.` },
  ]

  return (
    <Seccion id={id} tag={`Evolución ${anios}`} titulo={titulo} texto={lectura}>
      <TablaOscura
        aria={`Resultados oficiales y trayectoria mensual del motor · ${N.rotulo(v.b, v.e)}`}
        minAncho={1180}
        columnas={columnas}
        arriba={
          <Serie
            etiquetas={[...ofi.map((o) => N.mes(o.fecha, true) as string), ...meses.map((p) => (p.hoy ? 'hoy' : (N.mes(p.fecha, true) as string)))]}
            arriba="ventaja MC"
            abajo={`ventaja ${nomBloque}`}
            series={series}
            aria={`Margen de MC frente a ${nomBloque}: resultados oficiales y trayectoria mensual del motor en ${rot}`}
          />
        }
        grupos={[
          { titulo: `Resultados oficiales · ${N.BOLETA[v.b].corto} (% de votación válida; el tablero los tiene ${POR_COAL})`, filas: filasOfi },
          {
            titulo: `Motor · ${N.rotulo(v.b, v.e)} (% de voto válido, mediana de las corridas; por partido: el día de la elección, estimación del motor; cada mes, ${T.REPARTO_ESTIMADO})`,
            realce: true,
            filas: filasMes,
          },
        ]}
      />
      <div className="pp-chips">
        {Pfin ? <Naturaleza de={Pfin} /> : null}
        {Prep ? <Naturaleza de={Prep} /> : null}
      </div>
      <RotuloCandidatura boleta={v.b} chico />
      <Fuente titulo="Fuentes.">
        {`sim_evolucion.json · oficiales.${v.b} y escenarios[${v.e}]; el día de la elección, sim_v8.json · escenarios[${v.e}].${N.BOLETA[v.b].json}. El eje no es proporcional al tiempo: las elecciones pasadas van aparte, a la izquierda. El margen de cada mes es la diferencia de las medianas de MC y de ${coalicion}; el del día de la elección es la mediana del margen. La trayectoria mensual solo trae cada coalición: sus partidos son un reparto estimado (cálculo propio) con la proporción de cada partido dentro de su coalición que da el motor en ${rot} el día de la elección. ${
          meses2.length && idCmp ? `La línea gris es ${rotEsc(idCmp)}, para comparar. ` : ''
        }Las encuestas no van en esta gráfica porque miden otra cosa (mención, con indecisos): están en «Serie mes a mes».`}
      </Fuente>
    </Seccion>
  )
}
