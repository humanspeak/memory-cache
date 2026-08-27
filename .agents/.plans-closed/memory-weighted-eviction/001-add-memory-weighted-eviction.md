# Plan 001: Add weight-bounded LRU eviction and document it end to end

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan in
> the `README.md` alongside this file unless a reviewer dispatched you and told
> you they maintain the index.
>
> **Drift check (run first)**:
> `git diff --stat 5e2574f..HEAD -- src/cache.ts src/cache.lru.test.ts src/cache.statistics.test.ts src/cache.decorator.test.ts README.md docs/src/routes docs/src/lib/compare-data.ts docs/src/lib/examples`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED
- **Depends on**: none
- **Category**: direction
- **Planned at**: commit `5e2574f`, 2026-08-27

## Why this matters

`MemoryCache.maxSize` currently limits entry count, not memory-like cost. That
is sufficient when values are similarly sized, but the project explicitly
promotes API-response caching, where payload sizes can vary by orders of
magnitude. A cache holding at most 500 responses therefore has no meaningful
upper memory bound. Add opt-in weighted LRU eviction without changing the
meaning or defaults of `maxSize`, retain the zero-dependency/in-process model,
and teach the feature through the public docs and a website-native interactive
example.

The limit is deliberately called `maxWeight`, not `maxMemorySize`: JavaScript
cannot measure retained heap size accurately. Users define the unit through
`sizeCalculation`, so it may represent serialized bytes, rows, tokens, or an
application-specific cost. Documentation must describe it as a deterministic
user-supplied weight, not exact heap accounting.

## Current state

- `src/cache.ts` owns the full public API and implementation. `CacheOptions<T>`
  currently exposes only `maxSize`, `ttl`, and `hooks` (`src/cache.ts:98-126`).
- `src/cache.ts:224-227` stores only `value` and `timestamp` per entry. There is
  no per-entry weight or aggregate weight.
- `src/cache.ts:532-585` prunes expired entries and evicts at most one LRU entry
  before a new insert, based exclusively on `this.cache.size >= this.maxSize`.
- Every removal path is independent: lazy expiry in `read`
  (`src/cache.ts:382-418`), `delete`/`deleteAsync`/`clear` and bulk deletion
  (`src/cache.ts:602-725`), and queued expiry in `prune`
  (`src/cache.ts:886-930`). Weight accounting must be updated through one
  shared internal removal primitive or explicitly in every path; missing any
  path will make the aggregate drift.
- `CacheStats` currently reports `{ hits, misses, evictions, expirations,
size }` (`src/cache.ts:182-188`), and `src/cache.statistics.test.ts:15-23`
  asserts that exact shape.
- `CachedDecoratorOptions<T>` extends `CacheOptions<T>` and the decorator
  forwards cache options into `MemoryCache` (`src/cache.ts:155-159` and
  `src/cache.ts:987-1012`). Weighted configuration should therefore work for
  both synchronous and asynchronous decorated methods without a parallel
  implementation.
- Existing LRU behavior and hook expectations are concentrated in
  `src/cache.lru.test.ts`; use its `MemoryCache LRU Eviction` suites as the
  structural test pattern. Decorator coverage belongs in
  `src/cache.decorator.test.ts`.
- The README advertises API response caching (`README.md:21`) and documents
  `maxSize` as an entry limit (`README.md:192`). Preserve that wording and add
  the new options rather than redefining `maxSize`.
- The API-response guide configures `maxSize: 500` for heterogeneous JSON
  responses (`docs/src/routes/docs/examples/api-caching/+page.svx:20-63`). It
  is the primary real-world guide to update.
- The comparison page already calls this gap out honestly:
  `docs/src/lib/compare-data.ts:160-163` says Memory Cache has entry-count
  limits while `lru-cache` has computed byte-size limits. Update that row and
  its prose after the feature exists, while preserving `lru-cache`'s advantages
  in raw tuning and maturity.
- Interactive website examples follow a three-file pattern:
  `docs/src/routes/examples/lru-eviction/+page.ts` supplies page metadata,
  `docs/src/routes/examples/lru-eviction/+page.svelte` composes
  `ExampleV2`/`CodeReferenceV2`, SEO, breadcrumbs, notes, and source links, and
  `docs/src/lib/examples/lru-eviction/demos/Default.svelte` contains the live
  responsive demo. Match this architecture and its design tokens
  (`--brut-bg`, `--brut-ink`, `--brut-rule`, `--brut-accent`).
