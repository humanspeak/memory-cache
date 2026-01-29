/**
 * Context passed to onHit hook when a cache entry is successfully retrieved.
 */
export type OnHitContext<T> = { key: string; value: T | undefined }

/**
 * Context passed to onMiss hook when a cache lookup fails.
 */
export type OnMissContext = { key: string; reason: 'not_found' | 'expired' }

/**
 * Context passed to onSet hook when a value is stored in the cache.
 */
export type OnSetContext<T> = { key: string; value: T; isUpdate: boolean }

/**
 * Context passed to onEvict hook when an entry is evicted due to size limits.
 */
export type OnEvictContext<T> = { key: string; value: T | undefined }

/**
 * Context passed to onExpire hook when an entry expires due to TTL.
 */
export type OnExpireContext<T> = {
    key: string
    value: T | undefined
    source: 'get' | 'has' | 'prune'
}

/**
 * Context passed to onDelete hook when an entry is explicitly deleted.
 */
export type OnDeleteContext<T> = {
    key: string
    value: T | undefined
    source: 'delete' | 'deleteAsync' | 'deleteByPrefix' | 'deleteByMagicString' | 'clear'
}

/**
 * Callback hooks for observing cache lifecycle events.
 * All hooks are synchronous and errors are silently caught to prevent cache corruption.
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
 * @interface CacheOptions
 * @property {number} [maxSize] - Maximum number of entries the cache can hold before evicting oldest entries
 * @property {number} [ttl] - Time-to-live in milliseconds for cache entries before they expire
 * @property {CacheHooks} [hooks] - Optional lifecycle hooks for observing cache events
 */
export type CacheOptions<T = unknown> = {
    maxSize?: number
    ttl?: number // milliseconds
    hooks?: CacheHooks<T>
}

/**
 * Statistics about cache usage and performance.
 *
 * @interface CacheStats
 * @property {number} hits - Number of successful cache retrievals
 * @property {number} misses - Number of cache misses (key not found or expired)
 * @property {number} evictions - Number of entries removed due to size limits
 * @property {number} expirations - Number of entries removed due to TTL expiration
 * @property {number} size - Current number of entries in the cache
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
 * @class CacheConfigError
 * @extends Error
 */
export class CacheConfigError extends Error {
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
 * Special sentinel values to represent cached undefined/null values.
 * This allows us to distinguish between "not cached" and "cached undefined/null".
 */
const CACHED_UNDEFINED = Symbol('CACHED_UNDEFINED')
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
    private cache: Map<string, CacheEntry<T | typeof CACHED_UNDEFINED | typeof CACHED_NULL>> =
        new Map()
    private maxSize: number
    private ttl: number
    private hooks: CacheHooks<T>
    private stats: Omit<CacheStats, 'size'> = {
        hits: 0,
        misses: 0,
        evictions: 0,
        expirations: 0
    }

    /**
     * Creates a new MemoryCache instance.
     *
     * @param {CacheOptions} options - Configuration options for the cache
     * @param {number} [options.maxSize=100] - Maximum number of entries (default: 100)
     * @param {number} [options.ttl=300000] - Time-to-live in milliseconds (default: 5 minutes)
     * @param {CacheHooks} [options.hooks] - Optional lifecycle hooks
     * @throws {CacheConfigError} If maxSize is negative or ttl is negative
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
     * Safely calls a hook function, catching any errors to prevent cache corruption.
     */
    // eslint-disable-next-line no-unused-vars
    private callHook<C>(hook: ((context: C) => void) | undefined, context: C): void {
        if (!hook) return
        try {
            hook(context)
        } catch {
            /* silent - hooks should not affect cache operation */
        }
    }

    /**
     * Unwraps a stored value, converting sentinel values back to their original form.
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
     * Checks if a key exists in the cache (regardless of its value).
     * This is useful for distinguishing between cache misses and cached undefined values.
     *
     * @param {string} key - The key to check
     * @returns {boolean} True if the key exists in cache and hasn't expired, false otherwise
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
     * @param {string} key - The key of the entry to remove
     * @returns {Promise<boolean>} Promise resolving to true if removed, false otherwise
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
 * Cache decorator factory for method-level caching.
 * Provides a way to cache method results based on their arguments.
 *
 * @template T - The return type of the decorated method
 * @param {CacheOptions} options - Configuration options for the cache
 * @returns A method decorator that caches the results
 *
 * @example
 * ```typescript
 * class UserService {
 *     @cached<User>({ ttl: 60000 })
 *     async getUser(id: string): Promise<User> {
 *         // Expensive operation
 *         return await fetchUser(id);
 *     }
 * }
 * ```
 */
export function cached<T>(options: CacheOptions = {}) {
    const cache = new MemoryCache<T>(options)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        descriptor.value = function (...args: any[]) {
            const key = `${propertyKey}:${JSON.stringify(args)}`

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
