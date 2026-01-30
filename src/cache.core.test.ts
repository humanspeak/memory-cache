import { beforeEach, describe, expect, it } from 'vitest'
import { CacheConfigError, MemoryCache } from './cache.js'

describe('MemoryCache Core', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
        cache = new MemoryCache<string>()
    })

    // ==========================================
    // CONSTRUCTOR
    // ==========================================
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

    // ==========================================
    // CONSTRUCTOR VALIDATION
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
    // SET AND GET
    // ==========================================
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

    // ==========================================
    // HAS
    // ==========================================
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

        it('should return false for non-existent keys', () => {
            expect(cache.has('nonexistent')).toBe(false)
        })

        it('should return false for deleted key', () => {
            cache.set('key', 'value')
            cache.delete('key')
            expect(cache.has('key')).toBe(false)
        })
    })

    // ==========================================
    // DELETE
    // ==========================================
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

        it('should return false for non-existent key', () => {
            expect(cache.delete('nonexistent')).toBe(false)
        })

        it('should return false for already deleted key', () => {
            cache.set('key1', 'value1')
            cache.delete('key1')
            expect(cache.delete('key1')).toBe(false)
        })
    })

    // ==========================================
    // DELETE ASYNC
    // ==========================================
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

    // ==========================================
    // CLEAR
    // ==========================================
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

        it('should handle clearing empty cache', () => {
            expect(() => cache.clear()).not.toThrow()
        })
    })
})
