import type { CSSProperties } from 'react'
import bannerDiputaciones from '../../assets/svg/hero-diputaciones-banner.svg'
import taglineDiputaciones from '../../assets/svg/hero-diputaciones-tagline.svg'
import titleDiputaciones from '../../assets/svg/hero-diputaciones-title.svg'
import bannerMapa from '../../assets/svg/hero-mapa-banner.svg'
import taglineMapa from '../../assets/svg/hero-mapa-tagline.svg'
import titleMapa from '../../assets/svg/hero-mapa-title.svg'
import bannerSimulacion from '../../assets/svg/hero-simulacion-banner.svg'
import taglineSimulacion from '../../assets/svg/hero-simulacion-tagline.svg'
import titleSimulacion from '../../assets/svg/hero-simulacion-title.svg'
import shadowHeroMapa from '../../assets/svg/shadow-hero-mapa.svg'
import shadowHero from '../../assets/svg/shadow-hero.svg'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/iconPaths'
import { Dropdown, type DropdownOption } from '../ui/Dropdown'
import { FitText } from './FitText'
import type { PageVariant } from './PageShell'
import './PageHero.css'

/** Rótulo vectorial del diseño: archivo y ancho de su lienzo (px del diseño). */
type Lettering = { src: string; width: number }

/**
 * Los tres rótulos del encabezado (título, franja y lema) se dibujan con los
 * trazos exactos del diseño; el texto real queda disponible para lectores de
 * pantalla y buscadores.
 */
const LETTERING: Partial<Record<PageVariant, { title: Lettering; banner: Lettering; tagline: Lettering }>> = {
  mapa: {
    title: { src: titleMapa, width: 998.4 },
    banner: { src: bannerMapa, width: 940.8 },
    tagline: { src: taglineMapa, width: 991.6 },
  },
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
  /** Título principal (p. ej. "PE 2027"). */
  title: string
  /** Texto de la franja con degradado. */
  banner: string
  chip?: HeroChip
}

const width = (lettering: Lettering) => ({ '--w': lettering.width }) as CSSProperties

function Chip({ chip }: { chip: HeroChip }) {
  const content = (
    <>
      <Icon name={chip.icon} />
      <span className={`hero__chip-text ${chip.font === 'helvetica' ? 'f-h-bold' : 'f-bold'}`}>{chip.text}</span>
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
  const art = LETTERING[variant]
  // Páginas sin rótulos en el diseño: mismo encabezado, con texto ajustado al ancho de la franja.
  if (!art) {
    return (
      <section className={`hero hero--${variant}`}>
        <h1 className="hero__title hero__title--text">
          <FitText className="hero__fit f-black" width={1034} max={140}>
            {title}
          </FitText>
        </h1>
        <img className="hero__shadow" src={shadowHero} alt="" aria-hidden="true" />
        <p className="hero__banner hero__banner--text">
          <FitText className="hero__fit f-bold" width={930} max={53}>
            {banner}
          </FitText>
        </p>
        <p className="hero__tagline">
          <span className="sr-only">{TAGLINE}</span>
          <img className="hero__lettering" src={taglineDiputaciones} style={{ '--w': 1012 } as CSSProperties} alt="" aria-hidden="true" />
        </p>
        {chip ? <Chip chip={chip} /> : null}
      </section>
    )
  }
  return (
    <section className={`hero hero--${variant}`}>
      <h1 className="hero__title">
        <span className="sr-only">{title}</span>
        <img className="hero__lettering" src={art.title.src} style={width(art.title)} alt="" aria-hidden="true" />
      </h1>
      <img className="hero__shadow" src={variant === 'mapa' ? shadowHeroMapa : shadowHero} alt="" aria-hidden="true" />
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
