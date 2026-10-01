# Okey 101 Optimizer

A web app for the Turkish tile game **Okey 101**. Enter your tiles and it finds the best way to arrange your rack:

- **Meld opening:** the sets (per) and runs (seri) worth the most points, and whether you reach 101.
- **Pairs opening:** how many pairs (çift) you have; 5 opens.
- **Leftover penalty:** the smallest value you can be left holding (an unplayed okey counts 101).
- **Discard suggestion:** with 22 tiles, the best tile to throw away, for melds and for pairs.
- **Auto-sort:** lays out the rack with melds (or pairs) grouped and the rest sorted.

Rules: the okey is indicator + 1 in the same color (13 → 1). False okeys play as the okey's face. Runs don't wrap from 13 to 1.

## Development

Requires Node 22+ and pnpm (`corepack enable pnpm`).

```sh
pnpm install
pnpm dev        # start the app
pnpm test       # run engine tests
pnpm build      # typecheck + production build
pnpm lint
```

## Layout

- `src/engine/`: game logic in pure TypeScript, with no React
  - `tiles.ts`: tile model, okey resolution, copy limits
  - `solver.ts`: memoized search for the best melds (points or penalty objective)
  - `pairs.ts`, `discard.ts`, `layout.ts`: pairs, discard ranking, rack layout
  - `analyze.ts`: combines everything; runs in a Web Worker (`worker.ts`, `client.ts`)
- `src/components/`: pickers, rack, results panel
