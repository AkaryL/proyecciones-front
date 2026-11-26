/** Fuentes · 2: cómo calcula el motor cada cifra. El método se muestra con las palabras del propio motor. */
import { D, N, T, esNum, listaDe as lista, type Json } from '../../motor'
import { Col, DosColumnas, Fuente, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { RankNombre, RankNumero, SinDetalle, TablaRanking } from '../../components/tablero/kit/tablas'
import { KpiMini, Tarjeta } from '../../components/tablero/kit/tarjetas'
import { DISCLAIMER, J, limpio, metaDe, metaTxt, nZonas, num, obj, partesMetodo, pct, plural, primeraFrase, seccion, tx } from './modelo'
import { Ficha, Puntos, Sub, VacioSec } from './piezas'

export function Metodo() {
  const s = seccion('fue-metodo')
  const meta: Json = D.meta() || {}
  if (!meta.metodo) return <VacioSec s={s} x="El archivo del motor no trae la descripción del método." />
  const can: Json = obj(meta.canales)
  const metas: Json = obj(meta.metas_calibracion_pp)
  const pri: Json = obj(meta.priors)
  const ks = Object.keys(can)
  const edades = lista(D.edades()).length
  const generos = esNum(meta.n_celdas) && esNum(meta.n_secciones) && edades ? meta.n_celdas / meta.n_secciones / edades : null
  const meses = lista<string>(obj(J('v8')).meses)
  const ev: Json = metaDe('evolucion')
  const ag = J('agentes')
  const agm: Json = metaDe('agentes')
  const es = J('escenarios')
  const co = J('corridas')
  const partes = partesMetodo(tx(meta.metodo))
  const sueltas = partes
    .filter((p) => !p.t)
    .map((p) => p.x)
    .join(' ')
  const nb: Json = obj(agm.no_binario)
  const zonasPor = (N.DISTRITOS as string[])
    .map((dl) => {
      const z: Json = ag ? D.distritoZonas(dl) : null
      return z ? `${N.DISTRITO_LOCAL[dl].corto}: ${num(lista(z.clusters).length)}` : ''
    })
    .filter(Boolean)
    .join(' · ')
  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      texto={
        <>
          {`El motor (versión ${meta.version || T.SIN_DATO}) partiría Guadalajara en `}
          <strong>{`${num(meta.n_celdas)} celdas`}</strong>
          {` (${num(meta.n_secciones)} secciones × ${num(edades)} grupos de edad × ${num(generos)} géneros), les aplicaría `}
          <strong>{`${plural(ks.length, 'canal', 'canales')} de choque`}</strong>
          {` mes a mes${meses.length ? ` (de ${meses[0]} a ${meses[meses.length - 1]})` : ''} y repetiría la elección `}
          <strong>{`${num(meta.n_corridas)} veces`}</strong>
          {` por escenario, cada vez con supuestos distintos dentro de su rango. Por eso cada cifra es una mediana con el rango de ${T.CORRIDAS_80}: ${DISCLAIMER}.`}
        </>
      }
    >
      <DosColumnas
        base={620}
        anchoLado={240}
        principal={
          <Tarjeta variante="24">
            {sueltas ? <span className="pp-tarjeta__s">{sueltas}</span> : null}
            <Puntos items={partes.filter((p) => p.t)} titulo="El método, con las palabras del propio motor" />
          </Tarjeta>
        }
        lado={
          <Col>
            <KpiMini rotulo="Celdas" valor={num(meta.n_celdas)} sub="una sección, un grupo de edad y un género" />
            <KpiMini rotulo="Corridas por escenario" valor={num(meta.n_corridas)} sub="para el resultado del día de la elección" />
            <KpiMini rotulo="Corridas de la trayectoria" valor={num(meta.n_corridas_trayectoria)} sub="para la línea mes a mes; por eso su final puede diferir unas décimas" />
            <KpiMini rotulo="Meses simulados" valor={num(meses.length)} sub={meses.length ? `de ${meses[0]} a ${meses[meses.length - 1]}` : ''} />
          </Col>
        }
      />
      <Sub titulo="¿Por qué vías puede moverse el voto?">{`Cada hecho (agua, protesta, ola nacional, candidaturas…) entra por un canal. El motor trae ${plural(ks.length, 'canal', 'canales')}; su fuerza se ajustó a metas declaradas, no a una serie histórica de crisis.`}</Sub>
      <TablaRanking
        aria="Canales de choque del motor"
        minAncho={820}
        columnas={[
          { t: '', ancho: '34px' },
          { t: 'Canal', ancho: 'minmax(240px,1.6fr)' },
          { t: 'Meta de calibración', ancho: 'minmax(200px,1.2fr)', tip: 'Cuánto movería el canal a intensidad normal. Es una meta declarada por el analista, no una medición.' },
          { t: 'Cuánto puede variar su fuerza', ancho: 'minmax(200px,1.1fr)', tip: 'En cada corrida la fuerza del canal se sortea entre un valor bajo y uno alto, alrededor de 1 (lo normal).' },
        ]}
        filas={ks.map((k, i) => {
          const fam = k.split('_')[0]
          const mk = Object.keys(metas).find((x) => x.startsWith(`${fam}_`))
          const r = lista<number>(pri[`lam_${fam}`])
          return [
            { c: <RankNumero n={i + 1} /> },
            { c: <RankNombre nombre={tx(D.canalTxt(k))} /> },
            { c: mk ? metaTxt(mk, metas[mk]) : <SinDetalle>el motor no la exporta</SinDetalle> },
            { c: r.length >= 3 ? `de ${num(r[0], 2)} a ${num(r[r.length - 1], 2)} veces (centro ${num(r[1], 2)})` : <SinDetalle>el motor no lo exporta</SinDetalle> },
          ]
        })}
      />
      <Sub titulo="¿Cómo se arman las zonas, los perfiles y las lecturas?" />
      <Rejilla min={250}>
        <Ficha kicker="Zonas del modelo" valor={ag ? num(nZonas(ag)) : T.SIN_DATO} sub={zonasPor}>
          Cada distrito se divide en zonas: grupos de secciones parecidas por su voto anterior y por rasgos de la sección (escolaridad, informalidad, bienestar, internet, drenaje y exposición a la crisis del agua). No son colonias ni distritos electorales.
        </Ficha>
        <Ficha kicker={T.AGENTES} valor={ag ? num(lista(ag.agentes).length) : T.SIN_DATO} sub="una zona × un grupo de edad × un género">
          {`Cada perfil lleva su lista nominal y su voto es la suma de sus celdas en el motor. No son personas ni entrevistados.${
            esNum(nb.n)
              ? ` El padrón registra ${plural(nb.n, 'persona no binaria', 'personas no binarias')}${esNum(nb.pct) ? ` (${pct(nb.pct, 3)})` : ''}: cuentan en el total, pero son muy pocas para proyectar su voto sin inventarlo, así que no forman un perfil propio.`
              : ''
          }`}
        </Ficha>
        <Ficha kicker="Grupos clave" valor={es ? num(lista(es.grupos_clave).length) : T.SIN_DATO} sub={es ? `y ${plural(lista(es.micro_grupos).length, 'grupo más fino', 'grupos más finos')}, por sección` : ''}>
          Son los perfiles de votante ordenados por interés: cuántos electores pesan, qué tan reñido está su distrito y cuánto cambia su voto de un escenario a otro.
        </Ficha>
        <Ficha kicker="Lecturas por zona" valor={co ? num(lista(co.corridas).length) : T.SIN_DATO} sub="zonas con lectura escrita">
          {co?.tipo ? limpio(co.tipo) : 'Las lecturas por zona se escriben con reglas fijas a partir de los números del modelo.'}
        </Ficha>
      </Rejilla>
      <Fuente titulo="Fuentes.">
        {`sim_v8.json · _meta.metodo (texto íntegro), _meta.canales, _meta.metas_calibracion_pp y _meta.priors; sim_agentes.json · _meta y distritos; sim_escenarios.json · grupos_clave; sim_corridas.json · tipo. ${ev.nota ? primeraFrase(tx(ev.nota)) : ''}`}
      </Fuente>
    </Seccion>
  )
}
