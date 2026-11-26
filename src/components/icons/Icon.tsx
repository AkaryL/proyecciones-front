import { EXTRA_ICONS, type ExtraIconName } from './extraIcons'
import { ICONS, type IconDef, type IconName } from './iconPaths'

type IconProps = {
  name: IconName | ExtraIconName
  className?: string
}

const ALL: Record<string, IconDef> = { ...ICONS, ...EXTRA_ICONS }

/**
 * Ícono vectorial: los del diseño (iconPaths.ts) y los pocos que se añadieron
 * después (extraIcons.ts). Hereda el color con `currentColor` y su tamaño se
 * controla desde CSS (por defecto, el de su caja en el diseño).
 */
export function Icon({ name, className }: IconProps) {
  const icon = ALL[name]
  return (
    <svg
      className={className ? `icon ${className}` : 'icon'}
      viewBox={`0 0 ${icon.w} ${icon.h}`}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      {icon.paths.map((path, index) =>
        path.fill ? (
          <path key={index} d={path.d} fill="currentColor" />
        ) : (
          <path
            key={index}
            d={path.d}
            stroke="currentColor"
            strokeWidth={path.sw}
            strokeLinecap={path.cap}
            strokeLinejoin={path.join}
          />
        ),
      )}
    </svg>
  )
}
