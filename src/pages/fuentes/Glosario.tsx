/** Fuentes · 8: glosario. Las palabras del tablero, con las cifras que hoy las definen. */
import { D, N, POR_COAL, T, enFrase, esNum, listaDe as lista, type Json } from '../../motor'
import { Fuente, Seccion } from '../../components/tablero/kit/base'
import { Tarjeta } from '../../components/tablero/kit/tarjetas'
import { J, anio, enumera, intencion, limpio, marcas, mayus, metaDe, nZonas, num, obj, pct, primeraFrase, proy, punto, rotEsc, seccion, val } from './modelo'
import { Notas } from './piezas'

export function Glosario() {
  const s = seccion('fue-glosario')
  const meta: Json = D.meta() || {}
  const cen: string = D.central()
  const M = marcas()
  const est: Json = obj(proy('P5')?.estados)
  const I = intencion()
  const P2 = proy('P2')
  const ag = J('agentes')
  const escudo: Json = obj(metaDe('corridas').escudo)
  const ln: unknown = D.listaNominal()
  const anioEl = anio(val(obj(obj(proy('P7')).fecha_eleccion).fecha))
  const anios = J('evolucion') ? lista(D.evolucion('ayun')?.oficiales).map((o) => anio(o.fecha)) : []
  const mc: string = N.nombre('MC')
  const pri: string = N.nombre('PRI')
  const federal = String(N.BOLETA.fed.corto).toLowerCase()

  const G: [string, string][] = [
    ['Motor', `El modelo de simulación del tablero (versión ${meta.version || T.SIN_DATO}). Calcula el voto por sección, grupo de edad y género, y repite la elección muchas veces.`],
    ['Corrida', `Una elección simulada completa. Cada escenario se corre ${num(meta.n_corridas)} veces, cada vez con supuestos distintos dentro de su rango.`],
    ['Mediana', 'El valor del medio: la mitad de las corridas queda por arriba y la mitad por abajo. Es la cifra principal de cada partido.'],
    [`Rango de ${T.CORRIDAS_80}`, `Entre qué valores cae el resultado en ${T.CORRIDAS_80}; se deja fuera la décima parte más alta y la más baja.`],
    ['Escenario', `Un «qué pasaría si»: una combinación de hechos con el efecto que el motor les supone. Hay ${num(lista(D.escenarios()).length)} y no son excluyentes.`],
    [T.S0, est.referencia?.que_significa ? limpio(est.referencia.que_significa) : 'Escenario de referencia: no es un futuro posible.'],
    [rotEsc(cen), `${est.central?.que_significa ? limpio(est.central.que_significa) : 'El escenario que el motor toma como base.'} Es el que se ve por defecto en todo el tablero.`],
    ['Boleta', `Cada elección que se vota por separado: ${enumera((N.BOLETAS as string[]).map((b) => N.BOLETA[b].primera))}. Sus porcentajes no se comparan entre sí.`],
    [
      N.nombre('MORENA_ALIADOS'),
      `Coalición de 2024 de ${N.BLOQUE_DEF.MORENA_ALIADOS}${
        N.BLOQUE_DEF_FED?.MORENA_ALIADOS ? `; en la ${federal}, ${N.BLOQUE_DEF_FED.MORENA_ALIADOS}` : ''
      }. El tablero enseña cada partido por separado; la coalición solo sirve para decir quién va adelante (y el margen con que se decide). «${N.nombre('MORENA')}» es el partido solo: así lo miden casi todas las encuestas.`,
    ],
    [
      N.nombre('PAN_PRI'),
      `Coalición de 2024 del ${N.nombre('PAN')} y el ${pri} (en el motor, el ${pri} incluye al PRD). ${M.pan_pri_sin_alianza?.texto ? limpio(M.pan_pri_sin_alianza.texto) : 'Los dos partidos sumados como en 2024.'}`,
    ],
    [
      T.PARTIDO || 'Partido',
      `Lo que se dibuja en barras, tablas y leyendas, uno por uno: ${enumera((N.PARTIDOS as string[]).map((k) => N.nombre(k)))}. Cada uno va siempre en el mismo lugar y con el mismo color. En la ${federal} no compite Hagamos/Futuro (son partidos locales).`,
    ],
    [
      T.CANDIDATURA || 'Coalición',
      `Los partidos que fueron juntos en 2024. ${punto(N.rotulo_candidatura('ayun'))} Quién va adelante, «parejo», el veredicto y los curules se dicen ${POR_COAL}, porque es la coalición la que gana el cargo.`,
    ],
    [mayus(N.NATURALEZA.MOTOR), 'La cifra por partido tal como la da el motor: en toda la ciudad, con su mediana y su rango; en un distrito, solo la mediana.'],
    [
      mayus(N.NATURALEZA.REPARTO),
      'Cálculo propio: donde el motor solo da el voto de la coalición (una sección, una zona, un grupo, un mes, un corte guardado), se reparte entre sus partidos con la proporción de cada uno dentro de ella. Está en «¿Cómo se separan los partidos?».',
    ],
    [
      'Votación válida y mención',
      `El motor y los resultados oficiales van en porcentaje de votación válida (suma cien). Las encuestas van en mención: ${
        I?.que_mide ? limpio(I.que_mide).charAt(0).toLowerCase() + limpio(I.que_mide).slice(1) : 'porcentaje sobre el total de entrevistas, con indecisos.'
      }`,
    ],
    ['Margen', `Puntos de ${mc} menos puntos de ${enFrase('MORENA_ALIADOS')}. Positivo: ${mc} va adelante.`],
    ['Punto', 'Punto porcentual: la resta de dos porcentajes. Los cambios y los márgenes se dan en puntos, no en por ciento.'],
    ['% de las corridas', 'Parte de las corridas en que MC o una coalición queda primero. No es una probabilidad medida: depende de los supuestos del motor. No hay una por partido: el motor no la da.'],
    [
      'Gana, Ventaja, Empate técnico',
      `Solo donde se elige un cargo (la alcaldía en toda la ciudad o un distrito). «Gana» desde ${pct(N.UMBRAL.GANA, 0)} de las corridas, «Ventaja» desde ${pct(N.UMBRAL.VENTAJA, 0)} y, por debajo, «Empate técnico».`,
    ],
    [T.MAS_VOTOS, 'Lo que se dice en sumas y recortes que no eligen a nadie: un grupo de edad, la alcaldía dentro de un distrito o la suma de los distritos de una diputación.'],
    ['Sección', `La unidad más chica del mapa electoral. Guadalajara tiene ${num(meta.n_secciones)}.`],
    ['Celda', `Una sección, un grupo de edad y un género. El motor calcula ${num(meta.n_celdas)}.`],
    ['Lista nominal', `Personas que pueden votar. ${esNum(ln) ? `${N.lista_nominal(ln)}.` : ''}`],
    ['Zona', `Grupo de secciones parecidas dentro de un distrito${ag ? ` (${num(nZonas(ag))})` : ''}.`],
    [T.AGENTES, `Una zona, un grupo de edad y un género${ag ? ` (${num(lista(ag.agentes).length)})` : ''}. No son personas ni entrevistados.`],
    ['Distrito', `${enumera((N.DISTRITOS as string[]).map((d) => N.DISTRITO_LOCAL[d].corto))}. ${T.NOTA_D13} ${T.NOTA_DF13}`],
    ['Canal de choque', `Cada vía por la que un hecho mueve votos (${num(Object.keys(obj(meta.canales)).length)}): calidad del agua, tandeo, protesta, ola nacional, candidaturas…`],
    ['Tandeo', 'Reparto del agua por turnos, con cortes programados.'],
    [
      'Escudo de Delgadillo',
      `${escudo.que_es ? primeraFrase(limpio(escudo.que_es)) : 'Parte del castigo al gobierno estatal que no llega a la boleta de la alcaldía.'}${esNum(escudo.mediana) ? ` El motor supone ${pct(escudo.mediana, 0)} en la mediana.` : ''}`,
    ],
    ['Ancla', 'Dato externo (un resultado, un modelo o una encuesta) que dice hacia dónde se movió el margen desde la elección anterior. Cada una pesa según su confianza.'],
    ['Punto de partida', 'El margen del cómputo anterior más el cambio medio de las anclas. También se le dice línea base; el cambio se llama deriva.'],
    [
      'Elección intermedia',
      `La que no trae presidencia en la boleta${anios.length && anioEl ? ` (${enumera([anios[0], anioEl])})` : ''}; la concurrente sí la trae${anios.length > 1 ? ` (${anios[anios.length - 1]})` : ''}. En la intermedia vota menos gente y de más edad.`,
    ],
    ['Corte', `Fecha hasta la que llegan los datos. Hoy: ${D.corteTexto()}.`],
    ['Brecha en votos', P2?.como_se_calcula ? primeraFrase(limpio(String(P2.como_se_calcula).split(';')[1] || P2.como_se_calcula)) : 'El margen convertido a votos.'],
    ['Curules esperados', 'La suma de las probabilidades de quedar primero en cada distrito. No es un reparto seguro.'],
    ['Huella', 'Código corto que identifica el contenido exacto de un archivo: si el archivo cambia, la huella cambia.'],
  ]
  const palabras = [...G].sort((a, c) => String(a[0]).localeCompare(String(c[0]), 'es', { sensitivity: 'base' }))

  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      texto={`Las palabras del tablero, con las cifras que hoy las definen: se diría «Gana» desde ${pct(N.UMBRAL.GANA, 0)} de las corridas y «Ventaja» desde ${pct(N.UMBRAL.VENTAJA, 0)}; por debajo sería «Empate técnico».`}
    >
      <Tarjeta variante="24 plana">
        <Notas min={250} items={palabras.map(([t, x]) => ({ t, x }))} />
      </Tarjeta>
      <Fuente titulo="Fuentes.">
        Las cifras salen de sim_v8.json · _meta, de nombres.js (umbrales, nombres de boletas, partidos y coaliciones) y de proyecciones.json (P2, P5, P6 y _meta.marcas). Los avisos «preliminar», «sin cotejar con el original» y «no es certeza» están en «Limitaciones».
      </Fuente>
    </Seccion>
  )
}
