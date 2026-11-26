/** Comparativo · 3 y 4: el promedio de encuestas frente al motor, y los careos de Delgadillo con cada aspirante de Morena. */
import { D, N, T, cuantos, esNum, listaDe as lista, num, pct, pts, signo, type Estado, type Json } from '../../motor'
import { Aviso, Col, Etiqueta, Fuente, Kicker, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { PildoraLider } from '../../components/tablero/kit/barras'
import { Naturaleza } from '../../components/tablero/kit/partidos'
import { LecturaRapida, type Lectura } from '../../components/tablero/kit/tablas'
import { BarrasPareadas, CabTarjeta, Tarjeta, TarjetaAviso } from '../../components/tablero/kit/tarjetas'
import { ALC, SIN_COTEJAR, cita, entran, f1, has, intencion, llano, partidosCols, prelim, proy, puntosTxt, sinRutas, val } from './modelo'
import { FijoEncuestas, VacioSec } from './piezas'

/** Promedio de encuestas (P6) frente al motor, partido por partido. */
export function Promedio({ v }: { v: Estado }) {
  const id = 'cmp-promedio'
  const titulo = `¿Qué dicen las encuestas de la ${ALC}, en promedio?`
  const I = intencion()
  const bol: Json = D.boleta(v.e, v.b)
  if (!I?.promedio) return <VacioSec id={id} tag="Encuestas" titulo={titulo} x="Falta el promedio de encuestas (proyecciones.json · P6)." />
  const P6 = proy('P6')
  const pr: Json = I.promedio
  const ps: Json = I.promedio_simple || {}
  const sp: Json = I.promedio_sin_preliminares || {}
  const S: Json = I.sensibilidad_dejando_una_fuera || {}
  const partidos: Json = bol?.partidos ?? {}
  const Pm: Json = D.partidosBoleta(v.e, v.b)
  // orden fijo de los partidos (cada uno siempre en su lugar): los que listan las encuestas y los que el motor cuenta y ellas no
  const claves = partidosCols(v.b).filter((k) => (has(pr, k) && esNum(val(pr[k]))) || (partidos[k] && esNum(partidos[k].p50)))
  const filas = claves.map((k) => ({ t: N.nombre(k) as string, valores: [has(pr, k) ? (val(pr[k]) as number | null) : null, partidos[k] ? (partidos[k].p50 as number | null) : null] }))
  const tope = Math.max(0, ...filas.flatMap((f) => f.valores.filter(esNum)))
  const hayPrelim = entran().some(prelim)
  const linea = (o: Json) => `MC ${pct(val(o.MC))} · ${N.nombre('MORENA')} ${pct(val(o.MORENA))}`
  const margen = (o: Json) => pts(val(o.margen_mc_menos_morena))
  // la alternativa: las encuestas que el monitoreo no pudo verificar, con el nivel de su método
  const pm: Json = I.promedio_con_nivel_por_metodo
  const items: (Lectura | null)[] = [
    { t: `Ponderado · ${linea(pr)}`, x: `Margen de MC: ${margen(pr)}. Pesa más la encuesta reciente y la de mayor confianza.` },
    ps.MC ? { color: N.DISENO.marino, t: `Sin pesos · ${linea(ps)}`, x: `Margen de MC: ${margen(ps)}. Todas las encuestas cuentan igual.` } : null,
    hayPrelim && sp.MC ? { color: N.DISENO.ambar, t: `Sin la encuesta MURAL · ${linea(sp)}`, x: `Margen de MC: ${margen(sp)}. MURAL está ${SIN_COTEJAR}.` } : null,
    S.margen_mc_menos_morena && S.encuesta_con_mas_peso
      ? {
          color: N.DISENO.sin_dato,
          t: 'Quitando una encuesta cada vez',
          x: `El margen iría de ${pts(val(S.margen_mc_menos_morena.min))} (sin ${cita(S.margen_mc_menos_morena.min)}) a ${pts(val(S.margen_mc_menos_morena.max))} (sin ${cita(S.margen_mc_menos_morena.max)}). La que más pesa es ${
            S.encuesta_con_mas_peso.casa
          }, con ${pct(S.encuesta_con_mas_peso.peso_pct)} del peso${S.cambia_quien_va_delante === false ? '; en ningún caso cambiaría quién va por delante.' : '.'}`,
        }
      : null,
    pm?.MC && lista(pm.cambian).length
      ? {
          color: N.DISENO.petroleo,
          t: `Con el nivel de confianza por método · ${linea(pm)}`,
          x: `Margen de MC: ${margen(pm)}. ${lista(pm.cambian)
            .map((c) => `${c.casa} entraría con nivel «${c.nivel_por_metodo}» en vez de «${c.nivel_declarado}» y pesaría ${pct(c.peso_pct_con_nivel_por_metodo)} en vez de ${pct(c.peso_pct)}.`)
            .join(' ')} Es una alternativa al ponderado.`,
        }
      : null,
  ]
  const lecturas = items.filter((x): x is Lectura => x !== null)
  const vida = I.metodo?.vida_media_dias ? val(I.metodo.vida_media_dias) : null
  return (
    <Seccion id={id} tag="Encuestas" titulo={titulo} texto={puntosTxt(I.lectura || P6?.lectura || '')}>
      <div className="pp-chips">
        <FijoEncuestas />
        {hayPrelim ? <Aviso icono="alerta">{`Encuesta MURAL: ${SIN_COTEJAR}`}</Aviso> : null}
      </div>
      <Rejilla min={420}>
        <Tarjeta variante="g">
          <Kicker>Encuestas frente al motor · partido por partido</Kicker>
          <BarrasPareadas
            filas={filas}
            series={[
              { t: `Promedio de ${cuantos(val(pr.n_encuestas), 'encuesta', 'encuestas')} · % de mención`, color: N.DISENO.teal },
              { t: `Motor · ${N.rotulo(v.b, v.e)} · % de voto válido`, color: N.DISENO.marino },
            ]}
            max={Math.ceil((tope + 1e-9) / 10) * 10}
          />
          <div className="pp-chips">
            {Pm ? <Naturaleza de={Pm} /> : null}
            <Etiqueta tipo="gris">Encuestas: tal como las publica cada casa</Etiqueta>
          </div>
          <span className="pp-nota pp-nota--12">{`No son la misma medida: la mención incluye indecisos y el voto válido no. Sirve para ver el orden y las distancias, no para restar una barra de la otra. «${T.SIN_DATO}»: las encuestas no listan ese partido. Los partidos van siempre en el mismo orden.`}</span>
        </Tarjeta>
        <Tarjeta variante="g">
          <LecturaRapida items={lecturas} titulo={`El promedio, visto de ${num(lecturas.length)} maneras`} />
        </Tarjeta>
      </Rejilla>
      <Fuente titulo="Fuentes.">
        {`proyecciones.json · P6.intencion_alcaldia (promedio, promedio_simple, promedio_sin_preliminares, promedio_con_nivel_por_metodo y sensibilidad_dejando_una_fuera) y sim_v8.json · escenarios[${v.e}].${N.BOLETA[v.b].json}.partidos. Peso de cada encuesta = el de su nivel de confianza × la mitad por cada ${
          esNum(vida) ? num(vida) : ''
        } días de antigüedad (supuesto del analista). ${llano(I.que_mide)}`}
      </Fuente>
    </Seccion>
  )
}

/** Careos de Delgadillo con cada aspirante de Morena (P6). */
export function Careos() {
  const id = 'cmp-careos'
  const titulo = '¿Y con nombres? Delgadillo frente a cada aspirante de Morena'
  const P6 = proy('P6')
  const C: Json = P6?.careos
  if (!C || !lista(C.por_aspirante).length) return <VacioSec id={id} tag="Careos" titulo={titulo} x="Faltan los careos (proyecciones.json · P6.careos)." />
  const cot = lista(C.cotejo_de_la_encuesta_preliminar)
  const mal = cot.filter((c) => c.coinciden === false)
  const queEs =
    sinRutas(C.aviso_sin_cotejar || P6?.aviso_sin_cotejar || '') ||
    'Las cifras de la encuesta MURAL (XtrategiaGDL para Grupo Reforma) se copiaron de recortes de prensa y no se han comparado con la publicación original.'
  const notas = [
    { t: 'Qué quiere decir', x: `${queEs} Sus cifras se usan con esa reserva en todo el tablero.` },
    { t: 'Comprobación con una nota verificada', x: `La copia de los recortes y la nota verificada de la misma encuesta coinciden en ${num(cot.length - mal.length)} de ${num(cot.length)} careos.` },
    ...mal.map((c) => ({
      t: `${c.aspirante}${c.candidato_pan_pri ? ` (con ${c.candidato_pan_pri} por ${N.nombre('PAN_PRI')})` : ''}`,
      x: `Recortes: ${c.aspirante} ${f1(c.transcripcion.aspirante_pct)} · Delgadillo ${f1(c.transcripcion.delgadillo_pct)}. Nota verificada: ${c.aspirante} ${f1(c.nota_verificada.aspirante_pct)} · Delgadillo ${f1(c.nota_verificada.delgadillo_pct)}.`,
    })),
  ]
  return (
    <Seccion id={id} tag="Careos" titulo={titulo} texto={puntosTxt(C.lectura || '')}>
      <FijoEncuestas />
      <Rejilla min={260}>
        {lista(C.por_aspirante).map((a) => (
          <Tarjeta key={a.aspirante}>
            <CabTarjeta icono="grupo" kicker="Aspirante de Morena" titulo={a.aspirante} />
            {lista(a.estudios).map((s, i) => {
              const d: unknown = s.diferencia_media
              return (
                <Col key={i} gap={6}>
                  <span className="pp-nota">
                    {sinRutas(s.estudio)}
                    {s.preliminar || s.sin_cotejar ? (
                      <>
                        {' '}
                        <Etiqueta tipo="ambar">{SIN_COTEJAR}</Etiqueta>
                      </>
                    ) : null}
                  </span>
                  <div className="pp-chips">
                    <span className="pp-nota pp-nota--12">
                      {`${a.aspirante} `}
                      <strong>{f1(s.aspirante_pct_medio)}</strong>
                      {' · Delgadillo '}
                      <strong>{f1(s.delgadillo_pct_medio)}</strong>
                      {s.n_careos > 1 ? ` · media de ${num(s.n_careos)} careos` : ''}
                    </span>
                    {/* quién va por delante en ese careo y por cuántos puntos */}
                    {!esNum(d) || N.red(d, 1) === 0 ? <PildoraLider clave="OTROS" t="Igualados" /> : <PildoraLider clave={d > 0 ? 'MORENA' : 'MC'} t={d > 0 ? a.aspirante : 'Delgadillo'} valor={signo(Math.abs(d))} />}
                  </div>
                </Col>
              )
            })}
          </Tarjeta>
        ))}
      </Rejilla>
      {cot.length ? <TarjetaAviso titulo={`La encuesta MURAL está ${SIN_COTEJAR}`} aviso="Sin cotejar" notas={notas} /> : null}
      <Fuente titulo="Fuentes.">
        {`proyecciones.json · P6.careos.por_aspirante y cotejo_de_la_encuesta_preliminar. ${
          C.como_se_lee ? `Cómo se lee: ${llano(C.como_se_lee)} ` : ''
        }La píldora dice quién va por delante en ese careo y por cuántos puntos. Un careo es una pregunta con nombres; no es la boleta por partido de las otras secciones.`}
      </Fuente>
    </Seccion>
  )
}
