/** Territorio · 4: qué secciones conviene atender primero (listas por clase y voto diferenciado). */
import { D, N, POR_COAL, T, cuantos, enFrase, esNum, limpia, lista, mayus, num, pct, pts } from '../../motor'
import { useSeccionesMotor } from '../../motor/hooks'
import { Col, Etiqueta, H3, Nota, RotuloFijo, Seccion } from '../../components/tablero/kit/base'
import { Anillo, Lineal, Mueve, PildoraLider } from '../../components/tablero/kit/barras'
import { partesParejo } from '../../motor'
import { BarraPartidos, LeyendaPartidos, Naturaleza, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { Filtros, RankNombre, RankNumero, SinDetalle, TablaRanking, type Celda, type Columna, type Opcion } from '../../components/tablero/kit/tablas'
import { MOR, dCorto, defClase, difZ, esExtrema, listaSecc, marcas, nomClase, orden3, parejoZ, probTxt, umbralZ, type Lista, type Modelo, type Series } from './modelo'
import { SinDatos } from './piezas'

export type Cuantas = 'top' | 'todas'

/** «Sección 1027» con su distrito y su zona. */
const celdaSeccion = (S: Series, i: number, b: Modelo['b'], zonaDe: Record<string, string>): Celda => {
  const id = String(S.ids[i])
  return { c: <RankNombre nombre={`Sección ${id}`} sub={`${dCorto(S.dl[i], b)}${zonaDe[id] ? ` · zona ${zonaDe[id]}` : ''}`} /> }
}

/** Probabilidad como anillo; las extremas («>99.9 %») van solo en texto. */
const Prob = ({ p }: { p: unknown }) => (/^[<>]/.test(probTxt(p)) || !esNum(p) ? <>{probTxt(p)}</> : <Anillo p={p} dec={1} />)

/**
 * «Va primero» de una sección, por coalición. Con la predicción por sección, su
 * regla de casi empate (nadie llega a 60 % de las corridas → «Parejo»); sin
 * ella, el voto de los tres con la regla de las zonas, o la probabilidad de MC:
 * entre 40 % y 60 % de las corridas nadie se destaca.
 */
function PildoraSeccion({ m, S, i, pr }: { m: Modelo; S: Series; i: number; pr: Record<string, { p50?: number } | undefined> & { adelante?: string; parejo?: boolean; p_primero?: Record<string, unknown> } }) {
  if (pr?.adelante) {
    const x = pr[pr.adelante]
    if (pr.parejo) return <PildoraLider parejo tip={pr.p_primero ? partesParejo(pr.p_primero) : null} />
    return <PildoraLider clave={pr.adelante} valor={x && esNum(x.p50) ? pct(x.p50) : null} />
  }
  if (S.tri) {
    const o = orden3({ MC: S.tri.MC[i], [MOR]: S.tri[MOR][i], PAN_PRI: S.tri.PAN_PRI[i] })
    if (!o.length) return <PildoraLider />
    return parejoZ(o) ? <PildoraLider parejo t={`${T.PAREJO} · ${num(o[0].v - o[1].v, 1)} puntos`} tip={mayus(difZ(o))} /> : <PildoraLider clave={o[0].k} valor={pct(o[0].v)} />
  }
  const p = S.p?.[i]
  if (!esNum(p) || !m.u) return <PildoraLider />
  if (p > m.u.hi) return <PildoraLider clave="MC" />
  if (p < m.u.lo) return <PildoraLider clave={MOR} />
  return <PildoraLider parejo tip={`MC queda delante en ${N.pct_corridas(p)}: nadie llega a ${pct(m.u.hi, 0)}.`} />
}

/** Dónde MC saca más en la alcaldía que en la diputación local. Es indicativo: son dos boletas distintas. */
function Diferenciado({ m, tope }: { m: Modelo; tope: number }) {
  const S = m.S as Series
  const a0: number[] | null = D.campoSeccion(`${S.pre}mc_ayun`)
  const d0: number[] | null = D.campoSeccion(`${S.pre}mc_dip`)
  const da: number[] | null = m.esRef ? null : D.campoSeccion('d_mc_ayun', m.eid)
  const dd: number[] | null = m.esRef ? null : D.campoSeccion('d_mc_dip', m.eid)
  if (!a0 || !d0) return <SinDatos m={m} k="Voto diferenciado" t={T.SIN_DATO} x="sim_v8.json no trae el voto de MC por sección en las dos boletas." />
  const idx: number[] = []
  S.ids.forEach((_, i) => {
    if ((!m.d || String(S.dl[i]) === m.d) && esNum(a0[i]) && esNum(d0[i])) idx.push(i)
  })
  idx.sort((x, y) => a0[y] - d0[y] - (a0[x] - d0[x]) || S.ln[y] - S.ln[x])
  const ver = idx.slice(0, tope)
  const ambito: string = N.ambito(m.d, 'ayun')
  const columnas: Columna[] = [
    { t: '', ancho: '34px' },
    { t: 'Sección', ancho: 'minmax(150px,1.2fr)' },
    { t: 'Electores', ancho: '90px', der: true },
    { t: `MC · ${N.BOLETA.ayun.corto}`, ancho: '110px', tip: `% de voto de MC en la alcaldía, en ${m.ref.id} (mediana).` },
    { t: `MC · ${N.BOLETA.dip.corto}`, ancho: '110px', tip: `% de voto de MC en la diputación local, en ${m.ref.id} (mediana).` },
    { t: 'Diferencia', ancho: '100px', tip: 'Voto de MC en la alcaldía menos su voto en la diputación local, en puntos.' },
  ]
  if (da && dd) columnas.push({ t: `Mueve MC · ${N.BOLETA.ayun.corto}`, ancho: '120px' }, { t: `Mueve MC · ${N.BOLETA.dip.corto}`, ancho: '120px' })
  return (
    <Col gap={10}>
      <RotuloFijo>{`${T.FIJO} ${N.BOLETA.ayun.corto} frente a ${N.BOLETA.dip.corto} · ${m.ref.id} · ${ambito} (no sigue al selector de boleta)`}</RotuloFijo>
      <H3>{`Voto diferenciado (indicativo): las ${num(ver.length)} secciones de ${ambito} donde MC saca más en la alcaldía que en la diputación local`}</H3>
      <Nota doce>{`Se ordenan las ${num(idx.length)} secciones por esa diferencia en ${m.ref.id} y se muestran las ${num(ver.length)} primeras. Son dos boletas con coaliciones distintas: es una pista de dónde la candidata a la alcaldía rinde más que su partido, no una medición.`}</Nota>
      <TablaRanking
        aria="Voto diferenciado de MC entre alcaldía y diputación local"
        minAncho={da && dd ? 940 : 700}
        columnas={columnas}
        filas={ver.map((i, j) => {
          const fila: Celda[] = [
            { c: <RankNumero n={j + 1} /> },
            celdaSeccion(S, i, 'ayun', m.zonaDe),
            { c: num(S.ln[i]), der: true },
            { c: <Anillo p={a0[i]} dec={1} /> },
            { c: <Anillo p={d0[i]} dec={1} /> },
            { c: pts(a0[i] - d0[i]) },
          ]
          if (da && dd) fila.push({ c: <Mueve valor={da[i]} prefijo={m.eid} /> }, { c: <Mueve valor={dd[i]} prefijo={m.eid} /> })
          return fila
        })}
      />
    </Col>
  )
}

type Props = { m: Modelo; lista: Lista; cuantas: Cuantas; onLista: (l: Lista) => void; onCuantas: (c: Cuantas) => void }

export function Secciones({ m, lista: elegida, cuantas, onLista, onCuantas }: Props) {
  // la predicción por sección y el resultado 2024 por partido se piden al ver la lista; al llegar se repinta
  const secListas = useSeccionesMotor(m.eid, m.b)
  const titulo = '¿Qué secciones conviene atender primero?'
  const { S, u, sec: r } = m
  if (!S?.p || !u || !r) {
    return (
      <Seccion n={3} id="t-secciones-sec" titulo={titulo}>
        <SinDatos m={m} t="Sin lista de secciones para esta boleta" x="Hacen falta la probabilidad por sección de sim_v8.json y los umbrales de proyecciones.json." />
      </Seccion>
    )
  }
  const p = S.p
  const mor = enFrase(MOR)
  const n: Record<string, number> = { bisagra: r.disp, defender: r.c.defender, recuperar: r.c.recuperar, cambian: r.aMor + r.aMc, bastion: r.c.bastion }
  const cual: Lista = m.esRef && elegida === 'cambian' ? 'bisagra' : elegida
  const texto = `En ${m.rotTxt} habría ${cuantos(n.bisagra, 'sección', 'secciones')} en disputa, parejas (nadie llega a ${pct(u.hi, 0)} de las corridas): ${num(n.defender)} por defender (MC delante en la mitad de las corridas o más) y ${num(n.recuperar)} por recuperar (MC por debajo de la mitad)${
    m.esRef ? '.' : `; en ${num(n.cambian)} MC cruza la mitad de las corridas frente a ${m.ref.id}.`
  } Cada lista dice cuántas son y cuántas se muestran.`
  const opciones: Opcion<Lista>[] = (['bisagra', 'defender', 'recuperar', 'cambian', 'bastion'] as Lista[])
    .filter((k) => !(m.esRef && k === 'cambian'))
    .map((k) => ({
      v: k,
      t: `${nomClase(k).replace(' (en disputa)', '')} · ${num(n[k])}`,
      tip: k === 'cambian' ? `Secciones en que MC queda delante en la mitad o más de las corridas en ${m.ref.id} y no en ${m.eid}, o al revés.` : `${defClase(k, u)}.`,
    }))
  opciones.push({ v: 'diferenciado', t: 'Voto diferenciado', tip: 'Dónde MC saca más en la alcaldía que en la diputación local (lectura indicativa).' })

  const tope = u.top || r.n
  const idx = cual === 'diferenciado' ? [] : listaSecc(m, cual)
  const total = idx.length
  const ver = cuantas === 'todas' ? idx : idx.slice(0, tope)
  const lnTot = idx.reduce((s, i) => s + S.ln[i], 0)
  const maxLn = Math.max(1, ...ver.map((i) => S.ln[i]))
  const uz = umbralZ()

  const columnas: Columna[] = [
    { t: '', ancho: '34px' },
    { t: 'Sección', ancho: 'minmax(150px,1.2fr)' },
    { t: 'Electores', ancho: '130px', tip: 'Lista nominal del INE de la sección.' },
    { t: 'MC delante', ancho: '92px', tip: `En cuántas corridas de ${m.eid} queda MC delante de ${mor} en la sección (% de las corridas).` },
  ]
  if (!m.esRef) columnas.push({ t: `En ${m.ref.id}`, ancho: '70px', tip: `El mismo dato en ${m.ref.id}, la referencia sin la crisis de octubre.` })
  columnas.push(
    {
      t: 'Voto por partido',
      ancho: 'minmax(190px,1.3fr)',
      tip: `Mediana de cada coalición en la sección, repartida entre sus partidos con lo que sacó cada uno en esa sección en 2024 en la misma boleta (${T.REPARTO_ESTIMADO}). Toca la barra para ver cada partido.`,
    },
    {
      t: 'Va primero',
      // cabe la píldora más larga: «Coalición de Morena 45.6 %»
      ancho: '174px',
      tip: `Quién tiene la mediana más alta en la sección (MC o una coalición) y su % de voto (quién va adelante se calcula ${POR_COAL}). «${T.PAREJO}» si nadie queda primero en ${pct(N.UMBRAL.VENTAJA, 0)} de las corridas o más (o, sin ese dato, si las dos primeras quedan a menos de ${num(uz != null ? uz : 5)} puntos): entonces no se nombra a nadie. Una sección no elige a nadie.`,
    },
    { t: `MC en ${m.ref.id}`, ancho: '84px', tip: `% de voto de MC en la sección en ${m.ref.id} (mediana).` },
  )
  if (!m.esRef) columnas.push({ t: 'Mueve MC', ancho: '92px', tip: `Cambio de MC en la sección en ${m.eid} frente a ${m.ref.id}, en puntos.` })
  columnas.push({ t: 'Agua', ancho: '56px', tip: 'Exposición a la crisis del agua, de menos a más (estimación propia).' })

  // por partido: la mediana de cada coalición en la sección repartida entre sus partidos con el resultado 2024 de la sección
  const repartos = ver.map((i) => (secListas ? D.partidosSeccion(m.eid, m.b, String(S.ids[i])) : null))
  const hayReparto = repartos.some(Boolean)
  const pendiente = repartos.some((Ps) => Ps?.proporcion?.pendiente_2024)
  const filas: Celda[][] = ver.map((i, j) => {
    const Ps = repartos[j]
    const pr = secListas ? D.prediccionSeccion(m.eid, m.b, String(S.ids[i])) : null
    const fila: Celda[] = [{ c: <RankNumero n={j + 1} /> }, celdaSeccion(S, i, m.b, m.zonaDe), { c: <Lineal valor={S.ln[i]} max={maxLn} dec={0} /> }, { c: <Prob p={p[i]} /> }]
    if (!m.esRef) fila.push({ c: S.p0 ? probTxt(S.p0[i]) : T.SIN_DATO })
    fila.push(Ps ? { c: <BarraPartidos P={Ps} alto={16} totales={false} min={14} />, tip: Ps.nota } : { c: <SinDetalle>{secListas ? T.SIN_DATO : 'cargando…'}</SinDetalle> })
    fila.push({ c: <PildoraSeccion m={m} S={S} i={i} pr={pr} /> })
    fila.push({ c: S.mc0 ? pct(S.mc0[i]) : T.SIN_DATO })
    if (!m.esRef) fila.push({ c: <Mueve valor={S.dmc ? S.dmc[i] : null} prefijo={m.eid} /> })
    fila.push({ c: esNum(S.agua[i]) ? num(S.agua[i] * 100) : T.SIN_DATO })
    return fila
  })
  const hayExtrema = cual !== 'diferenciado' && idx.some((i) => esExtrema(p[i]) || (S.p0 && esExtrema(S.p0[i])))
  const ultimo: string = N.DISTRITOS[N.DISTRITOS.length - 1]

  return (
    <Seccion n={3} id="t-secciones-sec" titulo={titulo} texto={texto}>
      <Filtros aria="Qué secciones ver" valor={cual} onChange={onLista} opciones={opciones} />
      <LeyendaPartidos boleta={m.b} />
      {cual === 'diferenciado' ? (
        <Diferenciado m={m} tope={tope} />
      ) : (
        <>
          <div className="pp-cab pp-cab--extremos">
            <Col gap={4}>
              <H3>{`${nomClase(cual)}: ${cuantos(total, 'sección', 'secciones')} en ${m.amb} · ${num(lnTot)} electores`}</H3>
              <Nota doce>{`${cual === 'cambian' ? `MC cruza la mitad de las corridas entre ${m.ref.id} y ${m.eid}` : mayus(defClase(cual, u))}. ${
                total > ver.length ? `Se muestran las ${num(ver.length)} con más electores de las ${num(total)}.` : total ? 'Se muestran todas, de más a menos electores.' : ''
              }`}</Nota>
            </Col>
            {total > tope ? (
              <Filtros
                aria="Cuántas secciones ver"
                valor={cuantas}
                onChange={onCuantas}
                opciones={[
                  { v: 'top', t: `Las ${num(tope)} con más electores` },
                  { v: 'todas', t: `Las ${num(total)}` },
                ]}
              />
            ) : null}
          </div>
          {filas.length ? (
            <>
              <TablaRanking aria={`${nomClase(cual)} · ${m.rot}`} minAncho={1180} columnas={columnas} filas={filas} />
              <div className="pp-chips">
                {hayReparto ? (
                  <Naturaleza
                    de={T.REPARTO_ESTIMADO}
                    nota={`Voto por partido de cada sección: la mediana de cada coalición en la sección repartida entre sus partidos con lo que sacó cada uno en esa sección en 2024 en la misma boleta (${D.FUENTE_2024?.[m.b]?.boleta}); Hagamos/Futuro, con su parte en el distrito según el motor; si la sección no trae ese resultado, con la proporción del motor en su distrito.`}
                  />
                ) : null}
                {pendiente ? <Etiqueta tipo="ambar">Cargando el resultado 2024 por sección: mientras, el reparto usa la proporción del distrito</Etiqueta> : null}
              </div>
              <RotuloCandidatura boleta={m.b} chico />
            </>
          ) : (
            <SinDatos m={m} t="Ninguna sección en esta lista" x={m.rot} />
          )}
        </>
      )}
      {hayExtrema && marcas().probabilidad_extrema ? <Nota doce>{limpia(marcas().probabilidad_extrema.texto)}</Nota> : null}
      <Nota doce>{`Electores = lista nominal del INE · «MC delante» compara solo a MC con ${mor} · Agua: de menos a más expuesta.${
        lista(D.seccionesDe(m.d)).length && (!m.d || D.esFranja(m.d)) ? ` ${D.textoFranja(m.b, ultimo).nota}` : ''
      }`}</Nota>
    </Seccion>
  )
}
