/**
 * Context passed to the {@link CacheHooks.onHit} callback when a cache entry
 * is successfully retrieved.
 *
 * @template T - The type of values stored in the cache.
 * @property {string} key - The cache key that was looked up.
 * @property {T | undefined} value - The unwrapped value returned to the caller.
 */
export type OnHitContext<T> = { key: string; value: T | undefined }

/**
 * Context passed to the {@link CacheHooks.onMiss} callback when a cache lookup
 * does not produce a value.
 *
 * @property {string} key - The cache key that was looked up.
 * @property {'not_found' | 'expired'} reason - Why the lookup missed:
 *   `'not_found'` if no entry existed, `'expired'` if the entry's TTL had elapsed.
 */
export type OnMissContext = { key: string; reason: 'not_found' | 'expired' }

/**
 * Context passed to the {@link CacheHooks.onSet} callback when a value is
 * written to the cache.
 *
 * @template T - The type of values stored in the cache.
 * @property {string} key - The cache key being written.
 * @property {T} value - The value that was stored.
 * @property {boolean} isUpdate - `true` when the key already existed (overwrite),
 *   `false` when it is a brand-new entry.
 */
export type OnSetContext<T> = { key: string; value: T; isUpdate: boolean }

/**
 * Context passed to the {@link CacheHooks.onEvict} callback when the
 * least-recently-used entry is removed to make room for a new one.
 *
 * @template T - The type of values stored in the cache.
 * @property {string} key - The cache key of the evicted entry.
 * @property {T | undefined} value - The unwrapped value that was evicted.
 */
export type OnEvictContext<T> = { key: string; value: T | undefined }

/**
 * Context passed to the {@link CacheHooks.onExpire} callback when a
 * TTL-expired entry is removed from the cache.
 *
 * @template T - The type of values stored in the cache.
 * @property {string} key - The cache key of the expired entry.
 * @property {T | undefined} value - The unwrapped value that expired.
 * @property {'get' | 'has' | 'prune'} source - The operation that discovered
 *   the expiration: `'get'` / `'has'` for lazy cleanup, `'prune'` for
 *   proactive cleanup.
 */
export type OnExpireContext<T> = {
    key: string
    value: T | undefined
    source: 'get' | 'has' | 'prune'
}

/**
 * Context passed to the {@link CacheHooks.onDelete} callback when an entry is
 * explicitly removed by the caller.
 *
 * @template T - The type of values stored in the cache.
 * @property {string} key - The cache key that was deleted.
 * @property {T | undefined} value - The unwrapped value that was deleted.
 * @property {'delete' | 'deleteAsync' | 'deleteByPrefix' | 'deleteByMagicString' | 'clear'} source -
 *   The method that triggered the deletion.
 */
export type OnDeleteContext<T> = {
    key: string
    value: T | undefined
    source: 'delete' | 'deleteAsync' | 'deleteByPrefix' | 'deleteByMagicString' | 'clear'
}

/**
 * Callback hooks for observing cache lifecycle events.
 * All hooks are synchronous and errors are silently caught to prevent cache
 * corruption.
 *
 * @template T - The type of values stored in the cache.
 * @property {function} [onHit] - Called after a successful cache read.
 * @property {function} [onMiss] - Called when a key is not found or has expired.
 * @property {function} [onSet] - Called after a value is written (insert or update).
 * @property {function} [onEvict] - Called when an LRU entry is removed to stay within `maxSize`.
 * @property {function} [onExpire] - Called when a TTL-expired entry is removed.
 * @property {function} [onDelete] - Called when an entry is explicitly deleted by the caller.
 */
export type CacheHooks<T> = {
    onHit?: (_ctx: OnHitContext<T>) => void
    onMiss?: (_ctx: OnMissContext) => void
    onSet?: (_ctx: OnSetContext<T>) => void
    onEvict?: (_ctx: OnEvictContext<T>) => void
    onExpire?: (_ctx: OnExpireContext<T>) => void
    onDelete?: (_ctx: OnDeleteContext<T>) => void
}