- `docs/src/routes/examples/+page.ts:8-26` provides human-written titles and
  descriptions for routes discovered from the generated sitemap. Adding the
  route and its entry makes the index and `ExamplePager` discover it; do not
  hand-edit generated manifests.
- `docs/vite.config.ts:25-90` generates sitemap data, demo code loaders, mirrors,
  LLM files, and social cards during builds. Those outputs are ignored by Git
  and must not be committed.
- `.trunk/trunk.yaml` exists and enables the repository's lint suite. `trunk
check` and `trunk fmt` are authoritative, even though package-level lint and
  format scripts also exist.

### Required public semantics

Implement this exact contract unless a STOP condition applies:

```ts
export type CacheOptions<T = unknown> = {
    maxSize?: number
    maxWeight?: number
    sizeCalculation?: (value: T, key: string) => number
    ttl?: number
    hooks?: CacheHooks<T>
}

export type CacheStats = {
    hits: number
    misses: number
    evictions: number
    expirations: number
    size: number
    weight: number
}
```

- `maxSize` remains the entry-count limit, defaults to `100`, and `0` remains
  unlimited. Existing behavior must not change when weighted options are absent.
- `maxWeight` defaults to `0`, meaning no weight limit. A positive value requires
  `sizeCalculation`; construction without it throws `CacheConfigError` with a
  direct, tested message. Negative or `NaN` `maxWeight` values also throw
  `CacheConfigError`. Preserve the existing acceptance of `Infinity` for
  `maxSize`; do not use this feature to redesign legacy validation.
- `sizeCalculation(value, key)` runs exactly once per `set` attempt when
  `maxWeight > 0`. Its return value must be a finite, non-negative number;
  otherwise `set` throws `RangeError` and leaves the cache, LRU order, stats,
  aggregate weight, expiration queue, and hooks unchanged. If the callback
  itself throws, propagate that error with the same no-mutation guarantee.
- Store the calculated weight on the cache entry and maintain a private
  aggregate. `getStats().weight` reports the current aggregate after pruning,
  and is `0` when weighted mode is disabled or the cache is empty. Weight is a
  current gauge and is not reset by `resetStats()`.
- On a new insert, prune expired entries first when either active limit would
  be exceeded, then evict LRU entries in a loop until both the entry-count and
  aggregate-weight constraints can accept the new entry. Each removed entry is
  one normal eviction: increment `stats.evictions` and call `onEvict` once.
- Updating an existing key calculates and validates the new weight before any
  mutation, subtracts the old weight from the projected total, moves the key to
  MRU, and may evict other LRU entries until the replacement fits. The updated
  key must not evict itself while making room.
- If one value's calculated weight exceeds `maxWeight`, do not cache it. For a
  new key, leave the cache unchanged and emit no hooks. For an existing key,
  remove the old cached value as an eviction (increment the eviction counter and
  emit `onEvict`) so a subsequent `get` cannot return stale data. `set` remains
  `void`; `getOrSet` and decorated methods still return the freshly computed
  value, but it will miss again next time.
- Deletion, bulk deletion, clear, lazy expiration, queued pruning, and eviction
  all subtract exactly the stored entry weight. Aggregate weight must never be
  negative; do not paper over accounting errors with repeated recalculation on
  every `getStats()` call.
- `maxSize` and `maxWeight` are independent and may be used together. The cache
  evicts until both constraints hold. Because `maxSize` still defaults to 100,
  users wanting only a weight limit must explicitly set `maxSize: 0`; document
  this prominently.
- `onEvict` continues using its existing context. Update its documentation from
  "due to maxSize" to "due to entry-count or weight limits"; do not add a
  breaking discriminator in this plan.

## Commands you will need

| Purpose               | Command                                      | Expected on success                                       |
| --------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Focused unit tests    | `pnpm test:only -- src/cache.weight.test.ts` | exit 0 after implementation                               |
| All unit tests        | `pnpm test:only`                             | all tests pass                                            |
| Library typecheck     | `pnpm check`                                 | exit 0, no TypeScript errors                              |
| Library build         | `pnpm build`                                 | exit 0 and declarations emit                              |
| Docs typecheck        | `pnpm --filter docs check`                   | exit 0, no Svelte errors                                  |
| Docs production build | `pnpm --filter docs exec vite build`         | exit 0; route, demo manifest, mirrors, and cards generate |
| Lint                  | `trunk check`                                | exit 0                                                    |
| Format changed files  | `trunk fmt <paths...>`                       | exit 0; only named files change                           |

Dependencies are already installed in this workspace. Do not run an install
unless a command fails specifically because dependencies are missing; if that
happens, stop and ask before modifying the lockfile.

## Scope

**In scope** (the only source files you should modify or create):

- `src/cache.ts`
- `src/cache.weight.test.ts` (create)
- `src/cache.statistics.test.ts`
- `src/cache.decorator.test.ts`
- `README.md`
- `docs/src/routes/docs/getting-started/+page.svx`
- `docs/src/routes/docs/api/memory-cache/+page.svx`
- `docs/src/routes/docs/api/cached-decorator/+page.svx`
- `docs/src/routes/docs/examples/api-caching/+page.svx`
- `docs/src/lib/compare-data.ts`
- `docs/src/routes/examples/+page.ts`
- `docs/src/routes/examples/+page.svelte`
- `docs/src/routes/examples/memory-weighted-eviction/+page.ts` (create)
- `docs/src/routes/examples/memory-weighted-eviction/+page.svelte` (create)
- `docs/src/lib/examples/memory-weighted-eviction/demos/Default.svelte` (create)
- `.agents/.plans/memory-weighted-eviction/README.md` (status update only)

**Generated but ignored outputs** may be produced by the docs build but must not
be force-added or edited: `docs/src/lib/demo-loaders.ts`,
`docs/src/lib/demo-manifest.json`, `docs/src/lib/demo-virtual.d.ts`,
`docs/src/lib/sitemap-manifest.json`, `docs/static/docs/`,
`docs/static/examples/`, `docs/static/examples.md`, `docs/static/llms*.txt`, and
`docs/static/social-cards/`.

**Out of scope** (do not touch):

- `.competitive-intel/state.json` — it has an unrelated pre-existing working
  tree modification and is maintained by the competitive-intelligence process.
- Renaming or changing the semantics/default of `maxSize`.
- Exact JavaScript heap measurement, recursive object-size estimation, or a
  built-in `JSON.stringify` default calculator.
- Per-entry TTL, stale-while-revalidate, persistence, distributed caching, or
  pluggable backends.
- A new hook type or breaking changes to existing hook contexts.
- Dependencies or lockfiles; this feature must remain zero-dependency.
- Manually editing generated docs-kit manifests, mirrors, LLM files, or images.

## Git workflow

- Branch: `feat/memory-weighted-eviction` from a fresh `origin/main`. Preserve
  and do not stage the existing `.competitive-intel/state.json` modification.
- Use conventional commits matching history, for example
  `feat(cache): add memory-weighted eviction` and
  `docs: document memory-weighted eviction` if splitting implementation and
  documentation. A single coherent `feat(cache): add memory-weighted eviction`
  commit is also acceptable.
- Stage files explicitly. Do not use `git add .`.
- Do not push or open a pull request unless the operator asks.

## Steps

### Step 1: Add failing weighted-eviction characterization tests

Create `src/cache.weight.test.ts`, modeled on `src/cache.lru.test.ts`. Write
tests against the required public semantics before adding the options to
`CacheOptions`:

1. Weighted inserts evict one LRU entry when total weight would exceed the
   limit.
2. One heavy insertion evicts multiple LRU entries until it fits.
3. A recent `get` protects an entry, proving eviction remains LRU rather than
   largest-first.
4. `maxSize` and `maxWeight` operate simultaneously.
5. `maxSize: 0` permits weight-only operation.
6. Updating a key adjusts its stored weight, moves it to MRU, and does not evict
   itself while making room.
7. `sizeCalculation` receives the original value and key and runs once per set.
8. A new oversized entry is not cached and does not disturb existing entries;
   an oversized replacement removes the old entry and emits one eviction.
9. A throwing calculator and invalid results (`-1`, `NaN`, `Infinity`) leave all
   observable state and hooks unchanged.
10. Constructor validation rejects negative/`NaN` `maxWeight` and a positive
    `maxWeight` without `sizeCalculation`.
11. Every removal path (`delete`, `deleteAsync`, `clear`, `deleteByPrefix`,
    `deleteByMagicString`, lazy expiry through `get`/`has`, and `prune`) reduces
    `getStats().weight` exactly.
12. Eviction hooks and counters fire once per entry during a multi-eviction.
13. Existing count-only behavior is unchanged when weighted options are absent.

Use small integer weights rather than serialized strings so expected totals are
unambiguous. It is acceptable for this new file not to typecheck before the
implementation because the options do not exist yet.

**Verify**:
`pnpm test:only -- src/cache.weight.test.ts` → FAILS because `maxWeight`,
`sizeCalculation`, and `CacheStats.weight` are absent or weighted eviction does
not occur. If it passes without implementation, stop: the test is not exercising
the missing behavior.

### Step 2: Implement validated weight accounting and LRU eviction

Update `src/cache.ts` to implement the required contract. Prefer small private
helpers so every removal path shares the same accounting rules. A suitable
shape is:

- Extend `CacheEntry` with `weight: number`.
- Add private `maxWeight`, optional `sizeCalculation`, and `totalWeight` fields.
- Add a non-hooking internal delete/accounting primitive that returns the
  removed entry; public operations remain responsible for their existing hook
  and statistic semantics.
- Add a private eviction primitive that removes one key, decrements weight,
  increments `evictions`, and calls `onEvict`.
- Calculate and validate the candidate weight at the beginning of `set`, before
  pruning or changing LRU order. For weighted mode, do not call the calculator
  again for the same set attempt.
- Compute projected count/weight and prune only when an active constraint would
  be exceeded. After pruning, evict in a `while` loop based on both constraints.
  During updates, exclude the existing key's old weight from the projection and
  never select that key as an eviction candidate.
- Store the precomputed weight with the final entry and add it to
  `totalWeight`. Unweighted entries store `0`.
- Route all deletion and expiration paths through accounting so the aggregate
  cannot drift.
- Add `weight` to `CacheStats` and return it from `getStats()` after the existing
  pruning call. Do not reset it in `resetStats()`.
- Update all JSDoc for `CacheOptions`, constructor validation, `CacheStats`,
  `set`, `onEvict`, and class behavior. Include a short `maxWeight` example and
  state that units come from the calculator.

Do not introduce `any`; where unavoidable in existing decorator tests, use the
repository-required `// trunk-ignore(...)` convention, never
`eslint-disable`.

