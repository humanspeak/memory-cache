import { afterEach, describe, expect, it, vi } from 'vitest'
import { CacheConfigError, MemoryCache } from './cache.js'

type WeightedValue = { name: string; weight: number }

const createCache = (maxWeight: number, maxSize = 0, hooks = {}) =>
    new MemoryCache<WeightedValue>({
        maxSize,
        maxWeight,
        sizeCalculation: (value) => value.weight,
        hooks
    })

describe('MemoryCache weighted LRU eviction', () => {
    afterEach(() => {
        vi.useRealTimers()
    })

    it('evicts the LRU entry when aggregate weight would exceed the limit', () => {
        const cache = createCache(5)
        cache.set('a', { name: 'a', weight: 2 })
        cache.set('b', { name: 'b', weight: 2 })
        cache.set('c', { name: 'c', weight: 2 })

        expect(cache.has('a')).toBe(false)
        expect(cache.keys()).toEqual(['b', 'c'])
        expect(cache.getStats().weight).toBe(4)
    })

    it('evicts multiple LRU entries until a heavy insertion fits', () => {
        const cache = createCache(8)
        cache.set('a', { name: 'a', weight: 2 })
        cache.set('b', { name: 'b', weight: 2 })
        cache.set('c', { name: 'c', weight: 2 })
        cache.set('heavy', { name: 'heavy', weight: 6 })

        expect(cache.keys()).toEqual(['c', 'heavy'])
        expect(cache.getStats()).toMatchObject({ evictions: 2, weight: 8 })
    })

    it('uses recency rather than entry weight to choose evictions', () => {
        const cache = createCache(6)
        cache.set('large', { name: 'large', weight: 3 })
        cache.set('small', { name: 'small', weight: 1 })
        cache.get('large')
        cache.set('new', { name: 'new', weight: 3 })

        expect(cache.keys()).toEqual(['large', 'new'])
        expect(cache.has('small')).toBe(false)
    })

    it('enforces maxSize and maxWeight independently', () => {
        const cache = createCache(5, 2)
        cache.set('a', { name: 'a', weight: 1 })
        cache.set('b', { name: 'b', weight: 1 })
        cache.set('c', { name: 'c', weight: 1 })
        expect(cache.keys()).toEqual(['b', 'c'])

        cache.set('heavy', { name: 'heavy', weight: 5 })
        expect(cache.keys()).toEqual(['heavy'])
        expect(cache.getStats().weight).toBe(5)
    })

    it('supports weight-only operation when maxSize is zero', () => {
        const cache = createCache(1000, 0)
        for (let index = 0; index < 150; index++) {
            cache.set(String(index), { name: String(index), weight: 1 })
        }

        expect(cache.size()).toBe(150)
        expect(cache.getStats().weight).toBe(150)
    })

    it('updates stored weight, promotes the key, and never evicts the updated key', () => {
        const cache = createCache(7)
        cache.set('a', { name: 'a', weight: 2 })
        cache.set('b', { name: 'b', weight: 2 })
        cache.set('c', { name: 'c', weight: 2 })
        cache.set('a', { name: 'updated-a', weight: 5 })

        expect(cache.keys()).toEqual(['c', 'a'])
        expect(cache.get('a')).toEqual({ name: 'updated-a', weight: 5 })
        expect(cache.getStats()).toMatchObject({ evictions: 1, weight: 7 })
    })

    it('calls sizeCalculation once with the original value and key per set attempt', () => {
        const sizeCalculation = vi.fn(
            (value: WeightedValue, key: string) => value.weight + key.length
        )
        const cache = new MemoryCache<WeightedValue>({ maxSize: 0, maxWeight: 20, sizeCalculation })
        const value = { name: 'record', weight: 2 }

        cache.set('api', value)

        expect(sizeCalculation).toHaveBeenCalledOnce()
        expect(sizeCalculation).toHaveBeenCalledWith(value, 'api')
        expect(cache.getStats().weight).toBe(5)
    })

    it('does not cache a new oversized value and evicts an oversized replacement', () => {
        const onEvict = vi.fn()
        const onSet = vi.fn()
        const cache = createCache(5, 0, { onEvict, onSet })
        cache.set('kept', { name: 'kept', weight: 2 })

        cache.set('too-big', { name: 'too-big', weight: 6 })
        expect(cache.keys()).toEqual(['kept'])
        expect(onSet).toHaveBeenCalledTimes(1)
        expect(onEvict).not.toHaveBeenCalled()

        cache.set('kept', { name: 'replacement', weight: 6 })
        expect(cache.has('kept')).toBe(false)
        expect(cache.getStats()).toMatchObject({ evictions: 1, weight: 0 })
        expect(onEvict).toHaveBeenCalledOnce()
        expect(onEvict).toHaveBeenCalledWith({ key: 'kept', value: { name: 'kept', weight: 2 } })
        expect(onSet).toHaveBeenCalledTimes(1)
    })

    it('returns oversized getOrSet values without caching them', async () => {
        const cache = createCache(5)
        const fetcher = vi.fn(() => ({ name: 'fresh', weight: 6 }))

        await expect(cache.getOrSet('oversized', fetcher)).resolves.toEqual({
            name: 'fresh',
            weight: 6
        })
        await expect(cache.getOrSet('oversized', fetcher)).resolves.toEqual({
            name: 'fresh',
            weight: 6
        })

        expect(fetcher).toHaveBeenCalledTimes(2)
        expect(cache.has('oversized')).toBe(false)
        expect(cache.getStats().weight).toBe(0)
    })

    it.each([
        ['negative', -1],
        ['NaN', Number.NaN],
        ['Infinity', Number.POSITIVE_INFINITY]
    ])('rejects a %s calculated weight without observable mutation', (_label, result) => {
        const onEvict = vi.fn()
        const onExpire = vi.fn()
        const onSet = vi.fn()
        const sizeCalculation = vi.fn((value: WeightedValue) =>
            value.name === 'bad' ? result : value.weight
        )
        const cache = new MemoryCache<WeightedValue>({
            maxSize: 0,
            maxWeight: 5,
            ttl: 100,
            sizeCalculation,
            hooks: { onEvict, onExpire, onSet }
        })
        cache.set('a', { name: 'a', weight: 2 })
        const before = cache.getStats()
        const beforeKeys = cache.keys()
        onSet.mockClear()
        sizeCalculation.mockClear()

        expect(() => cache.set('bad', { name: 'bad', weight: 1 })).toThrow(RangeError)
        expect(cache.keys()).toEqual(beforeKeys)
        expect(cache.getStats()).toEqual(before)
        expect(sizeCalculation).toHaveBeenCalledOnce()
        expect(onEvict).not.toHaveBeenCalled()
        expect(onExpire).not.toHaveBeenCalled()
        expect(onSet).not.toHaveBeenCalled()
    })

    it('propagates calculator errors without observable mutation', () => {
        const calculatorError = new Error('calculator failed')
        const onSet = vi.fn()
        const sizeCalculation = vi.fn((value: WeightedValue) => {
            if (value.name === 'bad') throw calculatorError
            return value.weight
        })
        const cache = new MemoryCache<WeightedValue>({
            maxSize: 0,
            maxWeight: 5,
            sizeCalculation,
            hooks: { onSet }
        })
        cache.set('a', { name: 'a', weight: 2 })
        const before = cache.getStats()
        onSet.mockClear()

        expect(() => cache.set('bad', { name: 'bad', weight: 1 })).toThrow(calculatorError)
        expect(cache.keys()).toEqual(['a'])
        expect(cache.getStats()).toEqual(before)
        expect(onSet).not.toHaveBeenCalled()
    })

    it('validates maxWeight configuration', () => {
        expect(() => new MemoryCache({ maxWeight: -1 })).toThrowError(
            new CacheConfigError('maxWeight must be a non-negative number')
        )
        expect(() => new MemoryCache({ maxWeight: Number.NaN })).toThrowError(
            new CacheConfigError('maxWeight must be a non-negative number')
        )
        expect(() => new MemoryCache({ maxWeight: 1 })).toThrowError(
            new CacheConfigError('sizeCalculation is required when maxWeight is greater than 0')
        )
    })

    it('updates aggregate weight for explicit deletion paths', async () => {
        const cache = createCache(20)
        cache.set('plain', { name: 'plain', weight: 1 })
        cache.set('async', { name: 'async', weight: 2 })
        cache.set('prefix:a', { name: 'prefix-a', weight: 3 })
        cache.set('prefix:b', { name: 'prefix-b', weight: 4 })
        cache.set('magic:one:end', { name: 'magic', weight: 5 })
        cache.set('clear', { name: 'clear', weight: 5 })

        expect(cache.delete('plain')).toBe(true)
        expect(cache.getStats().weight).toBe(19)
        expect(await cache.deleteAsync('async')).toBe(true)
        expect(cache.getStats().weight).toBe(17)
        expect(cache.deleteByPrefix('prefix:')).toBe(2)
        expect(cache.getStats().weight).toBe(10)
        expect(cache.deleteByMagicString('magic:*:end')).toBe(1)
        expect(cache.getStats().weight).toBe(5)
        cache.clear()
        expect(cache.getStats().weight).toBe(0)
    })

    it('updates aggregate weight for lazy get and has expiration and proactive prune', () => {
        vi.useFakeTimers()
        const createExpiringCache = () =>
            new MemoryCache<WeightedValue>({
                maxSize: 0,
                maxWeight: 20,
                ttl: 100,
                sizeCalculation: (value) => value.weight
            })

        const getCache = createExpiringCache()
        getCache.set('get', { name: 'get', weight: 2 })
        vi.advanceTimersByTime(101)
        expect(getCache.get('get')).toBeUndefined()
        expect(getCache.getStats().weight).toBe(0)

        const hasCache = createExpiringCache()
        hasCache.set('has', { name: 'has', weight: 3 })
        vi.advanceTimersByTime(101)
        expect(hasCache.has('has')).toBe(false)
        expect(hasCache.getStats().weight).toBe(0)

        const pruneCache = createExpiringCache()
        pruneCache.set('prune', { name: 'prune', weight: 4 })
        vi.advanceTimersByTime(101)
        expect(pruneCache.prune()).toBe(1)
        expect(pruneCache.getStats().weight).toBe(0)
    })

    it('fires one eviction hook and increments the counter for every multi-eviction entry', () => {
        const onEvict = vi.fn()
        const cache = createCache(8, 0, { onEvict })
        cache.set('a', { name: 'a', weight: 2 })
        cache.set('b', { name: 'b', weight: 2 })
        cache.set('c', { name: 'c', weight: 2 })
        cache.set('heavy', { name: 'heavy', weight: 7 })

        expect(onEvict).toHaveBeenCalledTimes(3)
        expect(onEvict.mock.calls.map(([context]) => context.key)).toEqual(['a', 'b', 'c'])
        expect(cache.getStats().evictions).toBe(3)
    })

    it('preserves count-only LRU behavior when weighted options are absent', () => {
        const cache = new MemoryCache<string>({ maxSize: 2 })
        cache.set('a', 'a')
        cache.set('b', 'b')
        cache.get('a')
        cache.set('c', 'c')

        expect(cache.keys()).toEqual(['a', 'c'])
        expect(cache.getStats()).toMatchObject({ evictions: 1, size: 2, weight: 0 })
    })
})
