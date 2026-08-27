# Guard report — 001 add memory-weighted eviction

**Recommendation: PASS** — weighted LRU behavior, accounting, documentation,
and the live website example satisfy the plan with every automated gate green.
**Reviewed at** `3517b2c` · 2026-08-27 13:08 · **Plan planned at** `5e2574f`
**Integration** — snapshot committed on `seo/typescript-node-homepage`; PR not
opened because dispatch batch close leaves publication to the operator's next
decision.

## Done criteria

| Criterion                                                                         | Result | Evidence                                                                                                                                        |
| --------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `maxSize` retains its existing API, default, and count-only behavior              | met    | `src/cache.weight.test.ts:268`; full 276-test suite passed                                                                                      |
| `CacheOptions<T>` exposes validated `maxWeight` and `sizeCalculation(value, key)` | met    | `src/cache.ts:131-138`, `src/cache.ts:353-377`; constructor-validation tests passed                                                             |
| Inserts and updates evict LRU entries until both active limits hold               | met    | `src/cache.ts:610-680`; single-, multi-, combined-limit, and update tests passed                                                                |
| Oversized and invalid-calculator behavior matches the contract                    | met    | `src/cache.ts:611-626`; no-mutation and oversized tests passed                                                                                  |
| Every removal and expiration path maintains aggregate weight                      | met    | `src/cache.ts:417-443`, `src/cache.ts:697-817`, `src/cache.ts:981-1005`; removal-path tests passed                                              |
| `CacheStats.weight` is post-prune and survives `resetStats()`                     | met    | `src/cache.ts:934-963`; `src/cache.statistics.test.ts:147-162` passed                                                                           |
| Direct cache, hooks, stats, sync decorator, and async decorator coverage passes   | met    | `pnpm test:only` passed 11 files and 276 tests                                                                                                  |
| README, getting-started, API, API-caching, and comparison docs are consistent     | met    | `rg` found the new API across every named document; `docs/src/lib/compare-data.ts:160-163` no longer claims exclusivity for lru-cache           |
| Interactive example uses the actual API and demonstrates LRU and multi-eviction   | met    | live preview: 8 KiB insert produced weight 8/8, one entry, three evictions; protected-key scenario retained `api:1` and evicted `api:2`/`api:3` |
| Library tests, typecheck, and build pass                                          | met    | `pnpm test:only`, `pnpm check`, and `pnpm build` all exited 0                                                                                   |
| Docs typecheck and production build pass                                          | met    | `pnpm --filter docs check` reported 0 errors/0 warnings; Vite production build exited 0                                                         |
| Trunk lint passes                                                                 | met    | `trunk check` checked 19 modified files with no issues                                                                                          |
| No dependencies, lockfiles, or generated artifacts are staged                     | met    | scoped manifest/lockfile diff empty; `git status --short` clean after snapshot                                                                  |
| No source files outside plan Scope changed                                        | met    | `git diff --name-only b3c98bb..3517b2c` contains exactly the 15 in-scope files                                                                  |
| Batch status updated                                                              | met    | sibling `README.md` marks Plan 001 DONE and CLOSED                                                                                              |

## Spirit

The implementation solves the stated API-response-cache risk rather than only
adding configuration surface. It tracks one calculated weight per entry,
centralizes decrementing across every removal path, and repeatedly evicts by
recency until both count and aggregate-weight constraints hold. The docs avoid
claiming automatic heap measurement, and the live example makes the key product
distinction visible: capacity is weighted, but victims are still chosen by LRU,
not by largest value.

## Scope & conduct

- In-scope only? Yes; all 15 executor-touched files are explicitly listed in
  the plan, with no dependency, lockfile, generated-output, or competitive-state
  changes.
- STOP conditions respected? Yes; none were encountered or silently bypassed.
- Plan amendments during execution: none.
- Executor edited plan/guard artifacts? No.

## Residual risk / follow-ups

- The shared preview's resize operation timed out, so mobile appearance was not
  directly captured. Responsive breakpoints exist at 800 px and 540 px in
  `Default.svelte`, the docs compiler reports no errors, and desktop interaction
  was exercised successfully; a human mobile visual pass remains prudent before
  merge.
- The dev server emitted existing Node deprecation and listener-count warnings;
  neither affected compilation or runtime interaction.
- `maxSize` still defaults to 100 in weighted mode. Weight-only callers must
  continue to opt into `maxSize: 0`, as documented.
