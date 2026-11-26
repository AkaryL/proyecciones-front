/**
 * Arranque de Territorio: los avisos antes de leer, el voto por partido y los
 * indicadores de secciones (bastión, bisagra, por defender, las que cruzan la
 * mitad) con sus tres hallazgos.
 */
import type { ReactNode } from 'react'
import { D, N, POR_COAL, T, enFrase, lista, limpia, num, pct, ptsAbs, puntosTxt } from '../../motor'
import { Kicker, Nota, Rejilla, Seccion } from '../../components/tablero/kit/base'
import { BarraApilada } from '../../components/tablero/kit/barras'
import { BarraPartidos, Naturaleza, RotuloCandidatura, TablaPartidos } from '../../components/tablero/kit/partidos'
import { ComoLeer, Kpi, Leyenda, Numeradas, Tarjeta, TarjetaAviso } from '../../components/tablero/kit/tarjetas'
import { CLASES, MOR, colorClase, dCorto, difZ, marcas, nomClase, partesClase, resumenSecc, umbralZ, type Modelo } from './modelo'
import { EtqBoleta, SinDatos } from './piezas'

/** Avisos: boleta preliminar, escenario de referencia y escenarios que no mueven la boleta. */
export function Avisos({ m }: { m: Modelo }) {
  const notas: { t: string; x: ReactNode }[] = []
  const B = D.proyeccion('P10')?.boletas?.[m.b]
  if (m.prelim) {
    notas.push({ t: `${m.bol.largo}: ${String(T.PRELIMINAR).toLowerCase()}`, x: B?.aviso_preliminar ? limpia(B.aviso_preliminar) : 'Sus cifras son preliminares.' })
    if (m.b === 'fed' && (!m.d || D.esFranja(m.d))) notas.push({ t: dCorto(m.d || N.DISTRITOS[N.DISTRITOS.length - 1], m.b), x: T.NOTA_DF13 })
  }
  const E10 = B?.por_escenario?.[m.eid]
  const mk = marcas()
  if (B?.nota_pan_pri) notas.push({ t: `${N.nombre('PAN_PRI')}: ${mk.pan_pri_sin_alianza ? mk.pan_pri_sin_alianza.etiqueta : 'sin alianza acordada'}`, x: limpia(B.nota_pan_pri) })
  if (E10?.sin_cotejar) {
    notas.push({
      t: `Encuesta MURAL: ${mk.sin_cotejar ? mk.sin_cotejar.etiqueta : 'sin cotejar con el original'}`,
      x: `${m.eRot} se apoya en esa encuesta. ${limpia(E10.aviso_sin_cotejar || mk.sin_cotejar?.texto || '')}`,
    })
  }
  if (m.esRef) notas.push({ t: 'Escenario de referencia', x: m.e.definicion_llana || m.eRot })
  if (m.e && D.mueve(m.eid, m.b) === false && m.cen) {
    notas.push({
      t: `Este escenario no mueve la ${m.bol.corto}`,
      x: `${m.eRot} no cambia esta boleta: aquí sus cifras son las del escenario central (${m.cen.rotulo}). Sí cambia: ${
        lista(m.e.boletas_afectadas)
          .map((b) => N.BOLETA[b].corto)
          .join(', ') || 'ninguna boleta'
      }.`,
    })
  }
  if (!notas.length) return null
  return <TarjetaAviso titulo="Antes de leer esta pantalla" aviso={m.prelim} notas={notas} />
}

/** El voto de cada partido en el ámbito elegido, tal como lo da el motor (ciudad: mediana y rango; distrito: mediana). */
export function Partidos({ m }: { m: Modelo }) {
  const P = D.partidos(m.eid, m.b, m.d)
  if (!P) return null
  const top: string[] = lista(P.partidos)
    .filter((x) => typeof x.p50 === 'number' && Number.isFinite(x.p50) && x.clave !== 'OTROS')
    .sort((a, z) => z.p50 - a.p50)
    .slice(0, 3)
    .map((x) => `${x.nombre} ${pct(x.p50)}`)
  const enumera = top.length > 1 ? `${top.slice(0, -1).join(', ')} y ${top[top.length - 1]}` : top.join('')
  const lectura = `${m.esRef ? 'En ' : 'Si se cumpliera '}${m.eRot}, en la ${m.bol.corto}${m.prelim ? ' (preliminar)' : ''} · ${m.amb}, por partido: ${enumera} (${
    P.rango ? 'mediana de las corridas; el rango, en la tabla' : 'mediana de las corridas'
  }).${m.b !== 'ayun' && !m.d ? ` ${T.SUMA_DISTRITOS}.` : ''}`
  const rotulo = `Voto proyectado por partido · ${m.bol.corto} · ${m.eid} · ${m.amb}`
  return (
    <Seccion tag="Partidos" titulo="¿Cuánto sacaría cada partido?" texto={lectura}>
      <Tarjeta variante="plana">
        <div className="pp-fbol__cab">
          <Kicker>{rotulo}</Kicker>
          <EtqBoleta m={m} />
          <Naturaleza de={P} />
        </div>
        <BarraPartidos P={P} />
        <TablaPartidos P={P} aria={rotulo} />
      </Tarjeta>
    </Seccion>
  )
}

