import type { ComparisonOurs, Competitor } from '@humanspeak/docs-kit'

export type { ComparisonFeature, ComparisonOurs, Competitor } from '@humanspeak/docs-kit'

/**
 * Brand identity passed to `CompareIndexV2` + `ComparisonPageV2` on
 * every compare route. Keeping the literal here (not at each call site)
 * means changing the canonical URL once updates the index page, every
 * /compare/<slug> page, and the JSON-LD inside them.
 */
export const ours: ComparisonOurs = {
    name: 'Memory Cache',
    npmPackage: '@humanspeak/memory-cache',
    slug: 'memory-cache',
    url: 'https://memory.svelte.page'
}

const shared = {
    prosUs: [
        'Zero runtime dependencies — works in Node and the browser',
        'TypeScript-first with fully typed generics (MemoryCache<T>)',
        'TTL expiration and true LRU eviction in one cache — expired entries are pruned before any valid key is evicted',
        'Wildcard + prefix bulk invalidation (deleteByMagicString, deleteByPrefix)',
        '@cached decorator for method-level memoization — async-aware with in-flight de-duplication',
        'getOrSet() async fetch helper that de-duplicates concurrent lookups for the same key',
        'Lifecycle hooks (onHit, onMiss, onSet, onDelete, onExpire, onEvict) plus built-in getStats()',
        'Synchronous reads and writes — no await on the hot path'
    ],
    consUs: [
        'Smaller community (newer project)',
        'In-process only — no persistence or multi-process sharing by design',
        'TTL is configured per cache instance, not per entry'
    ]
}

