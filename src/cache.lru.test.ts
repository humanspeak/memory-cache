import { describe, expect, it } from 'vitest'
import { MemoryCache } from './cache.js'

describe('MemoryCache LRU Eviction', () => {
    // ==========================================
    // MAX SIZE EVICTION
    // ==========================================
    describe('Max Size Eviction', () => {
        it('should evict oldest entry when max size is reached', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 2 })

            sizeCache.set('key1', 'value1')
            sizeCache.set('key2', 'value2')
            sizeCache.set('key3', 'value3')

            expect(sizeCache.get('key1')).toBeUndefined()
            expect(sizeCache.get('key2')).toBe('value2')
            expect(sizeCache.get('key3')).toBe('value3')
        })

        it('should maintain maxSize entries after multiple operations', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 3 })

            for (let i = 0; i < 10; i++) {
                sizeCache.set(`key${i}`, `value${i}`)
            }

            // Only the last 3 should remain
            expect(sizeCache.get('key7')).toBe('value7')
            expect(sizeCache.get('key8')).toBe('value8')
            expect(sizeCache.get('key9')).toBe('value9')
            expect(sizeCache.get('key6')).toBeUndefined()
        })

        it('should not evict when updating existing key', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 2 })

            sizeCache.set('key1', 'value1')
            sizeCache.set('key2', 'value2')
            sizeCache.set('key1', 'value1-updated')

            expect(sizeCache.get('key1')).toBe('value1-updated')
            expect(sizeCache.get('key2')).toBe('value2')
        })

        it('should handle max size of 1', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 1 })

            sizeCache.set('key1', 'value1')
            sizeCache.set('key2', 'value2')

            expect(sizeCache.get('key1')).toBeUndefined()
            expect(sizeCache.get('key2')).toBe('value2')
        })

        it('should handle max size of 0 (no limit)', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 0 })

            for (let i = 0; i < 1000; i++) {
                sizeCache.set(`key${i}`, `value${i}`)
            }

            for (let i = 0; i < 1000; i++) {
                expect(sizeCache.get(`key${i}`)).toBe(`value${i}`)
            }
        })

        it('should handle Infinity maxSize', () => {
            const infCache = new MemoryCache<string>({ maxSize: Infinity })

            for (let i = 0; i < 200; i++) {
                infCache.set(`key${i}`, `value${i}`)
            }

            expect(infCache.get('key0')).toBe('value0')
            expect(infCache.get('key199')).toBe('value199')
        })

        it('should handle NaN maxSize (treated as no limit)', () => {
            // NaN is falsy in comparisons, so maxSize > 0 check fails
            const nanCache = new MemoryCache<string>({ maxSize: NaN })

            for (let i = 0; i < 200; i++) {
                nanCache.set(`key${i}`, `value${i}`)
            }

            // NaN > 0 is false, so no eviction occurs
            expect(nanCache.get('key0')).toBe('value0')
            expect(nanCache.get('key199')).toBe('value199')
        })
    })

    // ==========================================
    // LRU BEHAVIOR
    // ==========================================
    describe('LRU Behavior', () => {
        it('should move entry to MRU position when updating via set()', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 3 })

            sizeCache.set('key1', 'value1')
            sizeCache.set('key2', 'value2')
            sizeCache.set('key3', 'value3')
            // Order: key1 (LRU), key2, key3 (MRU)

            // Update key1 - should move it to MRU position
            sizeCache.set('key1', 'value1-updated')
            // Order: key2 (LRU), key3, key1 (MRU)

            // Add key4 - should evict key2 (now LRU), not key1
            sizeCache.set('key4', 'value4')

            expect(sizeCache.get('key1')).toBe('value1-updated') // Protected by update
            expect(sizeCache.get('key2')).toBeUndefined() // Evicted (was LRU)
            expect(sizeCache.get('key3')).toBe('value3')
            expect(sizeCache.get('key4')).toBe('value4')
        })

        it('should use LRU eviction - accessing an entry protects it from eviction', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 3 })

            sizeCache.set('key1', 'value1')
            sizeCache.set('key2', 'value2')
            sizeCache.set('key3', 'value3')

            // Access key1, making it the most recently used
            sizeCache.get('key1')

            // Add key4 - should evict key2 (LRU), not key1
            sizeCache.set('key4', 'value4')

            expect(sizeCache.get('key1')).toBe('value1') // Protected by access
            expect(sizeCache.get('key2')).toBeUndefined() // Evicted (was LRU)
            expect(sizeCache.get('key3')).toBe('value3')
            expect(sizeCache.get('key4')).toBe('value4')
        })

        it('should maintain correct LRU order with multiple accesses', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 3 })

            sizeCache.set('key1', 'value1')
            sizeCache.set('key2', 'value2')
            sizeCache.set('key3', 'value3')

            // Access in order: key1, key3, key2
            // LRU order after: key1 (oldest), key3, key2 (newest)
            sizeCache.get('key1')
            sizeCache.get('key3')
            sizeCache.get('key2')

            // Add key4 - should evict key1 (now LRU after accesses)
            sizeCache.set('key4', 'value4')

            expect(sizeCache.get('key1')).toBeUndefined() // Evicted (was LRU)
            expect(sizeCache.get('key2')).toBe('value2')
            expect(sizeCache.get('key3')).toBe('value3')
            expect(sizeCache.get('key4')).toBe('value4')
        })

        it('should evict least recently used entry, not oldest inserted', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 2 })

            sizeCache.set('old', 'value1')
            sizeCache.set('new', 'value2')

            // Access 'old' making it most recently used
            sizeCache.get('old')

            // Add another entry - should evict 'new' (LRU), not 'old'
            sizeCache.set('newest', 'value3')

            expect(sizeCache.get('old')).toBe('value1') // Protected by recent access
            expect(sizeCache.get('new')).toBeUndefined() // Evicted
            expect(sizeCache.get('newest')).toBe('value3')
        })

        it('should update LRU order on every get()', () => {
            const sizeCache = new MemoryCache<string>({ maxSize: 3 })

            sizeCache.set('a', '1')
            sizeCache.set('b', '2')
            sizeCache.set('c', '3')

            // Repeatedly access 'a' to keep it as MRU
            sizeCache.get('a')
            sizeCache.set('d', '4') // Evicts 'b'

            sizeCache.get('a')
            sizeCache.set('e', '5') // Evicts 'c'

            sizeCache.get('a')
            sizeCache.set('f', '6') // Evicts 'd'

            // 'a' should still exist due to repeated access
            expect(sizeCache.get('a')).toBe('1')
            expect(sizeCache.get('b')).toBeUndefined()
            expect(sizeCache.get('c')).toBeUndefined()
            expect(sizeCache.get('d')).toBeUndefined()
            expect(sizeCache.get('e')).toBe('5')
            expect(sizeCache.get('f')).toBe('6')
        })
    })

    // ==========================================
    // INTEGRATION WITH TTL
    // ==========================================
    describe('Integration with TTL', () => {
        it('should work with TTL and size limits together', () => {
            const integratedCache = new MemoryCache<string>({
                maxSize: 3,
                ttl: 1000
            })

            integratedCache.set('key1', 'value1')
            integratedCache.set('key2', 'value2')
            integratedCache.set('key3', 'value3')
            integratedCache.set('key4', 'value4')

            expect(integratedCache.get('key1')).toBeUndefined()
            expect(integratedCache.get('key4')).toBe('value4')
        })
    })
})
