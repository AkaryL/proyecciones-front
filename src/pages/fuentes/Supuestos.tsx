/** Fuentes · 4: qué se supone y qué se podría cambiar. Cuatro pestañas: del modelo, rangos inciertos, de las proyecciones, escenarios y noticias. */
import { Fragment } from 'react'
import { D, N, T, enFrase, esNum, listaDe as lista, type Json } from '../../motor'
import { EstadoChip, Fuente, Kicker, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { Barras } from '../../components/tablero/kit/barras'
import { Naturaleza } from '../../components/tablero/kit/partidos'
import { Filtros, RankNombre, SinDetalle, TablaRanking } from '../../components/tablero/kit/tablas'
import { CabTarjeta, Tarjeta, Vacio } from '../../components/tablero/kit/tarjetas'
import { tip, type Parte } from '../../components/tablero/kit/util'
import {
  PARAM,
  RAYA,
  TABS_SUP,
  dominio,
  enumera,
  esUrl,
  fechaTxt,
  limpio,
  mayus,
  metaDe,
  num,
  obj,
  parametros,
  pct,
  plural,
  primeraFrase,
  proy,
  rotBoleta,
  rotEsc,
  seccion,
  sinCodigo,
  tx,
  val,
  valorParam,
  type TabSupuestos,
} from './modelo'
import { EnlaceExterno, EtqMural, Ficha, Notas, Panel, Puntos, type Nota } from './piezas'

/** «A favor: Milenio ↗ (18-oct-2026) · registro de noticias del corte (28-oct-2026)», un renglón por sentido. */
function Evidencias({ e }: { e: Json }) {
  const porSentido = new Map<string, Json[]>()
  for (const x of lista(e.evidencia)) {
    const sentido = String(x.sentido || 'sin sentido declarado')
    porSentido.set(sentido, [...(porSentido.get(sentido) ?? []), x])
  }
  if (!porSentido.size) return <SinDetalle>sin evidencia registrada</SinDetalle>
  return (
    <>
      {[...porSentido].map(([sentido, pruebas], i) => (
        <Fragment key={sentido}>
          {i ? <br /> : null}
          <strong>{`${mayus(sentido)}:`}</strong>{' '}
          {pruebas.map((x, j) => {
            const cuando = /^\d{4}-\d{2}-\d{2}$/.test(String(x.fecha || '')) ? fechaTxt(x.fecha) : String(x.fecha || '')
            return (
              <Fragment key={j}>
                {j ? ' · ' : null}
                {esUrl(x.ref) ? <EnlaceExterno url={x.ref} texto={x.medio || dominio(x.ref)} /> : 'registro de noticias del corte'}
                {cuando ? ` (${cuando})` : ''}
                {x.sin_cotejar || x.cita_la_encuesta_preliminar ? (
                  <>
                    {' '}
                    <EtqMural />
                  </>
                ) : null}
              </Fragment>
            )
          })}
        </Fragment>
      ))}
    </>
  )
}

type Destino = Parte & { rep?: boolean }

/**
 * Si alguien deja a MC, ¿adónde iría? El motor supone el destino para la
 * coalición de Morena entera; aquí se reparte entre sus partidos con la
 * proporción que da el motor en toda la ciudad en el escenario central (reparto
 * estimado por partido). PAN, PRI y otros van tal cual.
 */
function destinos(dest: Json): { filas: Destino[]; reparto: Json } {
  const DEST: Record<string, string> = { MOR: 'MORENA_ALIADOS', PAN: 'PAN', PRI: 'PRI', OT: 'OTROS' }
  const proporcion: Json = D.proporcionesMotor(D.central(), 'ayun')
  const filas: Destino[] = []
  let reparto: Json = null
  for (const k of Object.keys(dest).filter((x) => esNum(dest[x]))) {
    if (DEST[k] === 'MORENA_ALIADOS' && proporcion) {
      reparto = D.repartoPartidos({ MC: null, MORENA_ALIADOS: dest[k] * 100, PAN_PRI: null, OTROS: null }, proporcion.pesos, {
        boleta: 'ayun',
        dec: 0,
        nota: `Reparto estimado por partido (cálculo propio): el motor supone el destino para ${enFrase('MORENA_ALIADOS')} entera (${num(dest[k] * 100, 0)} de cada 100); aquí se reparte con ${proporcion.texto}.`,
      })
      for (const x of lista(reparto?.partidos)) if (x.candidatura === 'MORENA_ALIADOS' && esNum(x.p50)) filas.push({ clave: x.clave, valor: x.p50, rep: true })
    } else if (DEST[k]) filas.push({ clave: DEST[k], valor: dest[k] * 100 })
    else filas.push({ nombre: 'No votan', color: N.DISENO.sin_dato, valor: dest[k] * 100 })
  }
  const orden: string[] = N.PARTIDOS || []
  filas.sort((a, c) => (a.clave ? orden.indexOf(a.clave) : 99) - (c.clave ? orden.indexOf(c.clave) : 99))
  return { filas, reparto }
}

export function Supuestos({ tab, onTab }: { tab: TabSupuestos; onTab: (t: TabSupuestos) => void }) {
  const s = seccion('fue-supuestos')
  const meta: Json = D.meta() || {}
  const sm = lista(meta.supuestos_modelado)
  const pri: Json = obj(meta.priors)
  const kp = Object.keys(pri)
  const par = parametros()
  const kpar = Object.keys(par)
  const P5 = proy('P5')
  const e5: Json = obj(P5?.escenarios)
  const escenarios = lista(D.escenarios())
  const ids: string[] = escenarios.map((e) => e.id)

  /* del modelo */
  const co: Json = metaDe('corridas')
  const escudo: Json = obj(co.escudo)
  const { filas: filasDest, reparto: repD } = destinos(obj(meta.destino_abandono_mc))
  const otros: Nota[] = [
    ...(P5?.supuesto ? [{ t: 'Estado y peso de cada escenario', x: limpio(P5.supuesto) }] : []),
    ...(co.rol_supuesto ? [{ t: 'Rótulo de cada zona (fuerte, competida)', x: sinCodigo(limpio(co.rol_supuesto)) }] : []),
    { t: 'Peso de cada ancla', x: 'El peso que el motor da a cada ancla del punto de partida es un juicio del analista; están una por una en «¿De dónde parte cada boleta?».' },
    { t: 'Metas de calibración', x: 'Cuánto movería cada canal a intensidad normal es una meta declarada; están en la tabla de canales del método.' },
  ]

  /* escenarios y noticias */
  const est: Json = obj(P5?.estados)
  const nEv = ids.reduce((n, id) => n + lista(obj(e5[id]).evidencia).length, 0)

  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      derecha={<Filtros aria="Qué supuestos ver" valor={tab} opciones={TABS_SUP} onChange={onTab} />}
      texto={
        <>
          {'Si alguno de estos supuestos cambiara, cambiarían las cifras. El motor declara '}
          <strong>{plural(sm.length, 'supuesto de modelado', 'supuestos de modelado')}</strong>
          {' y sortea '}
          <strong>{plural(kp.length, 'parámetro incierto', 'parámetros inciertos')}</strong>
          {' en cada corrida; las proyecciones añaden '}
          <strong>{`${plural(kpar.length, 'parámetro', 'parámetros')} de método`}</strong>
          {`, y el estado y el peso de los ${num(ids.length)} escenarios son un juicio del analista.`}
        </>
      }
    >
      <Panel grupo="su" valor="modelo" activo={tab}>
        <Rejilla min={320}>
          {sm.map((x, i) => {
            const b: string = N.bol ? N.bol(x.boleta) : x.boleta
            const B: Json = N.BOLETA[b]
            return (
              <Tarjeta key={i} variante="24">
                <CabTarjeta icono={B ? B.icono : 'info'} kicker={`Supuesto de modelado${B ? ` · ${B.pildora}` : ''}`} aviso={b === 'fed'} />
                <p className="pp-notas__x">{sinCodigo(limpio(x.supuesto))}</p>
                <Notas
                  min={180}
                  items={[
                    { t: 'Qué tan firme es', x: mayus(tx(x.confianza || T.SIN_DATO)) },
                    { t: 'Se revocaría si', x: limpio(x.se_revoca_si || T.SIN_DATO) },
                  ]}
                />
              </Tarjeta>
            )
          })}
          {esNum(escudo.mediana) ? (
            <Ficha
              fijo={`${N.BOLETA.ayun.corto} · ${rotEsc(escudo.escenario || D.central())}`}
              kicker="Escudo de Delgadillo"
              valor={pct(escudo.mediana, 0)}
              sub={esNum(escudo.desde) && esNum(escudo.hasta) ? `entre ${pct(escudo.desde, 0)} y ${pct(escudo.hasta, 0)} en ${T.CORRIDAS_80}` : ''}
            >{`${primeraFrase(limpio(escudo.que_es))} Es un supuesto del motor, no una medición.`}</Ficha>
          ) : null}
          {filasDest.length ? (
            <Tarjeta variante="plana">
              <Kicker>Si alguien deja a MC, ¿adónde iría?</Kicker>
              {repD ? (
                <div className="pp-chips">
                  <Naturaleza de={repD} />
                </div>
              ) : null}
              <Barras filas={filasDest} max={100} dec={0} />
              <p className="pp-notas__x">{`Reparto de partida que supone el motor (de cada 100 votos que deja MC); en cada sección cambia con su escolaridad. Es un supuesto, no una medición.${
                repD ? ` El motor lo da para ${enFrase('MORENA_ALIADOS')} entera: ${enumera(filasDest.filter((f) => f.rep).map((f) => N.nombre(f.clave)))} son un ${T.REPARTO_ESTIMADO}.` : ''
              }`}</p>
            </Tarjeta>
          ) : null}
        </Rejilla>
        <Tarjeta variante="24 plana">
          <Kicker>Otros supuestos que el propietario puede cambiar</Kicker>
          <Notas items={otros} min={240} />
        </Tarjeta>
      </Panel>

      <Panel grupo="su" valor="rangos" activo={tab}>
        <p className="pp-lead">{`En cada corrida el motor sortea estos ${plural(kp.length, 'parámetro', 'parámetros')} entre su valor bajo y su valor alto. Son supuestos con rango, no coeficientes medidos en Guadalajara.`}</p>
        <TablaRanking
          aria="Parámetros inciertos del motor"
          minAncho={620}
          columnas={[
            { t: 'Supuesto', ancho: 'minmax(260px,2fr)' },
            { t: 'Bajo', ancho: '80px', der: true },
            { t: 'Centro', ancho: '80px', der: true },
            { t: 'Alto', ancho: '80px', der: true },
          ]}
          filas={kp.map((k) => {
            const r = lista<number>(pri[k])
            const crudo: string = D.supuestoTxt(k)
            // sin nombre propio en la capa de datos: se usa la clave, en llano
            const nombre = crudo === String(k).replace(/_/g, ' ') ? (k === 'k_vol' ? 'Ruido por sección según su volatilidad entre las dos elecciones anteriores' : mayus(crudo)) : crudo
            return [{ c: <RankNombre nombre={tx(nombre)} /> }, { c: num(r[0], 2), der: true }, { c: num(r[1], 2), der: true }, { c: num(r[r.length - 1], 2), der: true }]
          })}
        />
      </Panel>

      <Panel grupo="su" valor="proyecciones" activo={tab}>
        <p className="pp-lead">{`Las proyecciones (brecha en votos, promedio de encuestas, listas por distrito…) usan ${plural(kpar.length, 'parámetro', 'parámetros')} de método. Cada uno dice por qué vale lo que vale.`}</p>
        <Tarjeta variante="24 plana">
          <Puntos
            items={kpar.map((k) => ({
              t: `${PARAM[k] || mayus(tx(k.replace(/_/g, ' ')))}: ${valorParam(val(par[k]))}`,
              x: limpio(String(obj(par[k]).supuesto || obj(par[k]).fuente || '').replace(/^Parámetro de método declarado en [^:]+:\s*/, '')),
            }))}
          />
        </Tarjeta>
      </Panel>

      <Panel grupo="su" valor="escenarios" activo={tab}>
        {!P5 ? (
          <Vacio chico k="Sin datos" t={T.SIN_DATO} x="Falta proyecciones.json · P5." />
        ) : (
          <>
            <p className="pp-lead">{`${limpio(P5.regla_de_pesos || '')} Los ${num(ids.length)} escenarios se apoyan en ${plural(nEv, 'evidencia', 'evidencias')} (noticias del corte y publicaciones verificadas).`}</p>
            <div className="pp-chips">
              {Object.keys(est).map((k) => (
                <span key={k} className="pp-chip pp-chip--gris" {...tip(limpio(est[k].que_significa))}>
                  <EstadoChip estado={k} />
                  {` peso ${num(est[k].peso)}`}
                </span>
              ))}
            </div>
            <TablaRanking
              aria="Estado, peso y evidencia de cada escenario"
              minAncho={980}
              columnas={[
                { t: 'Escenario', ancho: 'minmax(220px,1.3fr)' },
                { t: 'Estado', ancho: '118px', tip: 'Qué tan cerca está de ocurrir según las noticias verificadas. Juicio del analista.' },
                { t: 'Peso', ancho: '96px', tip: 'Peso del escenario en la proyección ponderada. Supuesto del analista.' },
                { t: 'Boletas que mueve', ancho: 'minmax(140px,.9fr)', tip: 'Boletas en que la mediana de algún bloque cambia frente al escenario central.' },
                { t: 'En qué se apoya', ancho: 'minmax(260px,2fr)' },
              ]}
              filas={ids.map((id) => {
                const e: Json = obj(e5[id])
                const af: unknown = escenarios.find((x) => x.id === id)?.boletas_afectadas
                const mueve = id === D.central() ? 'es el central: los demás se comparan con él' : Array.isArray(af) && af.length ? af.map(rotBoleta).join(' · ') : Array.isArray(af) ? 'ninguna' : T.SIN_DATO
                return [
                  {
                    c: (
                      <>
                        <RankNombre nombre={e.rotulo || rotEsc(id)} />
                        {e.sin_cotejar ? (
                          <>
                            {' '}
                            <EtqMural />
                          </>
                        ) : null}
                      </>
                    ),
                  },
                  { c: e.estado ? <EstadoChip estado={e.estado} /> : RAYA },
                  { c: e.entra_en_la_mezcla === false ? 'no entra' : `${num(val(e.peso))} (${pct(val(e.peso_pct), 1)})` },
                  { c: mueve },
                  { c: <Evidencias e={e} /> },
                ]
              })}
            />
          </>
        )}
      </Panel>

      <Fuente titulo="Fuentes.">
        sim_v8.json · _meta.supuestos_modelado, _meta.priors y _meta.destino_abandono_mc; sim_corridas.json · _meta.escudo y _meta.rol_supuesto; proyecciones.json · parametros y P5 (estados, peso y evidencia de cada escenario).
      </Fuente>
    </Seccion>
  )
}
