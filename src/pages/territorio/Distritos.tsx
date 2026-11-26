/** Territorio · 2: cómo se reparten las secciones y el voto por distrito. */
import { D, N, POR_COAL, T, cuantos, enFrase, limpia, lista, num, pct } from '../../motor'
import { Chips, Nota, Seccion } from '../../components/tablero/kit/base'
import { FilaBoleta } from '../../components/tablero/kit/barras'
import { LeyendaPartidos, RotuloCandidatura } from '../../components/tablero/kit/partidos'
import { Leyenda, TarjetaDistrito } from '../../components/tablero/kit/tarjetas'
import { CLASES, MOR, colorClase, dCorto, esExtrema, marcas, nomClase, partesClase, resumenSecc, type Modelo, type Resumen } from './modelo'
import { FilaPartidos, SinDatos } from './piezas'

/** El distrito que más tiene de algo, con su resumen. */
type Mayor = { dl: string; r: Resumen } | null

/** Lo que una tarjeta de distrito necesita saber; `extrema` avisa si hay que explicar las probabilidades «>99 %». */
function datosDistrito(m: Modelo, dl: string) {
  const f = D.distrito(m.eid, m.b, dl)
  const r = resumenSecc(m, dl)
  const dz = D.distritoZonas(dl)
  const fr = D.textoFranja(m.b, dl)
  const pie: string[] = []
  if (r) {
    pie.push(`En disputa: ${cuantos(r.disp, 'sección', 'secciones')} · ${num(r.lnDisp)} electores`)
    if (!m.esRef) pie.push(`Cruzan la mitad de las corridas frente a ${m.ref.id}: en ${num(r.aMor)} MC baja de la mitad · en ${num(r.aMc)} sube`)
  }
  const ve = f?.veredicto
  if (f) {
    const tipo = String(D.tipoRecorte(m.b, dl).nota || '').replace(/^\*\s*/, '')
    if (ve && !f.eleccion) pie.push(`${ve.adelante || ve.txt}${m.prelim ? ' (preliminar)' : ''}. Aquí no se elige un cargo${tipo && !fr?.franja ? `: ${tipo}` : '.'}`)
    else if (ve && m.prelim) pie.push(`${ve.nivel === 'gana' ? `Iría adelante ${enFrase(ve.lider)}` : ve.txt} (preliminar): ${ve.detalle || ''}`)
  }
  if (dz) pie.push(`${cuantos(lista(dz.clusters).length, 'zona', 'zonas')} · ${N.lista_nominal(D.listaNominal(dl))}`)
  const p3 = m.P3?.distritos?.[dl]?.votos_recuperables
  if (p3) pie.push(`Votos por recuperar (de ${m.P3cen} a ${m.P3.escenario_de_gestion}): ${num(p3.valor)}`)
  if (fr?.franja) {
    pie.push(fr.nota)
    if (fr.nota_federal) pie.push(fr.nota_federal)
  }
  return { f, r, pie, extrema: Boolean(f && ve && esExtrema(ve.p)) }
}

function Distrito({ m, dl }: { m: Modelo; dl: string }) {
  const { f, r, pie } = datosDistrito(m, dl)
  const etiqueta = `${m.eid}${m.prelim ? ` · ${T.PRELIMINAR}` : ''}`
  return (
    <TarjetaDistrito
      nombre={`${m.b === 'fed' ? 'Distrito federal ' : 'Distrito '}${dl}`}
      chip={cuantos(r ? r.n : f ? f.n_secciones : null, 'sección', 'secciones')}
      id={`t-d${dl}`}
      pie={pie.map((t) => (
        <Nota key={t} doce>
          {t}
        </Nota>
      ))}
    >
      {r ? (
        <FilaBoleta rotulo="Secciones según quién va delante" etiqueta={`${m.bol.corto} · ${etiqueta}`} etiquetaTipo={m.prelim ? 'ambar' : ''} partes={partesClase(r.c)} apilada={{ unidad: 'secciones', total: r.n, orden: false, dec: 0 }} />
      ) : null}
      {/* el voto del distrito por PARTIDO (medianas del motor en el distrito, tal cual); quién va adelante, por coalición */}
      {f ? (
        <FilaPartidos
          rotulo={`Voto del distrito por partido · ${m.bol.pildora}`}
          etiqueta={etiqueta}
          etiquetaTipo={m.prelim ? 'ambar' : ''}
          P={D.partidosDistrito(m.eid, m.b, dl)}
          pg={f.eleccion && !m.prelim ? f.p_gana : null}
        />
      ) : null}
      {!r && !f ? <SinDatos m={m} t={T.SIN_DATO} /> : null}
    </TarjetaDistrito>
  )
}

export function Distritos({ m, onDistrito }: { m: Modelo; onDistrito: (d: string) => void }) {
  const mor = enFrase(MOR)
  const r = m.sec
  const distritos: string[] = m.d ? [m.d] : N.DISTRITOS
  let texto: string | undefined
  if (m.d && r && m.u) {
    texto = `${m.rotTxt}. En este distrito MC quedaría delante de ${mor} en ${num(r.c.bastion)} de sus ${num(r.n)} secciones (bastión: más de ${pct(m.u.hi, 0)} de las corridas), ${num(r.disp)} estarían parejas, en disputa (${num(r.c.defender)} por defender y ${num(r.c.recuperar)} por recuperar) y en ${num(r.c.firme)} iría delante ${mor}.`
  } else if (r) {
    let masB = null as Mayor
    let masD = null as Mayor
    for (const dl of N.DISTRITOS as string[]) {
      const x = resumenSecc(m, dl)
      if (!x) continue
      if (!masB || x.c.bastion > masB.r.c.bastion) masB = { dl, r: x }
      if (!masD || x.disp > masD.r.disp) masD = { dl, r: x }
    }
    texto = `${m.rotTxt}. ${masB ? `Donde MC tendría más secciones bastión sería ${N.ambito(masB.dl, m.b)} (${num(masB.r.c.bastion)} de ${num(masB.r.n)})` : ''}${
      masD ? ` y donde habría más en disputa, ${N.ambito(masD.dl, m.b)} (${num(masD.r.disp)} de ${num(masD.r.n)}).` : '.'
    }`
  }
  const hayExtrema = distritos.some((dl) => datosDistrito(m, dl).extrema)
  const mk = marcas().probabilidad_extrema
  return (
    <Seccion n={1} titulo={m.d ? `¿Cómo queda ${m.amb}?` : '¿Cómo se reparten por distrito?'} texto={texto}>
      {m.u ? (
        <Leyenda
          barra
          items={CLASES.map((k) => ({ t: nomClase(k), color: colorClase(k) }))}
          nota={`Barra de arriba = número de secciones según quién va delante (${POR_COAL}) · barra de abajo = % de voto válido por partido (mediana del motor en el distrito)`}
        />
      ) : null}
      <LeyendaPartidos boleta={m.b} />
      <RotuloCandidatura boleta={m.b} chico />
      {distritos.map((dl) => (
        <Distrito key={dl} m={m} dl={dl} />
      ))}
      {hayExtrema && mk ? <Nota doce>{limpia(mk.texto)}</Nota> : null}
      {m.d ? (
        <Chips
          items={[
            { t: `Ver los ${N.DISTRITOS.length} distritos`, icono: 'capas', onClick: () => onDistrito('') },
            ...(N.DISTRITOS as string[]).filter((dl) => dl !== m.d).map((dl) => ({ t: dCorto(dl, m.b), clave: dl, onClick: () => onDistrito(dl) })),
          ]}
        />
      ) : null}
    </Seccion>
  )
}
