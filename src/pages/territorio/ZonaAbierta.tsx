/**
 * Territorio · 3b: una zona abierta. Su perfil, su voto por partido (y las
 * otras boletas), la zona en cada escenario, cómo votó en la elección anterior,
 * sus secciones, la lectura por zona y la lectura en voces.
 */
import type { ReactNode } from 'react'
import { D, N, POR_COAL, T, cuantos, enFrase, esNum, limpia, lista, mayus, num, pct, pts, ptsAbs, puntosTxt, type Boleta, type Json } from '../../motor'
import { Chip, Chips, Col, DosColumnas, Etiqueta, H3, Kicker, Nota, Rejilla, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { BarraApilada, Barras, Escalera } from '../../components/tablero/kit/barras'
import { BarraPartidos, Naturaleza, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { LecturasEnRejilla, type Lectura } from '../../components/tablero/kit/tablas'
import { CabTarjeta, KpiMini, Leyenda, Tarjeta } from '../../components/tablero/kit/tarjetas'
import { partesPartidos } from '../../components/tablero/kit/util'
import {
  CLASES,
  MOR,
  anioBase,
  claseDe,
  colorBoleta,
  colorClase,
  colorVoz,
  difZ,
  esPartido,
  esPrelim,
  nVoces,
  nomClase,
  orden3,
  ordenCanon,
  parejoZ,
  partesClase,
  rasgoTxt,
  rolFijo,
  type Clase,
  type Modelo,
} from './modelo'
import { EtqBoleta, FilaPartidos, MarcaMural, SinDatos } from './piezas'

/** Rasgos del perfil de zona en lenguaje llano (sim_agentes.json · distritos[].clusters[].perfil). */
const RASGO: Record<string, { t: string; u: string; edad?: boolean }> = {
  escolar: { t: 'Escolaridad', u: 'años de escuela (promedio)' },
  informal: { t: 'Sin afiliación a salud', u: '% de habitantes · pista de empleo informal' },
  bienestar: { t: 'Índice de bienestar', u: 'del censo · más alto, mejores condiciones' },
  jov: { t: 'Jóvenes', u: '% de la zona', edad: true },
  may: { t: 'Mayores', u: '% de la zona', edad: true },
  fem: { t: 'Mujeres', u: '% de la zona' },
}

/** Rasgos con el mismo valor en todas las zonas: no distinguen a ninguna. */
function rasgosIguales(): { k: string; v: number }[] {
  const zs = lista(D.zonas())
  const out: { k: string; v: number }[] = []
  if (zs.length < 2) return out
  for (const grupo of ['perfil', 'crisis']) {
    for (const k of Object.keys(zs[0][grupo] || {})) {
      if (esPartido(k)) continue
      const v0 = zs[0][grupo][k]
      if (zs.every((z) => z[grupo] && z[grupo][k] === v0)) out.push({ k, v: v0 })
    }
  }
  return out
}

type Props = { m: Modelo; id: string; onCerrar: () => void; onEscenario: (id: string) => void }

export function ZonaAbierta({ m, id, onCerrar, onEscenario }: Props) {
  const z: Json = D.zona(id)
  if (!z) return null
  const L = D.zonaLectura(z.id)
  const C: Json = L.corrida
  const K: Json = L.deliberacion
  const v = D.zonaVoto(m.eid, m.b, z.id)
  const o = orden3(v)
  const mor = enFrase(MOR)
  const Cm = D.dato('corridas')?._meta || {}
  const Kd: Json = D.dato('concilio') || {}
  const Km = Kd._meta || {}
  const rf = rolFijo()
  const rotZ = `${N.rotulo(m.b, m.eid, z.dl)} · zona ${z.id}`
  const rotZtxt = `${m.bol.corto}${m.prelim ? ' (preliminar)' : ''} · ${m.eid} · zona ${z.id}`
  const Pz = v ? D.partidosZona(m.eid, m.b, z.id) : null
  const moZ = Pz?.por?.MORENA ? Pz.por.MORENA.p50 : null
  // primero los partidos; después quién iría primero, contado por coalición
  const texto =
    o.length > 1
      ? `En ${rotZtxt}, ${esNum(moZ) ? `por partido, MC tendría ${pct(Pz.por.MC.p50)} y ${N.nombre('MORENA')} ${pct(moZ)} (${T.REPARTO_ESTIMADO}); ` : ''}${POR_COAL}, ${
          parejoZ(o) ? `quedaría ${String(T.PAREJO).toLowerCase()}: ${difZ(o)}` : `iría primero ${enFrase(o[0].k)} con ${pct(o[0].v)}, ${ptsAbs(o[0].v - o[1].v)} por delante de ${enFrase(o[1].k)}`
        }${m.esRef ? '.' : `; frente a ${m.ref.id}, MC cambiaría ${pts(v.d_mc)}.`} Una zona no elige a nadie: sirve para saber dónde se mueve el voto.`
      : `Sin voto por zona para ${rotZtxt}.`

  /* voto de la zona: la boleta elegida y, rotuladas, las otras dos en el mismo escenario */
  const voto = (
    <>
      <CabTarjeta
        icono={m.bol.icono}
        kicker={rotZ}
        aviso={m.prelim}
        titulo={!o.length ? T.SIN_DATO : parejoZ(o) ? `${T.PAREJO} · ${mayus(difZ(o))}` : N.mas_votos(o[0].k)}
        sub="Mediana de las corridas, por partido. Por zona el motor no publica rango."
      />
      {Pz ? (
        <>
          <div className="pp-chips">
            <Naturaleza de={Pz} />
          </div>
          <BarraPartidos P={Pz} alto={22} />
          <Barras chica filas={partesPartidos(Pz).map(([clave, valor]) => ({ clave, valor }))} />
        </>
      ) : null}
      <RotuloCandidatura boleta={m.b} chico />
      {v && !m.esRef ? <Nota doce>{`Cambio de MC frente a ${m.ref.id}: ${pts(v.d_mc)}${D.mueve(m.eid, m.b) === false ? ` · ${m.eRot} no mueve esta boleta: son las cifras del escenario central.` : ''}`}</Nota> : null}
      <Kicker>{`Las otras boletas en ${m.eid} · misma zona`}</Kicker>
      {(N.BOLETAS as Boleta[])
        .filter((b) => b !== m.b)
        .map((b) => {
          const pre = esPrelim(b)
          return D.zonaVoto(m.eid, b, z.id) ? (
            <FilaPartidos key={b} rotulo={N.BOLETA[b].pildora} etiqueta={`${m.eid}${pre ? ` · ${T.PRELIMINAR}` : ''}`} etiquetaTipo={pre ? 'ambar' : 'gris'} P={D.partidosZona(m.eid, b, z.id)} alto={16} />
          ) : null
        })}
    </>
  )

  /* perfil: rasgos con unidad y sin claves internas */
  const iguales = rasgosIguales()
  const pf: Record<string, number> = z.perfil || {}
  const rasgos: ReactNode[] = Object.keys(RASGO)
    .filter((k) => esNum(pf[k]) && !iguales.some((x) => x.k === k))
    .map((k) => {
      // el tramo de edad lo dice el propio archivo
      const edad = RASGO[k].edad ? rasgoTxt(k).replace(/^%\s*/, '') : ''
      return <KpiMini key={k} rotulo={`${RASGO[k].t}${edad ? ` (${edad} años)` : ''}`} valor={num(pf[k], 1)} sub={RASGO[k].u} />
    })
  if (C && esNum(C.agua)) rasgos.push(<KpiMini key="agua" rotulo="Exposición al agua" valor={num(C.agua)} sub="de menos a más · estimación propia" />)

  /* la zona en cada escenario (boleta elegida): al tocar un renglón se elige ese escenario */
  const escalones = m.E.map((e) => {
    const w = D.zonaVoto(e.id, m.b, z.id)
    return w && esNum(w.MC) && esNum(w[MOR]) ? { id: String(e.id), nombre: (e.corto || e.nombre) as string, margen: w.MC - w[MOR] } : null
  }).filter(Boolean)

  /* voto oficial de la elección anterior y electores por edad */
  const v24 = ordenCanon(
    Object.keys(pf)
      .filter(esPartido)
      .map((k) => [k, pf[k]] as [string, number]),
  )
  const porEdad: Record<string, number> = {}
  for (const a of lista(D.agentes({ zona: z.id }))) porEdad[a.edad] = (porEdad[a.edad] || 0) + (esNum(a.peso) ? a.peso : 0)
  const anio = anioBase()

  /* sus secciones */
  const secc = lista<string | number>(z.secciones)
  const S = m.S
  const idx: Record<string, number> = {}
  if (S) S.ids.forEach((s, i) => (idx[String(s)] = i))
  const cz: (Record<Clase, number> & { n: number }) | null = S && m.u ? { bastion: 0, defender: 0, recuperar: 0, firme: 0, n: 0 } : null
  if (cz && S && m.u) {
    for (const s of secc) {
      const i = idx[String(s)]
      const k = i != null && S.p ? claseDe(S.p[i], m.u) : null
      if (k) {
        cz[k]++
        cz.n++
      }
    }
  }

  /* lectura por zona (sim_corridas.json) y lectura en voces (sim_concilio.json) */
  const fijoZ = `${T.FIJO} ${rf} · zona ${z.id} ${T.FIJO_SUFIJO}`
  const roles = lista(Kd.roles)
  const nomRol: Record<string, Json> = Object.fromEntries(roles.map((r) => [r.id, r]))
  const lineasZona: string[] = C ? lista(C.lineas).map((l) => l.texto) : []
  // lo que el simulador ya dijo en la «Lectura por zona» no se repite entre las voces
  const yaDicho = (h: Json) => h.rol === 'simulador' && lineasZona.indexOf(h.texto) >= 0
  const hilo = K ? lista(K.hilo) : []
  const repetidos = hilo.filter(yaDicho).length
  const voces: Lectura[] = K
    ? hilo
        .filter((h) => !yaDicho(h))
        .map((h) => ({ color: colorVoz(roles, h.rol), t: `${nomRol[h.rol] ? nomRol[h.rol].nombre : h.rol}${h.rotulo ? ` · ${h.rotulo}` : ''}`, x: puntosTxt(h.texto) }))
    : []
  if (repetidos && nomRol.simulador) {
    voces.splice(Math.max(0, voces.length - 2), 0, {
      color: colorVoz(roles, 'simulador'),
      t: nomRol.simulador.nombre,
      x: `Sus ${num(repetidos)} renglones son los de la «Lectura por zona» de esta misma zona: no se repiten aquí.`,
    })
  }
  const NOMBRE_IGUAL: Record<string, string> = { difMOR: 'diferencia de Morena entre alcaldía y diputación', seguridad: 'peso del tema de seguridad' }

  return (
    <Seccion tag="Zona abierta" id="t-zona-sec" titulo={`Zona ${z.id}: ¿cómo vota y qué la mueve?`} texto={texto} derecha={<Chip chip={{ t: 'Cerrar la zona', punto: false, onClick: onCerrar }} />}>
      <Chips
        items={[
          { t: N.distrito(z.dl), icono: 'pin' },
          cuantos(z.n_secciones, 'sección', 'secciones'),
          N.lista_nominal(z.lista_nominal) as string,
          K?.peso ? `Puesto ${num(K.peso.puesto)} de ${num(K.peso.de)} por electores · ${pct(K.peso.pct_lista_nominal)} de la ciudad` : null,
          C ? { t: `${mayus(D.llano(C.rol))} (${rf})`, variante: 'gris', tip: Cm.rol_criterio ? limpia(Cm.rol_criterio) : null } : null,
        ]}
      />
      <Tarjeta variante="plana">
        <H3>Perfil de la zona</H3>
        <Nota doce>{`Promedio de sus secciones. ${K ? `${mayus(K.descripcion)}.` : ''}`}</Nota>
        <Rejilla min={140} gap={12}>
          {rasgos}
        </Rejilla>
        {iguales.length ? (
          <Nota doce>{`No se muestran como rasgo porque valen lo mismo en las ${num(m.nZonas)} zonas: ${iguales.map((x) => `${NOMBRE_IGUAL[x.k] || x.k} (${num(x.v, 1)})`).join(' y ')}.`}</Nota>
        ) : null}
      </Tarjeta>
      <DosColumnas
        base={520}
        anchoLado={380}
        principal={<Tarjeta variante="plana">{voto}</Tarjeta>}
        lado={
          <Tarjeta variante="plana">
            <Col gap={10}>
              <RotuloFijo>{`${T.FIJO} ${N.BOLETA.dip.corto} ${anio} · resultado oficial ${T.FIJO_SUFIJO}`}</RotuloFijo>
              <H3>{`Cómo votó en ${anio || 'la elección anterior'}`}</H3>
              <Nota doce>{`Promedio de sus secciones, por partido (no ${POR_COAL}). No suma el total: faltan otros partidos y votos nulos.`}</Nota>
              {v24.length ? <BarraApilada partes={v24} chicos orden={false} /> : <SinDatos m={m} t={T.SIN_DATO} />}
              <H3>Electores por edad</H3>
              <Nota doce>Lista nominal del INE de la zona, por grupo de edad.</Nota>
              <Barras
                chica
                sufijo=""
                dec={0}
                filas={lista<string>(D.edades())
                  .filter((e) => porEdad[e])
                  .map((e) => ({ nombre: `${e} años`, valor: porEdad[e], color: N.DISENO.teal }))}
              />
            </Col>
          </Tarjeta>
        }
      />
      <DosColumnas
        base={520}
        anchoLado={380}
        principal={
          <Tarjeta variante="plana">
            <div className="pp-fbol__cab">
              <H3>La zona en cada escenario</H3>
              <Etiqueta tipo={m.prelim ? 'ambar' : ''}>{`${m.bol.corto}${m.prelim ? ` · ${T.PRELIMINAR}` : ''}`}</Etiqueta>
            </div>
            <Nota doce>{`Margen de MC sobre ${mor} en la zona ${z.id}, en puntos (mediana). Toca un renglón para elegir ese escenario en toda la pantalla.`}</Nota>
            {/* el rótulo de arriba ya dice «en puntos»: la cifra va sola */}
            {escalones.length ? <Escalera items={escalones} sel={m.eid} sinUnidad aria={`Margen de MC en la zona ${z.id} por escenario, en puntos · ${m.bol.corto}`} onElegir={onEscenario} /> : <SinDatos m={m} t={T.SIN_DATO} />}
          </Tarjeta>
        }
        lado={
          <Tarjeta variante="plana">
            <div className="pp-fbol__cab">
              <H3>{`Sus ${num(secc.length)} secciones`}</H3>
              {cz ? <EtqBoleta m={m} /> : null}
            </div>
            {cz?.n ? (
              <>
                <BarraApilada partes={partesClase(cz)} unidad="secciones" total={cz.n} orden={false} dec={0} alto={20} />
                <Leyenda cuadro items={CLASES.map((k) => ({ t: `${nomClase(k)}: ${num(cz[k])}`, color: colorClase(k) }))} />
              </>
            ) : null}
            <Nota doce>Toca o pasa el cursor sobre un número para ver sus electores y en cuántas corridas queda MC delante. Las secciones de una zona no cambian de un escenario a otro.</Nota>
            <Chips
              items={secc.map((s) => {
                const i = idx[String(s)]
                const p = S?.p && i != null ? S.p[i] : null
                return {
                  t: String(s),
                  clave: String(s),
                  variante: 'mono' as const,
                  tip: `Sección ${s}${
                    i != null && S ? ` · ${num(S.ln[i])} electores${esNum(p) && m.u ? ` · ${m.bol.corto} ${m.eid}: MC delante en ${N.pct_corridas(p)} (${nomClase(claseDe(p, m.u) ?? '').toLowerCase()})` : ''}` : ''
                  }`,
                }
              })}
            />
          </Tarjeta>
        }
      />
      <Tarjeta variante="plana">
        {C ? (
          <Col gap={10}>
            <RotuloFijo>{fijoZ}</RotuloFijo>
            <H3>Lectura por zona</H3>
            <Nota doce>{`${Cm.rotulo ? `${limpia(Cm.rotulo)}. ` : ''}Cada renglón dice de qué boleta y de qué escenario habla.`}</Nota>
            <LecturasEnRejilla items={lista(C.lineas).map((l) => ({ color: colorBoleta(l.boleta), t: l.rotulo, x: puntosTxt(l.texto) }))} />
            <Nota doce>{D.dato('corridas')?.tipo || ''}</Nota>
          </Col>
        ) : (
          <SinDatos m={m} k="Lectura por zona" t="Sin lectura para esta zona" x="Falta sim_corridas.json." />
        )}
      </Tarjeta>
      <Tarjeta variante="plana">
        {K ? (
          <Col gap={10}>
            <RotuloFijo>{fijoZ}</RotuloFijo>
            <H3>{`Lectura en ${nVoces()} voces · ${K.decision} — ${K.decision_accion}`}</H3>
            <Nota doce>{`Rótulo de la zona en ${rf}: «competida» si MC y su rival con más votos quedan a menos de ${ptsAbs(Km.rol_umbral_pp, 0)}; si no, fuerte de quien va delante. ${Kd.tipo || ''}.`}</Nota>
            <Chips items={roles.map((r) => ({ t: r.nombre, clave: r.id, tip: r.desc, variante: 'gris' as const }))} />
            <LecturasEnRejilla items={voces} />
          </Col>
        ) : (
          <SinDatos m={m} k="Lectura en voces" t="Sin lectura para esta zona" x="Falta sim_concilio.json." />
        )}
      </Tarjeta>
      <MarcaMural textos={voces.map((x) => x.x)} />
    </Seccion>
  )
}
