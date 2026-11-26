/**
 * Piezas básicas del sistema de componentes del tablero (clases `pp-*` de
 * styles/tablero.css): iconos, etiquetas, chips, botones, secciones y rejillas.
 * Cada componente escribe el mismo marcado que su par del tablero original.
 */
import type { CSSProperties, ReactNode } from 'react'
import { T } from '../../../motor'
import { tip, tu } from './util'

/* ------------------------------------------------------------------ */
/* Iconos                                                              */
/* ------------------------------------------------------------------ */

const ICONOS = {
  alcaldia: <path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6" />,
  congreso: <path d="M4 10h16M6 10v9M10 10v9M14 10v9M18 10v9M3 21h18M12 3l9 5H3z" />,
  pin: (
    <>
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21z" />
      <circle cx="12" cy="9.5" r="2.5" />
    </>
  ),
  calendario: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </>
  ),
  trofeo: <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3" />,
  matraz: <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />,
  empate: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  flecha: <path d="M5 12h14M13 6l6 6-6 6" />,
  sube: <path d="M12 19V5M6 11l6-6 6 6" />,
  baja: <path d="M12 5v14M6 13l6 6 6-6" />,
  grupo: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 4.6a3.5 3.5 0 0 1 0 6.8M21.5 20a6.5 6.5 0 0 0-4-6" />
    </>
  ),
  capas: <path d="M12 3l9 5-9 5-9-5zM3 13l9 5 9-5" />,
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </>
  ),
  ojo: (
    <>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  agua: <path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.500 6-11 6-11z" />,
  prensa: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M7 9h6M7 13h10M7 16h7" />
    </>
  ),
  alerta: <path d="M12 3l10 18H2zM12 10v5M12 18v.5" />,
  boleta: <path d="M4 11h16v9H4zM8 11V4h8v7M10 7.5h4" />,
  diana: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  intercambio: <path d="M4 8h15M15 4l4 4-4 4M20 16H5M9 12l-4 4 4 4" />,
  balanza: <path d="M12 4v16M7 20h10M5 7h14M5 7l-3 6a3 3 0 0 0 6 0zM19 7l-3 6a3 3 0 0 0 6 0z" />,
  mapa: <path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14" />,
  chevron: <path d="M6 9l6 6 6-6" />,
  secciones: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="2" />
      <rect x="14" y="4" width="6" height="6" rx="2" />
      <rect x="4" y="14" width="6" height="6" rx="2" />
      <rect x="14" y="14" width="6" height="6" rx="2" />
    </>
  ),
} satisfies Record<string, ReactNode>

export type NombreIcono = keyof typeof ICONOS

/** Icono de trazo (hereda el color del texto). `tam` en px del tablero. */
export function Icono({ nombre, tam = 20 }: { nombre: string; tam?: number }) {
  const dibujo = (ICONOS as Record<string, ReactNode>)[nombre] ?? ICONOS.info
  return (
    <svg aria-hidden="true" style={tu({ width: tam, height: tam })} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      {dibujo}
    </svg>
  )
}