/**
 * Configuration options for cache initialization.
 *
 * @template T - The type of values stored in the cache (defaults to `unknown`).
 * @property {number} [maxSize=100] - Maximum number of entries the cache can
 *   hold. When exceeded, the least-recently-used entry is evicted.
 *   Set to `0` to disable the size limit.
 * @property {number} [ttl=300000] - Time-to-live in milliseconds for cache
 *   entries. After this duration, entries are considered expired and removed
 *   lazily on access or proactively via {@link MemoryCache.prune}.
 *   Set to `0` to disable expiration.
 * @property {CacheHooks<T>} [hooks] - Optional lifecycle hooks for observing
 *   cache events such as hits, misses, evictions, and deletions.
 *
 * @example
 * ```typescript
 * const options: CacheOptions<string> = {
 *     maxSize: 500,
 *     ttl: 60_000, // 1 minute
 *     hooks: { onEvict: (ctx) => console.log(`Evicted ${ctx.key}`) }
 * }
 * const cache = new MemoryCache<string>(options)
 * ```
 */
export type CacheOptions<T = unknown> = {
    maxSize?: number
    ttl?: number // milliseconds
    hooks?: CacheHooks<T>
}

/**
 * Configuration options for the {@link cached} method decorator.
 * Extends {@link CacheOptions} with decorator-specific key generation options.
 *
 * @template T - The return type of the decorated method (defaults to `unknown`).
 * @property {function} [keyGenerator] - Custom function that receives the
 *   method's arguments array and returns a cache key string. When provided,
 *   this takes precedence over `hashKeys`.
 * @property {boolean} [hashKeys=false] - When `true`, the decorator serialises
 *   the arguments via `JSON.stringify` and produces a 32-bit FNV-1a hash for a
 *   shorter, fixed-length cache key. Ignored when `keyGenerator` is set.
 *
 *   **Collision risk:** A 32-bit hash has ~50 % collision probability around
 *   ~77 k unique keys (birthday bound). For high-cardinality caches, prefer a
 *   custom `keyGenerator` or leave `hashKeys` disabled to avoid collisions.
 *
 * @example
 * ```typescript
 * // Custom key generation
 * @cached<User>({ keyGenerator: (args) => `user-${args[0]}` })
 * async getUser(id: number): Promise<User> { ... }
 *
 * // Hashed keys for large argument objects
 * @cached<string>({ hashKeys: true, ttl: 30_000 })
 * process(data: LargeObject): string { ... }
 * ```
 */
export type CachedDecoratorOptions<T = unknown> = CacheOptions<T> & {
    // trunk-ignore(eslint/@typescript-eslint/no-explicit-any)
    keyGenerator?: (_args: any[]) => string
    hashKeys?: boolean
}

/**
 * Statistics about cache usage and performance.
 *
 * @property {number} hits - Number of successful cache retrievals.
 * @property {number} misses - Number of cache misses (key not found or expired).
 * @property {number} evictions - Number of entries removed due to `maxSize` limits.
 * @property {number} expirations - Number of entries removed due to TTL expiration.
 * @property {number} size - Current number of non-expired entries in the cache.
 *
 * @example
 * ```typescript
 * // Typical stats object
 * const stats: CacheStats = {
 *     hits: 42,
 *     misses: 7,
 *     evictions: 3,
 *     expirations: 12,
 *     size: 85
 * }
 * ```
 */
export type CacheStats = {
    hits: number
    misses: number
    evictions: number
    expirations: number
    size: number
}

/**
 * Error thrown when cache configuration is invalid.
 *
 * @extends Error
 *
 * @example
 * ```typescript
 * try {
 *     new MemoryCache({ maxSize: -1 })
 * } catch (err) {
 *     console.log(err instanceof CacheConfigError) // true
 *     console.log(err.message) // 'maxSize must be a non-negative number'
 * }
 * ```
 */
export class CacheConfigError extends Error {
    /**
     * @param {string} message - Human-readable description of the configuration error.
     */
    constructor(message: string) {
        super(message)
        this.name = 'CacheConfigError'
        Object.setPrototypeOf(this, CacheConfigError.prototype)
    }
}

/**
 * Internal representation of a cached entry with its metadata.
 *
 * @interface CacheEntry
 * @template T - The type of value being cached
 * @property {T} value - The actual cached value
 * @property {number} timestamp - Unix timestamp when the entry was created
 */
type CacheEntry<T> = {
    value: T
    timestamp: number
}

/**
 * Sentinel value stored in place of a cached `undefined`.
 * Allows the cache to distinguish "no entry" from "entry whose value is undefined".
 */
