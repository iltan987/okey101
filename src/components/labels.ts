import type { Color, Face } from '../engine/tiles'

export const COLOR_NAMES: Record<Color, string> = {
  red: 'Kırmızı',
  yellow: 'Sarı',
  blue: 'Mavi',
  black: 'Siyah',
}

/** Turkish tile name, e.g. "Siyah 13". */
export function faceName(f: Face): string {
  return `${COLOR_NAMES[f.color]} ${f.n}`
}