/** Tres hallazgos armados con las cifras del estado elegido. */
function hallazgos(m: Modelo): ReactNode[] {
  const h: ReactNode[] = []
  const r = m.sec
  if (!r) return h
  if (m.d) {
    h.push(
      <>
        En <strong>{m.amb}</strong>, {num(r.disp)} de sus {num(r.n)} secciones estarían en disputa: <strong>{num(r.c.defender)}</strong> por defender y <strong>{num(r.c.recuperar)}</strong> por recuperar.
      </>,
    )
  } else {
    let mas: { dl: string; r: NonNullable<ReturnType<typeof resumenSecc>> } | null = null
    for (const dl of N.DISTRITOS as string[]) {
      const x = resumenSecc(m, dl)
      if (x && (!mas || x.disp > mas.r.disp)) mas = { dl, r: x }
    }
    if (mas) {
      h.push(
        <>
          El distrito con más secciones en disputa sería <strong>{N.ambito(mas.dl, m.b)}</strong>: {num(mas.r.disp)} de sus {num(mas.r.n)} ({num(mas.r.lnDisp)} electores).
        </>,
      )
    }
  }
  const zs = m.zonas.filter((z) => z.o.length > 1)
  if (zs.length) {
    const n: Record<string, number> = {}
    let nPar = 0
    let cer = zs[0]
    for (const z of zs) {
      if (z.par) nPar++
      else n[z.o[0].k] = (n[z.o[0].k] || 0) + 1
      if ((z.vent as number) < (cer.vent as number)) cer = z
    }
    const uz = umbralZ()
    const nom = (D.BLOQUES as string[]).filter((k) => n[k])
    h.push(
      <>
        De las {num(zs.length)} zonas de {m.amb}, {POR_COAL},{' '}
        {nom.length ? (
          <>
            iría primero{' '}
            {nom.map((k, i) => (
              <span key={k}>
                {i > 0 ? ', ' : ''}
                <strong>{N.nombre(k)}</strong> en {num(n[k])}
              </span>
            ))}
          </>
        ) : (
          'nadie quedaría claramente primero'
        )}
        {nPar ? `${nom.length ? ' y ' : ': '}${num(nPar)} ${nPar === 1 ? 'queda pareja' : 'quedan parejas'}${uz != null ? ` (menos de ${num(uz)} puntos entre los dos primeros)` : ''}` : ''}. La más cerrada sería {cer.z.id}:{' '}
        {cer.par ? difZ(cer.o) : `${N.nombre(cer.o[0].k)} por ${ptsAbs(cer.vent)} sobre ${enFrase(cer.o[1].k)}`}.
      </>,
    )
  }
  if (m.P3) {
    const tot = m.d ? m.P3.distritos?.[m.d]?.votos_recuperables : m.P3.ciudad?.votos_recuperables
    const zz = lista(m.P3.zonas).filter((z) => !m.d || String(z.dl) === m.d)[0]
    if (tot) {
      h.push(
        <>
          Si MC pasara de {m.P3cen} a {m.P3.escenario_de_gestion} (su mejor escenario de gestión), habría unos <strong>{num(tot.valor)}</strong> votos por recuperar en la {m.bol.corto}
          {zz ? `; la zona con más sería ${zz.zona} (${num(zz.votos_recuperables)}).` : '.'}
        </>,
      )
    }
  }
  return h
}

