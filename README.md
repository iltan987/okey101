# Okey 101 Optimizer

A web app for the Turkish tile game **Okey 101**. Enter your tiles and it finds the best way to arrange your rack:

- **Meld opening:** the sets (per) and runs (seri) worth the most points, and whether you reach the opening threshold (101).
- **Pairs opening:** how many pairs (çift) you have; 5 opens.
- **Leftover penalty:** the smallest value you can be left holding (an unplayed okey counts 101).
- **Discard suggestion:** with 22 tiles, the best tile to throw away (one tap to discard it).
- **Auto-sort:** lays out the rack with melds (or pairs) grouped and the rest sorted.
- **After opening (işleme):** enter the melds on the table and it plans what to lay off where, new melds or pairs, and okeys you can take from the table, minimizing what's left in hand.
- **Undo** for every change (Geri al / Ctrl+Z).

The okey is indicator + 1 in the same color (13 → 1), and false okeys play as the okey's face. Table rules vary, so they're configurable under **Kurallar**:

| Rule | Default |
|---|---|
| Points to open with melds / pairs to open | 101 / 5 |
| Okey penalty in hand / pairs opener's penalty | 101 / ×2 |
| 12-13-1 runs | off |
| Okey can complete a pair | on |
| Lay off on the turn you open | on |
| Max tiles laid off per run end per turn (0 = no limit) | 2 |
| Pairs opener may lay down new melds | off |
| Suggest taking okeys from the table | on |

## Development

Requires Node 22+ and pnpm (`corepack enable pnpm`).

```sh
pnpm install
pnpm dev        # start the app
pnpm test       # run engine tests
pnpm build      # typecheck + production build
pnpm lint
```

Pushing to `main` deploys to Vercel.

## Layout

- `src/engine/`: game logic in pure TypeScript, with no React
  - `tiles.ts`: tile model, okey resolution, copy limits
  - `rules.ts`: configurable table rules and defaults
  - `solver.ts`: memoized search for the best melds (points or penalty objective)
  - `pairs.ts`, `discard.ts`, `layout.ts`: pairs, discard ranking, rack layout
  - `table.ts`, `opened.ts`: table melds, and the lay-off / okey-swap planner after opening
  - `analyze.ts`: combines everything; runs in a Web Worker (`worker.ts`, `client.ts`)
- `src/components/`: pickers, rack, table, results and rules panels
