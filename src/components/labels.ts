import { sameFace, type Color, type Face, type HandTile } from '../engine/tiles'

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

/**
 * The physical tile to draw for a played face: the real okey for a joker, and a false okey
 * for a non-joker with the okey's face (that face's real copies are all jokers).
 */
export function tileFor(face: Face, joker: boolean, okey: Face): HandTile {
  if (joker) return { id: '', kind: 'face', ...okey }
  if (sameFace(face, okey)) return { id: '', kind: 'false' }
  return { id: '', kind: 'face', ...face }
}
