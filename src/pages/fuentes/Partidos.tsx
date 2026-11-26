/** Fuentes · 3: partidos por separado. De dónde sale cada cifra por partido: lo que da el motor y lo que es un reparto estimado. */
import { D, N, POR_COAL, T, enFrase, esNum, listaDe as lista, type Boleta, type Json } from '../../motor'
import { usePartidos2024 } from '../../motor/hooks'
import { Fuente, H3, Mono, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { LeyendaPartidos, Naturaleza, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { RankNombre, TablaRanking } from '../../components/tablero/kit/tablas'
import { Tarjeta } from '../../components/tablero/kit/tarjetas'
import { BOLETAS3, RAYA, enumera, mayus, num, pct, plural, rotEsc, seccion, sinDato2024 } from './modelo'
import { Notas, VacioSec } from './piezas'

export function Partidos() {
  const s = seccion('fue-partidos')
  // el resultado 2024 por sección (pesa) se pide al entrar a la página; al llegar se repinta la tabla
  usePartidos2024()
  const cen: string = D.central()
  const P: Json = D.partidosBoleta(cen, 'ayun')
  const F: Json = D.FUENTE_2024 || {}
  if (!P) return <VacioSec s={s} x="El motor no trae los partidos por separado." />
  const coalicion: Json = lista(P.candidaturas).reduce<Json>((r, x) => (x.clave === 'MORENA_ALIADOS' ? x : r), null)
  // ejemplo vivo del reparto: el total de la coalición, repartido con la proporción del motor, suma exactamente lo mismo
  const ej: Json = coalicion?.total ? D.repartoPartidos({ MORENA_ALIADOS: coalicion.total.p50 }, D.proporcionesMotor(cen, 'ayun').pesos, { boleta: 'ayun', dec: 1 }) : null
  const ejTxt = ej
    ? `${num(coalicion.total.p50, 1)} → ${lista(ej.partidos)
        .filter((x) => x.candidatura === 'MORENA_ALIADOS' && esNum(x.p50))
        .map((x) => `${x.nombre} ${num(x.p50, 1)}`)
        .join(' + ')}`
    : ''
  const parejo = String(T.PAREJO).toLowerCase()
  const motor = [
    {
      t: `Toda la ciudad · ${mayus(N.NATURALEZA.MOTOR)}`,
      x: `El motor da cada partido con su mediana y su rango de ${T.CORRIDAS_80}. En ${rotEsc(cen)}, ${String(N.BOLETA.ayun.corto).toLowerCase()}: ${lista(P.partidos)
        .filter((x) => esNum(x.p50))
        .map((x) => `${x.nombre} ${pct(x.p50)}`)
        .join(' · ')}.`,
    },
    { t: `Cada distrito · ${mayus(N.NATURALEZA.MOTOR)}`, x: 'El motor da la mediana de cada partido en el distrito, sin rango por partido: el rango solo existe para la coalición entera.' },
    { t: 'Lo que no se reparte', x: `Quién va adelante, la parte de las corridas, «${parejo}», el veredicto y los curules: se calculan ${POR_COAL} y no se inventa una probabilidad por partido (el motor no la da).` },
  ]
  const reparto = [
    {
      t: 'Cuándo se reparte',
      x: 'Donde el motor solo da el voto de la coalición: una sección, una zona, un grupo de edad o de sexo, un tipo de sección, los votos esperados, la trayectoria mensual y los cortes guardados.',
    },
    {
      t: 'Cómo',
      x: `El voto de la coalición se reparte entre sus partidos con la proporción de cada uno dentro de ella. MC y otros van tal cual. Se redondea una sola vez, al final (método del mayor resto): los partidos suman exactamente la coalición${
        ejTxt ? ` (en ${rotEsc(cen)}: ${ejTxt})` : ''
      }.`,
    },
    {
      t: 'Con qué proporción',
      x: 'Una sección: lo que sacó cada partido en esa sección en 2024 en la misma boleta, según el cómputo oficial (si la sección no tiene votos en ese cómputo, la del motor en su distrito). Una zona o un grupo: la del motor en su distrito. Un tipo de sección: la del motor en toda la ciudad. Un mes o un corte guardado: la del motor vigente en ese escenario.',
    },
    { t: 'Qué no tiene', x: `Un reparto no tiene rango propio: va «${T.SIN_RANGO}». Es un cálculo propio, no una salida del motor.` },
  ]
  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      texto={
        <>
          {'El tablero enseña cada '}
          <strong>partido</strong>
          {` por separado: ${enumera((N.PARTIDOS as string[]).map((k) => N.nombre(k)))}. Quién gana, la parte de las corridas en que alguien queda primero, «${parejo}», el veredicto y los curules siguen `}
          <strong>{POR_COAL}</strong>
          {' (las de 2024), porque es la coalición la que gana el cargo. Cada cifra por partido dice su naturaleza: '}
          <strong>{N.NATURALEZA.MOTOR}</strong>
          {' o '}
          <strong>{N.NATURALEZA.REPARTO}</strong>
          {` (${N.NATURALEZA.CALCULO}).`}
        </>
      }
    >
      <LeyendaPartidos boleta="ayun" largo />
      <RotuloCandidatura boleta="ayun" />
      <RotuloCandidatura boleta="fed" chico />
      <Rejilla min={360}>
        <Tarjeta variante="24 plana">
          <div className="pp-chips">
            <Naturaleza de={N.NATURALEZA.MOTOR} />
          </div>
          <Notas items={motor} min={220} />
        </Tarjeta>
        <Tarjeta variante="24 plana">
          <div className="pp-chips">
            <Naturaleza de={N.NATURALEZA.REPARTO} nota={T.REPARTO_NOTA} />
          </div>
          <Notas items={reparto} min={220} />
        </Tarjeta>
      </Rejilla>
      <H3 titulo>De dónde sale la proporción 2024 de cada sección</H3>
      <TablaRanking
        aria="De dónde sale la proporción 2024 por sección de cada boleta"
        minAncho={900}
        columnas={[
          { t: 'Boleta', ancho: 'minmax(150px,1fr)' },
          { t: 'Elección de la que sale', ancho: 'minmax(150px,1fr)' },
          { t: 'Archivo', ancho: '130px' },
          { t: 'Qué trae', ancho: 'minmax(220px,2fr)' },
          { t: 'Secciones sin ese dato', ancho: '150px', tip: `Secciones sin votos 2024 de los partidos de ${enFrase('MORENA_ALIADOS')}: su reparto usa la proporción del motor en su distrito y lo dice.` },
        ]}
        filas={BOLETAS3.map((b: Boleta) => {
          const f: Json = F[b] || {}
          const sd = sinDato2024(b)
          return [
            { c: <RankNombre nombre={N.BOLETA[b].primera} /> },
            { c: f.boleta || T.SIN_DATO },
            { c: <Mono>{f.archivo || RAYA}</Mono> },
            { c: `${b === 'fed' ? 'MC, Morena, PT, PVEM, PAN, PRI y otros (no hay partidos locales en la federal): ' : 'MC, Morena, PT, PVEM, Hagamos/Futuro, PAN, PRI y otros: '}${f.como || T.SIN_DATO}` },
            { c: sd ? `${plural(sd.n, 'sección', 'secciones')} de ${num(sd.de)}` : D.estadoPartidos2024(b) === 'falta' ? 'no se pudo leer' : 'cargando…' },
          ]
        })}
      />
      <Fuente titulo="Fuentes.">
        {`sim_v8.json · escenarios[…].${N.BOLETA.ayun.json}.partidos y distritos[…].partidos_p50 (lo que da el motor por partido); ${enumera(
          BOLETAS3.map((b) => {
            const f: Json = F[b] || {}
            return `${f.archivo || ''}${f.campo ? ` · ${f.campo}` : f.ruta ? ` · ${f.ruta}` : ''} (${f.boleta || ''})`
          }),
        )}. El total de cada partido de 2024 por sección es el resultado oficial tal como está en esos archivos. En el motor, PRI incluye PRD.`}
      </Fuente>
    </Seccion>
  )
}