**Verify**:
`pnpm test:only -- src/cache.weight.test.ts` → all new weighted tests PASS.

### Step 3: Update existing statistics and decorator coverage

Update `src/cache.statistics.test.ts` so exact `CacheStats` shape assertions
include `weight: 0`. Add a test proving weight is a live gauge that survives
`resetStats()` and reaches zero after `clear()`.

Add focused coverage to `src/cache.decorator.test.ts` for both a synchronous and
an asynchronous decorated method configured with `maxSize: 0`, `maxWeight`, and
`sizeCalculation`. Demonstrate that results are evicted by calculated weight and
that an oversized result is returned to the caller but not memoized. Keep these
tests near the existing `maxSize` decorator suites.

**Verify**:
`pnpm test:only -- src/cache.statistics.test.ts src/cache.decorator.test.ts src/cache.weight.test.ts`
→ all selected tests PASS.

### Step 4: Update README and reference documentation

Update all in-scope written documentation to use one consistent vocabulary:
"weighted eviction," "aggregate weight," `maxWeight`, and
`sizeCalculation(value, key)`. Never claim automatic or exact heap-byte
measurement.

- `README.md`: add weighted eviction to Features; extend the constructor option
  table and `CacheStats` example; add a concise API-response example using
  serialized UTF-8 byte length where available (use a browser/Node-compatible
  calculation or clearly label a simplified calculator); explain using
  `maxSize: 0` for weight-only limits; document oversized entries and calculator
  validation.
