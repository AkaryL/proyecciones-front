/** Comparativo · arriba: los cuatro indicadores con el voto por partido, y cómo leer la página con sus tres hallazgos. */
import type { ReactNode } from 'react'
import { D, N, POR_COAL, T, cuantos, enFrase, esNum, listaDe as lista, num, pct, pts, signo, type Estado, type Json } from '../../motor'
import { Kicker, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { BarraPartidos, Naturaleza, NotaSuma, RotuloCandidatura, TablaPartidos } from '../../components/tablero/kit/partidos'
import { ComoLeer, Kpi, Numeradas, Tarjeta, Vacio } from '../../components/tablero/kit/tarjetas'
import { SIN_COTEJAR, busca, candTotal, cita, coal, companeros, desdeTrimestre, entran, intencion, margenAliados, margenSola, nombresAliados, proy, rotEsc, val } from './modelo'
import { B, VacioSec } from './piezas'

const rango = (lo: unknown, hi: unknown): string => N.rango(lo, hi)

/** Los cuatro indicadores: MC, Morena, el margen partido contra partido y la fecha de la elección; debajo, el voto partido por partido. */
export function Indicadores({ v }: { v: Estado }) {
  const id = 'cmp-kpi'
  const r: Json = D.recorte(v)
  const bol: Json = D.boleta(v.e, v.b)
  const P: Json = D.partidosBoleta(v.e, v.b)
  if (!r || !bol || !P) {
    return (
      <Seccion id={id}>
        <Vacio k={N.BOLETA[v.b] ? N.BOLETA[v.b].chip : ''} t={T.SIN_DATO} x={`El motor no trae esta boleta para ${rotEsc(v.e)}.`} />
      </Seccion>
    )
  }
  const m: Json = bol.margen_mc_vs_morena_aliados || {}
  const P7 = proy('P7')
  const ev: Json = D.evolucion(v.b)
  const mo: Json = P.por.MORENA || {}
  const tMA: Json = candTotal(P, 'MORENA_ALIADOS') || {}
  const fe = P7?.fecha_eleccion ? P7.fecha_eleccion.fecha || val(P7.fecha_eleccion) : ev?.eleccion
  const dias = P7 ? val(P7.dias_a_la_eleccion) : null
  const demas = companeros(P, 'MORENA_ALIADOS').map((x) => `${x.nombre} ${pct(x.p50)}`)
  // El margen principal es MC frente a Morena COMO PARTIDO (diferencia de las dos medianas del motor); el de la
  // coalición (el que da el motor, con su rango) va como dato secundario y rotulado, junto a quién va adelante.
  const pMC = P.por.MC && esNum(P.por.MC.p50) ? P.por.MC.p50 : r.MC.p50
  const mPar = esNum(mo.p50) && esNum(pMC) ? pMC - mo.p50 : null
  const nomM: string = N.nombre('MORENA')
  const coalicion = enFrase('MORENA_ALIADOS')
  return (
    <Seccion id={id}>
      <Rejilla min={210}>
        <Kpi partido="MC" valor={pct(r.MC.p50)} rotulo="Voto válido proyectado" sub={r.rotulo} tip={`${N.nombre('MC')}: ${rango(r.MC.p10, r.MC.p90)} · ${P.naturaleza}.`} />
        <Kpi
          partido="MORENA"
          valor={pct(mo.p50)}
          rotulo="Voto válido proyectado"
          sub={r.rotulo}
          tip={`${nomM}: ${rango(mo.p10, mo.p90)} · ${P.naturaleza}. Con ${demas.join(', ')}, ${coalicion} sumaría ${pct(tMA.p50)}${esNum(tMA.p10) && esNum(tMA.p90) ? ` (${rango(tMA.p10, tMA.p90)})` : ''}.`}
        />
        <Kpi
          variante="teal"
          valor={esNum(mPar) ? signo(mPar) : T.SIN_DATO}
          rotulo={`Margen MC – ${nomM} (partido)`}
          sub={`puntos · diferencia de las dos medianas · ${POR_COAL}: ${signo(m.p50)} frente a ${coalicion} (${r.veredicto.txt})`}
          tip={`Margen principal: MC menos ${nomM}, partido contra partido (cálculo propio con las dos medianas del motor; sin rango). Dato secundario, ${POR_COAL}: MC menos ${coalicion}, ${signo(m.p50)} puntos, ${rango(m.p10, m.p90)} (estimación del motor). ${
            r.veredicto.detalle ? `${r.veredicto.detalle}. ` : ''
          }${N.rotulo_candidatura(v.b)}`}
        />
        <Kpi variante="navy" valor={fe ? N.fecha(fe) : T.SIN_DATO} rotulo="Fecha de la elección" sub={esNum(dias) ? `${num(dias)} días después del corte del ${D.corteTexto()}` : N.datos_al(D.corte())} />
      </Rejilla>
      {/* el voto de cada partido, uno por uno, con su naturaleza; quién va adelante sigue por coalición */}
      <Tarjeta variante="plana">
        <div className="pp-fbol__cab">
          <Kicker>{`Voto válido proyectado por partido · ${P.rotulo}`}</Kicker>
          <Naturaleza de={P} />
        </div>
        <BarraPartidos P={P} />
        <TablaPartidos P={P} aria={`Voto válido proyectado por partido · ${P.rotulo}`} />
        <NotaSuma P={P} />
        <RotuloCandidatura boleta={v.b} chico />
      </Tarjeta>
    </Seccion>
  )
}

/** Cómo leer la página y tres hallazgos que salen de los datos. */
export function Leer({ v }: { v: Estado }) {
  const id = 'cmp-leer'
  const r: Json = D.recorte(v)
  const bol: Json = D.boleta(v.e, v.b)
  const I = intencion()
  const titulo: string = N.pagina('comparativo')?.pregunta || '¿Coinciden el modelo y las encuestas?'
  if (!r || !bol) return <VacioSec id={id} tag="Comparativo" titulo={titulo} x={`El motor no trae esta boleta para ${rotEsc(v.e)}.`} />
  const rot = rotEsc(v.e)
  const mM: number = bol.margen_mc_vs_morena_aliados.p50
  const ver: Json = r.veredicto
  const meta: Json = D.meta() || {}
  const P: Json = D.partidosBoleta(v.e, v.b)
  const enc = entran()
  const prom: Json = I?.promedio ?? null
  const mE: unknown = prom ? val(prom.margen_mc_menos_morena) : null
  const nE: number = prom ? val(prom.n_encuestas) : enc.length
  const moP: number | null = P?.por.MORENA ? P.por.MORENA.p50 : null
  const tMA: Json = candTotal(P, 'MORENA_ALIADOS') || {}
  const mMor = esNum(moP) ? r.MC.p50 - moP : null
  const demas = companeros(P, 'MORENA_ALIADOS').map((x) => `${x.nombre} ${pct(x.p50)}`)
  const nomM: string = N.nombre('MORENA')
  const coalicion = enFrase('MORENA_ALIADOS')

  const lead = (
    <>
      {'En '}
      <B>{rot}</B>
      {', el motor daría a MC '}
      <B>{pct(r.MC.p50)}</B>
      {` y a ${nomM} `}
      <B>{pct(moP)}</B>
      {` del voto válido de la ${N.BOLETA[v.b].corto.toLowerCase()}: `}
      {esNum(mMor) ? (
        <>
          <B>{pts(mMor)}</B>
          {` de MC frente a ${nomM}, partido contra partido. `}
        </>
      ) : null}
      {`Contado ${POR_COAL} (quién va adelante), ${coalicion}, con ${demas.join(', ').replace(/, ([^,]*)$/, ' y $1')}, sumaría ${pct(tMA.p50)} («${ver.txt}»). `}
      {prom ? (
        <>
          {`El promedio de ${cuantos(nE, 'encuesta', 'encuestas')} da a MC `}
          <B>{pct(val(prom.MC))}</B>
          {` y a ${nomM} `}
          <B>{pct(val(prom.MORENA))}</B>
          {' de las menciones: no miden lo mismo, así que aquí se compara hacia qué lado apuntan y cómo se mueven, no el nivel.'}
        </>
      ) : (
        'No hay promedio de encuestas cargado (proyecciones.json), así que solo se ve el motor.'
      )}
    </>
  )

  const leer = (
    <>
      {'No es un marcador de aciertos. El '}
      <B>motor</B>
      {` (el modelo de simulación del tablero, versión ${meta.version || ''}) proyecta el `}
      <B>voto válido del día de la elección</B>
      {` de cada partido (MC, ${nomM}, PT, PVEM, Hagamos/Futuro, PAN, PRI y otros) y, para decir quién iría adelante, suma los partidos de cada `}
      <B>coalición</B>
      {` de 2024 (${coal('MORENA_ALIADOS', v.b)}). Cada `}
      <B>corrida</B>
      {' es una elección simulada: se da la '}
      <B>mediana</B>
      {` de las ${num(meta.n_corridas)} y el `}
      <B>rango</B>
      {` en que caen ${String(T.CORRIDAS_80).replace(/\s*corridas$/, '')}. Las `}
      <B>encuestas</B>
      {' miden '}
      <B>mención hoy</B>
      {`, con indecisos, y casi siempre a ${nomM} como partido. El `}
      <B>margen</B>
      {` son los puntos de MC menos los del rival: positivo, MC adelante. Cada columna dice contra quién se mide: el partido «${nomM}» o, contado ${POR_COAL}, ${coalicion}. La encuesta MURAL va marcada «${SIN_COTEJAR}».`}
    </>
  )

  /* hallazgo 1 · ¿apuntan al mismo lado? */
  let cierre1: string
  if (esNum(mE)) {
    const ladoM = mM > 0 ? 'MC' : mM < 0 ? 'M' : ''
    const ladoE = mE > 0 ? 'MC' : mE < 0 ? 'M' : ''
    // casi empate en el motor: el motor no apunta a nadie; solo se dice hacia dónde van las encuestas
    cierre1 =
      ver.nivel === 'empate' || ver.nivel === 'parejo'
        ? `el motor no da ventaja clara a nadie (nadie llega a ${pct(N.UMBRAL.VENTAJA, 0)} de las corridas)${ladoE ? ` y las encuestas apuntarían a ${ladoE === 'MC' ? 'MC' : 'Morena'}` : ''}`
        : ladoM && ladoM === ladoE
          ? `los dos apuntarían al mismo lado (${ladoM === 'MC' ? 'MC' : 'Morena'})`
          : 'apuntarían a lados distintos'
  } else cierre1 = ''
  const h1 = (
    <>
      {'En '}
      <B>{rot}</B>
      {' el motor daría a MC '}
      {esNum(mMor) ? (
        <>
          {'un margen de '}
          <B>{pts(mMor)}</B>
          {` frente al partido ${nomM} (diferencia de las medianas de los dos partidos) y, contado ${POR_COAL}, `}
        </>
      ) : null}
      {'de '}
      <B>{pts(mM)}</B>
      {` frente a ${coalicion} («${ver.txt}»${ver.detalle ? `: ${ver.detalle}` : ''}). `}
      {esNum(mE) ? (
        <>
          {`El promedio de las ${num(nE)} encuestas es de `}
          <B>{pts(mE)}</B>
          {` frente a ${nomM}: ${cierre1}.`}
        </>
      ) : (
        'Sin promedio de encuestas con qué compararlo.'
      )}
    </>
  )

  /* hallazgo 2 · qué tan dispersas están las encuestas y cuánto pesa una sola */
  const desde = desdeTrimestre()
  const conMargen = enc.filter((q) => esNum(margenSola(q)))
  const recientes = conMargen.filter((q) => String(q.fecha) >= desde)
  const grupo = recientes.length >= 2 ? recientes : conMargen
  let h2: ReactNode
  if (grupo.length >= 2) {
    const orden = [...grupo].sort((a, c) => (margenSola(a) as number) - (margenSola(c) as number))
    const lo = orden[0]
    const hi = orden[orden.length - 1]
    const S: Json = I?.sensibilidad_dejando_una_fuera
    const mas: Json = S?.encuesta_con_mas_peso
    const sinMas = mas ? busca(lista(S.por_encuesta).map((x) => ({ id: x.sin, x })), mas.id) : null
    h2 = (
      <>
        {`Las ${num(grupo.length)} encuestas ${grupo === recientes ? 'de los últimos tres meses' : 'del promedio'} van de `}
        <B>{pts(margenSola(lo))}</B>
        {` (${cita(lo)}) a `}
        <B>{pts(margenSola(hi))}</B>
        {` (${cita(hi)}) de margen para MC frente a ${nomM}. `}
        {mas && sinMas && esNum(mE) ? (
          <>
            {`Si se dejara fuera la que más pesa (${mas.casa}, ${pct(mas.peso_pct)} del peso), el promedio pasaría de ${pts(mE)} a `}
            <B>{pts(sinMas.x.margen_mc_menos_morena)}</B>.
          </>
        ) : null}
      </>
    )
  } else h2 = 'No hay encuestas suficientes para medir su dispersión.'

  /* hallazgo 3 · con la misma cuenta que el motor (Morena con los otros partidos de su coalición) */
  const conAl = enc.filter((q) => esNum(margenAliados(q)))
  let h3: ReactNode
  if (conAl.length) {
    const ms = conAl.map((q) => margenAliados(q) as number)
    const mn = Math.min(...ms)
    const mx = Math.max(...ms)
    h3 = (
      <>
        {`Contando a Morena con los partidos de su coalición que cada encuesta lista (${nombresAliados(conAl)}), las ${num(conAl.length)} que los traen dan a MC entre `}
        <B>{pts(mn)}</B>
        {' y '}
        <B>{pts(mx)}</B>
        {'. El motor daría '}
        <B>{pts(mM)}</B>
        {` frente a ${coalicion}: ${mM > mx ? 'quedaría más favorable a MC que todas ellas' : mM < mn ? 'quedaría menos favorable a MC que todas ellas' : 'quedaría dentro de ese rango'}.`}
      </>
    )
  } else h3 = `Ninguna encuesta del promedio lista a los otros partidos de ${coalicion}: su margen solo se puede medir frente a ${nomM}.`

  return (
    <Seccion id={id} tag="Comparativo" titulo={titulo} texto={lead} grande>
      <ComoLeer titulo="Cómo leer esto.">{leer}</ComoLeer>
      <Numeradas items={[h1, h2, h3]} />
      <RotuloCandidatura boleta={v.b} chico />
    </Seccion>
  )
}
