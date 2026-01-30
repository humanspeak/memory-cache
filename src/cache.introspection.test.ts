import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryCache } from './cache.js'

describe('MemoryCache Introspection', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
        cache = new MemoryCache<string>()
    })

    // ==========================================
    // SIZE
    // ==========================================
    describe('size()', () => {
        it('should return 0 for empty cache', () => {
            expect(cache.size()).toBe(0)
        })

        it('should return correct count after adding entries', () => {
            cache.set('key1', 'value1')
            expect(cache.size()).toBe(1)

            cache.set('key2', 'value2')
            expect(cache.size()).toBe(2)

            cache.set('key3', 'value3')
            expect(cache.size()).toBe(3)
        })

        it('should not increase size when overwriting', () => {
            cache.set('key1', 'value1')
            cache.set('key1', 'value2')
            expect(cache.size()).toBe(1)
        })

        it('should decrease after delete', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            cache.delete('key1')
            expect(cache.size()).toBe(1)
        })

        it('should be 0 after clear', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            cache.clear()
            expect(cache.size()).toBe(0)
        })

        it('should exclude expired entries', () => {
            vi.useFakeTimers()
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            expect(ttlCache.size()).toBe(2)

            vi.advanceTimersByTime(101)

            expect(ttlCache.size()).toBe(0)
            vi.useRealTimers()
        })
    })

    // ==========================================
    // KEYS
    // ==========================================
    describe('keys()', () => {
        it('should return empty array for empty cache', () => {
            expect(cache.keys()).toEqual([])
        })

        it('should return all keys', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            cache.set('key3', 'value3')

            const keys = cache.keys()
            expect(keys).toHaveLength(3)
            expect(keys).toContain('key1')
            expect(keys).toContain('key2')
            expect(keys).toContain('key3')
        })

        it('should preserve insertion order', () => {
            cache.set('a', 'value')
            cache.set('b', 'value')
            cache.set('c', 'value')

            expect(cache.keys()).toEqual(['a', 'b', 'c'])
        })

        it('should exclude expired entries', () => {
            vi.useFakeTimers()
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            expect(ttlCache.keys()).toEqual(['key1', 'key2'])

            vi.advanceTimersByTime(101)

            expect(ttlCache.keys()).toEqual([])
            vi.useRealTimers()
        })
    })

    // ==========================================
    // VALUES
    // ==========================================
    describe('values()', () => {
        it('should return empty array for empty cache', () => {
            expect(cache.values()).toEqual([])
        })

        it('should return all values', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')

            const values = cache.values()
            expect(values).toHaveLength(2)
            expect(values).toContain('value1')
            expect(values).toContain('value2')
        })

        it('should handle undefined values', () => {
            const mixedCache = new MemoryCache<string | undefined>()
            mixedCache.set('key1', 'value1')
            mixedCache.set('key2', undefined)

            const values = mixedCache.values()
            expect(values).toEqual(['value1', undefined])
        })

        it('should handle null values', () => {
            const mixedCache = new MemoryCache<string | null>()
            mixedCache.set('key1', 'value1')
            mixedCache.set('key2', null)

            const values = mixedCache.values()
            expect(values).toEqual(['value1', null])
        })

        it('should exclude expired entries', () => {
            vi.useFakeTimers()
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            expect(ttlCache.values()).toEqual(['value1', 'value2'])

            vi.advanceTimersByTime(101)

            expect(ttlCache.values()).toEqual([])
            vi.useRealTimers()
        })
    })

    // ==========================================
    // ENTRIES
    // ==========================================
    describe('entries()', () => {
        it('should return empty array for empty cache', () => {
            expect(cache.entries()).toEqual([])
        })

        it('should return all key-value pairs', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')

            const entries = cache.entries()
            expect(entries).toHaveLength(2)
            expect(entries).toContainEqual(['key1', 'value1'])
            expect(entries).toContainEqual(['key2', 'value2'])
        })

        it('should handle undefined values', () => {
            const mixedCache = new MemoryCache<string | undefined>()
            mixedCache.set('key1', 'value1')
            mixedCache.set('key2', undefined)

            const entries = mixedCache.entries()
            expect(entries).toEqual([
                ['key1', 'value1'],
                ['key2', undefined]
            ])
        })

        it('should handle null values', () => {
            const mixedCache = new MemoryCache<string | null>()
            mixedCache.set('key1', 'value1')
            mixedCache.set('key2', null)

            const entries = mixedCache.entries()
            expect(entries).toEqual([
                ['key1', 'value1'],
                ['key2', null]
            ])
        })

        it('should exclude expired entries', () => {
            vi.useFakeTimers()
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            expect(ttlCache.entries()).toEqual([
                ['key1', 'value1'],
                ['key2', 'value2']
            ])

            vi.advanceTimersByTime(101)

            expect(ttlCache.entries()).toEqual([])
            vi.useRealTimers()
        })
    })
})
