/** Fuentes · 5: qué no puede decir este tablero. Las limitaciones que declara el motor, los avisos que se repiten y lo que falta por entregar. */
import { D, N, T, enFrase, esNum, listaDe as lista, type Json } from '../../motor'
import { Etiqueta, Fuente, Kicker, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { Tarjeta, TarjetaAviso } from '../../components/tablero/kit/tarjetas'
import { archivos, enumera, etiquetaMarca, fechaTxt, limpio, marcas, mayus, metaDe, nombraMural, obj, pct, plural, primeraFrase, proy, rotBoleta, rotLimite, seccion, sinCodigo } from './modelo'
import { EtqMural, Notas, Puntos, VacioSec, type Nota } from './piezas'

const esFederal = (t: string) => /federal/i.test(t)
const esPanPri = (t: string) => /PAN\s*(?:y|\+|\/)\s*PRI|PAN_PRI/i.test(t)

/** Lo que el motor todavía no entrega, agrupado por proyección y por lo que falta (una nota para todas las boletas que lo esperan). */
function pendientes(pm: Json): Nota[] {
  const grupos = new Map<string, { p: string; boletas: string[]; falta: string }>()
  for (const p of lista(pm.pendientes_de_exportacion)) {
    const m = /^(P\d+)\.boletas\.(\w+)\./.exec(String(p.donde || ''))
    const falta = String(p.falta || '')
    const clave = `${m ? m[1] : ''}|${falta}`
    const g = grupos.get(clave) ?? { p: m ? m[1] : '', boletas: [], falta: /^sim_v8\.json · [^(]+\((.+)\)$/.exec(falta)?.[1] ?? falta }
    if (m && N.BOLETA[m[2]] && !g.boletas.includes(m[2])) g.boletas.push(m[2])
    grupos.set(clave, g)
  }
  return [...grupos.values()].map((x) => ({ t: `${proy(x.p)?.titulo || 'Proyección'}${x.boletas.length ? ` · ${x.boletas.map(rotBoleta).join(', ')}` : ''}`, x: limpio(x.falta) }))
}

export function Limites() {
  const s = seccion('fue-limites')
  const meta: Json = D.meta() || {}
  const lim = lista(meta.limitaciones).map((t) => String(t))
  if (!lim.length) return <VacioSec s={s} x="El archivo del motor no trae limitaciones declaradas." />
  const M = marcas()
  const pm: Json = metaDe('proyecciones')
  const fed = lim.filter(esFederal)
  const pan = lim.filter((t) => !esFederal(t) && esPanPri(t))
  const resto = lim.filter((t) => !esFederal(t) && !esPanPri(t))
  const ancF = lista(obj(obj(meta.linea_base).fed).anclas)
  const mur = ancF.find((a) => nombraMural(a.ancla))
  const preliminar = String(T.PRELIMINAR).toLowerCase()
  const federal = String(N.BOLETA.fed.largo).toLowerCase()

  const notasFed: Nota[] = [
    ...(M.preliminar?.texto ? [{ t: `Por qué es ${preliminar}`, x: primeraFrase(limpio(M.preliminar.texto)) }] : []),
    ...fed.map((t) => ({ t: 'Rango probablemente más angosto que el real', x: limpio(t) })),
    ...(ancF.length
      ? [
          {
            t: 'Pocas anclas',
            x: (
              <>
                {`Su punto de partida se apoya en ${plural(ancF.length, 'ancla', 'anclas')}`}
                {mur ? (
                  <>
                    {`; la encuesta MURAL pesa ${pct(mur.peso * 100, 0)} y está `}
                    <EtqMural />
                  </>
                ) : null}
                .
              </>
            ),
          },
        ]
      : []),
    { t: 'Distrito federal y distrito local', x: T.NOTA_DF13 },
  ]
  const notasPan: Nota[] = [
    ...pan.map((t) => ({ t: 'Sin incertidumbre propia', x: limpio(t) })),
    ...(M.pan_pri_sin_alianza?.texto ? [{ t: mayus(etiquetaMarca('pan_pri_sin_alianza', 'sin alianza acordada')), x: limpio(M.pan_pri_sin_alianza.texto) }] : []),
    ...(M.probabilidad_extrema?.texto ? [{ t: mayus(etiquetaMarca('probabilidad_extrema', 'no es certeza')), x: limpio(M.probabilidad_extrema.texto) }] : []),
  ]

  // encuestas levantadas después de la marcha que el tablero ya guarda y el motor todavía no usa como ancla
  const tras: Json = obj(metaDe('corridas').encuestas_tras_marcha)
  const casasTras = [...new Set(lista(tras.lista).flatMap((q) => (q?.casa ? [q.casa as string] : [])))]
  const notasPend = pendientes(pm)
  const ant = archivos().filter((x) => x.estado === 'anterior')
  const baja = lista(obj(metaDe('agentes').universo).baja_cobertura_asignadas)
  const ev: Json = metaDe('evolucion')
  const cautelas: Nota[] = [
    { t: N.DISTRITO_LOCAL['13'] ? N.DISTRITO_LOCAL['13'].corto : 'Distrito 13', x: T.NOTA_D13 },
    ...(ev.nota ? [{ t: 'Tres bases que no se comparan directo', x: primeraFrase(limpio(ev.nota)) }] : []),
    ...(ant.length ? [{ t: 'Archivos anteriores al corte', x: `${mayus(enumera(ant.map((x) => `«${x.a.parte}» (al ${fechaTxt(x.fecha)})`)))}: las cifras del modelo que citen serían de una versión anterior del motor.` }] : []),
    ...(baja.length
      ? [{ t: 'Secciones con poca información electoral', x: `${plural(baja.length, 'sección se asignó', 'secciones se asignaron')} a la zona más parecida por sus rasgos no electorales, para que su lista nominal cuente.` }]
      : []),
  ]

  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      texto={
        <>
          {'El motor declara '}
          <strong>{plural(lim.length, 'limitación', 'limitaciones')}</strong>
          {`. Dos pesarían más al leer el tablero: la ${federal} es ${preliminar} (su rango real podría ser más ancho que el mostrado) y ${enFrase('PAN_PRI')} no tiene incertidumbre propia (una probabilidad extrema no sería certeza).`}
        </>
      }
    >
      <TarjetaAviso titulo={`Límites de la ${federal}`} aviso notas={notasFed} />
      <TarjetaAviso titulo={`Límites de ${enFrase('PAN_PRI')}`} aviso={etiquetaMarca('probabilidad_extrema', 'no es certeza')} notas={notasPan} />
      <Tarjeta variante="24 plana">
        <Puntos
          titulo="Las demás limitaciones que declara el motor"
          items={resto.map((t) => ({
            t: rotLimite(t),
            color: N.DISENO.ambar,
            x:
              /posterior a la marcha/i.test(t) && esNum(tras.con_cifras) && tras.con_cifras > 1 ? (
                <>
                  {sinCodigo(limpio(t))} <strong>Al corte vigente</strong>
                  {` el tablero ya guarda ${plural(tras.con_cifras, 'encuesta', 'encuestas')} de alcaldía levantadas después de la marcha${casasTras.length ? ` (${enumera(casasTras)})` : ''}; el motor sigue sin usarlas como ancla, así que su punto de partida no las incluye.`}
                  {casasTras.some(nombraMural) ? (
                    <>
                      {' '}
                      <EtqMural />
                    </>
                  ) : null}
                </>
              ) : (
                sinCodigo(limpio(t))
              ),
          }))}
        />
      </Tarjeta>
      <Rejilla min={380}>
        <Tarjeta variante="24 plana">
          <Kicker>Los avisos que se repiten en el tablero</Kicker>
          <Notas min={200} items={Object.keys(M).map((k) => ({ t: <Etiqueta tipo="ambar">{M[k].etiqueta || k}</Etiqueta>, x: limpio(primeraFrase(M[k].texto || '')) }))} />
        </Tarjeta>
        <Tarjeta variante="24 plana">
          <Kicker>Lo que el motor todavía no entrega</Kicker>
          {notasPend.length ? <Notas items={notasPend} min={200} /> : <p className="pp-notas__x">Nada pendiente.</p>}
          <Kicker>Otras cautelas de los datos</Kicker>
          <Notas items={cautelas} min={200} />
        </Tarjeta>
      </Rejilla>
      <Fuente titulo="Fuentes.">
        sim_v8.json · _meta.limitaciones y _meta.linea_base.fed; proyecciones.json · _meta.marcas y _meta.pendientes_de_exportacion; sim_corridas.json · _meta.encuestas_tras_marcha; sim_evolucion.json · _meta.nota; sim_agentes.json · _meta.universo.
      </Fuente>
    </Seccion>
  )
}
