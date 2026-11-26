import type { CSSProperties } from 'react'
import bannerDiputaciones from '../../assets/svg/hero-diputaciones-banner.svg'
import taglineDiputaciones from '../../assets/svg/hero-diputaciones-tagline.svg'
import titleDiputaciones from '../../assets/svg/hero-diputaciones-title.svg'
import taglineMapa from '../../assets/svg/hero-mapa-tagline.svg'
import bannerSimulacion from '../../assets/svg/hero-simulacion-banner.svg'
import taglineSimulacion from '../../assets/svg/hero-simulacion-tagline.svg'
import titleSimulacion from '../../assets/svg/hero-simulacion-title.svg'
import shadowHeroMapa from '../../assets/svg/shadow-hero-mapa.svg'
import shadowHero from '../../assets/svg/shadow-hero.svg'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/iconPaths'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { Swap } from '../ui/Swap'
import { FitLines, FitText } from './FitText'
import type { PageVariant } from './PageShell'
import './PageHero.css'

/** Rótulo vectorial del diseño: archivo y ancho de su lienzo (px del diseño). */
type Lettering = { src: string; width: number }

/**
 * Páginas cuyos tres rótulos (título, franja y lema) se dibujan con los trazos
 * exactos del diseño; el texto real queda disponible para lectores de pantalla
 * y buscadores.
 */
const LETTERING: Partial<Record<PageVariant, { title: Lettering; banner: Lettering; tagline: Lettering }>> = {
  diputaciones: {
    title: { src: titleDiputaciones, width: 1052 },
    banner: { src: bannerDiputaciones, width: 940 },
    tagline: { src: taglineDiputaciones, width: 1012 },
  },
  simulacion: {
    title: { src: titleSimulacion, width: 1016 },
    banner: { src: bannerSimulacion, width: 960 },
    tagline: { src: taglineSimulacion, width: 991.6 },
  },
}

/** Texto que se ajusta a un ancho (px del diseño) sin pasar de un cuerpo máximo. */
type Fit = { width: number; max: number }

/**
 * Páginas cuyo título y franja son texto: el título se ajusta al ancho de la
 * franja, como en el diseño, y el lema es el rótulo del PDF.
 *
 * - `mapa`: el diseño decía «PE 2027» sobre «PROYECCIONES ELECTORALES»; se pidió
 *   el nombre completo como título y el año en la franja. El título va en dos
 *   líneas del mismo cuerpo y del ancho de la franja, para conservar el bloque
 *   macizo que hacía el «PE 2027» del diseño; el año va algo más grande que el
 *   texto que llevaba la franja (58 px) para que no se pierda en ella.
 * - `documento`: páginas que no tienen pantalla en el diseño.
 */
const TEXT_HERO: Partial<Record<PageVariant, { title: Fit; banner: Fit; tagline: Lettering; shadow: string }>> = {
  mapa: {
    title: { width: 998.4, max: 170 },
    banner: { width: 940.8, max: 66 },
    tagline: { src: taglineMapa, width: 991.6 },
    shadow: shadowHeroMapa,
  },
  documento: {
    title: { width: 1034, max: 140 },
    banner: { width: 930, max: 53 },
    tagline: { src: taglineDiputaciones, width: 1012 },
    shadow: shadowHero,
  },
}

const TAGLINE = 'PANORAMA INTEGRAL GUADALAJARA'

/** Etiqueta bajo el lema (corte / escenario). Con `select` abre una lista para cambiar de escenario. */
export type HeroChip = {
  icon: IconName
  text: string
  /** Familia del texto en el diseño. */
  font: 'helvetica' | 'gotham'
  select?: {
    label: string
    options: DropdownOption<string>[]
    value: string
    onChange: (value: string) => void
  }
}

type PageHeroProps = {
  variant: PageVariant
  /**
   * Título principal (p. ej. "DIPUTACIONES 2027"). En las páginas con título de
   * texto puede venir en varias líneas: cada una se ajusta al ancho de la franja.
   */
  title: string | string[]
  /** Texto de la franja con degradado. */
  banner: string
  chip?: HeroChip
}

const width = (lettering: Lettering) => ({ '--w': lettering.width }) as CSSProperties

function Chip({ chip }: { chip: HeroChip }) {
  const content = (
    <>
      <Icon name={chip.icon} />
      {/* con otro escenario, el rótulo nuevo entra con un fundido */}
      <Swap as="span" key={chip.text} className={`hero__chip-text ${chip.font === 'helvetica' ? 'f-h-bold' : 'f-bold'}`}>
        {chip.text}
      </Swap>
    </>
  )
  if (!chip.select) {
    return (
      <div className="hero__chip">
        <div className="hero__chip--static">{content}</div>
      </div>
    )
  }
  return (
    <Dropdown className="hero__chip" {...chip.select}>
      {content}
    </Dropdown>
  )
}

export function PageHero({ variant, title, banner, chip }: PageHeroProps) {
  const lines = Array.isArray(title) ? title : [title]
  const fullTitle = lines.join(' ')
  const text = TEXT_HERO[variant]
  if (text) {
    return (
      <section className={`hero hero--${variant}`}>
        <h1 className="hero__title hero__title--text" aria-label={fullTitle}>
          <FitLines className="hero__fit f-black" lines={lines} width={text.title.width} max={text.title.max} tracking={-0.01} />
        </h1>
        <img className="hero__shadow" src={text.shadow} alt="" aria-hidden="true" />
        <p className="hero__banner hero__banner--text">
          <FitText className="hero__fit f-bold" width={text.banner.width} max={text.banner.max}>
            {banner}
          </FitText>
        </p>
        <p className="hero__tagline">
          <span className="sr-only">{TAGLINE}</span>
          <img className="hero__lettering" src={text.tagline.src} style={width(text.tagline)} alt="" aria-hidden="true" />
        </p>
        {chip ? <Chip chip={chip} /> : null}
      </section>
    )
  }

  const art = LETTERING[variant]
  if (!art) return null
  return (
    <section className={`hero hero--${variant}`}>
      <h1 className="hero__title">
        <span className="sr-only">{fullTitle}</span>
        <img className="hero__lettering" src={art.title.src} style={width(art.title)} alt="" aria-hidden="true" />
      </h1>
      <img className="hero__shadow" src={shadowHero} alt="" aria-hidden="true" />
      <p className="hero__banner">
        <span className="sr-only">{banner}</span>
        <img className="hero__lettering" src={art.banner.src} style={width(art.banner)} alt="" aria-hidden="true" />
      </p>
      <p className="hero__tagline">
        <span className="sr-only">{TAGLINE}</span>
        <img className="hero__lettering" src={art.tagline.src} style={width(art.tagline)} alt="" aria-hidden="true" />
      </p>
      {chip ? <Chip chip={chip} /> : null}
    </section>
  )
}