const CACHED_UNDEFINED = Symbol('CACHED_UNDEFINED')

/**
 * Sentinel value stored in place of a cached `null`.
 * Allows the cache to distinguish "no entry" from "entry whose value is null".
 */
const CACHED_NULL = Symbol('CACHED_NULL')

/**
 * Generic in-memory cache implementation with TTL and LRU (Least Recently Used) eviction.
 * Provides efficient caching for any type of data with automatic cleanup
 * of expired or excess entries. When the cache reaches maxSize, the least
 * recently accessed entry is evicted to make room for new entries.
 *
 * @class MemoryCache
 * @template T - The type of values being cached
 *
 * @example
 * ```typescript
 * // Create a cache for string values
 * const cache = new MemoryCache<string>({
 *     maxSize: 100,
 *     ttl: 5 * 60 * 1000 // 5 minutes
 * });
 *
 * // Store and retrieve values
 * cache.set('key', 'value');
 * const value = cache.get('key');
 * ```
 */
export class MemoryCache<T> {
    /** Internal store mapping keys to their cached entries with metadata. */
    private cache: Map<string, CacheEntry<T | typeof CACHED_UNDEFINED | typeof CACHED_NULL>> =
        new Map()

    /** Tracks in-flight fetcher promises for the single-flight pattern in {@link getOrSet}. */
    private inFlight: Map<string, Promise<T>> = new Map()

    /** Maximum number of entries before LRU eviction kicks in. `0` means unlimited. */
    private maxSize: number

    /** Time-to-live in milliseconds. `0` means entries never expire. */
    private ttl: number

    /** User-supplied lifecycle hooks. */
    private hooks: CacheHooks<T>

    /** Running counters for cache performance metrics. */
    private stats: Omit<CacheStats, 'size'> = {
        hits: 0,
        misses: 0,
        evictions: 0,
        expirations: 0
    }

    /**
     * Creates a new MemoryCache instance.
     *
     * @param {CacheOptions<T>} options - Configuration options for the cache.
     * @param {number} [options.maxSize=100] - Maximum number of entries (default: 100).
     * @param {number} [options.ttl=300000] - Time-to-live in milliseconds (default: 5 minutes).
     * @param {CacheHooks<T>} [options.hooks] - Optional lifecycle hooks.
     * @throws {CacheConfigError} If `maxSize` is negative or `ttl` is negative.
     *
     * @example
     * ```typescript
     * // Throws CacheConfigError: maxSize must be a non-negative number
     * new MemoryCache({ maxSize: -1 })
     * ```
     */
    constructor(options: CacheOptions<T> = {}) {
        const maxSize = options.maxSize ?? 100
        const ttl = options.ttl ?? 5 * 60 * 1000 // 5 minutes default

        if (maxSize < 0) {
            throw new CacheConfigError('maxSize must be a non-negative number')
        }
        if (ttl < 0) {
            throw new CacheConfigError('ttl must be a non-negative number')
        }

        this.maxSize = maxSize
        this.ttl = ttl
        this.hooks = options.hooks ?? {}
    }

    /**
     * Safely calls a hook function, catching any errors to prevent cache
     * corruption.
     *
     * @template C - The context type for the hook callback.
     * @param {((context: C) => void) | undefined} hook - The hook function to
     *   invoke, or `undefined` if no hook is registered.
     * @param {C} context - The context object passed to the hook.
     * @returns {void}
     */
    // trunk-ignore(eslint/no-unused-vars)
    private callHook<C>(hook: ((context: C) => void) | undefined, context: C): void {
        if (!hook) return
        try {
            hook(context)
        } catch {
            /* silent - hooks should not affect cache operation */
        }
    }

    /**
     * Unwraps a stored value, converting sentinel symbols back to their
     * original `undefined` or `null` form.
     *
     * @param {T | typeof CACHED_UNDEFINED | typeof CACHED_NULL} storedValue -
     *   The raw value from the internal cache map.
     * @returns {T | undefined} The original value the caller stored, with
     *   sentinels replaced by `undefined` or `null`.
     */
    private unwrapValue(
        storedValue: T | typeof CACHED_UNDEFINED | typeof CACHED_NULL
    ): T | undefined {
        if (storedValue === CACHED_UNDEFINED) return undefined
        if (storedValue === CACHED_NULL) return null as T
        return storedValue as T
    }

