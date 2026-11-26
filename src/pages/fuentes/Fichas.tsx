/** Fuentes · 7: fichas de encuestas. Quién midió, cómo y cuánto cuenta en el promedio de la alcaldía. */
import { N, T, esNum, listaDe as lista, type Json } from '../../motor'
import { Fuente, Rejilla, Seccion, SinCorte } from '../../components/tablero/kit/base'
import { Confianza, TablaOscura } from '../../components/tablero/kit/noche'
import { Filtros, RankNombre, SinDetalle, TablaRanking } from '../../components/tablero/kit/tablas'
import { CabTarjeta, Tarjeta, Vacio } from '../../components/tablero/kit/tarjetas'
import { J, RAYA, TABS_FI, dominio, fechaTxt, fichaDe, intencion, limpio, nombraMural, num, obj, pct, plural, primeraFrase, seccion, sinCotejar, sinRutas, tx, type TabFichas } from './modelo'
import { EnlaceExterno, EnlacePagina, EtqMural, Fijo, Notas, Panel, Renglon, VacioSec } from './piezas'

const esMural = (q: Json): boolean => Boolean(q.sin_cotejar) || nombraMural(q.casa)
const peso = (qs: Json[]): number => qs.reduce((t, q) => t + (esNum(q.peso_pct) ? q.peso_pct : 0), 0)
/** Agrupa por una clave conservando el orden en que aparece cada grupo. */
const agrupa = (items: Json[], clave: (x: Json) => string): [string, Json[]][] => {
  const grupos = new Map<string, Json[]>()
  for (const x of items) grupos.set(clave(x), [...(grupos.get(clave(x)) ?? []), x])
  return [...grupos]
}
const masReciente = (a: Json, b: Json) => String(b.fecha).localeCompare(String(a.fecha))

