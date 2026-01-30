import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryCache } from './cache.js'

describe('MemoryCache Statistics', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
        cache = new MemoryCache<string>()
    })

    // ==========================================
    // GET STATS
    // ==========================================
    describe('getStats()', () => {
        it('should return initial stats with all zeros', () => {
            const stats = cache.getStats()
            expect(stats).toEqual({
                hits: 0,
                misses: 0,
                evictions: 0,
                expirations: 0,
                size: 0
            })
        })

        it('should track cache hits', () => {
            cache.set('key', 'value')
            cache.get('key')
            cache.get('key')
            cache.get('key')

            const stats = cache.getStats()
            expect(stats.hits).toBe(3)
        })

        it('should track cache misses', () => {
            cache.get('nonexistent1')
            cache.get('nonexistent2')

            const stats = cache.getStats()
            expect(stats.misses).toBe(2)
        })

        it('should track evictions', () => {
            const smallCache = new MemoryCache<string>({ maxSize: 2 })
            smallCache.set('key1', 'value1')
            smallCache.set('key2', 'value2')
            smallCache.set('key3', 'value3') // evicts key1
            smallCache.set('key4', 'value4') // evicts key2

            const stats = smallCache.getStats()
            expect(stats.evictions).toBe(2)
        })

        it('should track expirations', () => {
            vi.useFakeTimers()
            const shortTtlCache = new MemoryCache<string>({ ttl: 10 })
            shortTtlCache.set('key', 'value')

            vi.advanceTimersByTime(20)

            shortTtlCache.get('key') // triggers expiration

            const stats = shortTtlCache.getStats()
            expect(stats.expirations).toBe(1)
            expect(stats.misses).toBe(1) // expiration also counts as miss
            vi.useRealTimers()
        })

        it('should return current size', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')

            const stats = cache.getStats()
            expect(stats.size).toBe(2)
        })

        it('should exclude expired entries from size', () => {
            vi.useFakeTimers()
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            expect(ttlCache.getStats().size).toBe(2)

            vi.advanceTimersByTime(101)

            expect(ttlCache.getStats().size).toBe(0)
            vi.useRealTimers()
        })

        it('should return a copy of stats (not reference)', () => {
            cache.get('nonexistent')
            const stats1 = cache.getStats()
            cache.get('nonexistent2')
            const stats2 = cache.getStats()

            expect(stats1.misses).toBe(1)
            expect(stats2.misses).toBe(2)
        })
    })

    // ==========================================
    // RESET STATS
    // ==========================================
    describe('resetStats()', () => {
        it('should reset all counters to zero', () => {
            cache.set('key', 'value')
            cache.get('key') // hit
            cache.get('nonexistent') // miss

            cache.resetStats()

            const stats = cache.getStats()
            expect(stats.hits).toBe(0)
            expect(stats.misses).toBe(0)
            expect(stats.evictions).toBe(0)
            expect(stats.expirations).toBe(0)
        })

        it('should not affect cache size', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')

            cache.resetStats()

            expect(cache.size()).toBe(2)
            expect(cache.getStats().size).toBe(2)
        })

        it('should allow stats to accumulate again after reset', () => {
            cache.set('key', 'value')
            cache.get('key')
            cache.resetStats()
            cache.get('key')
            cache.get('key')

            const stats = cache.getStats()
            expect(stats.hits).toBe(2)
        })
    })

    // ==========================================
    // PRUNE
    // ==========================================
    describe('prune()', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should remove expired entries and return count', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')
            ttlCache.set('key3', 'value3')

            vi.advanceTimersByTime(101)

            const pruned = ttlCache.prune()
            expect(pruned).toBe(3)
            expect(ttlCache.size()).toBe(0)
        })

        it('should only remove expired entries', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('old', 'value1')

            vi.advanceTimersByTime(50)
            ttlCache.set('new', 'value2')

            vi.advanceTimersByTime(51)

            const pruned = ttlCache.prune()
            expect(pruned).toBe(1)
            expect(ttlCache.size()).toBe(1)
            expect(ttlCache.get('new')).toBe('value2')
        })

        it('should return 0 when no entries are expired', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            const pruned = ttlCache.prune()
            expect(pruned).toBe(0)
            expect(ttlCache.size()).toBe(2)
        })

        it('should return 0 when TTL is disabled', () => {
            vi.useRealTimers() // Use real timers for this test
            const noTtlCache = new MemoryCache<string>({ ttl: 0 })
            noTtlCache.set('key1', 'value1')

            const pruned = noTtlCache.prune()
            expect(pruned).toBe(0)
            expect(noTtlCache.size()).toBe(1)
        })

        it('should increment expirations stat for each pruned entry', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            vi.advanceTimersByTime(101)

            ttlCache.prune()
            expect(ttlCache.getStats().expirations).toBe(2)
        })

        it('should return 0 when cache is empty', () => {
            vi.useRealTimers() // Use real timers for this test
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            const pruned = ttlCache.prune()
            expect(pruned).toBe(0)
        })
    })

    // ==========================================
    // COMBINED STATISTICS SCENARIOS
    // ==========================================
    describe('Combined Statistics Scenarios', () => {
        it('should track all stats correctly in typical usage', () => {
            const testCache = new MemoryCache<string>({ maxSize: 3 })

            // Add entries
            testCache.set('key1', 'value1')
            testCache.set('key2', 'value2')
            testCache.set('key3', 'value3')

            // Hits - these also update LRU order
            testCache.get('key1') // hit, key1 becomes MRU
            testCache.get('key2') // hit, key2 becomes MRU
            // LRU order is now: key3 (oldest), key1, key2 (newest)

            // Misses
            testCache.get('nonexistent')

            // Eviction - evicts key3 (LRU), not key1
            testCache.set('key4', 'value4')

            // Hit - key1 was protected by LRU access
            testCache.get('key1') // hit (key1 still exists)

            // Miss - key3 was evicted
            testCache.get('key3')

            const stats = testCache.getStats()
            expect(stats.hits).toBe(3) // key1, key2, then key1 again
            expect(stats.misses).toBe(2) // nonexistent, key3
            expect(stats.evictions).toBe(1)
            expect(stats.size).toBe(3)
        })
    })
})
