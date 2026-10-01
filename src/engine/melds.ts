import type { Face } from './tiles'

export interface MeldTile {
  /** Face the tile plays as. For jokers, the face it stands in for. */
  face: Face
  joker: boolean
}

/** A set (per): same number, distinct colors. A run (seri): same color, consecutive numbers. */
export interface Meld {
  kind: 'set' | 'run'
  tiles: MeldTile[]
}

/** Points a meld counts toward the 101 opening; jokers count as the tile they replace. */
export function meldPoints(m: Meld): number {
  return m.tiles.reduce((sum, t) => sum + t.face.n, 0)
}

export function isValidMeld(m: Meld): boolean {
  const faces = m.tiles.map((t) => t.face)
  if (faces.length < 3) return false
  if (m.kind === 'set') {
    const colors = new Set(faces.map((f) => f.color))
    return faces.length <= 4 && colors.size === faces.length && faces.every((f) => f.n === faces[0].n)
  }
  // Runs never wrap from 13 back to 1.
  return faces.every((f, i) => f.color === faces[0].color && f.n === faces[0].n + i)
}