- `docs/src/routes/docs/getting-started/+page.svx`: introduce the two options in
  its option table and show a minimal configuration.
- `docs/src/routes/docs/api/memory-cache/+page.svx`: fully specify defaults,
  validation, combined-limit behavior, updates, multi-eviction, oversized
  entries, `getStats().weight`, hook behavior, and the fact that calculator units
  are application-defined.
- `docs/src/routes/docs/api/cached-decorator/+page.svx`: list the inherited
  options and show a weighted decorator example, including the behavior of an
  oversized returned value.
- `docs/src/routes/docs/examples/api-caching/+page.svx`: replace the misleading
  count-only memory-safety implication with a realistic weighted API cache.
  Include a response-size field or calculator whose cost is deterministic in
  both Node and browser environments.
- `docs/src/lib/compare-data.ts`: change the `Size-Aware Eviction` row to say
  both libraries support computed weight, while distinguishing API names and
  maturity. Remove "Byte-size-aware eviction" from `lru-cache`-only pros and
  update the verdict so it no longer says users must choose `lru-cache` for
  byte-accurate bounds. Continue to credit `lru-cache` for its broader controls
  and tuning.

Search the repository for claims that `maxSize` bounds memory or that Memory
Cache lacks weighted eviction. Only modify matches in the explicit scope; if a
material stale claim exists outside it, stop and report the path.

