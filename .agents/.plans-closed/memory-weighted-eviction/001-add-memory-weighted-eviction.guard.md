# Guard log — 001 add memory-weighted eviction

## Checkpoint 1 — 2026-08-27 13:08 — ON TRACK

`3517b2c` · final close-out of runtime, tests, documentation, and interactive example

- All runtime gates reproduced: `pnpm test:only` passed 276/276 tests,
  `pnpm check` passed, and `pnpm build` emitted the library and declarations.
- All docs gates reproduced: `pnpm --filter docs check` reported 0 errors and
  0 warnings; `pnpm --filter docs exec vite build` generated the new route,
  demo chunk, mirrors, and social cards; `trunk check` reported no issues.
- Scope is exact: `git diff --name-only b3c98bb..3517b2c` lists only the 15
  planned implementation/docs files; dependency manifests, lockfile, plan, and
  competitive-intelligence state were untouched by the executor.
- Live behavior reproduced at `/examples/memory-weighted-eviction`: an 8 KiB
  insertion evicted all three seeded entries, and accessing `api:1` before a
  4 KiB insertion preserved it while evicting `api:2` and `api:3`.
- Action: none needed; final verdict PASS.