    /**
     * Retrieves a value from the cache if it exists and hasn't expired.
     * Accessing an entry moves it to the most-recently-used position (LRU behavior).
     *
     * @param {string} key - The key to look up
     * @returns {T | undefined} The cached value if found and valid, undefined otherwise
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<number>();
     * cache.set('counter', 42);
     * const value = cache.get('counter'); // Returns 42
     * const missing = cache.get('nonexistent'); // Returns undefined
     * ```
     */
    get(key: string): T | undefined {
        const entry = this.cache.get(key)
        if (!entry) {
            this.stats.misses++
            this.callHook(this.hooks.onMiss, { key, reason: 'not_found' })
            return undefined
        }

        // Check if entry has expired (skip check if TTL is 0 or negative)
        if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
            const expiredValue = this.unwrapValue(entry.value)
            this.cache.delete(key)
            this.stats.expirations++
            this.stats.misses++
            this.callHook(this.hooks.onExpire, { key, value: expiredValue, source: 'get' })
            this.callHook(this.hooks.onMiss, { key, reason: 'expired' })
            return undefined
        }

        // Move entry to end of Map for LRU ordering (most recently used)
        this.cache.delete(key)
        this.cache.set(key, entry)

        this.stats.hits++

        // Handle the special sentinel values for cached undefined/null
        const value = this.unwrapValue(entry.value)
        this.callHook(this.hooks.onHit, { key, value })