**Verify**:

```sh
rg -n "maxWeight|sizeCalculation|aggregate weight|weighted eviction" README.md docs/src/routes/docs docs/src/lib/compare-data.ts
```

Expected: the new API and semantics appear in the README, getting started, both
API references, API-caching guide, and comparison data; the comparison no
longer describes weighted eviction as exclusive to `lru-cache`.

### Step 5: Build the website-native interactive example

Create `/examples/memory-weighted-eviction` by matching the architecture and
visual language of `/examples/lru-eviction`:

- Add metadata in
  `docs/src/routes/examples/memory-weighted-eviction/+page.ts`.
- Add the page composition in
  `docs/src/routes/examples/memory-weighted-eviction/+page.svelte` using
  `ExampleV2`, `CodeReferenceV2`, `formatSheetLabel`, breadcrumb/SEO contexts,
  `demoCodeSample`, notes with Lucide icons, and the canonical source URL. Set
  `seo.h1`, a unique `seo.ogSlug = 'examples-memory-weighted-eviction'`, a useful
  description, tagline, and four feature labels.
- Build the live demo in
  `docs/src/lib/examples/memory-weighted-eviction/demos/Default.svelte` using the
  actual workspace `MemoryCache` implementation. Model styling on the LRU demo:
  brutalist panels, repository CSS variables, monospace telemetry, visible LRU
  to MRU order, keyboard-accessible buttons, and responsive behavior.
- Seed differently weighted API-response-like records (for example 1, 2, and 4
  KiB logical payloads). Provide controls to add/select weights and adjust
  `maxWeight`; display current aggregate weight versus limit, entry count, LRU
  and MRU keys, eviction count, and an eviction log populated from `onEvict`.
  The user must be able to trigger a single insert that evicts multiple entries.
- Include reset and entry-access controls. Accessing an entry must call
  `cache.get(key)` and visibly move it to MRU, demonstrating that policy remains
  LRU even though capacity is weighted.
- Use `getStats().weight` for aggregate telemetry rather than duplicating the
  cache's accounting in the demo. It is fine for display records to retain their
  known logical weights for labels.
- Add the slug/title/description to `EXAMPLES` in
  `docs/src/routes/examples/+page.ts`. Update the examples index SEO description,
  `ogFeatures`, and hero copy in `docs/src/routes/examples/+page.svelte` so the
  new feature is discoverable. Do not hard-code pager entries; sitemap discovery
  handles them.
- The page notes and displayed code must explain that weights are user-defined,
  show `maxSize: 0` for a weight-only cache, and distinguish weighted LRU from
  evicting the physically largest item.

Keep the demo self-contained in one Svelte file unless it exceeds roughly the
size/complexity of the existing LRU demo; if it needs additional components,
stop and propose the new paths before expanding scope.

**Verify**:

1. `pnpm --filter docs check` → exit 0 with no Svelte/type errors.
2. `pnpm --filter docs exec vite build` → exit 0; output confirms discovery of
   `/examples/memory-weighted-eviction`, its demo source, mirror, and social card.
3. Inspect the generated ignored sitemap and demo loader with:
   `rg -n "memory-weighted-eviction" docs/src/lib/sitemap-manifest.json docs/src/lib/demo-loaders.ts`
   → both files contain the new slug/path. Do not stage those generated files.

### Step 6: Run the complete verification gate

Format only the in-scope files, then run the complete library, docs, and Trunk
checks. A docs build may recreate ignored generated files; leave them ignored.

