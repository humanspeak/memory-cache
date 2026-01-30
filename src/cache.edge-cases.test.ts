import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryCache } from './cache.js'

describe('MemoryCache Edge Cases', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
        cache = new MemoryCache<string>()
    })

    // ==========================================
    // EMPTY STRING KEYS AND VALUES
    // ==========================================
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

    // ==========================================
    // NULL AND UNDEFINED VALUES
    // ==========================================
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

    // ==========================================
    // SPECIAL CHARACTERS
    // ==========================================
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
    })

    // ==========================================
    // LARGE VALUES
    // ==========================================
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

    // ==========================================
    // CONCURRENT OPERATIONS
    // ==========================================
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

    // ==========================================
    // FROZEN AND SEALED OBJECTS
    // ==========================================
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

    // ==========================================
    // SYMBOL AND SPECIAL OBJECT VALUES
    // ==========================================
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
})