        return value
    }

    /**
     * Gets a value from cache, or fetches and caches it if not present.
     * Implements the single-flight pattern to prevent thundering herd: if
     * multiple callers request the same key concurrently, only one fetch
     * executes and the rest share the same `Promise`.
     *
     * @param {string} key - The key to look up or store.
     * @param {() => T | Promise<T>} fetcher - Function that returns the value
     *   to cache. Called at most once per cache miss per key.
     * @returns {Promise<T>} Resolves to the cached value (on hit) or the
     *   fetcher result (on miss). Concurrent callers for the same key receive
     *   the same `Promise` instance.
     *
     * @example
     * ```typescript
     * const user = await cache.getOrSet('user:123', async () => {
     *     return await fetchUserFromDB(123)
     * })
     * ```
     *
     * @example
     * ```typescript
     * // Thundering herd prevention — only one fetch executes
     * const [a, b] = await Promise.all([
     *     cache.getOrSet('key', expensiveFetch),
     *     cache.getOrSet('key', expensiveFetch)
     * ])
     * // expensiveFetch was called only once; a === b
     * ```
     */
    async getOrSet(key: string, fetcher: () => T | Promise<T>): Promise<T> {
        // 1. Check cache (calls onHit if found)
        if (this.has(key)) {
            return this.get(key) as T
        }

        // 2. Check in-flight (join existing fetch)
        const existing = this.inFlight.get(key)
        if (existing) return existing

        // 3. Create fetch promise with single-flight
        const fetchPromise = (async () => {
            try {
                this.stats.misses++
                this.callHook(this.hooks.onMiss, { key, reason: 'not_found' })
                const value = await fetcher()
                this.set(key, value)
                return value
            } finally {
                this.inFlight.delete(key)
            }
        })()

        this.inFlight.set(key, fetchPromise)
        return fetchPromise
    }

    /**
     * Checks if a key exists in the cache (regardless of its value).
     * This is useful for distinguishing between cache misses and cached
     * `undefined` values.
     *
     * @param {string} key - The key to check.
     * @returns {boolean} `true` if the key exists in cache and hasn't expired,
     *   `false` otherwise.
     *
     * @example
     * ```typescript
     * cache.set('nullable', undefined)
     * cache.has('nullable')   // true  — entry exists
     * cache.get('nullable')   // undefined
     * cache.has('nonexistent') // false — no entry
     * ```
     */
    has(key: string): boolean {
        const entry = this.cache.get(key)
        if (!entry) return false

        // Check if entry has expired (skip check if TTL is 0 or negative)
        if (this.ttl > 0 && Date.now() - entry.timestamp > this.ttl) {
            const expiredValue = this.unwrapValue(entry.value)
            this.cache.delete(key)
            this.callHook(this.hooks.onExpire, { key, value: expiredValue, source: 'has' })
            return false
        }

        return true
    }

    /**
     * Stores a value in the cache. If the cache is full and this is a new key,
     * the least recently used entry is evicted to make room. Setting a value
     * (new or update) moves the entry to the most-recently-used position.
     *
     * @param {string} key - The key under which to store the value
     * @param {T} value - The value to cache
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('greeting', 'Hello, World!');
     * ```
     */
    set(key: string, value: T): void {
        const isNewKey = !this.cache.has(key)

        // Remove LRU entry if cache is full and this is a new key (skip if maxSize is 0)
        if (isNewKey && this.maxSize > 0 && this.cache.size >= this.maxSize) {
            const oldestKey = this.cache.keys().next().value
            if (oldestKey) {
                const evictedEntry = this.cache.get(oldestKey)
                const evictedValue = evictedEntry ? this.unwrapValue(evictedEntry.value) : undefined
                this.cache.delete(oldestKey)
                this.stats.evictions++
                this.callHook(this.hooks.onEvict, { key: oldestKey, value: evictedValue })
            }
        }

        // For existing keys, delete first to move to end (MRU position)
        // Map.set() on existing key doesn't change position in iteration order
        if (!isNewKey) {
            this.cache.delete(key)
        }

        // Store undefined/null values as sentinels to distinguish from cache misses
        let valueToStore: T | typeof CACHED_UNDEFINED | typeof CACHED_NULL
        if (value === undefined) {
            valueToStore = CACHED_UNDEFINED
        } else if (value === null) {
            valueToStore = CACHED_NULL
        } else {
            valueToStore = value
        }

        this.cache.set(key, {
            value: valueToStore,
            timestamp: Date.now()
        })

        this.callHook(this.hooks.onSet, { key, value, isUpdate: !isNewKey })
    }

    /**
     * Removes a specific entry from the cache.
     *
     * @param {string} key - The key of the entry to remove
     * @returns {boolean} True if an element was removed, false if the key wasn't found
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('key', 'value');
     * cache.delete('key'); // Returns true
     * cache.delete('nonexistent'); // Returns false
     * ```
     */
    delete(key: string): boolean {
        const entry = this.cache.get(key)
        const deleted = this.cache.delete(key)
        if (deleted && entry) {
            const value = this.unwrapValue(entry.value)
            this.callHook(this.hooks.onDelete, { key, value, source: 'delete' })
        }
        return deleted
    }

    /**
     * Asynchronously removes a specific entry from the cache.
     *
     * @param {string} key - The key of the entry to remove.
     * @returns {Promise<boolean>} Promise resolving to `true` if an entry was
     *   removed, `false` if the key wasn't found.
     *
     * @example
     * ```typescript
     * cache.set('temp', 'data')
     * const removed = await cache.deleteAsync('temp') // true
     * ```
     */
    async deleteAsync(key: string): Promise<boolean> {
        const entry = this.cache.get(key)
        const deleted = this.cache.delete(key)
        if (deleted && entry) {
            const value = this.unwrapValue(entry.value)
            this.callHook(this.hooks.onDelete, { key, value, source: 'deleteAsync' })
        }
        return Promise.resolve(deleted)
    }

    /**
     * Removes all entries from the cache.
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('key1', 'value1');
     * cache.set('key2', 'value2');
     * cache.clear(); // Removes all entries
     * ```
     */
    clear(): void {
        // Call onDelete for each entry before clearing
        for (const [key, entry] of this.cache.entries()) {
            const value = this.unwrapValue(entry.value)
            this.callHook(this.hooks.onDelete, { key, value, source: 'clear' })
        }
        this.cache.clear()
    }

    /**
     * Removes all entries from the cache whose keys start with the given prefix.
     *
     * @param {string} prefix - The prefix to match against cache keys
     * @returns {number} Number of entries removed
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('user:123:name', 'John');
     * cache.set('user:123:email', 'john@example.com');
     * cache.set('post:456', 'Hello World');
     *
     * const removed = cache.deleteByPrefix('user:123:'); // Returns 2
     * ```
     */
    deleteByPrefix(prefix: string): number {
        let count = 0
        for (const [key, entry] of this.cache.entries()) {
            if (key.startsWith(prefix)) {
                const value = this.unwrapValue(entry.value)
                this.cache.delete(key)
                this.callHook(this.hooks.onDelete, { key, value, source: 'deleteByPrefix' })
                count++
            }
        }
        return count
    }

    /**
     * Removes all entries from the cache whose keys match the given wildcard pattern.
     * Supports asterisk (*) wildcards for flexible pattern matching.
     *
     * @param {string} magicString - The wildcard pattern to match against cache keys (use * for wildcards)
     * @returns {number} Number of entries removed
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('user:123:name', 'John');
     * cache.set('user:123:email', 'john@example.com');
     * cache.set('user:456:name', 'Jane');
     * cache.set('post:789', 'Hello World');
     *
     * const removed1 = cache.deleteByMagicString('user:123:*'); // Returns 2 (matches name and email)
     * const removed2 = cache.deleteByMagicString('user:*:name'); // Returns 1 (matches Jane's name)
     * const removed3 = cache.deleteByMagicString('post:*'); // Returns 1 (matches the post)
     * ```
     */
    deleteByMagicString(magicString: string): number {
        let count = 0

        // Convert wildcard pattern to regex
        const escapedPattern = magicString
            .replace(/[.+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars except *
            .replace(/\*/g, '.*') // Convert * to .*

        const regex = new RegExp(`^${escapedPattern}$`)

        for (const [key, entry] of this.cache.entries()) {
            if (regex.test(key)) {
                const value = this.unwrapValue(entry.value)
                this.cache.delete(key)
                this.callHook(this.hooks.onDelete, { key, value, source: 'deleteByMagicString' })
                count++
            }
        }
        return count
    }

    /**
     * Returns the current number of non-expired entries in the cache.
     * Automatically prunes expired entries before counting.
     *
     * @returns {number} The number of cached entries
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('key1', 'value1');
     * cache.set('key2', 'value2');
     * console.log(cache.size()); // 2
     * ```
     */
    size(): number {
        this.prune()
        return this.cache.size
    }

    /**
     * Returns an array of all keys currently in the cache.
     * Automatically prunes expired entries before returning keys.
     *
     * @returns {string[]} Array of cache keys
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('user:1', 'Alice');
     * cache.set('user:2', 'Bob');
     * console.log(cache.keys()); // ['user:1', 'user:2']
     * ```
     */
    keys(): string[] {
        this.prune()
        return Array.from(this.cache.keys())
    }

    /**
     * Returns an array of all values currently in the cache.
     * Automatically prunes expired entries before returning values.
     * Cached undefined values are returned as undefined, cached null values as null.
     *
     * @returns {(T | undefined)[]} Array of cached values
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('key1', 'value1');
     * cache.set('key2', 'value2');
     * console.log(cache.values()); // ['value1', 'value2']
     * ```
     */
    values(): (T | undefined)[] {
        this.prune()
        const result: (T | undefined)[] = []
        for (const entry of this.cache.values()) {
            if (entry.value === CACHED_UNDEFINED) {
                result.push(undefined)
            } else if (entry.value === CACHED_NULL) {
                result.push(null as T)
            } else {
                result.push(entry.value as T)
            }
        }
        return result
    }

    /**
     * Returns an array of all key-value pairs currently in the cache.
     * Automatically prunes expired entries before returning entries.
     *
     * @returns {[string, T | undefined][]} Array of [key, value] tuples
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('key1', 'value1');
     * cache.set('key2', 'value2');
     * console.log(cache.entries()); // [['key1', 'value1'], ['key2', 'value2']]
     * ```
     */
    entries(): [string, T | undefined][] {
        this.prune()
        const result: [string, T | undefined][] = []
        for (const [key, entry] of this.cache.entries()) {
            let value: T | undefined
            if (entry.value === CACHED_UNDEFINED) {
                value = undefined
            } else if (entry.value === CACHED_NULL) {
                value = null as T
            } else {
                value = entry.value as T
            }
            result.push([key, value])
        }
        return result
    }

    /**
     * Returns statistics about cache usage and performance.
     *
     * @returns {CacheStats} Object containing cache statistics
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.set('key', 'value');
     * cache.get('key');     // hit
     * cache.get('missing'); // miss
     * const stats = cache.getStats();
     * console.log(stats); // { hits: 1, misses: 1, evictions: 0, expirations: 0, size: 1 }
     * ```
     */
    getStats(): CacheStats {
        return {
            hits: this.stats.hits,
            misses: this.stats.misses,
            evictions: this.stats.evictions,
            expirations: this.stats.expirations,
            size: this.size()
        }
    }

    /**
     * Resets all cache statistics counters to zero.
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>();
     * cache.get('missing'); // increments misses
     * cache.resetStats();
     * const stats = cache.getStats();
     * console.log(stats.misses); // 0
     * ```
     */
    resetStats(): void {
        this.stats.hits = 0
        this.stats.misses = 0
        this.stats.evictions = 0
        this.stats.expirations = 0
    }

    /**
     * Proactively removes all expired entries from the cache.
     * This is useful for reclaiming memory when you don't want to wait for
     * lazy cleanup (which only occurs when expired entries are accessed).
     *
     * @returns {number} The number of expired entries that were removed
     *
     * @example
     * ```typescript
     * const cache = new MemoryCache<string>({ ttl: 1000 });
     * cache.set('key1', 'value1');
     * cache.set('key2', 'value2');
     * // ... time passes ...
     * const pruned = cache.prune(); // Returns number of expired entries removed
     * ```
     */
    prune(): number {
        if (this.ttl <= 0) {
            return 0
        }

        let count = 0
        const now = Date.now()
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.ttl) {
                const value = this.unwrapValue(entry.value)
                this.cache.delete(key)
                this.stats.expirations++
                this.callHook(this.hooks.onExpire, { key, value, source: 'prune' })
                count++
            }
        }
        return count
    }
}