export function Fichas({ tab, onTab }: { tab: TabFichas; onTab: (t: TabFichas) => void }) {
  const s = seccion('fue-encuestas')
  const I = intencion()
  const tablero: Json = J('dashboard')
  const filas = lista(tablero?.encuestas?.filas)
  if (!I && !filas.length) return <VacioSec s={s} x="Faltan proyecciones.json · P6 y sim_dashboard.json." />
  const ent = lista(I?.entran)
  const no = lista(I?.no_entran)
  const mayor: Json = obj(obj(I?.sensibilidad_dejando_una_fuera).encuesta_con_mas_peso)
  const mural = ent.find(esMural)
  const porCasa = agrupa(filas, (f) => String(f.casa || 'Casa sin nombre'))
  // casas del promedio, de la que más pesa a la que menos
  const casas = agrupa(ent, (q) => String(q.casa)).sort(([, a], [, c]) => peso(c) - peso(a))
  const porPeso = [...ent].sort((a, c) => (c.peso_pct || 0) - (a.peso_pct || 0))
  const met: Json = obj(I?.metodo)

  return (
    <Seccion
      id={s.id}
      tag={s.corto}
      n={s.n}
      titulo={s.titulo}
      derecha={<Filtros aria="Qué casas ver" valor={tab} opciones={TABS_FI} onChange={onTab} />}
      texto={
        <>
          {`El promedio de encuestas de la ${String(N.BOLETA.ayun.corto).toLowerCase()} usa `}
          <strong>{`${num(ent.length)} de ${plural(ent.length + no.length, 'medición', 'mediciones')}`}</strong>
          {` de intención de voto${mayor.casa ? `; si se quitara la que más pesa (${mayor.casa}, ${pct(mayor.peso_pct)} del peso), el promedio cambiaría` : ''}.${
            mural ? ` La encuesta MURAL (${pct(mural.peso_pct)} del peso) está ${sinCotejar()}.` : ''
          }${filas.length ? ` En total el monitoreo guarda ${plural(filas.length, 'medición', 'mediciones')} de ${plural(porCasa.length, 'casa', 'casas')} (intención de voto, aprobación y problemas).` : ''}`}
        </>
      }
    >
      <Panel grupo="fi" valor="promedio" activo={tab}>
        {!I ? (
          <Vacio chico k="Sin datos" t={T.SIN_DATO} x="Falta proyecciones.json · P6." />
        ) : (
          <>
            <Fijo>{`${N.BOLETA.ayun.corto} · encuestas publicadas`}</Fijo>
            <Rejilla min={300}>
              {casas.map(([casa, mediciones]) => {
                const qs = [...mediciones].sort(masReciente)
                const conFicha = qs.map(fichaDe).find((f) => f?.ficha_tecnica)
                const niveles = [...new Set(qs.map((q) => String(q.confianza || '')).filter(Boolean))]
                const aviso = qs.find((q) => q.aviso)
                const ult = qs[0]
                const fu = fichaDe(ult)
                const url: unknown = ult.url || fu?.url
                return (
                  <Tarjeta key={casa} variante="24">
                    <CabTarjeta icono="prensa" kicker={`${plural(qs.length, 'medición', 'mediciones')} en el promedio`} aviso={qs.some(esMural) ? sinCotejar() : null} titulo={casa} />
                    <Tarjeta variante="suave">
                      <Renglon rotulo="Peso en el promedio">{pct(peso(qs))}</Renglon>
                      <Renglon rotulo="Nivel de confianza">{niveles.join(' · ') || T.SIN_DATO}</Renglon>
                      <Renglon rotulo="Última medición">{fu?.campo ? fu.campo : ult.fecha_texto || fechaTxt(ult.fecha)}</Renglon>
                    </Tarjeta>
                    <Notas
                      min={180}
                      items={[
                        { t: 'Cómo levanta', x: conFicha ? limpio(conFicha.ficha_tecnica) : 'Sin ficha técnica verificada en el monitoreo.' },
                        { t: 'Dónde se publicó', x: url ? <EnlaceExterno url={url} texto={dominio(url)} /> : 'Sin enlace verificado en los archivos.' },
                      ]}
                    />
                    {aviso ? (
                      <p className="pp-notas__x">
                        <strong>Aviso.</strong> {primeraFrase(sinRutas(tx(aviso.aviso)).replace(/\s*\(estado «[^»]*»\)/g, ''))}
                      </p>
                    ) : null}
                  </Tarjeta>
                )
              })}
            </Rejilla>
            <TablaOscura
              aria="Mediciones que entran en el promedio de la alcaldía, con su ficha técnica"
              minAncho={980}
              columnas={[
                { t: 'Levantamiento', ancho: 'minmax(150px,1fr)' },
                { t: 'Casa', ancho: 'minmax(170px,1.1fr)' },
                { t: 'Cómo se levantó', ancho: 'minmax(240px,2fr)' },
                { t: 'Confianza', ancho: '112px', tip: 'Nivel que declara su ficha; a menos confianza, menos peso.' },
                { t: 'Antigüedad', ancho: '86px', der: true, tip: 'Días entre la medición y el corte; cada cierto número de días pierde la mitad de su peso.' },
                { t: 'Peso', ancho: '64px', der: true },
              ]}
              grupos={[
                {
                  titulo: `${N.BOLETA.ayun.chip} · mención sobre el total de entrevistas (incluye indecisos) · ordenadas por peso`,
                  filas: porPeso.map((q) => {
                    const f = fichaDe(q)
                    return {
                      tenue: q.confianza === 'baja',
                      celdas: [
                        f?.campo ? f.campo : q.fecha_texto || fechaTxt(q.fecha),
                        {
                          c: (
                            <>
                              {q.casa}
                              {esMural(q) ? (
                                <>
                                  {' '}
                                  <EtqMural />
                                </>
                              ) : null}
                            </>
                          ),
                        },
                        f?.ficha_tecnica ? limpio(f.ficha_tecnica) : 'Sin ficha técnica verificada en el monitoreo',
                        { c: <Confianza nivel={q.confianza || T.SIN_DATO} /> },
                        { c: esNum(q.dias_al_corte) ? `${num(q.dias_al_corte)} días` : RAYA, clase: 'num' as const },
                        { c: pct(q.peso_pct), clase: 'num' as const },
                      ],
                    }
                  }),
                },
              ]}
            />
            <Fuente titulo="Reglas del promedio.">
              {`${lista(met.reglas).map(limpio).join(' ')} Las ${num(no.length)} que no entran, con su motivo y sus cifras, están en `}
              <EnlacePagina pagina="comparativo" />.
            </Fuente>
          </>
        )}
      </Panel>

      <Panel grupo="fi" valor="todas" activo={tab}>
        {!filas.length ? (
          <Vacio chico k="Sin datos" t={T.SIN_DATO} x="Falta sim_dashboard.json." />
        ) : (
          <>
            <p className="pp-lead">{`${primeraFrase(limpio(tablero.encuestas.nota || ''))} Los métodos (vivienda, telefónica, panel digital) son distintos: no se comparan entre sí.`}</p>
            <TablaRanking
              aria="Casas encuestadoras del monitoreo"
              minAncho={980}
              columnas={[
                { t: 'Casa', ancho: 'minmax(210px,1.4fr)' },
                { t: 'Mediciones', ancho: '92px', der: true },
                { t: 'Qué mide', ancho: 'minmax(170px,1fr)' },
                { t: 'Cómo levanta (ficha más reciente)', ancho: 'minmax(240px,1.8fr)' },
                { t: 'Última publicación', ancho: 'minmax(150px,.9fr)' },
              ]}
              filas={[...porCasa]
                .sort(([, a], [, c]) => c.length - a.length)
                .map(([casa, mediciones]) => {
                  const fs = [...mediciones].sort(masReciente)
                  const tipos = [...new Set(fs.map((f) => String(f.tipo_txt || '')).filter(Boolean))]
                  const conFicha = fs.find((f) => f.ficha_tecnica)
                  return [
                    {
                      c: (
                        <>
                          <RankNombre nombre={casa} />
                          {nombraMural(casa) ? (
                            <>
                              {' '}
                              <EtqMural />
                            </>
                          ) : null}
                        </>
                      ),
                    },
                    { c: num(fs.length), der: true },
                    { c: tipos.join(' · ') || RAYA },
                    { c: conFicha ? limpio(conFicha.ficha_tecnica) : <SinDetalle>sin ficha técnica en la fuente</SinDetalle> },
                    {
                      c: (
                        <>
                          <SinCorte>{fs[0].fecha_txt || fechaTxt(fs[0].fecha)}</SinCorte>
                          {fs[0].url ? (
                            <>
                              {' · '}
                              <EnlaceExterno url={fs[0].url} texto="fuente" />
                            </>
                          ) : null}
                        </>
                      ),
                    },
                  ]
                })}
            />
          </>
        )}
      </Panel>

      <Fuente titulo="Fuentes.">
        proyecciones.json · P6.intencion_alcaldia (entran, no_entran, metodo y sensibilidad_dejando_una_fuera); sim_dashboard.json · encuestas.filas (ficha técnica, enlace y verificación de cada medición) y encuestas.conteo. Las encuestas que el motor usa como ancla están en «¿De dónde parte cada boleta?».
      </Fuente>
    </Seccion>
  )
}