**Verify**:

```sh
pnpm test:only
pnpm check
pnpm build
pnpm --filter docs check
pnpm --filter docs exec vite build
trunk check
git status --short
```

Expected: every command exits 0. `git status --short` shows only the explicitly
in-scope source changes plus the pre-existing unstaged
`.competitive-intel/state.json`; it does not show lockfile changes or staged
generated files.

## Test plan

- The red-first anchor is `src/cache.weight.test.ts`: its initial tests fail
  because the current cache has no weighted options or accounting. They become
  green only after the implementation enforces aggregate limits.
- Cover weighted single/multiple eviction, LRU ordering, combined constraints,
  weight-only mode, updates, one calculator call, invalid calculators, oversized
  new/replacement entries, all removal and expiration paths, hook/stat counts,
  and legacy count-only compatibility.
- Extend exact statistics assertions and test that `weight` is a gauge rather
  than a resettable counter.
- Cover synchronous and asynchronous decorators, including returned-but-not-
  memoized oversized values.
- Model unit-test organization and fake-timer handling after
  `src/cache.lru.test.ts`; model decorator tests after the existing `maxSize`
  contexts in `src/cache.decorator.test.ts`.
- Verification: `pnpm test:only` passes the entire suite, including the new
  weight test file.

## Done criteria

- [ ] `maxSize` retains its existing API, default, and count-only behavior.
- [ ] `CacheOptions<T>` exposes `maxWeight` and typed
      `sizeCalculation(value, key)` with the required validation.
- [ ] Weighted inserts and updates evict LRU entries until both active limits
      hold, including multiple evictions from one set.
- [ ] Oversized and invalid-calculator behavior matches the required semantics
      and is tested.
- [ ] Every removal/expiration path maintains exact aggregate weight.
- [ ] `CacheStats.weight` reports the current post-prune aggregate and survives
      `resetStats()`.
- [ ] Direct cache, hook, stats, sync decorator, and async decorator tests exist
      and pass.
- [ ] README, getting-started docs, both API references, API-caching guide, and
      comparison content describe the feature consistently.
- [ ] `/examples/memory-weighted-eviction` exists, uses the actual cache API,
      matches the established `ExampleV2` website pattern, is responsive and
      accessible, and can demonstrate both LRU protection and multi-eviction.
- [ ] `pnpm test:only`, `pnpm check`, `pnpm build`,
      `pnpm --filter docs check`, `pnpm --filter docs exec vite build`, and
      `trunk check` all exit 0.
- [ ] No dependency or lockfile changes exist.
- [ ] No ignored/generated docs-kit artifacts are staged.
- [ ] No files outside Scope are modified except the pre-existing unstaged
      `.competitive-intel/state.json`.
- [ ] `.agents/.plans/memory-weighted-eviction/README.md` marks this plan DONE.

## STOP conditions

Stop and report back; do not improvise if:

- In-scope implementation or website patterns have materially changed since
  commit `5e2574f`.
- Correct accounting appears to require changing the public `set` return type,
  hook context shapes, or `maxSize` semantics.
- The decorator does not actually forward the new `CacheOptions` after the type
  extension, requiring a separate cache implementation.
- A material stale weighted-eviction claim is found outside the explicit source
  scope.
- The demo requires a new dependency or changes to docs-kit.
- The demo cannot use `getStats().weight` without maintaining a second source of
  truth for aggregate weight.
- Formatting or builds modify tracked/generated files outside Scope.
- Any verification fails twice after a reasonable correction.

## Maintenance notes

- Reviewers should scrutinize accounting on updates and expiration, and confirm
  the calculator is called once before mutation. Those are the easiest places
  for aggregate drift or partial state changes.
- Any future removal path added to `MemoryCache` must go through the shared
  accounting primitive. Add that requirement to the helper's comment.
- Weight units are contractual only within a cache instance. Mixing bytes and
  arbitrary costs in one calculator makes the limit meaningless; docs should
  continue to show one stable unit.
- `maxSize` defaults to 100 even in weighted mode. Future API changes must not
  silently disable that limit when `maxWeight` is present.
- A future `maxEntryWeight` option or eviction-reason discriminator may be useful
  but is intentionally deferred to keep this release additive and focused.
- `.competitive-intel/state.json` should be reconciled by its owning digest
  workflow after the feature ships, not manually in this implementation.
