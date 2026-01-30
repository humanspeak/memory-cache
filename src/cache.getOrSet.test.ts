import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryCache } from './cache.js'

describe('MemoryCache.getOrSet()', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
        cache = new MemoryCache<string>({ ttl: 60000 })
    })

    // ==========================================
    // BASIC FUNCTIONALITY
    // ==========================================
    describe('basic functionality', () => {
        it('should return cached value without calling fetcher', async () => {
            cache.set('key', 'cached-value')
            let fetcherCalled = false

            const result = await cache.getOrSet('key', () => {
                fetcherCalled = true
                return 'fetched-value'
            })

            expect(result).toBe('cached-value')
            expect(fetcherCalled).toBe(false)
        })

        it('should call fetcher and cache on miss', async () => {
            let fetcherCalled = false

            const result = await cache.getOrSet('key', () => {
                fetcherCalled = true
                return 'fetched-value'
            })

            expect(result).toBe('fetched-value')
            expect(fetcherCalled).toBe(true)
            expect(cache.get('key')).toBe('fetched-value')
        })

        it('should work with sync fetcher', async () => {
            const result = await cache.getOrSet('key', () => 'sync-value')

            expect(result).toBe('sync-value')
            expect(cache.get('key')).toBe('sync-value')
        })

        it('should work with async fetcher', async () => {
            const result = await cache.getOrSet('key', async () => {
                await new Promise((resolve) => setTimeout(resolve, 10))
                return 'async-value'
            })

            expect(result).toBe('async-value')
            expect(cache.get('key')).toBe('async-value')
        })

        it('should cache undefined from fetcher', async () => {
            const anyCache = new MemoryCache<string | undefined>({ ttl: 60000 })
            let fetchCount = 0

            const result1 = await anyCache.getOrSet('key', () => {
                fetchCount++
                return undefined
            })

            expect(result1).toBeUndefined()
            expect(anyCache.has('key')).toBe(true)

            // Second call should use cached undefined
            const result2 = await anyCache.getOrSet('key', () => {
                fetchCount++
                return 'should-not-be-called'
            })

            expect(result2).toBeUndefined()
            expect(fetchCount).toBe(1)
        })

        it('should cache null from fetcher', async () => {
            const anyCache = new MemoryCache<string | null>({ ttl: 60000 })
            let fetchCount = 0

            const result1 = await anyCache.getOrSet('key', () => {
                fetchCount++
                return null
            })

            expect(result1).toBeNull()
            expect(anyCache.has('key')).toBe(true)

            // Second call should use cached null
            const result2 = await anyCache.getOrSet('key', () => {
                fetchCount++
                return 'should-not-be-called'
            })

            expect(result2).toBeNull()
            expect(fetchCount).toBe(1)
        })
    })

    // ==========================================
    // SINGLE-FLIGHT (THUNDERING HERD PREVENTION)
    // ==========================================
    describe('single-flight', () => {
        it('should only call fetcher once for concurrent requests', async () => {
            let fetchCount = 0

            const fetcher = async () => {
                fetchCount++
                await new Promise((resolve) => setTimeout(resolve, 50))
                return 'fetched-value'
            }

            // Start multiple concurrent requests
            const promises = [
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher)
            ]

            const results = await Promise.all(promises)

            expect(fetchCount).toBe(1)
            expect(results).toEqual([
                'fetched-value',
                'fetched-value',
                'fetched-value',
                'fetched-value',
                'fetched-value'
            ])
        })

        it('should return same value to all waiters', async () => {
            const fetcher = async () => {
                await new Promise((resolve) => setTimeout(resolve, 20))
                return `value-${Date.now()}`
            }

            const promises = [
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher)
            ]

            const results = await Promise.all(promises)

            // All should have exactly the same value
            expect(results[0]).toBe(results[1])
            expect(results[1]).toBe(results[2])
        })

        it('should allow new fetch after completion', async () => {
            let fetchCount = 0

            const fetcher = async () => {
                fetchCount++
                return `value-${fetchCount}`
            }

            // First fetch
            const result1 = await cache.getOrSet('key', fetcher)
            expect(result1).toBe('value-1')
            expect(fetchCount).toBe(1)

            // Delete the cached value
            cache.delete('key')

            // Second fetch should call fetcher again
            const result2 = await cache.getOrSet('key', fetcher)
            expect(result2).toBe('value-2')
            expect(fetchCount).toBe(2)
        })

        it('should handle different keys independently', async () => {
            let fetchCountA = 0
            let fetchCountB = 0

            const fetcherA = async () => {
                fetchCountA++
                await new Promise((resolve) => setTimeout(resolve, 20))
                return 'value-a'
            }

            const fetcherB = async () => {
                fetchCountB++
                await new Promise((resolve) => setTimeout(resolve, 20))
                return 'value-b'
            }

            const promises = [
                cache.getOrSet('key-a', fetcherA),
                cache.getOrSet('key-a', fetcherA),
                cache.getOrSet('key-b', fetcherB),
                cache.getOrSet('key-b', fetcherB)
            ]

            const results = await Promise.all(promises)

            expect(fetchCountA).toBe(1)
            expect(fetchCountB).toBe(1)
            expect(results).toEqual(['value-a', 'value-a', 'value-b', 'value-b'])
        })
    })

    // ==========================================
    // ERROR HANDLING
    // ==========================================
    describe('error handling', () => {
        it('should propagate fetcher errors', async () => {
            const fetcher = async () => {
                throw new Error('Fetch failed')
            }

            await expect(cache.getOrSet('key', fetcher)).rejects.toThrow('Fetch failed')
        })

        it('should not cache errors', async () => {
            let fetchCount = 0

            const fetcher = async () => {
                fetchCount++
                if (fetchCount === 1) {
                    throw new Error('First fetch failed')
                }
                return 'success'
            }

            // First call fails
            await expect(cache.getOrSet('key', fetcher)).rejects.toThrow('First fetch failed')
            expect(cache.has('key')).toBe(false)

            // Second call should retry and succeed
            const result = await cache.getOrSet('key', fetcher)
            expect(result).toBe('success')
            expect(fetchCount).toBe(2)
        })

        it('should clean up in-flight on error', async () => {
            let fetchCount = 0

            const failingFetcher = async () => {
                fetchCount++
                await new Promise((resolve) => setTimeout(resolve, 10))
                throw new Error('Fetch failed')
            }

            // First attempt fails
            await expect(cache.getOrSet('key', failingFetcher)).rejects.toThrow('Fetch failed')

            // Subsequent attempt should start a new fetch (not join the failed one)
            const successFetcher = async () => {
                fetchCount++
                return 'success'
            }

            const result = await cache.getOrSet('key', successFetcher)
            expect(result).toBe('success')
            expect(fetchCount).toBe(2)
        })

        it('should propagate error to all waiters', async () => {
            let fetchCount = 0

            const fetcher = async () => {
                fetchCount++
                await new Promise((resolve) => setTimeout(resolve, 20))
                throw new Error('Shared failure')
            }

            const promises = [
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher)
            ]

            const results = await Promise.allSettled(promises)

            expect(fetchCount).toBe(1)
            expect(results.every((r) => r.status === 'rejected')).toBe(true)
            results.forEach((r) => {
                if (r.status === 'rejected') {
                    expect(r.reason.message).toBe('Shared failure')
                }
            })
        })
    })

    // ==========================================
    // HOOKS
    // ==========================================
    describe('hooks', () => {
        it('should call onHit on cache hit', async () => {
            const onHit = vi.fn()
            const hookCache = new MemoryCache<string>({ ttl: 60000, hooks: { onHit } })

            hookCache.set('key', 'cached-value')
            await hookCache.getOrSet('key', () => 'fetched-value')

            expect(onHit).toHaveBeenCalledTimes(1)
            expect(onHit).toHaveBeenCalledWith({ key: 'key', value: 'cached-value' })
        })

        it('should call onMiss before fetch', async () => {
            const onMiss = vi.fn()
            const hookCache = new MemoryCache<string>({ ttl: 60000, hooks: { onMiss } })

            await hookCache.getOrSet('key', () => 'fetched-value')

            expect(onMiss).toHaveBeenCalledTimes(1)
            expect(onMiss).toHaveBeenCalledWith({ key: 'key', reason: 'not_found' })
        })

        it('should call onSet after successful fetch', async () => {
            const onSet = vi.fn()
            const hookCache = new MemoryCache<string>({ ttl: 60000, hooks: { onSet } })

            await hookCache.getOrSet('key', () => 'fetched-value')

            expect(onSet).toHaveBeenCalledTimes(1)
            expect(onSet).toHaveBeenCalledWith({
                key: 'key',
                value: 'fetched-value',
                isUpdate: false
            })
        })

        it('should not call onSet when fetcher fails', async () => {
            const onSet = vi.fn()
            const hookCache = new MemoryCache<string>({ ttl: 60000, hooks: { onSet } })

            await expect(
                hookCache.getOrSet('key', () => {
                    throw new Error('Fetch failed')
                })
            ).rejects.toThrow()

            expect(onSet).not.toHaveBeenCalled()
        })

        it('should call onMiss only once for concurrent requests', async () => {
            const onMiss = vi.fn()
            const hookCache = new MemoryCache<string>({ ttl: 60000, hooks: { onMiss } })

            const fetcher = async () => {
                await new Promise((resolve) => setTimeout(resolve, 20))
                return 'value'
            }

            await Promise.all([
                hookCache.getOrSet('key', fetcher),
                hookCache.getOrSet('key', fetcher),
                hookCache.getOrSet('key', fetcher)
            ])

            expect(onMiss).toHaveBeenCalledTimes(1)
        })
    })

    // ==========================================
    // EXPIRATION
    // ==========================================
    describe('expiration', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should re-fetch after cached entry expires', async () => {
            const ttlCache = new MemoryCache<string>({ ttl: 100 })
            let fetchCount = 0

            const fetcher = () => {
                fetchCount++
                return `value-${fetchCount}`
            }

            // First fetch
            const result1 = await ttlCache.getOrSet('key', fetcher)
            expect(result1).toBe('value-1')
            expect(fetchCount).toBe(1)

            // Advance past TTL
            vi.advanceTimersByTime(101)

            // Should re-fetch
            const result2 = await ttlCache.getOrSet('key', fetcher)
            expect(result2).toBe('value-2')
            expect(fetchCount).toBe(2)
        })
    })

    // ==========================================
    // LRU INTEGRATION
    // ==========================================
    describe('LRU integration', () => {
        it('should evict properly when cache is full', async () => {
            const lruCache = new MemoryCache<string>({ maxSize: 2, ttl: 60000 })

            await lruCache.getOrSet('key1', () => 'value1')
            await lruCache.getOrSet('key2', () => 'value2')

            // Cache is full, adding key3 should evict key1 (LRU)
            await lruCache.getOrSet('key3', () => 'value3')

            expect(lruCache.has('key1')).toBe(false)
            expect(lruCache.has('key2')).toBe(true)
            expect(lruCache.has('key3')).toBe(true)
        })

        it('should update LRU order on cache hit via getOrSet', async () => {
            const lruCache = new MemoryCache<string>({ maxSize: 2, ttl: 60000 })

            await lruCache.getOrSet('key1', () => 'value1')
            await lruCache.getOrSet('key2', () => 'value2')

            // Access key1 to make it MRU
            await lruCache.getOrSet('key1', () => 'should-not-be-called')

            // Adding key3 should now evict key2 (now LRU)
            await lruCache.getOrSet('key3', () => 'value3')

            expect(lruCache.has('key1')).toBe(true)
            expect(lruCache.has('key2')).toBe(false)
            expect(lruCache.has('key3')).toBe(true)
        })
    })

    // ==========================================
    // STATISTICS
    // ==========================================
    describe('statistics', () => {
        it('should increment hits on cache hit', async () => {
            cache.set('key', 'value')
            await cache.getOrSet('key', () => 'fetched')

            expect(cache.getStats().hits).toBe(1)
        })

        it('should increment misses on cache miss', async () => {
            await cache.getOrSet('key', () => 'fetched')

            expect(cache.getStats().misses).toBe(1)
        })

        it('should only increment misses once for concurrent requests', async () => {
            const fetcher = async () => {
                await new Promise((resolve) => setTimeout(resolve, 20))
                return 'value'
            }

            await Promise.all([
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher),
                cache.getOrSet('key', fetcher)
            ])

            expect(cache.getStats().misses).toBe(1)
        })
    })
})
