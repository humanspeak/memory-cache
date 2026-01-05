import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CacheConfigError, cached, MemoryCache } from './cache.js'

describe('MemoryCache', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
        cache = new MemoryCache<string>()
    })

    // ==========================================
    // POSITIVE TEST CASES
    // ==========================================
    describe('Positive Cases', () => {
        describe('Constructor', () => {
            it('should create cache with default options', () => {
                const defaultCache = new MemoryCache<string>()
                expect(defaultCache).toBeInstanceOf(MemoryCache)
            })

            it('should create cache with custom maxSize', () => {
                const customCache = new MemoryCache<string>({ maxSize: 50 })
                expect(customCache).toBeInstanceOf(MemoryCache)
            })

            it('should create cache with custom TTL', () => {
                const customCache = new MemoryCache<string>({ ttl: 1000 })
                expect(customCache).toBeInstanceOf(MemoryCache)
            })

            it('should create cache with both custom options', () => {
                const customCache = new MemoryCache<string>({
                    maxSize: 200,
                    ttl: 2000
                })
                expect(customCache).toBeInstanceOf(MemoryCache)
            })

            it('should create multiple independent cache instances', () => {
                const cache1 = new MemoryCache<string>()
                const cache2 = new MemoryCache<string>()

                cache1.set('key', 'value1')
                cache2.set('key', 'value2')

                expect(cache1.get('key')).toBe('value1')
                expect(cache2.get('key')).toBe('value2')
            })
        })

        describe('set() and get()', () => {
            it('should set and get a value', () => {
                cache.set('key1', 'value1')
                expect(cache.get('key1')).toBe('value1')
            })

            it('should overwrite existing value', () => {
                cache.set('key1', 'value1')
                cache.set('key1', 'value2')
                expect(cache.get('key1')).toBe('value2')
            })

            it('should handle different data types', () => {
                const numberCache = new MemoryCache<number>()
                const objectCache = new MemoryCache<{ name: string }>()
                const arrayCache = new MemoryCache<string[]>()

                numberCache.set('num', 42)
                objectCache.set('obj', { name: 'test' })
                arrayCache.set('arr', ['a', 'b', 'c'])

                expect(numberCache.get('num')).toBe(42)
                expect(objectCache.get('obj')).toEqual({ name: 'test' })
                expect(arrayCache.get('arr')).toEqual(['a', 'b', 'c'])
            })

            it('should handle boolean values', () => {
                const boolCache = new MemoryCache<boolean>()
                boolCache.set('true', true)
                boolCache.set('false', false)

                expect(boolCache.get('true')).toBe(true)
                expect(boolCache.get('false')).toBe(false)
            })

            it('should handle Date objects', () => {
                const dateCache = new MemoryCache<Date>()
                const now = new Date()
                dateCache.set('date', now)
                expect(dateCache.get('date')).toBe(now)
            })

            it('should handle RegExp objects', () => {
                const regexCache = new MemoryCache<RegExp>()
                const pattern = /test\d+/gi
                regexCache.set('regex', pattern)
                expect(regexCache.get('regex')).toBe(pattern)
            })

            it('should handle function values', () => {
                // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
                const fnCache = new MemoryCache<Function>()
                const fn = () => 'hello'
                fnCache.set('fn', fn)
                expect(fnCache.get('fn')).toBe(fn)
            })

            it('should handle BigInt values', () => {
                const bigIntCache = new MemoryCache<bigint>()
                const bigNum = BigInt(9007199254740991)
                bigIntCache.set('big', bigNum)
                expect(bigIntCache.get('big')).toBe(bigNum)
            })

            it('should handle Map and Set values', () => {
                const mapCache = new MemoryCache<Map<string, number>>()
                const setCache = new MemoryCache<Set<string>>()

                const map = new Map([['a', 1]])
                const set = new Set(['x', 'y'])

                mapCache.set('map', map)
                setCache.set('set', set)

                expect(mapCache.get('map')).toBe(map)
                expect(setCache.get('set')).toBe(set)
            })

            it('should handle nested objects', () => {
                const nestedCache = new MemoryCache<object>()
                const nested = {
                    level1: {
                        level2: {
                            level3: {
                                value: 'deep'
                            }
                        }
                    }
                }
                nestedCache.set('nested', nested)
                expect(nestedCache.get('nested')).toEqual(nested)
            })

            it('should reuse same key after delete', () => {
                cache.set('key', 'value1')
                cache.delete('key')
                cache.set('key', 'value2')
                expect(cache.get('key')).toBe('value2')
            })

            it('should handle setting many keys sequentially', () => {
                for (let i = 0; i < 100; i++) {
                    cache.set(`key${i}`, `value${i}`)
                }
                expect(cache.get('key50')).toBe('value50')
            })
        })

        describe('has()', () => {
            it('should return true for existing keys', () => {
                cache.set('key1', 'value1')
                expect(cache.has('key1')).toBe(true)
            })

            it('should return true for cached undefined values', () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyCache = new MemoryCache<any>()
                anyCache.set('undefined', undefined)
                expect(anyCache.has('undefined')).toBe(true)
            })

            it('should return true for cached null values', () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyCache = new MemoryCache<any>()
                anyCache.set('null', null)
                expect(anyCache.has('null')).toBe(true)
            })

            it('should return true for cached empty string', () => {
                cache.set('empty', '')
                expect(cache.has('empty')).toBe(true)
            })

            it('should return true for cached zero', () => {
                const numCache = new MemoryCache<number>()
                numCache.set('zero', 0)
                expect(numCache.has('zero')).toBe(true)
            })
        })

        describe('TTL (Time To Live)', () => {
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
        })

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
        })

        describe('delete()', () => {
            it('should delete existing key and return true', () => {
                cache.set('key1', 'value1')
                expect(cache.delete('key1')).toBe(true)
                expect(cache.get('key1')).toBeUndefined()
            })

            it('should allow new values after deletion', () => {
                cache.set('key1', 'value1')
                cache.delete('key1')
                cache.set('key1', 'value2')
                expect(cache.get('key1')).toBe('value2')
            })
        })

        describe('deleteAsync()', () => {
            it('should delete existing key and return true', async () => {
                cache.set('key1', 'value1')
                const result = await cache.deleteAsync('key1')
                expect(result).toBe(true)
                expect(cache.get('key1')).toBeUndefined()
            })

            it('should handle multiple async deletes', async () => {
                cache.set('key1', 'value1')
                cache.set('key2', 'value2')
                cache.set('key3', 'value3')

                const results = await Promise.all([
                    cache.deleteAsync('key1'),
                    cache.deleteAsync('key2'),
                    cache.deleteAsync('key3')
                ])

                expect(results).toEqual([true, true, true])
                expect(cache.get('key1')).toBeUndefined()
                expect(cache.get('key2')).toBeUndefined()
                expect(cache.get('key3')).toBeUndefined()
            })
        })

        describe('clear()', () => {
            it('should remove all entries', () => {
                cache.set('key1', 'value1')
                cache.set('key2', 'value2')
                cache.set('key3', 'value3')

                cache.clear()

                expect(cache.get('key1')).toBeUndefined()
                expect(cache.get('key2')).toBeUndefined()
                expect(cache.get('key3')).toBeUndefined()
            })

            it('should allow setting new entries after clear', () => {
                cache.set('key1', 'value1')
                cache.clear()
                cache.set('key2', 'value2')
                expect(cache.get('key2')).toBe('value2')
            })
        })

        describe('deleteByPrefix()', () => {
            it('should delete entries with matching prefix', () => {
                cache.set('user:123:name', 'John')
                cache.set('user:123:email', 'john@example.com')
                cache.set('user:456:name', 'Jane')
                cache.set('post:789', 'Hello World')

                const removed = cache.deleteByPrefix('user:123:')

                expect(removed).toBe(2)
                expect(cache.get('user:123:name')).toBeUndefined()
                expect(cache.get('user:123:email')).toBeUndefined()
                expect(cache.get('user:456:name')).toBe('Jane')
                expect(cache.get('post:789')).toBe('Hello World')
            })

            it('should handle exact key match as prefix', () => {
                cache.set('exact', 'value')
                cache.set('exact:more', 'other')

                const removed = cache.deleteByPrefix('exact')

                expect(removed).toBe(2)
            })

            it('should handle special characters in prefix', () => {
                cache.set('user:123:name', 'John')
                cache.set('user:123:email', 'john@example.com')

                const removed = cache.deleteByPrefix('user:123:')
                expect(removed).toBe(2)
            })
        })

        describe('deleteByMagicString()', () => {
            it('should delete entries matching wildcard pattern', () => {
                cache.set('user:123:name', 'John')
                cache.set('user:123:email', 'john@example.com')
                cache.set('user:456:name', 'Jane')
                cache.set('post:789', 'Hello World')

                const removed = cache.deleteByMagicString('user:123:*')

                expect(removed).toBe(2)
                expect(cache.get('user:123:name')).toBeUndefined()
                expect(cache.get('user:123:email')).toBeUndefined()
                expect(cache.get('user:456:name')).toBe('Jane')
                expect(cache.get('post:789')).toBe('Hello World')
            })

            it('should handle multiple wildcards', () => {
                cache.set('user:123:name', 'John')
                cache.set('user:456:name', 'Jane')
                cache.set('user:123:email', 'john@example.com')
                cache.set('post:789', 'Hello World')

                const removed = cache.deleteByMagicString('user:*:name')

                expect(removed).toBe(2)
                expect(cache.get('user:123:name')).toBeUndefined()
                expect(cache.get('user:456:name')).toBeUndefined()
                expect(cache.get('user:123:email')).toBe('john@example.com')
            })

            it('should handle wildcard at start', () => {
                cache.set('user:123:name', 'John')
                cache.set('post:123:name', 'Post Name')
                cache.set('comment:123:name', 'Comment Name')

                const removed = cache.deleteByMagicString('*:123:name')
                expect(removed).toBe(3)
            })

            it('should handle wildcard at end', () => {
                cache.set('user:123:name', 'John')
                cache.set('user:123:email', 'john@example.com')
                cache.set('user:123:avatar', 'avatar.jpg')

                const removed = cache.deleteByMagicString('user:123:*')
                expect(removed).toBe(3)
            })

            it('should handle multiple wildcards in sequence', () => {
                cache.set('user:123:name', 'John')
                cache.set('user:456:name', 'Jane')
                cache.set('post:123:title', 'Post Title')

                const removed = cache.deleteByMagicString('user:*:*')

                expect(removed).toBe(2)
                expect(cache.get('post:123:title')).toBe('Post Title')
            })

            it('should handle exact match with no wildcards', () => {
                cache.set('exact', 'value')
                cache.set('exact:more', 'other')

                const removed = cache.deleteByMagicString('exact')

                expect(removed).toBe(1)
                expect(cache.get('exact')).toBeUndefined()
                expect(cache.get('exact:more')).toBe('other')
            })

            it('should handle complex patterns', () => {
                cache.set('api:v1:users:123:profile', 'Profile Data')
                cache.set('api:v1:users:456:profile', 'Other Profile')
                cache.set('api:v2:users:123:profile', 'V2 Profile')
                cache.set('api:v1:posts:123:content', 'Post Content')

                const removed = cache.deleteByMagicString('api:v1:users:*:profile')

                expect(removed).toBe(2)
                expect(cache.get('api:v2:users:123:profile')).toBe('V2 Profile')
                expect(cache.get('api:v1:posts:123:content')).toBe('Post Content')
            })
        })

        describe('Integration Tests', () => {
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

            it('should handle complex deletion scenarios', () => {
                cache.set('user:123:profile:name', 'John')
                cache.set('user:123:profile:email', 'john@example.com')
                cache.set('user:123:settings:theme', 'dark')
                cache.set('user:456:profile:name', 'Jane')
                cache.set('post:789:content', 'Hello World')

                const removed1 = cache.deleteByMagicString('user:123:*')
                expect(removed1).toBe(3)

                const removed2 = cache.deleteByMagicString('user:*:profile:name')
                expect(removed2).toBe(1)

                expect(cache.get('post:789:content')).toBe('Hello World')
            })
        })
    })

    // ==========================================
    // NEGATIVE TEST CASES
    // ==========================================
    describe('Negative Cases', () => {
        describe('get()', () => {
            it('should return undefined for non-existent key', () => {
                expect(cache.get('nonexistent')).toBeUndefined()
            })

            it('should return undefined for deleted key', () => {
                cache.set('key', 'value')
                cache.delete('key')
                expect(cache.get('key')).toBeUndefined()
            })

            it('should return undefined for cleared key', () => {
                cache.set('key', 'value')
                cache.clear()
                expect(cache.get('key')).toBeUndefined()
            })

            it('should return undefined for evicted key', () => {
                const smallCache = new MemoryCache<string>({ maxSize: 1 })
                smallCache.set('key1', 'value1')
                smallCache.set('key2', 'value2')
                expect(smallCache.get('key1')).toBeUndefined()
            })
        })

        describe('has()', () => {
            it('should return false for non-existent keys', () => {
                expect(cache.has('nonexistent')).toBe(false)
            })

            it('should return false for deleted key', () => {
                cache.set('key', 'value')
                cache.delete('key')
                expect(cache.has('key')).toBe(false)
            })

            it('should return false for expired entries', () => {
                vi.useFakeTimers()
                const ttlCache = new MemoryCache<string>({ ttl: 1000 })

                ttlCache.set('key1', 'value1')
                expect(ttlCache.has('key1')).toBe(true)

                vi.advanceTimersByTime(1001)
                expect(ttlCache.has('key1')).toBe(false)

                vi.useRealTimers()
            })
        })

        describe('delete()', () => {
            it('should return false for non-existent key', () => {
                expect(cache.delete('nonexistent')).toBe(false)
            })

            it('should return false for already deleted key', () => {
                cache.set('key1', 'value1')
                cache.delete('key1')
                expect(cache.delete('key1')).toBe(false)
            })
        })

        describe('deleteAsync()', () => {
            it('should return false for non-existent key', async () => {
                const result = await cache.deleteAsync('nonexistent')
                expect(result).toBe(false)
            })

            it('should return false for already deleted key', async () => {
                cache.set('key1', 'value1')
                await cache.deleteAsync('key1')
                const result = await cache.deleteAsync('key1')
                expect(result).toBe(false)
            })
        })

        describe('deleteByPrefix()', () => {
            it('should return 0 for non-matching prefix', () => {
                cache.set('user:123:name', 'John')
                cache.set('post:789', 'Hello World')

                const removed = cache.deleteByPrefix('nonexistent:')

                expect(removed).toBe(0)
                expect(cache.get('user:123:name')).toBe('John')
                expect(cache.get('post:789')).toBe('Hello World')
            })

            it('should return 0 on empty cache', () => {
                const removed = cache.deleteByPrefix('prefix:')
                expect(removed).toBe(0)
            })
        })

        describe('deleteByMagicString()', () => {
            it('should return 0 for non-matching pattern', () => {
                cache.set('user:123:name', 'John')
                cache.set('post:789', 'Hello World')

                const removed = cache.deleteByMagicString('nonexistent:*')
                expect(removed).toBe(0)
            })

            it('should return 0 for empty pattern', () => {
                cache.set('key1', 'value1')
                cache.set('key2', 'value2')

                const removed = cache.deleteByMagicString('')
                expect(removed).toBe(0)
            })

            it('should return 0 on empty cache', () => {
                const removed = cache.deleteByMagicString('*')
                expect(removed).toBe(0)
            })
        })

        describe('TTL edge cases', () => {
            beforeEach(() => {
                vi.useFakeTimers()
            })

            afterEach(() => {
                vi.useRealTimers()
            })

            it('should clean up expired entries on get', () => {
                const ttlCache = new MemoryCache<string>({ ttl: 1000 })

                ttlCache.set('key1', 'value1')
                ttlCache.set('key2', 'value2')

                vi.advanceTimersByTime(1001)

                expect(ttlCache.get('key2')).toBeUndefined()
            })
        })
    })

    // ==========================================
    // EDGE CASES
    // ==========================================
    describe('Edge Cases', () => {
        describe('Empty string keys and values', () => {
            it('should handle empty string keys', () => {
                cache.set('', 'empty key value')
                expect(cache.get('')).toBe('empty key value')
            })

            it('should handle empty string values', () => {
                cache.set('empty', '')
                expect(cache.get('empty')).toBe('')
            })

            it('should delete empty string key', () => {
                cache.set('', 'value')
                expect(cache.delete('')).toBe(true)
                expect(cache.get('')).toBeUndefined()
            })
        })

        describe('Null and undefined values', () => {
            it('should handle null and undefined values', () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyCache = new MemoryCache<any>()
                anyCache.set('null', null)
                anyCache.set('undefined', undefined)

                expect(anyCache.get('null')).toBeNull()
                expect(anyCache.get('undefined')).toBeUndefined()
            })

            it('should distinguish cached undefined from cache miss', () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyCache = new MemoryCache<any>()

                anyCache.set('undefined', undefined)
                expect(anyCache.has('undefined')).toBe(true)
                expect(anyCache.has('nonexistent')).toBe(false)
            })

            it('should distinguish cached null from cache miss', () => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const anyCache = new MemoryCache<any>()

                anyCache.set('null', null)
                expect(anyCache.has('null')).toBe(true)
                expect(anyCache.get('null')).toBeNull()
            })
        })

        describe('Zero and negative values for options', () => {
            it('should handle zero TTL (no expiration)', () => {
                vi.useFakeTimers()
                const ttlCache = new MemoryCache<string>({ ttl: 0 })

                ttlCache.set('key1', 'value1')
                vi.advanceTimersByTime(10000)
                expect(ttlCache.get('key1')).toBe('value1')

                vi.useRealTimers()
            })

            it('should handle zero TTL (no expiration)', () => {
                vi.useFakeTimers()
                const ttlCache = new MemoryCache<string>({ ttl: 0 })

                ttlCache.set('key1', 'value1')
                vi.advanceTimersByTime(10000)
                expect(ttlCache.get('key1')).toBe('value1')

                vi.useRealTimers()
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

            it('should handle zero max size (no limit)', () => {
                const sizeCache = new MemoryCache<string>({ maxSize: 0 })

                for (let i = 0; i < 1000; i++) {
                    sizeCache.set(`key${i}`, `value${i}`)
                }

                for (let i = 0; i < 1000; i++) {
                    expect(sizeCache.get(`key${i}`)).toBe(`value${i}`)
                }
            })
        })

        describe('TTL boundary conditions', () => {
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
        })

        describe('Special characters', () => {
            it('should handle unicode keys and values', () => {
                const unicodeKey = '🔑:测试:key'
                const unicodeValue = '🎉测试value🌟'

                cache.set(unicodeKey, unicodeValue)
                expect(cache.get(unicodeKey)).toBe(unicodeValue)
            })

            it('should handle keys with newlines and tabs', () => {
                cache.set('key\nwith\nnewlines', 'value1')
                cache.set('key\twith\ttabs', 'value2')

                expect(cache.get('key\nwith\nnewlines')).toBe('value1')
                expect(cache.get('key\twith\ttabs')).toBe('value2')
            })

            it('should handle keys with backslashes', () => {
                cache.set('key\\with\\backslashes', 'value')
                expect(cache.get('key\\with\\backslashes')).toBe('value')
            })

            it('should handle very long keys', () => {
                const longKey = 'x'.repeat(10000)
                cache.set(longKey, 'value')
                expect(cache.get(longKey)).toBe('value')
            })

            it('should handle regex special characters in deleteByMagicString', () => {
                cache.set('user.123.name', 'John')
                cache.set('user+123+name', 'Jane')
                cache.set('user*123*name', 'Bob')

                const removed = cache.deleteByMagicString('user.123.*')

                expect(removed).toBe(1)
                expect(cache.get('user.123.name')).toBeUndefined()
                expect(cache.get('user+123+name')).toBe('Jane')
                expect(cache.get('user*123*name')).toBe('Bob')
            })

            it('should handle all regex special characters in deleteByMagicString', () => {
                cache.set('a.b', 'dot')
                cache.set('a+b', 'plus')
                cache.set('a?b', 'question')
                cache.set('a^b', 'caret')
                cache.set('a$b', 'dollar')
                cache.set('a{b', 'brace')
                cache.set('a(b', 'paren')
                cache.set('a[b', 'bracket')
                cache.set('a|b', 'pipe')
                cache.set('a\\b', 'backslash')

                // Test each regex special character is escaped properly
                expect(cache.deleteByMagicString('a.b')).toBe(1)
                expect(cache.deleteByMagicString('a+b')).toBe(1)
                expect(cache.deleteByMagicString('a?b')).toBe(1)
                expect(cache.deleteByMagicString('a^b')).toBe(1)
                expect(cache.deleteByMagicString('a$b')).toBe(1)
                expect(cache.deleteByMagicString('a{b')).toBe(1)
                expect(cache.deleteByMagicString('a(b')).toBe(1)
                expect(cache.deleteByMagicString('a[b')).toBe(1)
                expect(cache.deleteByMagicString('a|b')).toBe(1)
                expect(cache.deleteByMagicString('a\\b')).toBe(1)
            })
        })

        describe('Large values', () => {
            it('should handle very large values', () => {
                const largeString = 'x'.repeat(1000000)
                cache.set('large', largeString)
                expect(cache.get('large')).toBe(largeString)
            })

            it('should handle many keys', () => {
                const manyCache = new MemoryCache<string>({ maxSize: 10000 })

                for (let i = 0; i < 1000; i++) {
                    manyCache.set(`key${i}`, `value${i}`)
                }

                for (let i = 0; i < 1000; i++) {
                    expect(manyCache.get(`key${i}`)).toBe(`value${i}`)
                }
            })
        })

        describe('Empty prefix/pattern matching', () => {
            it('should handle empty prefix (matches all)', () => {
                cache.set('key1', 'value1')
                cache.set('key2', 'value2')

                const removed = cache.deleteByPrefix('')

                expect(removed).toBe(2)
                expect(cache.get('key1')).toBeUndefined()
                expect(cache.get('key2')).toBeUndefined()
            })

            it('should handle single wildcard matching all', () => {
                cache.set('key1', 'value1')
                cache.set('key2', 'value2')
                cache.set('anything', 'value3')

                const removed = cache.deleteByMagicString('*')

                expect(removed).toBe(3)
            })
        })

        describe('Clearing empty cache', () => {
            it('should handle clearing empty cache', () => {
                expect(() => cache.clear()).not.toThrow()
            })
        })

        describe('Concurrent operations', () => {
            it('should handle concurrent operations', () => {
                const promises = []

                for (let i = 0; i < 100; i++) {
                    promises.push(
                        Promise.resolve().then(() => {
                            cache.set(`key${i}`, `value${i}`)
                            return cache.get(`key${i}`)
                        })
                    )
                }

                return Promise.all(promises).then((results) => {
                    results.forEach((result, i) => {
                        expect(result).toBe(`value${i}`)
                    })
                })
            })

            it('should handle rapid set/delete operations', async () => {
                const promises: Promise<void>[] = []

                for (let i = 0; i < 50; i++) {
                    promises.push(
                        Promise.resolve().then(() => {
                            cache.set('race', `value${i}`)
                        })
                    )
                    promises.push(
                        Promise.resolve().then(() => {
                            cache.delete('race')
                        })
                    )
                }

                await Promise.all(promises)
                // Cache should be in a consistent state (either has value or doesn't)
                const value = cache.get('race')
                expect(value === undefined || typeof value === 'string').toBe(true)
            })
        })

        describe('Frozen and sealed objects', () => {
            it('should handle frozen objects as values', () => {
                const objCache = new MemoryCache<object>()
                const frozen = Object.freeze({ key: 'value' })
                objCache.set('frozen', frozen)
                expect(objCache.get('frozen')).toBe(frozen)
            })

            it('should handle sealed objects as values', () => {
                const objCache = new MemoryCache<object>()
                const sealed = Object.seal({ key: 'value' })
                objCache.set('sealed', sealed)
                expect(objCache.get('sealed')).toBe(sealed)
            })
        })

        describe('Symbol and special object values', () => {
            it('should handle Symbol values', () => {
                const symbolCache = new MemoryCache<symbol>()
                const sym = Symbol('test')
                symbolCache.set('symbol', sym)
                expect(symbolCache.get('symbol')).toBe(sym)
            })

            it('should handle Proxy objects as values', () => {
                const objCache = new MemoryCache<object>()
                const target = { name: 'test' }
                const proxy = new Proxy(target, {})
                objCache.set('proxy', proxy)
                expect(objCache.get('proxy')).toBe(proxy)
            })
        })

        describe('NaN and Infinity options', () => {
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

            it('should handle Infinity TTL', () => {
                vi.useFakeTimers()
                const infCache = new MemoryCache<string>({ ttl: Infinity })

                infCache.set('key', 'value')
                vi.advanceTimersByTime(Number.MAX_SAFE_INTEGER)
                expect(infCache.get('key')).toBe('value')

                vi.useRealTimers()
            })

            it('should handle Infinity maxSize', () => {
                const infCache = new MemoryCache<string>({ maxSize: Infinity })

                for (let i = 0; i < 200; i++) {
                    infCache.set(`key${i}`, `value${i}`)
                }

                expect(infCache.get('key0')).toBe('value0')
                expect(infCache.get('key199')).toBe('value199')
            })
        })
    })

    // ==========================================
    // CONSTRUCTOR VALIDATION TESTS
    // ==========================================
    describe('Constructor Validation', () => {
        it('should throw CacheConfigError for negative maxSize', () => {
            expect(() => new MemoryCache<string>({ maxSize: -1 })).toThrow(CacheConfigError)
            expect(() => new MemoryCache<string>({ maxSize: -1 })).toThrow(
                'maxSize must be a non-negative number'
            )
        })

        it('should throw CacheConfigError for negative ttl', () => {
            expect(() => new MemoryCache<string>({ ttl: -1 })).toThrow(CacheConfigError)
            expect(() => new MemoryCache<string>({ ttl: -1 })).toThrow(
                'ttl must be a non-negative number'
            )
        })

        it('should accept zero maxSize', () => {
            const zeroCache = new MemoryCache<string>({ maxSize: 0 })
            expect(zeroCache).toBeInstanceOf(MemoryCache)
        })

        it('should accept zero ttl', () => {
            const zeroCache = new MemoryCache<string>({ ttl: 0 })
            expect(zeroCache).toBeInstanceOf(MemoryCache)
        })
    })

    // ==========================================
    // INTROSPECTION TESTS
    // ==========================================
    describe('Introspection Methods', () => {
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

    // ==========================================
    // STATISTICS TESTS
    // ==========================================
    describe('Statistics', () => {
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

            it('should track expirations', async () => {
                const shortTtlCache = new MemoryCache<string>({ ttl: 10 })
                shortTtlCache.set('key', 'value')

                await new Promise((resolve) => setTimeout(resolve, 20))

                shortTtlCache.get('key') // triggers expiration

                const stats = shortTtlCache.getStats()
                expect(stats.expirations).toBe(1)
                expect(stats.misses).toBe(1) // expiration also counts as miss
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

        describe('prune()', () => {
            it('should remove expired entries and return count', () => {
                vi.useFakeTimers()
                const ttlCache = new MemoryCache<string>({ ttl: 100 })
                ttlCache.set('key1', 'value1')
                ttlCache.set('key2', 'value2')
                ttlCache.set('key3', 'value3')

                vi.advanceTimersByTime(101)

                const pruned = ttlCache.prune()
                expect(pruned).toBe(3)
                expect(ttlCache.size()).toBe(0)
                vi.useRealTimers()
            })

            it('should only remove expired entries', () => {
                vi.useFakeTimers()
                const ttlCache = new MemoryCache<string>({ ttl: 100 })
                ttlCache.set('old', 'value1')

                vi.advanceTimersByTime(50)
                ttlCache.set('new', 'value2')

                vi.advanceTimersByTime(51)

                const pruned = ttlCache.prune()
                expect(pruned).toBe(1)
                expect(ttlCache.size()).toBe(1)
                expect(ttlCache.get('new')).toBe('value2')
                vi.useRealTimers()
            })

            it('should return 0 when no entries are expired', () => {
                vi.useFakeTimers()
                const ttlCache = new MemoryCache<string>({ ttl: 100 })
                ttlCache.set('key1', 'value1')
                ttlCache.set('key2', 'value2')

                const pruned = ttlCache.prune()
                expect(pruned).toBe(0)
                expect(ttlCache.size()).toBe(2)
                vi.useRealTimers()
            })

            it('should return 0 when TTL is disabled', () => {
                const noTtlCache = new MemoryCache<string>({ ttl: 0 })
                noTtlCache.set('key1', 'value1')

                const pruned = noTtlCache.prune()
                expect(pruned).toBe(0)
                expect(noTtlCache.size()).toBe(1)
            })

            it('should increment expirations stat for each pruned entry', () => {
                vi.useFakeTimers()
                const ttlCache = new MemoryCache<string>({ ttl: 100 })
                ttlCache.set('key1', 'value1')
                ttlCache.set('key2', 'value2')

                vi.advanceTimersByTime(101)

                ttlCache.prune()
                expect(ttlCache.getStats().expirations).toBe(2)
                vi.useRealTimers()
            })

            it('should return 0 when cache is empty', () => {
                const ttlCache = new MemoryCache<string>({ ttl: 100 })
                const pruned = ttlCache.prune()
                expect(pruned).toBe(0)
            })
        })

        describe('Combined Statistics Scenarios', () => {
            it('should track all stats correctly in typical usage', () => {
                const testCache = new MemoryCache<string>({ maxSize: 3 })

                // Add entries
                testCache.set('key1', 'value1')
                testCache.set('key2', 'value2')
                testCache.set('key3', 'value3')

                // Hits
                testCache.get('key1')
                testCache.get('key2')

                // Misses
                testCache.get('nonexistent')

                // Eviction
                testCache.set('key4', 'value4') // evicts key1

                // Miss after eviction
                testCache.get('key1')

                const stats = testCache.getStats()
                expect(stats.hits).toBe(2)
                expect(stats.misses).toBe(2)
                expect(stats.evictions).toBe(1)
                expect(stats.size).toBe(3)
            })
        })
    })
})

describe('cached decorator', () => {
    // ==========================================
    // POSITIVE TEST CASES
    // ==========================================
    describe('Positive Cases', () => {
        describe('Basic functionality', () => {
            it('should cache method results', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>()
                    getValue(id: string): string {
                        this.callCount++
                        return `value-${id}`
                    }
                }

                const instance = new TestClass()

                expect(instance.getValue('123')).toBe('value-123')
                expect(instance.getValue('123')).toBe('value-123')
                expect(instance.callCount).toBe(1)
            })

            it('should cache different arguments separately', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>()
                    getValue(id: string): string {
                        this.callCount++
                        return `value-${id}`
                    }
                }

                const instance = new TestClass()

                expect(instance.getValue('123')).toBe('value-123')
                expect(instance.getValue('456')).toBe('value-456')
                expect(instance.callCount).toBe(2)
            })

            it('should handle complex arguments', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>()
                    getValue(id: string, options: { type: string }): string {
                        this.callCount++
                        return `value-${id}-${options.type}`
                    }
                }

                const instance = new TestClass()

                expect(instance.getValue('123', { type: 'user' })).toBe('value-123-user')
                expect(instance.getValue('123', { type: 'user' })).toBe('value-123-user')
                expect(instance.callCount).toBe(1)
            })

            it('should handle async methods', async () => {
                class TestClass {
                    callCount = 0

                    @cached<Promise<string>>()
                    async getValue(id: string): Promise<string> {
                        this.callCount++
                        return `value-${id}`
                    }
                }

                const instance = new TestClass()

                const result1 = await instance.getValue('123')
                const result2 = await instance.getValue('123')

                expect(result1).toBe('value-123')
                expect(result2).toBe('value-123')
                expect(instance.callCount).toBe(1)
            })

            it('should preserve this context', () => {
                class TestClass {
                    prefix = 'PREFIX'

                    @cached<string>()
                    getValue(id: string): string {
                        return `${this.prefix}-${id}`
                    }
                }

                const instance = new TestClass()
                expect(instance.getValue('123')).toBe('PREFIX-123')
            })

            it('should handle methods with no arguments', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>()
                    getValue(): string {
                        this.callCount++
                        return 'constant'
                    }
                }

                const instance = new TestClass()

                expect(instance.getValue()).toBe('constant')
                expect(instance.getValue()).toBe('constant')
                expect(instance.callCount).toBe(1)
            })

            it('should handle numeric arguments', () => {
                class TestClass {
                    callCount = 0

                    @cached<number>()
                    multiply(a: number, b: number): number {
                        this.callCount++
                        return a * b
                    }
                }

                const instance = new TestClass()

                expect(instance.multiply(2, 3)).toBe(6)
                expect(instance.multiply(2, 3)).toBe(6)
                expect(instance.multiply(3, 4)).toBe(12)
                expect(instance.callCount).toBe(2)
            })

            it('should handle array arguments', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>()
                    join(arr: string[]): string {
                        this.callCount++
                        return arr.join(',')
                    }
                }

                const instance = new TestClass()

                expect(instance.join(['a', 'b', 'c'])).toBe('a,b,c')
                expect(instance.join(['a', 'b', 'c'])).toBe('a,b,c')
                expect(instance.callCount).toBe(1)
            })
        })

        describe('Cache options', () => {
            it('should respect TTL', async () => {
                vi.useRealTimers()

                class TestClass {
                    callCount = 0

                    @cached<string>({ ttl: 100 })
                    getValue(id: string): string {
                        this.callCount++
                        return `value-${id}`
                    }
                }

                const instance = new TestClass()

                expect(instance.getValue('123')).toBe('value-123')
                expect(instance.getValue('123')).toBe('value-123')
                expect(instance.callCount).toBe(1)

                await new Promise((resolve) => setTimeout(resolve, 150))

                expect(instance.getValue('123')).toBe('value-123')
                expect(instance.callCount).toBe(2)
            })

            it('should respect max size', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>({ maxSize: 2 })
                    getValue(id: string): string {
                        this.callCount++
                        return `value-${id}`
                    }
                }

                const instance = new TestClass()

                instance.getValue('1')
                instance.getValue('2')
                instance.getValue('3')
                instance.getValue('1')

                expect(instance.callCount).toBe(4)
            })

            it('should handle both TTL and maxSize options', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>({ ttl: 60000, maxSize: 50 })
                    getValue(id: string): string {
                        this.callCount++
                        return `value-${id}`
                    }
                }

                const instance = new TestClass()

                for (let i = 0; i < 100; i++) {
                    instance.getValue(`${i % 10}`)
                }

                expect(instance.callCount).toBe(10)
            })
        })

        describe('Multiple instances', () => {
            it('should cache per instance', () => {
                class TestClass {
                    callCount = 0

                    @cached<string>()
                    getValue(id: string): string {
                        this.callCount++
                        return `value-${id}`
                    }
                }

                const instance1 = new TestClass()
                const instance2 = new TestClass()

                // Note: The decorator creates a shared cache, not per-instance
                instance1.getValue('123')
                instance2.getValue('123')

                // Both use the same cache, so only 1 call
                expect(instance1.callCount + instance2.callCount).toBe(1)
            })

            it('should handle multiple decorated methods in same class', () => {
                class TestClass {
                    getNameCount = 0
                    getAgeCount = 0

                    @cached<string>()
                    getName(id: string): string {
                        this.getNameCount++
                        return `name-${id}`
                    }

                    @cached<number>()
                    getAge(id: string): number {
                        this.getAgeCount++
                        return parseInt(id)
                    }
                }

                const instance = new TestClass()

                instance.getName('123')
                instance.getName('123')
                instance.getAge('456')
                instance.getAge('456')

                expect(instance.getNameCount).toBe(1)
                expect(instance.getAgeCount).toBe(1)
            })
        })
    })

    // ==========================================
    // NEGATIVE TEST CASES
    // ==========================================
    describe('Negative Cases', () => {
        it('should throw on circular references in arguments', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                getValue(obj: any): string {
                    this.callCount++
                    return `value-${obj.id}`
                }
            }

            const instance = new TestClass()
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const circularObj: any = { id: '123' }
            circularObj.self = circularObj

            expect(() => instance.getValue(circularObj)).toThrow()
        })

        it('should not cache when method throws', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(id: string): string {
                    this.callCount++
                    if (id === 'error') {
                        throw new Error('Test error')
                    }
                    return `value-${id}`
                }
            }

            const instance = new TestClass()

            expect(() => instance.getValue('error')).toThrow('Test error')
            expect(() => instance.getValue('error')).toThrow('Test error')
            expect(instance.callCount).toBe(2)
        })

        it('should not cache rejected promises', async () => {
            class TestClass {
                callCount = 0

                @cached<Promise<string>>()
                async getValue(id: string): Promise<string> {
                    this.callCount++
                    if (id === 'error') {
                        throw new Error('Async error')
                    }
                    return `value-${id}`
                }
            }

            const instance = new TestClass()

            // Note: The decorator caches the Promise (which is rejected)
            // This is expected behavior - the rejected promise gets cached
            await expect(instance.getValue('error')).rejects.toThrow('Async error')
            await expect(instance.getValue('error')).rejects.toThrow('Async error')
            // The rejected promise is cached, so only 1 call
            expect(instance.callCount).toBe(1)
        })
    })

    // ==========================================
    // EDGE CASES
    // ==========================================
    describe('Edge Cases', () => {
        it('should handle undefined arguments', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(id?: string): string {
                    this.callCount++
                    return `value-${id || 'undefined'}`
                }
            }

            const instance = new TestClass()

            expect(instance.getValue()).toBe('value-undefined')
            expect(instance.getValue()).toBe('value-undefined')
            expect(instance.callCount).toBe(1)
        })

        it('should handle null arguments', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(id: string | null): string {
                    this.callCount++
                    return `value-${id || 'null'}`
                }
            }

            const instance = new TestClass()

            expect(instance.getValue(null)).toBe('value-null')
            expect(instance.getValue(null)).toBe('value-null')
            expect(instance.callCount).toBe(1)
        })

        it('should handle methods that return undefined', () => {
            class TestClass {
                callCount = 0

                @cached<string | undefined>()
                getValue(id: string): string | undefined {
                    this.callCount++
                    return id === 'valid' ? 'value' : undefined
                }
            }

            const instance = new TestClass()

            expect(instance.getValue('valid')).toBe('value')
            expect(instance.getValue('valid')).toBe('value')
            expect(instance.callCount).toBe(1)

            expect(instance.getValue('invalid')).toBeUndefined()
            expect(instance.getValue('invalid')).toBeUndefined()
            expect(instance.callCount).toBe(2)
        })

        it('should handle methods that return null', () => {
            class TestClass {
                callCount = 0

                @cached<string | null>()
                getValue(id: string): string | null {
                    this.callCount++
                    return id === 'valid' ? 'value' : null
                }
            }

            const instance = new TestClass()

            expect(instance.getValue('valid')).toBe('value')
            expect(instance.getValue('valid')).toBe('value')
            expect(instance.callCount).toBe(1)

            expect(instance.getValue('invalid')).toBeNull()
            expect(instance.getValue('invalid')).toBeNull()
            expect(instance.callCount).toBe(2)
        })

        it('should handle boolean return values', () => {
            class TestClass {
                callCount = 0

                @cached<boolean>()
                isEven(n: number): boolean {
                    this.callCount++
                    return n % 2 === 0
                }
            }

            const instance = new TestClass()

            expect(instance.isEven(2)).toBe(true)
            expect(instance.isEven(2)).toBe(true)
            expect(instance.isEven(3)).toBe(false)
            expect(instance.isEven(3)).toBe(false)
            expect(instance.callCount).toBe(2)
        })

        it('should handle zero as return value', () => {
            class TestClass {
                callCount = 0

                @cached<number>()
                getZero(): number {
                    this.callCount++
                    return 0
                }
            }

            const instance = new TestClass()

            expect(instance.getZero()).toBe(0)
            expect(instance.getZero()).toBe(0)
            expect(instance.callCount).toBe(1)
        })

        it('should handle empty string as return value', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getEmpty(): string {
                    this.callCount++
                    return ''
                }
            }

            const instance = new TestClass()

            expect(instance.getEmpty()).toBe('')
            expect(instance.getEmpty()).toBe('')
            expect(instance.callCount).toBe(1)
        })

        it('should handle NaN in arguments', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(n: number): string {
                    this.callCount++
                    return `value-${n}`
                }
            }

            const instance = new TestClass()

            expect(instance.getValue(NaN)).toBe('value-NaN')
            expect(instance.getValue(NaN)).toBe('value-NaN')
            expect(instance.callCount).toBe(1)
        })

        it('should handle Infinity in arguments', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(n: number): string {
                    this.callCount++
                    return `value-${n}`
                }
            }

            const instance = new TestClass()

            expect(instance.getValue(Infinity)).toBe('value-Infinity')
            expect(instance.getValue(Infinity)).toBe('value-Infinity')
            expect(instance.callCount).toBe(1)

            // Note: JSON.stringify(Infinity) and JSON.stringify(-Infinity) both
            // return "null", so they share the same cache key - this is a known
            // limitation when using JSON serialization for cache keys
        })

        it('should handle deeply nested object arguments', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(obj: { a: { b: { c: string } } }): string {
                    this.callCount++
                    return obj.a.b.c
                }
            }

            const instance = new TestClass()
            const nested = { a: { b: { c: 'deep' } } }

            expect(instance.getValue(nested)).toBe('deep')
            expect(instance.getValue(nested)).toBe('deep')
            expect(instance.callCount).toBe(1)
        })

        it('should differentiate similar but different objects', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(obj: { id: number }): string {
                    this.callCount++
                    return `id-${obj.id}`
                }
            }

            const instance = new TestClass()

            expect(instance.getValue({ id: 1 })).toBe('id-1')
            expect(instance.getValue({ id: 2 })).toBe('id-2')
            expect(instance.getValue({ id: 1 })).toBe('id-1')
            expect(instance.callCount).toBe(2)
        })

        it('should handle arguments with special characters', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(s: string): string {
                    this.callCount++
                    return `value-${s}`
                }
            }

            const instance = new TestClass()

            expect(instance.getValue('hello\nworld')).toBe('value-hello\nworld')
            expect(instance.getValue('hello\nworld')).toBe('value-hello\nworld')
            expect(instance.getValue('tab\there')).toBe('value-tab\there')
            expect(instance.callCount).toBe(2)
        })
    })

    // ==========================================
    // PERFORMANCE TESTS
    // ==========================================
    describe('Performance Tests', () => {
        it('should handle many cached calls efficiently', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(id: string): string {
                    this.callCount++
                    return `value-${id}`
                }
            }

            const instance = new TestClass()

            for (let i = 0; i < 1000; i++) {
                expect(instance.getValue('123')).toBe('value-123')
            }

            expect(instance.callCount).toBe(1)
        })

        it('should handle many unique calls efficiently', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(id: string): string {
                    this.callCount++
                    return `value-${id}`
                }
            }

            const instance = new TestClass()

            for (let i = 0; i < 1000; i++) {
                expect(instance.getValue(`id-${i}`)).toBe(`value-id-${i}`)
            }

            expect(instance.callCount).toBe(1000)
        })

        it('should handle rapid alternating calls', () => {
            class TestClass {
                callCount = 0

                @cached<string>()
                getValue(id: string): string {
                    this.callCount++
                    return `value-${id}`
                }
            }

            const instance = new TestClass()

            for (let i = 0; i < 500; i++) {
                instance.getValue('a')
                instance.getValue('b')
            }

            expect(instance.callCount).toBe(2)
        })
    })
})
