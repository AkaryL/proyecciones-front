/**
 * Íconos que no vienen del PDF del diseño (iconPaths.ts se genera a partir de
 * él y no se edita a mano). Mismo formato: trazos en una caja de w × h.
 */
import type { IconDef } from './iconPaths'

export const EXTRA_ICONS = {
  /** Cerrar sesión: el marco de una puerta y una flecha que sale. */
  logout: {
    w: 24,
    h: 24,
    paths: [
      { d: 'M9.5 20.5L5.5 20.5C4.4 20.5 3.5 19.6 3.5 18.5L3.5 5.5C3.5 4.4 4.4 3.5 5.5 3.5L9.5 3.5', sw: 2, cap: 'round', join: 'round' },
      { d: 'M16 16.5L20.5 12L16 7.5M20.5 12L9 12', sw: 2, cap: 'round', join: 'round' },
    ],
  },
} satisfies Record<string, IconDef>

export type ExtraIconName = keyof typeof EXTRA_ICONS
