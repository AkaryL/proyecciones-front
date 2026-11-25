import type { CSSProperties } from 'react'
import { Icon } from '../icons/Icon'
import type { IconName } from '../icons/iconPaths'
import './ui.css'

type IconBadgeProps = {
  icon: IconName
  /** Diámetro del círculo (px del diseño). */
  size: number
  /** Lado del ícono (px del diseño). */
  iconSize: number
  /** Fondo: degradado de marca (por defecto) o un tono sólido. */
  tone?: 'brand' | 'mc' | 'morena' | 'teal' | 'deep'
  className?: string
}

/** Círculo con ícono blanco centrado. */
export function IconBadge({ icon, size, iconSize, tone = 'brand', className }: IconBadgeProps) {
  return (
    <span
      className={`icon-badge icon-badge--${tone}${className ? ` ${className}` : ''}`}
      style={{ '--size': size, '--icon': iconSize } as CSSProperties}
    >
      <Icon name={icon} />
    </span>
  )
}