/** Indicadores de secciones: bastión, bisagra, por defender y las que cruzan la mitad. */
export function Indicadores({ m }: { m: Modelo }) {
  const titulo = '¿En cuántas secciones va MC delante y cuántas están en disputa?'
  const { u, sec: r } = m
  if (!u || !r) {
    return (
      <Seccion tag="Secciones" titulo={titulo}>
        <SinDatos m={m} t="Sin clasificación de secciones para esta boleta" x="Hacen falta la probabilidad por sección de sim_v8.json y los umbrales de proyecciones.json." />
      </Seccion>
    )
  }
  const meta = D.meta() || {}
  const P10 = D.proyeccion('P10')
  const B = P10?.boletas?.[m.b]
  const { c, x } = r
  const mor = enFrase(MOR)
  // «delante» solo donde se llega al umbral de ventaja; la bisagra es pareja y no se le pone dueño
  const texto = `${m.esRef ? 'En ' : 'Si se cumpliera '}${m.eRot}, en la ${m.bol.primera} MC quedaría delante de ${mor} en ${num(c.bastion)} de las ${num(r.n)} secciones de ${m.amb} (en más de ${pct(u.hi, 0)} de las corridas) y ${mor} delante de MC en ${num(c.firme)}; ${num(r.disp)} estarían parejas, en disputa (${num(r.lnDisp)} electores): ${num(c.defender)} con MC delante en la mitad o más de las corridas, sin llegar a ${pct(u.hi, 0)} (por defender), y ${num(c.recuperar)} por debajo de la mitad (por recuperar).`

  const aqui = x ? x.cambian_a_mc_vs_central : null
  const alla = x ? x.cambian_a_morena_aliados_vs_central : null
  const cambia = m.esRef ? (
    <Kpi variante="teal" valor={num(x ? aqui + alla : null)} rotulo="Distintas del escenario central" sub={m.cen ? `frente a ${m.cen.id}: ${num(aqui)} con MC delante aquí y no allá · ${num(alla)} al revés` : ''} />
  ) : (
    <Kpi variante="teal" valor={num(r.aMor + r.aMc)} rotulo="Cruzan la mitad de las corridas" sub={`frente a ${m.ref.id}: en ${num(r.aMor)} MC baja de la mitad · en ${num(r.aMc)} sube de la mitad`} />
  )
  const tri = x?.primero_por_seccion

  return (
    <Seccion tag="Secciones" titulo={titulo} texto={texto}>
      <Rejilla min={160}>
        <Kpi partido="MC" valor={num(c.bastion)} rotulo="Secciones bastión de MC" sub={`MC delante en más de ${pct(u.hi, 0)} de las corridas`} />
        <Kpi variante="navy" valor={num(r.disp)} rotulo="Secciones bisagra (en disputa)" sub={`${num(r.lnDisp)} electores · MC delante entre ${pct(u.lo, 0)} y ${pct(u.hi, 0)}`} />
        <Kpi variante="navy" valor={num(c.defender)} rotulo="Por defender" sub={`bisagra con MC en la mitad o más de las corridas, sin llegar a ${pct(u.hi, 0)} · otras ${num(c.recuperar)} por recuperar`} />
        {cambia}
      </Rejilla>
      <Tarjeta variante="plana">
        <div className="pp-fbol__cab">
          <Kicker>{`Las ${num(r.n)} secciones de ${m.amb}, según quién va delante (${POR_COAL})`}</Kicker>
          <EtqBoleta m={m} />
        </div>
        <BarraApilada partes={partesClase(c)} unidad="secciones" total={r.n} orden={false} dec={0} />
        <Leyenda cuadro items={CLASES.map((k) => ({ t: `${nomClase(k)}: ${num(c[k])}`, color: colorClase(k) }))} />
        {tri ? (
          <>
            <div className="pp-fbol__cab">
              <Kicker>{`Quién iría primero, ${POR_COAL} (cuenta de secciones)`}</Kicker>
              <EtqBoleta m={m} />
            </div>
            <BarraApilada partes={(D.BLOQUES as string[]).map((k) => [k, tri[k]] as [string, unknown])} unidad="secciones" total={r.n} orden={false} chicos dec={0} />
            <Nota doce>{B?.primero_por_seccion_que_es ? puntosTxt(limpia(B.primero_por_seccion_que_es)) : ''}</Nota>
          </>
        ) : null}
        <RotuloCandidatura boleta={m.b} chico />
      </Tarjeta>
      <ComoLeer titulo="Cómo leer esto.">
        Una <strong>corrida</strong> es una simulación completa de la elección; el motor hace {num(meta.n_corridas)} y aquí se cuenta en cuántas queda MC delante de {mor} en cada sección (quién va delante se calcula {POR_COAL}).{' '}
        <strong>Bastión de MC</strong>: en más de {pct(u.hi, 0)}; <strong>firme de {mor}</strong>: MC en menos de {pct(u.lo, 0)}. <strong>Bisagra</strong> (en disputa): entre {pct(u.lo, 0)} y {pct(u.hi, 0)}: nadie llega a {pct(u.hi, 0)}, así que no
        se le pone dueño; dentro de ella, <strong>por defender</strong> si MC queda delante en la mitad de las corridas o más ({pct(u.U, 0)} o más) y <strong>por recuperar</strong> si queda por debajo. <strong>Cruzan la mitad</strong>: en{' '}
        {m.ref.id} MC quedaba delante en la mitad o más de las corridas y en este escenario no (o al revés). La <strong>mediana</strong> es el valor de en medio de las corridas; las diferencias van en puntos y los <strong>electores</strong> son las
        personas inscritas en la lista nominal del INE. {P10?.nota ? puntosTxt(limpia(P10.nota)) : ''}
      </ComoLeer>
      <Numeradas items={hallazgos(m)} />
    </Seccion>
  )
}
