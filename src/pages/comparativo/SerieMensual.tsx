/** Comparativo · 5: serie mes a mes. Cada encuesta en su fecha y el motor en cada corte guardado. */
import { D, N, POR_COAL, T, cuantos, enFrase, esNum, listaDe as lista, num, pct, pts, type Estado, type Json } from '../../motor'
import { Fuente, RotuloFijo, Seccion, SinCorte } from '../../components/tablero/kit/base'
import { Confianza, Serie, TablaOscura, type CeldaOscura, type FilaOscura, type GrupoOscuro, type PuntoSerie, type SerieDef } from '../../components/tablero/kit/noche'
import { Naturaleza, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { Filtros, type Columna } from '../../components/tablero/kit/tablas'
import {
  ALC,
  FILTROS,
  RAYA,
  SIN_COTEJAR,
  adelanteEnc,
  aliadosDe,
  avisoDe,
  celdaPartido,
  cifraEnc,
  colM,
  conAliados,
  corridas,
  desdeTrimestre,
  entran,
  f1,
  fechaTxt,
  intencion,
  levantamiento,
  llano,
  margenAliados,
  margenSola,
  nombresAliados,
  parejoMotor,
  partidosCols,
  pasa,
  periodo,
  pgCorte,
  prelim,
  proy,
  reparto,
  rotEsc,
  rotFiltro,
  sig,
  sigla,
  val,
  type Filtro,
} from './modelo'
import { MarcaAviso, MarcaPrelim, VacioSec } from './piezas'

type Props = { v: Estado; filtro: Filtro; onFiltro: (f: Filtro) => void }

export function SerieMensual({ v, filtro, onFiltro }: Props) {
  const id = 'cmp-serie'
  const titulo = 'Serie mes a mes · ¿hacia dónde apunta cada encuesta y el motor?'
  const enc = entran()
  const bol: Json = D.boleta(v.e, v.b)
  const meta: Json = D.meta() || {}
  const ver = `Motor ${meta.version || ''}`
  if (!enc.length && !bol) return <VacioSec id={id} tag="Serie mensual" titulo={titulo} x="Faltan las encuestas (proyecciones.json · P6) y el motor." />
  const P9 = proy('P9')
  const e9: Json = P9?.boletas?.[v.b]?.escenarios ?? {}
  const cen: string = D.central()
  // el historial por corte: el del escenario elegido si se guardó; si no, el del central (o el que haya)
  const sid: string | null = e9[v.e] ? v.e : e9[cen] ? cen : Object.keys(e9)[0] || null
  const cortes = sid ? lista(e9[sid].serie) : []
  const mismo = sid === v.e
  const vigente = P9?.ultimo_corte_vs_vigente?.mismas_cifras === true
  const nomM: string = N.nombre('MORENA')
  const nomB: string = N.nombre('MORENA_ALIADOS')
  const coalicion = enFrase('MORENA_ALIADOS')
  const rot = rotEsc(v.e)
  const rotSid = sid ? rotEsc(sid) : ''

  const ptsEnc: PuntoSerie[] = enc
    .map((q) => {
      const m = margenSola(q)
      const per = periodo(q)
      return {
        x: q.fecha,
        x1: per?.[0],
        x2: per?.[1],
        y: m,
        id: String(q.id),
        tenue: q.confianza === 'baja',
        fuera: !pasa(q, filtro),
        t: `${q.casa} · ${levantamiento(q)} · MC ${f1(q.MC)} / ${nomM} ${f1(q.MORENA)} · margen ${sig(m)} · confianza ${q.confianza}${prelim(q) ? ` · ${SIN_COTEJAR}` : ''}`,
      }
    })
    .filter((p) => esNum(p.y))
  const ptsMotor: PuntoSerie[] = cortes.map((c, i) => ({
    x: c.corte,
    y: c.margen.p50,
    id: `corte-${i}`,
    t: `${ver} · ${rotSid} · corte ${c.etiqueta} · MC ${f1(val(c.mc_p50))} / ${nomB} ${f1(val(c.morena_aliados_p50))} · margen ${sig(c.margen.p50)} · ${corridas(pgCorte(c))}`,
  }))
  const series: SerieDef[] = [{ t: 'Encuesta', tipo: 'dispersion', puntos: ptsEnc, rotPos: `MC por delante de ${nomM}`, rotNeg: `${nomM} por delante de MC` }]
  if (ptsMotor.length) series.push({ t: `${ver} por corte · ${rotSid} (frente a ${coalicion}, ${POR_COAL})`, tipo: 'linea', rombo: true, puntos: ptsMotor, color: mismo ? null : N.DISENO.sin_dato })
  if (!mismo && bol) {
    series.push({
      t: `${ver} hoy · ${rot}`,
      tipo: 'puntos',
      rombo: true,
      puntos: [
        {
          x: D.corte(),
          y: bol.margen_mc_vs_morena_aliados.p50,
          id: 'hoy',
          t: `${ver} · ${rot} · corte ${D.corteTexto()} · MC ${f1(bol.bloques.MC.p50)} / ${nomB} ${f1(bol.bloques.MORENA_ALIADOS.p50)} · margen ${sig(bol.margen_mc_vs_morena_aliados.p50)} · ${corridas(bol.p_gana)}`,
        },
      ],
    })
  }

  // Por partido: las encuestas, cada partido tal como lo publica la casa; el motor, sus partidos (el vigente, tal cual; los cortes
  // guardados solo traen MC y la coalición: sus partidos son un reparto estimado con la proporción del motor vigente en ese escenario).
  const colsP = partidosCols(v.b).filter((k) => k !== 'MC')
  const Pvig: Json = D.partidosBoleta(v.e, v.b)
  const filasEnc: FilaOscura[] = enc.map((q) => {
    const m = margenSola(q)
    const ca = conAliados(q)
    const ma = margenAliados(q)
    return {
      id: String(q.id),
      tenue: q.confianza === 'baja',
      fuera: !pasa(q, filtro),
      celdas: [
        levantamiento(q),
        {
          c: (
            <>
              {q.casa}
              <MarcaPrelim q={q} />
              <MarcaAviso q={q} />
            </>
          ),
          tip: avisoDe(q) || null,
        },
        { c: f1(q.MC), clase: 'num' },
        ...colsP.map((k): CeldaOscura => {
          const x = cifraEnc(q, k)
          return { c: f1(x), clase: 'num', tip: esNum(x) ? `${N.nombre(k)} ${f1(x)} % de mención, como lo publica la casa.` : `Esta encuesta no publica a ${N.nombre(k)}.` }
        }),
        { c: sig(m), clase: 'num', color: colM(m) },
        {
          c: sig(ma),
          clase: 'num',
          color: colM(ma),
          tip:
            ca != null
              ? `MC ${f1(q.MC)} menos ${nomM} ${f1(q.MORENA)} + ${aliadosDe(q)
                  .map((k) => `${N.nombre(k)} ${f1(q[k])}`)
                  .join(' + ')} = ${f1(ca)} (los partidos de la coalición que lista).`
              : `Esta encuesta no lista a los otros partidos de ${coalicion}.`,
        },
        { c: adelanteEnc(m), clase: 'fuerte', color: colM(m) },
        { c: <Confianza nivel={q.confianza} />, tip: q.confianza_texto && q.confianza_texto !== q.confianza ? `Confianza: ${q.confianza_texto}` : null },
      ],
    }
  })
  /** Fila del motor: en casi empate, ni color de partido en los márgenes ni «MC por delante». */
  const filaMotor = (idFila: string, cuando: string, que: string, mc: unknown, P: Json, rep: boolean, bloque: unknown, m: Json, pg: Record<string, unknown> | null): FilaOscura => {
    const par = parejoMotor(pg)
    const mo: unknown = P?.por.MORENA ? P.por.MORENA.p50 : null
    const dif = esNum(mo) && esNum(mc) ? mc - mo : null
    return {
      id: idFila,
      celdas: [
        cuando,
        `${que}${rep && P ? ` · partidos: ${T.REPARTO_ESTIMADO}` : ''}`,
        { c: f1(mc), clase: 'num' },
        ...colsP.map((k) => celdaPartido(P, k, rep)),
        { c: dif != null ? sig(dif) : RAYA, clase: 'num', color: dif != null && !par ? colM(dif) : null, tip: esNum(mo) ? `Diferencia de las medianas de MC y de ${nomM}${rep ? ` (${T.REPARTO_ESTIMADO})` : ''}.` : null },
        { c: sig(m?.p50), clase: 'num', color: par ? null : colM(m?.p50), tip: `MC menos ${coalicion} (${f1(bloque)}), ${POR_COAL}.` },
        corridas(pg),
        {
          c: <Confianza nivel="Motor" />,
          tip: `No es una encuesta ni lleva nivel de confianza: es la mediana de ${num(meta.n_corridas)} corridas del motor${m && esNum(m.p10) ? `. Su margen frente a ${coalicion} iría ${N.rango(m.p10, m.p90)}` : ''}.`,
        },
      ],
    }
  }
  const porCorte = cortes.map((c, i) => {
    // el último corte guardado es el vigente: ahí sí se conocen los partidos
    const ultimo = mismo && vigente && i === cortes.length - 1
    const mc = val(c.mc_p50)
    const ma = val(c.morena_aliados_p50)
    return { c, i, mc, ma, rep: !ultimo, P: ultimo ? Pvig : (reparto({ MC: mc, MORENA_ALIADOS: ma, PAN_PRI: null, OTROS: null }, sid as string, v.b) as Json) }
  })
  const hayRep = porCorte.some((x) => x.rep && x.P)
  const grupos: GrupoOscuro[] = [{ titulo: `Encuestas publicadas · ${N.BOLETA.ayun.chip} (% de mención: incluye indecisos; cada partido como lo publica la casa)`, filas: filasEnc }]
  if (porCorte.length) {
    grupos.push({
      titulo: `Motor por corte · ${N.rotulo(v.b, sid)} (% de voto válido, mediana; en los cortes anteriores, los partidos son un ${T.REPARTO_ESTIMADO})`,
      realce: true,
      filas: porCorte.map(({ c, i, mc, ma, rep, P }) => filaMotor(`corte-${i}`, `corte ${c.etiqueta}`, `${ver} · ${rotSid}`, mc, P, rep, ma, c.margen, pgCorte(c))),
    })
  }
  if (!mismo && bol) {
    grupos.push({
      titulo: `Motor hoy · ${N.rotulo(v.b, v.e)} (% de voto válido, mediana)`,
      realce: true,
      filas: [filaMotor('hoy', `corte ${D.corteTexto()}`, `${ver} · ${rot}`, bol.bloques.MC.p50, Pvig, false, bol.bloques.MORENA_ALIADOS.p50, bol.margen_mc_vs_morena_aliados, bol.p_gana)],
    })
  }

  const conM = enc.filter((q) => esNum(margenSola(q)))
  const nMor = conM.filter((q) => (margenSola(q) as number) < 0).length
  const nMC = conM.filter((q) => (margenSola(q) as number) > 0).length
  const lectura = `De las ${num(conM.length)} encuestas de ${ALC}, ${num(nMor)} ponen por delante a ${nomM} y ${num(nMC)} a MC.${
    bol
      ? ` El motor, en ${rot}, daría ${Pvig?.por.MORENA ? `${pts(Pvig.por.MC.p50 - Pvig.por.MORENA.p50)} frente al partido ${nomM} (diferencia de medianas) y, contado ${POR_COAL}, ` : ''}${pts(bol.margen_mc_vs_morena_aliados.p50)} frente a ${coalicion} (rombos).`
      : ''
  }${filtro !== 'todas' ? ` Con el filtro «${rotFiltro(filtro)}» pasan ${num(enc.filter((q) => pasa(q, filtro)).length)} de ${num(enc.length)}; las demás van atenuadas.` : ''}`
  const conPeriodo = ptsEnc.filter((p) => p.x1).length
  const aliados = nombresAliados(enc)

  const columnas: Columna[] = [
    { t: '', ancho: 'minmax(0,1.3fr)' },
    // 182: lo que mide la etiqueta «sin cotejar con el original», que va en un solo renglón
    { t: 'Fuente', ancho: 'minmax(182px,1.5fr)' },
    { t: 'MC', ancho: '48px', der: true },
    ...colsP.map((k) => ({
      t: sigla(k),
      ancho: k === 'HAG_FUT' ? '104px' : k === 'MORENA' ? '62px' : '50px',
      der: true,
      tip: `${N.nombre_largo(k)}. Encuestas: como lo publica cada casa. Motor: estimación del motor (el corte vigente) o ${T.REPARTO_ESTIMADO} (los cortes anteriores).`,
    })),
    { t: `Margen · ${nomM}`, ancho: '74px', der: true, tip: `Puntos de MC menos puntos del partido ${nomM}.` },
    {
      t: 'Margen · coalición',
      ancho: '92px',
      der: true,
      tip: `Puntos de MC menos los de ${coalicion}: en las encuestas, Morena más los partidos de su coalición que lista${aliados ? ` (${aliados})` : ''}; en el motor, ${N.bloque_def('MORENA_ALIADOS', v.b)}. Es la cuenta con la que se decide quién va adelante.`,
    },
    {
      t: 'Adelante',
      ancho: 'minmax(118px,.9fr)',
      tip: `En las encuestas: quién tiene más menciones (frente a ${nomM}). En el motor: quién queda primero, contado ${POR_COAL}, y en qué parte de las corridas; si nadie llega a ${pct(N.UMBRAL.VENTAJA, 0)} de las corridas, «${T.PAREJO}» con las dos partes y sin nombrar a nadie.`,
    },
    { t: 'Confianza', ancho: '112px', tip: 'Nivel de confianza de la encuesta según su ficha (método, muestra, si se pudo verificar).' },
  ]

  return (
    <Seccion id={id} tag="Serie mensual" titulo={titulo} texto={lectura} derecha={<Filtros aria="Filtrar encuestas" valor={filtro} opciones={FILTROS} onChange={onFiltro} />}>
      {!mismo && sid ? <RotuloFijo>{`${T.FIJO} el historial por corte es de ${rotSid}: los cortes guardados solo traen ${Object.keys(e9).join(' y ')}.`}</RotuloFijo> : null}
      <TablaOscura
        aria={`Encuestas de ${ALC} y motor por corte`}
        minAncho={1320}
        columnas={columnas}
        grupos={grupos}
        arriba={<Serie arriba="ventaja MC" abajo="ventaja Morena" series={series} aria={`Margen de MC en cada encuesta de ${ALC} y en el motor`} />}
      />
      <div className="pp-chips">
        {Pvig ? <Naturaleza de={Pvig} /> : null}
        {hayRep ? (
          <Naturaleza
            de={T.REPARTO_ESTIMADO || N.NATURALEZA.REPARTO}
            nota={`Los cortes guardados solo traen MC y ${coalicion}: sus partidos se reparten con la proporción de cada uno dentro de la coalición que da el motor vigente en ${rotSid}.`}
          />
        ) : null}
      </div>
      <RotuloCandidatura boleta={v.b} chico />
      <Fuente titulo="Fuentes.">
        {`proyecciones.json · P6.intencion_alcaldia.entran (${cuantos(enc.length, 'encuesta', 'encuestas')}; ${num(conPeriodo)} con periodo de levantamiento, la barra detrás del punto)${
          sid ? ` y P9.boletas.${v.b}.escenarios.${sid}.serie (${cuantos(cortes.length, 'corte guardado', 'cortes guardados')})` : ''
        }. Los puntos de las encuestas son su margen frente al partido ${nomM}; los rombos del motor, frente a ${coalicion} (${POR_COAL}): no son la misma cuenta, por eso la tabla trae las dos. Las encuestas de confianza baja van atenuadas. «Último trimestre» = desde el `}
        <SinCorte>{fechaTxt(desdeTrimestre())}</SinCorte>
        {`. ${llano(intencion()?.que_mide)}`}
      </Fuente>
    </Seccion>
  )
}
