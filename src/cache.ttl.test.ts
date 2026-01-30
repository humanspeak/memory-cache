import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryCache } from './cache.js'

describe('MemoryCache TTL', () => {
    // ==========================================
    // TTL (TIME TO LIVE)
    // ==========================================
    describe('TTL Expiration', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should expire entries after TTL', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key1', 'value1')
            expect(ttlCache.get('key1')).toBe('value1')

            vi.advanceTimersByTime(1001)
            expect(ttlCache.get('key1')).toBeUndefined()
        })

        it('should not expire entries before TTL', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key1', 'value1')

            vi.advanceTimersByTime(999)
            expect(ttlCache.get('key1')).toBe('value1')
        })

        it('should expire entries on has() check', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key1', 'value1')
            expect(ttlCache.has('key1')).toBe(true)

            vi.advanceTimersByTime(1001)
            expect(ttlCache.has('key1')).toBe(false)
        })

        it('should handle TTL expiration for multiple entries', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key1', 'value1')
            vi.advanceTimersByTime(500)
            ttlCache.set('key2', 'value2')

            vi.advanceTimersByTime(600) // key1 expired, key2 still valid
            expect(ttlCache.get('key1')).toBeUndefined()
            expect(ttlCache.get('key2')).toBe('value2')

            vi.advanceTimersByTime(500) // key2 now expired
            expect(ttlCache.get('key2')).toBeUndefined()
        })

        it('should update timestamp when overwriting entry', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key', 'value1')
            vi.advanceTimersByTime(800)
            ttlCache.set('key', 'value2') // Reset timestamp

            vi.advanceTimersByTime(500) // Would have expired original
            expect(ttlCache.get('key')).toBe('value2')
        })

        it('should clean up expired entries on get', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key1', 'value1')
            ttlCache.set('key2', 'value2')

            vi.advanceTimersByTime(1001)

            expect(ttlCache.get('key2')).toBeUndefined()
        })
    })

    // ==========================================
    // TTL BOUNDARY CONDITIONS
    // ==========================================
    describe('TTL Boundary Conditions', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should keep entry at exact TTL boundary', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key1', 'value1')
            vi.advanceTimersByTime(1000) // Exactly at TTL
            expect(ttlCache.get('key1')).toBe('value1')
        })

        it('should expire entry just past TTL boundary', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1000 })

            ttlCache.set('key1', 'value1')
            vi.advanceTimersByTime(1001)
            expect(ttlCache.get('key1')).toBeUndefined()
        })

        it('should handle very short TTL', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 1 })

            ttlCache.set('key1', 'value1')
            expect(ttlCache.get('key1')).toBe('value1')

            vi.advanceTimersByTime(2)
            expect(ttlCache.get('key1')).toBeUndefined()
        })

        it('should handle very long TTL', () => {
            const ttlCache = new MemoryCache<string>({ ttl: Number.MAX_SAFE_INTEGER })

            ttlCache.set('key1', 'value1')
            vi.advanceTimersByTime(86400000) // 1 day
            expect(ttlCache.get('key1')).toBe('value1')
        })

        it('should handle zero TTL (no expiration)', () => {
            const ttlCache = new MemoryCache<string>({ ttl: 0 })

            ttlCache.set('key1', 'value1')
            vi.advanceTimersByTime(10000)
            expect(ttlCache.get('key1')).toBe('value1')
        })

        it('should handle Infinity TTL', () => {
            const infCache = new MemoryCache<string>({ ttl: Infinity })

            infCache.set('key', 'value')
            vi.advanceTimersByTime(Number.MAX_SAFE_INTEGER)
            expect(infCache.get('key')).toBe('value')
        })
    })
})
