/** Territorio · 3: las zonas con su perfil, y lo que vale para todas a la vez. */
import { D, N, POR_COAL, T, color, cuantos, esNum, limpia, lista, mayus, num, pct, ptsAbs, puntosTxt, signo, type Json } from '../../motor'
import { Boton, Chip, Chips, Col, H3, Kicker, Nota, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { Etiqueta } from '../../components/tablero/kit/base'
import { Mueve, PildoraLider } from '../../components/tablero/kit/barras'
import { BarraPartidos, LeyendaPartidos, Naturaleza, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { Filtros, LecturaRapida, LecturasEnRejilla, RankNombre, RankNumero, SinDetalle, TablaRanking, type Celda, type Lectura } from '../../components/tablero/kit/tablas'
import { Tarjeta } from '../../components/tablero/kit/tarjetas'
import { MOR, colorBoleta, colorVoz, difZ, marcas, nVoces, parejoZ, rolFijo, umbralZ, type Modelo, type Orden3, type ZonaVista } from './modelo'
import { MarcaMural, SinDatos } from './piezas'

export type OrdenZonas = 'cerradas' | 'electores' | 'distrito'
export type PestanaCiudad = 'concentrar' | 'resumen' | 'riesgo' | 'bloques' | 'supuestos' | 'medios' | 'escenario'

/** Quién va primero en una zona (por coalición) y por cuánto; «Parejo» en gris si no hay ventaja clara. */
export function PildoraZona({ o }: { o: Orden3 }) {
  if (o.length < 2) return <PildoraLider />
  if (Math.abs(o[0].v - o[1].v) < 0.05) return <Etiqueta tipo="gris">{`${N.nombre(o[0].k)} = ${N.nombre(o[1].k)}`}</Etiqueta>
  if (parejoZ(o)) return <PildoraLider parejo t={`${T.PAREJO} · diferencia ${num(o[0].v - o[1].v, 1)} puntos`} tip={mayus(difZ(o))} />
  return <PildoraLider clave={o[0].k} valor={signo(o[0].v - o[1].v)} />
}

function ordenaZonas(zs: ZonaVista[], orden: OrdenZonas): ZonaVista[] {
  const dd: string[] = N.DISTRITOS
  const numero = (id: string) => +(String(id).split('-C')[1] || 0)
  const porDistrito = (a: ZonaVista, b: ZonaVista) => dd.indexOf(String(a.z.dl)) - dd.indexOf(String(b.z.dl)) || numero(a.z.id) - numero(b.z.id)
  const copia = [...zs]
  if (orden === 'electores') copia.sort((a, b) => b.z.lista_nominal - a.z.lista_nominal || porDistrito(a, b))
  else if (orden === 'cerradas') copia.sort((a, b) => (a.vent ?? Infinity) - (b.vent ?? Infinity) || porDistrito(a, b))
  else copia.sort(porDistrito)
  return copia
}

/** Cómo son las zonas según su rótulo (escolaridad, salud y agua): datos fijos, no siguen la boleta ni el escenario. */
function PerfilPorRol({ m, zs, rf }: { m: Modelo; zs: ZonaVista[]; rf: string }) {
  const g: Record<string, { rol: string; n: number; esc: number[]; inf: number[]; agua: number[] }> = {}
  const orden: string[] = []
  for (const x of zs) {
    if (!x.C || !x.z.perfil) continue
    const k: string = x.C.rol_clave
    if (!g[k]) {
      g[k] = { rol: D.llano(x.C.rol), n: 0, esc: [], inf: [], agua: [] }
      orden.push(k)
    }
    g[k].n++
    if (esNum(x.z.perfil.escolar)) g[k].esc.push(x.z.perfil.escolar)
    if (esNum(x.z.perfil.informal)) g[k].inf.push(x.z.perfil.informal)
    if (esNum(x.C.agua)) g[k].agua.push(x.C.agua)
  }
  if (!orden.length) return null
  // «de X a Y», o solo «X» si es una zona o todas valen lo mismo
  const de = (a: number[], dec: number) => {
    if (!a.length) return T.SIN_DATO as string
    const lo = Math.min(...a)
    const hi = Math.max(...a)
    return lo === hi ? num(lo, dec) : `de ${num(lo, dec)} a ${num(hi, dec)}`
  }
  const items: Lectura[] = orden.map((k) => ({
    color: k === 'mc' ? color('MC') : k === 'competida' ? N.DISENO.ambar : color(MOR),
    t: `${cuantos(g[k].n, 'zona', 'zonas')} con rótulo «${g[k].rol}»`,
    x: `Escolaridad: ${de(g[k].esc, 1)} años. Sin afiliación a servicios de salud: ${de(g[k].inf, 1)} % de sus habitantes. Exposición al agua: ${de(g[k].agua, 0)}.`,
  }))
  const sil = (N.DISTRITOS as string[])
    .filter((dl) => !m.d || dl === m.d)
    .map((dl) => {
      const dz = D.distritoZonas(dl)
      return dz && esNum(dz.silueta) ? `${N.distrito(dl, true)} ${num(dz.silueta, 2)}` : null
    })
    .filter(Boolean)
  return (
    <Tarjeta variante="plana">
      <RotuloFijo>{`${T.FIJO} rótulo de zona de ${rf} · perfil del censo · ${m.amb} (no sigue a la boleta ni al escenario)`}</RotuloFijo>
      <H3>¿En qué se parecen las zonas de cada rótulo?</H3>
      <LecturasEnRejilla items={items} />
      {sil.length ? <Nota doce>{`Las zonas son agrupaciones aproximadas. Su índice de separación (de menos a más distintas entre sí, con tope en uno) es: ${sil.join(' · ')}.`}</Nota> : null}
    </Tarjeta>
  )
}

type ZonasProps = { m: Modelo; orden: OrdenZonas; abierta: string; onOrden: (o: OrdenZonas) => void; onZona: (id: string) => void }

export function Zonas({ m, orden, abierta, onOrden, onZona }: ZonasProps) {
  const zs = m.zonas
  const rf = rolFijo()
  const mt = D.dato('corridas')?._meta || {}
  const titulo = m.d ? `¿Cómo votan las ${num(zs.length)} zonas de ${m.amb}?` : `¿Cómo vota cada una de las ${num(zs.length)} zonas?`
  if (!zs.length) {
    return (
      <Seccion n={2} id="t-zonas-sec" titulo={titulo}>
        <SinDatos m={m} k="Zonas" t="Sin zonas para este recorte" x="Falta sim_agentes.json." />
      </Seccion>
    )
  }
  const conVoto = zs.filter((z) => z.o.length > 1)
  const n: Record<string, number> = {}
  let nPar = 0
  let cer = conVoto[0]
  for (const z of conVoto) {
    // las parejas, aparte
    if (z.par) nPar++
    else n[z.o[0].k] = (n[z.o[0].k] || 0) + 1
    if ((z.vent as number) < (cer.vent as number)) cer = z
  }
  const uz = umbralZ()
  const nomZ = (D.BLOQUES as string[]).filter((k) => n[k]).map((k) => `${N.nombre(k)} en ${num(n[k])}`)
  const texto = `Una zona es un grupo de secciones vecinas de un mismo distrito local que votan y viven parecido. El modelo arma ${num(m.nZonas)}: ${(N.DISTRITOS as string[]).map((dl) => `${lista(D.zonas({ dl })).length} en ${N.distrito(dl, true)}`).join(', ')}. ${
    conVoto.length
      ? `En ${m.rotTxt}, ${POR_COAL}, ${nomZ.length ? `iría primero ${nomZ.join(', ')}` : 'nadie quedaría claramente primero'}${
          nPar ? `${nomZ.length ? ' y ' : ': '}${num(nPar)} ${nPar === 1 ? 'queda pareja' : 'quedan parejas'}${uz != null ? ` (menos de ${num(uz)} puntos entre los dos primeros)` : ''}` : ''
        }; la más cerrada sería ${cer.z.id} (${cer.par ? difZ(cer.o) : `${N.nombre(cer.o[0].k)} por ${ptsAbs(cer.vent)}`}).`
      : ''
  }`

  const filas: Celda[][] = ordenaZonas(zs, orden).map((x, i) => {
    const z = x.z
    return [
      { c: <RankNumero n={i + 1} /> },
      { c: <RankNombre nombre={z.id} sub={`${cuantos(z.n_secciones, 'sección', 'secciones')} · ${num(z.lista_nominal)} electores`} /> },
      { c: <Chip chip={{ t: abierta === z.id ? 'Abierta' : 'Abrir', icono: 'ojo', onClick: () => onZona(z.id) }} /> },
      { c: x.P ? <BarraPartidos P={x.P} alto={20} totales={false} min={12} /> : <SinDetalle>{T.SIN_DATO}</SinDetalle>, tip: x.P ? x.P.nota : null },
      { c: <PildoraZona o={x.o} />, tip: x.o.length > 1 ? `${N.nombre(x.o[0].k)} ${pct(x.o[0].v)} · ${N.nombre(x.o[1].k)} ${pct(x.o[1].v)}` : null },
      { c: <Mueve valor={x.v && !m.esRef ? x.v.d_mc : null} prefijo={m.eid} /> },
      { c: <RankNombre nombre={z.perfil && esNum(z.perfil.escolar) ? `${num(z.perfil.escolar, 1)} años` : T.SIN_DATO} sub={x.C && esNum(x.C.agua) ? `agua ${num(x.C.agua)}` : ''} /> },
      { c: x.C ? <Etiqueta tipo={x.C.rol_clave === 'competida' ? 'ambar' : x.C.rol_clave === 'mc' ? '' : 'gris'}>{(D.llano(x.C.rol) as string).replace(/^zona\s+/, '')}</Etiqueta> : <SinDetalle>{T.SIN_DATO}</SinDetalle> },
    ]
  })
  const Pz = zs.map((x) => x.P).filter(Boolean)[0]
  const ultimo: string = N.DISTRITOS[N.DISTRITOS.length - 1]
  return (
    <Seccion
      n={2}
      id="t-zonas-sec"
      titulo={titulo}
      texto={texto}
      derecha={
        <Filtros
          aria="Ordenar las zonas"
          valor={orden}
          onChange={onOrden}
          opciones={[
            { v: 'cerradas', t: 'Más cerradas' },
            { v: 'electores', t: 'Más electores' },
            { v: 'distrito', t: 'Por distrito' },
          ]}
        />
      }
    >
      <LeyendaPartidos boleta={m.b} nota={`Barra = % de voto de la zona por partido (mediana de cada coalición repartida entre sus partidos) · ${m.rot}`} />
      <div className="pp-chips">{Pz ? <Naturaleza de={Pz} /> : null}</div>
      <RotuloCandidatura boleta={m.b} chico />
      <TablaRanking
        aria={`Zonas de ${m.amb} · ${m.rot}`}
        minAncho={1160}
        columnas={[
          { t: '', ancho: '34px' },
          { t: 'Zona', ancho: 'minmax(186px,1.2fr)' },
          { t: 'Ver', ancho: '84px' },
          {
            t: 'Voto por partido · mediana',
            ancho: 'minmax(210px,1.6fr)',
            tip: `Voto de la zona en ${m.rot}, por partido. Por zona el motor publica solo la mediana de cada coalición, sin rango: sus partidos son un ${T.REPARTO_ESTIMADO} con la proporción de cada uno dentro de su coalición que da el motor en el distrito de la zona.`,
          },
          {
            t: 'Va primero',
            // cabe la píldora más larga: «Parejo · diferencia 0.2 puntos»
            ancho: '178px',
            tip: `Quién tiene más votos en la zona (MC o una coalición) y los puntos que le saca al segundo (quién va adelante se calcula ${POR_COAL}). «${T.PAREJO}» ${
              uz != null ? `si las dos primeras quedan a menos de ${num(uz)} puntos` : 'en todas, porque falta el umbral'
            }: entonces no se nombra a nadie. Una zona no elige a nadie.`,
          },
          { t: 'Mueve MC', ancho: '88px', tip: `Cambio de MC en la zona frente a ${m.ref.id}, en puntos.` },
          {
            t: 'Escolaridad · agua',
            ancho: '112px',
            tip: `Años de escuela promedio de la zona (censo por sección) y exposición a la crisis del agua, de menos a más. ${mt.agua_criterio ? `${limpia(String(mt.agua_criterio).split('. ')[0])}.` : ''}`,
          },
          // cabe el rótulo más largo en un renglón: «fuerte de la coalición de Morena»
          { t: `Rol · ${rf}`, ancho: '218px', tip: `Rótulo fijo de la zona (${rf}; no sigue los selectores). ${mt.rol_criterio ? limpia(mt.rol_criterio) : ''}` },
        ]}
        filas={filas}
      />
      <Col gap={4}>
        <Nota doce>{`Mueve MC = cambio de MC en ${m.eid} frente a ${m.ref.id}, en puntos · Rol = rótulo fijo de la zona en ${rf} · Los encabezados con línea punteada explican la columna al tocarlos o pasar el cursor.`}</Nota>
        {zs.some((x) => D.esFranja(x.z.dl)) ? <Nota doce>{D.textoFranja(m.b, ultimo).nota}</Nota> : null}
        {zs.some((x) => x.o.length && x.o[0].k === 'PAN_PRI') && marcas().pan_pri_sin_alianza ? <Nota doce>{limpia(marcas().pan_pri_sin_alianza.texto)}</Nota> : null}
        {abierta ? null : <Nota doce>{`Toca «Abrir» en una zona para ver su perfil, su voto en cada escenario, su lectura por zona y su lectura en ${nVoces()} voces.`}</Nota>}
      </Col>
      <PerfilPorRol m={m} zs={zs} rf={rf} />
    </Seccion>
  )
}

/* ------------------------------------------------------------------ */
/* Lo que vale para todas las zonas (síntesis de la ciudad)            */
/* ------------------------------------------------------------------ */

type CiudadProps = { m: Modelo; pestana: PestanaCiudad; onPestana: (p: PestanaCiudad) => void; onDiputaciones: () => void }

export function Ciudad({ m, pestana, onPestana, onDiputaciones }: CiudadProps) {
  const Kd: Json = D.dato('concilio')
  const G = Kd?.sintesis_global
  const Cm = D.dato('corridas')?._meta || {}
  const titulo = '¿Qué vale para todas las zonas a la vez?'
  if (!G) {
    return (
      <Seccion tag="Toda la ciudad" id="t-ciudad-sec" titulo={titulo}>
        <SinDatos m={m} k="Lectura de la ciudad" t="Sin lectura de la ciudad" x="Falta sim_concilio.json." />
      </Seccion>
    )
  }
  const texto = `Estas lecturas son las mismas en las ${num(m.nZonas)} zonas; por eso van una sola vez. ${Kd.tipo || ''}. Confianza de la lectura: ${G.confianza || T.SIN_DATO}.`
  const tinta: string = N.DISENO.teal
  let items: Lectura[] = []
  let rotulo = <RotuloFijo>{G.fijo || N.fijo(Cm.boleta || 'ayun', Cm.escenario_central || m.cen.id)}</RotuloFijo>
  let extra = null
  if (pestana === 'concentrar') {
    items.push({ color: tinta, t: 'Dónde concentrar', x: G.donde_concentrar })
    const rc = Cm.rol_conteo
    if (rc) {
      items.push({
        color: N.DISENO.marino,
        t: 'Las zonas por rol',
        x: `${Object.keys(rc)
          .map((k) => `${cuantos(rc[k].zonas, 'zona', 'zonas')} con rótulo «${D.llano(k)}» (${num(rc[k].lista_nominal)} electores)`)
          .join(' · ')}.`,
      })
    }
    if (Cm.rol_criterio) items.push({ color: N.DISENO.petroleo, t: 'Cómo se rotula cada zona', x: limpia(Cm.rol_criterio) })
  } else if (pestana === 'resumen') {
    items.push({ color: tinta, t: `${G.veredicto} · ${G.rotulo}`, x: G.resumen })
    const st = Kd.stats
    if (st) {
      extra = (
        <Chips
          items={[
            cuantos(st.agentes, 'perfil de votante', 'perfiles de votante'),
            cuantos(st.clusters, 'zona', 'zonas'),
            cuantos(st.escenarios, 'escenario', 'escenarios'),
            cuantos(st.reservas_generales, 'reserva general', 'reservas generales'),
          ]}
        />
      )
    }
  } else if (pestana === 'riesgo') {
    const filas: [string, unknown, string][] = [
      ['Riesgo principal', G.riesgo_principal, N.DISENO.ambar],
      ['La palanca que más ayuda', G.palanca, tinta],
      ['Escenario más favorable', G.escenario_favorable, N.DISENO.verde],
      ['Escenario de mayor riesgo', G.escenario_riesgo, N.DISENO.ambar],
      ['Cuándo mejora MC', G.nota_gestion, N.DISENO.marino],
    ]
    for (const [t, x, c] of filas) if (x) items.push({ color: c, t, x: x as string })
  } else if (pestana === 'bloques') {
    items.push({ color: color('PAN'), t: `${N.nombre('PAN_PRI')} por zona (el PAN y el PRI juntos, como en 2024)`, x: G.pan_pri_por_zona })
  } else if (pestana === 'supuestos') {
    lista<string>(G.supuestos).forEach((t, i) => items.push({ color: tinta, t: `Supuesto ${i + 1}`, x: t }))
    lista<string>(G.reservas_lista).forEach((t, i) => items.push({ color: N.DISENO.ambar, t: `Reserva ${i + 1}`, x: t }))
    if (G.ajuste) items.push({ color: N.DISENO.marino, t: 'Qué convendría medir', x: G.ajuste })
  } else if (pestana === 'medios') {
    for (const x of lista(G.medios_por_edad)) items.push({ color: tinta, t: `${x.edad} años`, x: x.medios })
    extra = <Nota doce>{G.medios_por_edad_nota || ''}</Nota>
  } else {
    const e = lista(Kd.escenarios).find((x) => x.id === m.eid)
    const roles = lista(Kd.roles)
    const nomRol: Record<string, string> = Object.fromEntries(roles.map((r) => [r.id, r.nombre]))
    rotulo = <Kicker>{`Sigue al escenario elegido · ${m.eRot} · las ${N.BOLETAS.length} boletas · ${T.TODA_GDL}`}</Kicker>
    if (e) {
      items.push({ color: N.DISENO.verde, t: 'Qué supone', x: e.definicion })
      for (const h of lista(e.hilo)) {
        // la definición ya va arriba; el detalle por distrito está en Diputaciones
        if (h.rol === 'simulador' && h.boleta !== 'ayun') continue
        items.push({ color: h.boleta ? colorBoleta(h.boleta) : colorVoz(roles, h.rol), t: `${nomRol[h.rol] || h.rol}${h.rotulo ? ` · ${h.rotulo}` : ''}`, x: h.texto })
      }
      items.splice(2, 0, { color: colorBoleta('dip'), t: `${N.BOLETA.dip.corto} · ${e.id}`, x: e.gana_dip }, { color: colorBoleta('fed'), t: `${N.BOLETA.fed.primera} · ${e.id}`, x: e.gana_fed })
      extra = <Boton onClick={onDiputaciones}>Ver cada distrito en Diputaciones →</Boton>
    }
  }
  items = items.filter((x) => x.x).map((x) => ({ ...x, x: puntosTxt(x.x), t: puntosTxt(x.t) }))
  return (
    <Seccion tag="Toda la ciudad" id="t-ciudad-sec" titulo={titulo} texto={texto}>
      <Filtros
        aria="Lecturas de toda la ciudad"
        valor={pestana}
        onChange={onPestana}
        opciones={[
          { v: 'concentrar', t: 'Dónde concentrar' },
          { v: 'resumen', t: 'Resumen' },
          { v: 'riesgo', t: 'Riesgo y palanca' },
          { v: 'bloques', t: `${N.nombre('PAN_PRI')} por zona` },
          { v: 'supuestos', t: 'Supuestos y reservas' },
          { v: 'medios', t: 'Medios por edad' },
          { v: 'escenario', t: 'Escenario elegido' },
        ]}
      />
      <Tarjeta variante="plana">
        {rotulo}
        {items.length ? items.length > 2 ? <LecturasEnRejilla items={items} /> : <LecturaRapida items={items} /> : <SinDatos m={m} t={T.SIN_DATO} />}
        {extra}
        <MarcaMural textos={items.map((x) => x.x)} />
      </Tarjeta>
    </Seccion>
  )
}