export const competitors: Competitor[] = [
    {
        slug: 'vs-node-cache',
        name: 'node-cache',
        tagline: 'The Classic TTL Cache vs a Modern TypeScript Rewrite',
        description:
            'Compare node-cache and @humanspeak/memory-cache: two in-memory TTL caches for Node.js with different answers on LRU eviction, value cloning, TypeScript support, bulk invalidation, and method memoization.',
        github: 'https://github.com/node-cache/node-cache',
        npm: 'node-cache',
        type: 'In-Memory TTL Cache',
        approach: 'EventEmitter-based key-value store with a periodic expiry sweep (checkperiod)',
        features: [
            {
                name: 'Zero Dependencies',
                us: true,
                them: false,
                note: 'node-cache depends on clone because it deep-clones values on set and get by default (useClones), which also adds per-operation overhead.'
            },
            { name: 'TypeScript Support', us: 'Written in TypeScript', them: 'Bundled typings' },
            {
                name: 'TTL Expiration',
                us: 'Per cache instance',
                them: 'stdTTL + per-key override',
                note: 'node-cache lets ttl(key, ttl) override the default per key. Memory Cache sets one TTL per cache instance — create purpose-scoped caches for different lifetimes.'
            },
            {
                name: 'LRU Eviction',
                us: true,
                them: false,
                note: 'When node-cache reaches maxKeys, set() throws ECACHEFULL instead of evicting. Memory Cache evicts the least recently used key after pruning expired entries.'
            },
            {
                name: 'Bounded Memory',
                us: 'maxSize with LRU eviction',
                them: 'maxKeys (set() throws when full)'
            },
            {
                name: 'Wildcard / Prefix Deletion',
                us: 'deleteByMagicString + deleteByPrefix',
                them: false
            },
            {
                name: 'Method Memoization Decorator',
                us: '@cached, async-aware',
                them: false
            },
            {
                name: 'Async Fetch De-Duplication',
                us: 'getOrSet() collapses concurrent lookups',
                them: false
            },
            {
                name: 'Lifecycle Instrumentation',
                us: 'Six lifecycle hooks',
                them: 'EventEmitter events (set, del, expired, flush)'
            },
            {
                name: 'Built-In Statistics',
                us: true,
                them: true,
                note: 'Both track hits and misses. node-cache adds rough key/value size estimates; Memory Cache adds eviction and expiration counters.'
            },
            { name: 'Browser Support', us: true, them: 'Node-focused' },
            {
                name: 'Active Maintenance',
                us: true,
                them: 'Dormant (last release v5.1.2, 2020)'
            }
        ],
        ...shared,
        prosThem: [
            'Battle-tested with a huge install base and years of production use',
            'Per-key TTL overrides (ttl, getTtl) and take() for read-and-delete',
            'Value cloning by default isolates cached data from later mutations',
            'Batch operations (mget, mset) out of the box'
        ],
        consThem: [
            'No eviction policy — a full cache throws ECACHEFULL instead of making room',
            'Deep-clones values on every set and get by default, a real cost for large objects',
            'Dormant maintenance — no substantial release since 2020',
            'No bulk invalidation, memoization decorator, or TypeScript-native API'
        ],
        verdict:
            'node-cache is the incumbent for a reason: it is simple, stable, and everywhere, and its per-key TTL overrides are genuinely handy. But it has been dormant since 2020, clones every value by default, and throws when full instead of evicting. If you want a bounded cache that manages its own memory, typed generics, wildcard invalidation, and a @cached decorator, Memory Cache is the modern replacement. If you only need a tiny TTL map and already depend on node-cache, there is no urgent reason to switch.',
        keywords: [
            'node-cache alternative',
            'node-cache vs memory-cache',
            'in-memory cache node.js',
            'ttl cache typescript',
            'lru eviction node-cache',
            'node cache comparison'
        ]
    },
    {
        slug: 'vs-lru-cache',
        name: 'lru-cache',
        tagline: 'The Canonical LRU vs a Batteries-Included Cache',
        description:
            'Compare lru-cache and @humanspeak/memory-cache: the canonical LRU implementation against a TypeScript cache that layers wildcard invalidation, lifecycle hooks, statistics, and a @cached decorator on top of LRU + TTL.',
        github: 'https://github.com/isaacs/node-lru-cache',
        npm: 'lru-cache',
        type: 'LRU Cache',
        approach:
            'Highly optimized bounded map with recency tracking, size-aware eviction, and async fetch()',
        features: [
            { name: 'Zero Dependencies', us: true, them: true },
            {
                name: 'TypeScript Support',
                us: 'Written in TypeScript',
                them: 'Written in TypeScript'
            },
            {
                name: 'LRU Eviction',
                us: true,
                them: true,
                note: 'lru-cache is the canonical, heavily tuned implementation. Memory Cache prunes expired entries before evicting any valid least-recently-used key.'
            },
            {
                name: 'TTL Expiration',
                us: 'Per cache instance',
                them: 'Per cache + per-entry overrides',
                note: 'lru-cache also supports allowStale and updateAgeOnGet for finer recency/staleness control.'
            },
            {
                name: 'Size-Aware Eviction',
                us: 'Entry count + computed weight (maxSize + maxWeight / sizeCalculation)',
                them: 'Entry count + computed size (max + maxSize / sizeCalculation)',
                note: 'Both accept a user-supplied calculator. Memory Cache exposes aggregate weight in getStats(); lru-cache has broader size and disposal tuning.'
            },
            {
                name: 'Wildcard / Prefix Deletion',
                us: 'deleteByMagicString + deleteByPrefix',
                them: false
            },
            {
                name: 'Method Memoization Decorator',
                us: '@cached, async-aware',
                them: 'memo() method (no decorator)'
            },
            {
                name: 'Async Fetch De-Duplication',
                us: 'getOrSet() collapses concurrent lookups',
                them: 'fetch() with fetchMethod'
            },
            {
                name: 'Stale-While-Revalidate',
                us: false,
                them: 'allowStale + background fetch'
            },
            {
                name: 'Lifecycle Instrumentation',
                us: 'Six lifecycle hooks',
                them: 'dispose / onInsert callbacks'
            },
            {
                name: 'Built-In Statistics',
                us: 'getStats() aggregate counters',
                them: 'Opt-in per-call status tracking'
            },
            { name: 'Browser Support', us: true, them: true }
        ],
        ...shared,
        prosThem: [
            'The canonical LRU — extremely optimized and battle-tested at npm scale',
            'Broader size-calculation, disposal, and tuning controls',
            'Stale-while-revalidate patterns with allowStale and async fetch()',
            'Rich low-level controls (peek, dispose, updateAgeOnGet, per-entry TTL)'
        ],
        consThem: [
            'Lower-level API with many knobs to hold correctly',
            'No wildcard or prefix bulk invalidation',
            'Memoization is a method helper, not a decorator you can put on class methods',
            'No aggregate hit/miss statistics or lifecycle hook set out of the box'
        ],
        verdict:
            'Both libraries can enforce application-defined computed-weight bounds; neither automatically measures retained JavaScript heap. If your bottleneck is raw LRU throughput or you need stale-while-revalidate and extensive low-level tuning, lru-cache remains the reference implementation. Memory Cache adds a @cached decorator, wildcard invalidation, lifecycle hooks, and aggregate stats with a smaller API surface. Pick lru-cache for infrastructure-grade controls; pick Memory Cache when you want application-level caching that reads like TypeScript.',
        keywords: [
            'lru-cache alternative',
            'lru-cache vs memory-cache',
            'lru cache typescript',
            'lru cache decorator',
            'javascript cache library',
            'bounded cache node.js'
        ]
    },
    {
        slug: 'vs-keyv',
        name: 'Keyv',
        tagline: 'A Multi-Backend Store vs an In-Process Cache',
        description:
            'Compare Keyv and @humanspeak/memory-cache: a pluggable async key-value layer spanning Redis, SQLite, and Postgres against a synchronous zero-dependency in-process cache with LRU eviction and method memoization.',
        website: 'https://keyv.org',
        github: 'https://github.com/jaredwray/keyv',
        npm: 'keyv',
        type: 'Multi-Backend Key-Value Store',
        approach:
            'Async storage abstraction with pluggable adapters (memory, Redis, SQLite, Postgres, Mongo, and more)',
        features: [
            {
                name: 'Zero Dependencies',
                us: true,
                them: false,
                note: 'Keyv keeps its core small, but ships with serialization dependencies and each backend needs its own adapter package.'
            },
            {
                name: 'TypeScript Support',
                us: 'Written in TypeScript',
                them: 'Written in TypeScript'
            },
            {
                name: 'Synchronous API',
                us: 'Sync get/set — no await on the hot path',
                them: false,
                note: 'Keyv is Promise-based everywhere so the same code can back onto Redis or SQLite. For purely in-process caching that indirection is overhead.'
            },
            {
                name: 'Persistent / Shared Backends',
                us: false,
                them: 'Redis, SQLite, Postgres, Mongo, etcd, …',
                note: 'This is Keyv’s core value proposition — Memory Cache is in-process by design and does not try to compete here.'
            },
            {
                name: 'TTL Expiration',
                us: 'Per cache instance',
                them: 'Per-entry ttl argument on set()'
            },
            {
                name: 'LRU Eviction',
                us: true,
                them: 'Store-dependent',
                note: 'Keyv’s default in-memory Map never evicts; bounded behavior requires bringing an LRU-capable store yourself.'
            },
            {
                name: 'Wildcard / Prefix Deletion',
                us: 'deleteByMagicString + deleteByPrefix',
                them: 'clear() per namespace'
            },
            {
                name: 'Method Memoization Decorator',
                us: '@cached, async-aware',
                them: false
            },
            {
                name: 'Async Fetch De-Duplication',
                us: 'getOrSet() collapses concurrent lookups',
                them: false
            },
            {
                name: 'Built-In Statistics',
                us: 'getStats() aggregate counters',
                them: false
            },
            {
                name: 'Namespaces',
                us: 'Key prefixes + prefix deletion',
                them: 'First-class namespaces'
            },
            {
                name: 'Value Compression',
                us: false,
                them: '@keyv/compress-brotli / gzip adapters'
            }
        ],
        ...shared,
        prosThem: [
            'Swap storage backends (memory to Redis to SQLite) without changing call sites',
            'Persistence and cross-process sharing when you outgrow one process',
            'Per-entry TTL on every set() plus first-class namespaces',
            'Actively maintained with a broad, well-documented adapter ecosystem'
        ],
        consThem: [
            'Async API adds Promise overhead to purely in-process caching',
            'Default memory store is an unbounded Map — no eviction policy built in',
            'Values are serialized by default, a cost Memory Cache never pays in-process',
            'No memoization decorator, fetch de-duplication, or cache statistics'
        ],
        verdict:
            'Keyv and Memory Cache solve different problems. Keyv is a storage abstraction: reach for it when cached state must survive restarts or be shared across processes, and you want Redis today with SQLite tomorrow. Memory Cache is a cache: bounded memory, LRU + TTL, synchronous hot-path reads, memoization, and stats, all inside one process. If you are using Keyv’s default memory store just to cache computed values, Memory Cache does that job with less ceremony and real eviction.',
        keywords: [
            'keyv alternative',
            'keyv vs memory-cache',
            'in-memory cache vs redis',
            'key-value store node.js',
            'typescript cache library',
            'in-process caching'
        ]
    }
]

export function getCompetitor(slug: string): Competitor | undefined {
    return competitors.find((c) => c.slug === slug)
}
