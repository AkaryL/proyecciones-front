import { ICONS, type IconDef, type IconName } from './iconPaths'

type IconProps = {
  name: IconName
  className?: string
}

/**
 * Ícono vectorial extraído del diseño. Hereda el color con `currentColor`
 * y su tamaño se controla desde CSS (por defecto, el de su caja en el diseño).
 */
export function Icon({ name, className }: IconProps) {
  const icon: IconDef = ICONS[name]
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