/** Círculo con degradado y un icono (o un texto corto) en blanco. */
export function Insignia({ icono, texto, tam = 40 }: { icono?: string; texto?: ReactNode; tam?: number }) {
  return (
    <span className={`pp-insignia${tam !== 40 ? ` pp-insignia--${tam}` : ''}`} aria-hidden="true">
      {texto != null ? texto : <Icono nombre={icono ?? 'info'} tam={tam >= 40 ? 20 : 16} />}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Textos chicos                                                       */
/* ------------------------------------------------------------------ */

/** Etiqueta de sección (píldora con degradado). */
export const Tag = ({ children }: { children: ReactNode }) => <span className="pp-tag">{children}</span>

export const Nota = ({ children, doce }: { children: ReactNode; doce?: boolean }) => (children ? <span className={`pp-nota${doce ? ' pp-nota--12' : ''}`}>{children}</span> : null)

export const Kicker = ({ children, variante = 'mono', estilo }: { children: ReactNode; variante?: 'mono' | 'chico' | ''; estilo?: CSSProperties }) => (
  <span className={`pp-kicker${variante ? ` pp-kicker--${variante}` : ''}`} style={estilo}>
    {children}
  </span>
)

/** Subtítulo dentro de una sección; `titulo` lo escribe como encabezado de verdad (<h3>). */
export const H3 = ({ children, titulo }: { children: ReactNode; titulo?: boolean }) => (titulo ? <h3 className="pp-h3">{children}</h3> : <span className="pp-h3">{children}</span>)

/** Columna con separación fija entre sus piezas (px del tablero). */
export const Col = ({ children, gap, id }: { children: ReactNode; gap?: number; id?: string }) => (
  <div id={id} className="pp-col" style={gap != null ? tu({ '--pp-gap': gap }) : undefined}>
    {children}
  </div>
)

/** Etiqueta chica junto a un rótulo. */
export const Etiqueta = ({ children, tipo }: { children: ReactNode; tipo?: 'ambar' | 'gris' | '' }) => <span className={`pp-etq${tipo ? ` pp-etq--${tipo}` : ''}`}>{children}</span>

/** Píldora ámbar de advertencia (por defecto, «PRELIMINAR»). */
export const Aviso = ({ children, grande, icono }: { children?: ReactNode; grande?: boolean; icono?: string }) => (
  <span className={`pp-aviso${grande ? ' pp-aviso--g' : ''}`}>
    {icono ? <Icono nombre={icono} tam={12} /> : null}
    {children ?? T.PRELIMINAR}
  </span>
)

/** Texto que no se parte en dos renglones (fechas, «D13 · S1»). */
export const SinCorte = ({ children }: { children: ReactNode }) => <span className="pp-nowrap">{children}</span>

/** Rótulo de un bloque que NO sigue los selectores de arriba. */
export const RotuloFijo = ({ children }: { children: ReactNode }) => <span className="pp-rotulo-fijo">{children}</span>

/** Nota de fuente al pie de un bloque. */
export const Fuente = ({ titulo, children }: { titulo?: string; children: ReactNode }) => (
  <p className="pp-fuente">
    {titulo ? <strong>{titulo}</strong> : null}
    {titulo ? ' ' : null}
    {children}
  </p>
)

/* ------------------------------------------------------------------ */
/* Chips y botones                                                     */
/* ------------------------------------------------------------------ */

export type ChipDef =
  | string
  | {
      t: ReactNode
      icono?: string
      /** `false` quita el punto teal. */
      punto?: boolean
      variante?: 'heroe' | 'gris' | 'mono'
      tip?: string | null
      /** Con `onClick` el chip es un botón (o un enlace, si además lleva `href`). */
      onClick?: () => void
      /** Con `href` el chip es un enlace (un ancla de la misma página: «#fue-metodo»). */
      href?: string
      /** Para que React distinga chips con el mismo texto. */
      clave?: string
    }

/** Chip blanco con punto teal; con `onClick`, un botón con la misma cara; con `href`, un enlace. */
export function Chip({ chip }: { chip: ChipDef }) {
  const c = typeof chip === 'string' ? { t: chip } : chip
  const dentro = (
    <>
      {'icono' in c && c.icono ? <Icono nombre={c.icono} tam={14} /> : ('punto' in c && c.punto === false) || ('variante' in c && c.variante) ? null : <i className="pp-chip__p" />}
      {c.t}
    </>
  )
  const clase = `pp-chip${'variante' in c && c.variante ? ` pp-chip--${c.variante}` : ''}`
  const titulo = 'tip' in c ? tip(c.tip) : {}
  if ('href' in c && c.href) {
    const alTocar = c.onClick
    return (
      <a
        className={clase}
        href={c.href}
        onClick={
          alTocar
            ? (ev) => {
                ev.preventDefault()
                alTocar()
              }
            : undefined
        }
        {...titulo}
      >
        {dentro}
      </a>
    )
  }
  if ('onClick' in c && c.onClick) {
    return (
      <button type="button" className={clase} onClick={c.onClick} {...titulo}>
        {dentro}
      </button>
    )
  }
  return (
    <span className={clase} {...titulo}>
      {dentro}
    </span>
  )
}

export const Chips = ({ items, children }: { items?: (ChipDef | null | undefined | false)[]; children?: ReactNode }) => (
  <div className="pp-chips">
    {(items ?? []).map((c, i) => (c ? <Chip key={typeof c === 'string' ? c : (c.clave ?? `${i}`)} chip={c} /> : null))}
    {children}
  </div>
)

/** Botón del tablero («Ver los grupos en Simulación →»). */
export const Boton = ({ children, onClick, variante }: { children: ReactNode; onClick?: () => void; variante?: 'noche' }) => (
  <button type="button" className={`pp-boton${variante ? ` pp-boton--${variante}` : ''}`} onClick={onClick}>
    {children}
  </button>
)

/** Chip del estado de un escenario según las noticias (ocurrió, en curso, posible, poco probable, referencia). */
export function EstadoChip({ estado }: { estado: string | null | undefined }) {
  if (estado == null || estado === '') return null
  const k = String(estado).trim().toLowerCase().replace(/ó/g, 'o').replace(/\s+/g, '-')
  return <span className={`pp-estado${['ocurrio', 'en-curso', 'posible', 'poco-probable', 'referencia'].includes(k) ? ` pp-estado--${k}` : ''}`}>{estado}</span>
}

/** Texto en letra de ancho fijo: nombres de archivo, huellas. */
export const Mono = ({ children }: { children: ReactNode }) => <span className="pp-mono">{children}</span>

/* ------------------------------------------------------------------ */
/* Secciones y rejillas                                                */
/* ------------------------------------------------------------------ */

type SeccionProps = {
  tag?: string
  /** Número de la insignia cuadrada (1, 2…). */
  n?: number | null
  titulo?: string
  texto?: ReactNode
  /** Párrafo de entrada en cuerpo grande. */
  grande?: boolean
  /** Lo que va a la derecha del título (filtros, un chip). */
  derecha?: ReactNode
  id?: string
  children?: ReactNode
}

/** Sección con su cabecera: etiqueta, insignia con número, título y párrafo de entrada. */
export function Seccion({ tag, n, titulo, texto, grande, derecha, id, children }: SeccionProps) {
  let h: ReactNode = titulo != null ? <h2 className="pp-h2">{titulo}</h2> : null
  if (h && n != null) {
    h = (
      <div className="pp-cab">
        <span className="pp-cab__n" aria-hidden="true">
          {n}
        </span>
        {h}
      </div>
    )
  }
  if (h && derecha) {
    h = (
      <div className="pp-cab pp-cab--extremos">
        {h}
        {derecha}
      </div>
    )
  }
  return (
    <section className="pp-sec" id={id}>
      {tag ? <Tag>{tag}</Tag> : null}
      {h}
      {texto != null ? <p className={`pp-lead${grande ? ' pp-lead--g' : ''}`}>{texto}</p> : null}
      {children}
    </section>
  )
}

/** Rejilla que se apila sola (`min` = ancho mínimo de columna en px del tablero). */
export const Rejilla = ({ children, min = 300, gap = 20 }: { children: ReactNode; min?: number; gap?: number }) => (
  <div className="pp-rej" style={tu({ '--pp-min': min, '--pp-gap': gap })}>
    {children}
  </div>
)

/** Columna ancha + columna lateral que cae debajo en pantallas chicas. */
export const DosColumnas = ({ principal, lado, base = 560, anchoLado = 280, gap = 18 }: { principal: ReactNode; lado: ReactNode; base?: number; anchoLado?: number; gap?: number }) => (
  <div className="pp-fila" style={tu({ '--pp-base': base, '--pp-base-lado': anchoLado, '--pp-gap': gap })}>
    <div className="pp-crece">{principal}</div>
    <div className="pp-lado">{lado}</div>
  </div>
)