/**
 * FNV-1a 32-bit hash function.
 * Pure JS implementation — no dependencies, works in browser and Node.
 * Internal helper used by the {@link cached} decorator when `hashKeys` is enabled.
 *
 * @param {string} str - The string to hash (typically `JSON.stringify(args)`).
 * @returns {string} An 8-character hex string of the unsigned 32-bit hash.
 */
function fnv1aHash(str: string): string {
    let hash = 0x811c9dc5
    for (let i = 0; i < str.length; i++) {
        hash ^= str.charCodeAt(i)
        hash = Math.imul(hash, 0x01000193)
    }
    return (hash >>> 0).toString(16)
}

/**
 * Cache decorator factory for method-level caching.
 * Provides a way to cache method results based on their arguments.
 * Each decorated method receives its own isolated {@link MemoryCache} instance.
 *
 * @template T - The return type of the decorated method.
 * @param {CachedDecoratorOptions<T>} options - Configuration options for the
 *   cache and key generation strategy.
 * @param {function} [options.keyGenerator] - Custom function to generate cache
 *   keys from method arguments. Takes precedence over `hashKeys`.
 * @param {boolean} [options.hashKeys] - When `true`, uses FNV-1a hashing on
 *   serialised arguments for shorter, fixed-length cache keys.
 * @returns {MethodDecorator} A legacy method decorator (`target, propertyKey,
 *   descriptor`) that wraps the original method with cache-lookup logic.
 *
 * @example
 * ```typescript
 * class UserService {
 *     @cached<User>({ ttl: 60000 })
 *     async getUser(id: string): Promise<User> {
 *         // Expensive operation
 *         return await fetchUser(id);
 *     }
 *
 *     @cached<string>({ keyGenerator: (args) => args[0].id })
 *     getByUser(user: User): string {
 *         return user.name;
 *     }
 *
 *     @cached<string>({ hashKeys: true })
 *     process(data: LargeObject): string {
 *         return expensiveComputation(data);
 *     }
 * }
 * ```
 */
export function cached<T>(options: CachedDecoratorOptions<T> = {}) {
    const { keyGenerator, hashKeys, ...cacheOptions } = options
    const cache = new MemoryCache<T>(cacheOptions)

    // trunk-ignore(eslint/@typescript-eslint/no-explicit-any)
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        // trunk-ignore(eslint/@typescript-eslint/no-explicit-any)
        descriptor.value = function (...args: any[]) {
            let argKey: string
            if (keyGenerator) {
                argKey = keyGenerator(args)
            } else if (hashKeys) {
                argKey = fnv1aHash(JSON.stringify(args))
            } else {
                argKey = JSON.stringify(args)
            }
            const key = `${propertyKey}:${argKey}`

            // Use has() to check if key exists, then get() to retrieve value
            // This allows us to distinguish between cache miss and cached undefined
            if (cache.has(key)) {
                return cache.get(key)
            }

            const result = originalMethod.apply(this, args)
            cache.set(key, result)
            return result
        }

        return descriptor
    }
}
