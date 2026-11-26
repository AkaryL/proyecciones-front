/** Comparativo · 6: aprobación de Delgadillo, Lemus y Sheinbaum (P6). No es una boleta ni cambia con el escenario. */
import { T, cuantos, esNum, listaDe as lista, num, pct, type Json } from '../../motor'
import { Fuente, H3, Kicker, Rejilla, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { Lineal, Mueve } from '../../components/tablero/kit/barras'
import { Filtros, RankNombre, TablaRanking, type Celda } from '../../components/tablero/kit/tablas'
import { CabTarjeta, Tarjeta } from '../../components/tablero/kit/tarjetas'
import { RAYA, fechaTxt, llano, porFecha, prelim, proy, puntosTxt, val } from './modelo'
import { Enlace, MarcaPrelim, VacioSec } from './piezas'

/** `persona` = de quién es la tabla de mediciones (una clave de las series; si no existe, la primera). */
export function Aprobacion({ persona, onPersona }: { persona: string; onPersona: (clave: string) => void }) {
  const id = 'cmp-aprobacion'
  const A: Json = proy('P6')?.aprobacion
  const claves: string[] = A?.series ? Object.keys(A.series) : []
  const aQuien = claves.map((k) => `a ${k}`)
  const titulo = `¿Cómo evalúan ${aQuien.length > 1 ? `${aQuien.slice(0, -1).join(', ')} y ${aQuien[aQuien.length - 1]}` : aQuien[0] || 'a los gobernantes'}?`
  if (!claves.length) return <VacioSec id={id} tag="Aprobación" titulo={titulo} x="Faltan las series de aprobación (proyecciones.json · P6.aprobacion)." />
  const elegida = claves.includes(persona) ? persona : claves[0]
  const s: Json = A.series[elegida]
  const med = [...lista(s.mediciones)].sort(porFecha).reverse()
  const nRep = lista(A.repetidas).length
  const nSin = lista(A.sin_cifra_legible).length
  const filas: Celda[][] = med.map((m) => [
    { c: fechaTxt(m.fecha), tip: m.fecha_como ? `Fecha: ${m.fecha_como}.` : null },
    {
      c: (
        <>
          <RankNombre nombre={m.casa} sub={m.fecha_publicacion ? `publicada ${fechaTxt(m.fecha_publicacion)}` : undefined} />
          <MarcaPrelim q={m} />
        </>
      ),
    },
    { c: m.ambito || RAYA },
    { c: <Lineal valor={m.aprueba} max={100} dec={1} /> },
    { c: esNum(m.desaprueba) ? pct(m.desaprueba) : RAYA },
    { c: m.medicion || '' },
    { c: <Enlace url={m.url} casa={m.casa} /> },
  ])
  return (
    <Seccion id={id} tag="Aprobación" titulo={titulo} texto={puntosTxt(A.lectura || '')}>
      <RotuloFijo>{`${T.FIJO} aprobación de gobernantes · no es una boleta ni cambia con el escenario ${T.FIJO_SUFIJO}`}</RotuloFijo>
      <Rejilla min={300}>
        {claves.map((k) => {
          const serie: Json = A.series[k]
          const u: Json = serie.ultima || {}
          const casas = lista(serie.por_casa)
          return (
            <Tarjeta key={k}>
              <CabTarjeta
                icono="grupo"
                kicker={serie.persona}
                aviso={prelim(u) ? 'Sin cotejar' : null}
                titulo={`${pct(u.aprueba)} aprueba`}
                sub={[serie.cargo, u.casa, u.fecha ? fechaTxt(u.fecha) : null, u.ambito, esNum(u.desaprueba) ? `desaprueba ${pct(u.desaprueba)}` : null].filter(Boolean).join(' · ')}
              />
              <Kicker variante="chico">Cambio dentro de cada casa encuestadora</Kicker>
              {casas.length ? (
                casas.map((c, i) => (
                  <span key={i} className="pp-nota pp-nota--12">
                    {`${c.casa}: ${pct(c.primera.aprueba)} (${fechaTxt(c.primera.fecha)}) → ${pct(c.ultima.aprueba)} (${fechaTxt(c.ultima.fecha)}) · ${cuantos(val(c.n_mediciones), 'medición', 'mediciones')}`} <Mueve valor={val(c.cambio)} />
                  </span>
                ))
              ) : (
                <span className="pp-nota pp-nota--12">Ninguna casa la ha medido dos veces: no hay cambio que comparar.</span>
              )}
            </Tarjeta>
          )
        })}
      </Rejilla>
      <div className="pp-cab pp-cab--extremos">
        <H3 titulo>{`Todas las mediciones de ${s.persona} (${num(med.length)})`}</H3>
        <Filtros aria="Elegir a quién se ve en la tabla" valor={elegida} opciones={claves.map((k) => ({ v: k, t: A.series[k].persona as string }))} onChange={onPersona} />
      </div>
      <TablaRanking
        aria={`Mediciones de aprobación de ${s.persona}`}
        minAncho={980}
        columnas={[
          { t: 'Levantamiento', ancho: '104px' },
          { t: 'Casa encuestadora', ancho: 'minmax(170px,1.3fr)' },
          { t: 'Entre habitantes de', ancho: '112px' },
          { t: 'Aprueba (%)', ancho: 'minmax(150px,1fr)' },
          { t: 'Desaprueba', ancho: '84px' },
          { t: 'Qué mide', ancho: 'minmax(220px,2fr)' },
          { t: 'Fuente', ancho: '64px' },
        ]}
        filas={filas}
      />
      <Fuente titulo="Fuentes.">
        {`proyecciones.json · P6.aprobacion.series. ${llano(A.como_se_lee)} No se promedian. Fuera de las series quedan ${cuantos(nRep, 'medición repetida', 'mediciones repetidas')} y ${cuantos(nSin, 'ficha', 'fichas')} sin el porcentaje junto al nombre. La aprobación no es intención de voto: no entra en el promedio de encuestas.`}
      </Fuente>
    </Seccion>
  )
}
