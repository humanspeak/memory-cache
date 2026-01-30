import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cached, MemoryCache } from './cache.js'

describe('Cache Hooks', () => {
    // ==========================================
    // ON HIT
    // ==========================================
    describe('onHit', () => {
        it('should call onHit when getting an existing entry', () => {
            const onHit = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onHit } })

            cache.set('key', 'value')
            cache.get('key')

            expect(onHit).toHaveBeenCalledTimes(1)
            expect(onHit).toHaveBeenCalledWith({ key: 'key', value: 'value' })
        })

        it('should not call onHit on cache miss', () => {
            const onHit = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onHit } })

            cache.get('nonexistent')

            expect(onHit).not.toHaveBeenCalled()
        })

        it('should handle undefined values correctly', () => {
            const onHit = vi.fn()
            const cache = new MemoryCache<undefined>({ hooks: { onHit } })

            cache.set('key', undefined)
            cache.get('key')

            expect(onHit).toHaveBeenCalledWith({ key: 'key', value: undefined })
        })

        it('should handle null values correctly', () => {
            const onHit = vi.fn()
            const cache = new MemoryCache<null>({ hooks: { onHit } })

            cache.set('key', null)
            cache.get('key')

            expect(onHit).toHaveBeenCalledWith({ key: 'key', value: null })
        })
    })

    // ==========================================
    // ON MISS
    // ==========================================
    describe('onMiss', () => {
        it('should call onMiss with not_found reason when key does not exist', () => {
            const onMiss = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onMiss } })

            cache.get('nonexistent')

            expect(onMiss).toHaveBeenCalledTimes(1)
            expect(onMiss).toHaveBeenCalledWith({ key: 'nonexistent', reason: 'not_found' })
        })

        it('should call onMiss with expired reason when entry is expired', () => {
            vi.useFakeTimers()
            const onMiss = vi.fn()
            const cache = new MemoryCache<string>({ ttl: 100, hooks: { onMiss } })

            cache.set('key', 'value')
            vi.advanceTimersByTime(101)
            cache.get('key')

            expect(onMiss).toHaveBeenCalledTimes(1)
            expect(onMiss).toHaveBeenCalledWith({ key: 'key', reason: 'expired' })
            vi.useRealTimers()
        })
    })

    // ==========================================
    // ON SET
    // ==========================================
    describe('onSet', () => {
        it('should call onSet with isUpdate=false for new keys', () => {
            const onSet = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onSet } })

            cache.set('key', 'value')

            expect(onSet).toHaveBeenCalledTimes(1)
            expect(onSet).toHaveBeenCalledWith({ key: 'key', value: 'value', isUpdate: false })
        })

        it('should call onSet with isUpdate=true for existing keys', () => {
            const onSet = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onSet } })

            cache.set('key', 'value1')
            cache.set('key', 'value2')

            expect(onSet).toHaveBeenCalledTimes(2)
            expect(onSet).toHaveBeenNthCalledWith(1, {
                key: 'key',
                value: 'value1',
                isUpdate: false
            })
            expect(onSet).toHaveBeenNthCalledWith(2, {
                key: 'key',
                value: 'value2',
                isUpdate: true
            })
        })
    })

    // ==========================================
    // ON EVICT
    // ==========================================
    describe('onEvict', () => {
        it('should call onEvict when LRU entry is evicted', () => {
            const onEvict = vi.fn()
            const cache = new MemoryCache<string>({ maxSize: 2, hooks: { onEvict } })

            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            cache.set('key3', 'value3') // Should evict key1

            expect(onEvict).toHaveBeenCalledTimes(1)
            expect(onEvict).toHaveBeenCalledWith({ key: 'key1', value: 'value1' })
        })

        it('should not call onEvict when updating existing key', () => {
            const onEvict = vi.fn()
            const cache = new MemoryCache<string>({ maxSize: 2, hooks: { onEvict } })

            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            cache.set('key1', 'updated') // Update, not eviction

            expect(onEvict).not.toHaveBeenCalled()
        })
    })

    // ==========================================
    // ON EXPIRE
    // ==========================================
    describe('onExpire', () => {
        beforeEach(() => {
            vi.useFakeTimers()
        })

        afterEach(() => {
            vi.useRealTimers()
        })

        it('should call onExpire via get()', () => {
            const onExpire = vi.fn()
            const cache = new MemoryCache<string>({ ttl: 100, hooks: { onExpire } })

            cache.set('key', 'value')
            vi.advanceTimersByTime(101)
            cache.get('key')

            expect(onExpire).toHaveBeenCalledTimes(1)
            expect(onExpire).toHaveBeenCalledWith({ key: 'key', value: 'value', source: 'get' })
        })

        it('should call onExpire via has()', () => {
            const onExpire = vi.fn()
            const cache = new MemoryCache<string>({ ttl: 100, hooks: { onExpire } })

            cache.set('key', 'value')
            vi.advanceTimersByTime(101)
            cache.has('key')

            expect(onExpire).toHaveBeenCalledTimes(1)
            expect(onExpire).toHaveBeenCalledWith({ key: 'key', value: 'value', source: 'has' })
        })

        it('should call onExpire via prune()', () => {
            const onExpire = vi.fn()
            const cache = new MemoryCache<string>({ ttl: 100, hooks: { onExpire } })

            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            vi.advanceTimersByTime(101)
            cache.prune()

            expect(onExpire).toHaveBeenCalledTimes(2)
            expect(onExpire).toHaveBeenCalledWith({ key: 'key1', value: 'value1', source: 'prune' })
            expect(onExpire).toHaveBeenCalledWith({ key: 'key2', value: 'value2', source: 'prune' })
        })
    })

    // ==========================================
    // ON DELETE
    // ==========================================
    describe('onDelete', () => {
        it('should call onDelete via delete()', () => {
            const onDelete = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onDelete } })

            cache.set('key', 'value')
            cache.delete('key')

            expect(onDelete).toHaveBeenCalledTimes(1)
            expect(onDelete).toHaveBeenCalledWith({ key: 'key', value: 'value', source: 'delete' })
        })

        it('should not call onDelete when deleting nonexistent key', () => {
            const onDelete = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onDelete } })

            cache.delete('nonexistent')

            expect(onDelete).not.toHaveBeenCalled()
        })

        it('should call onDelete via deleteAsync()', async () => {
            const onDelete = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onDelete } })

            cache.set('key', 'value')
            await cache.deleteAsync('key')

            expect(onDelete).toHaveBeenCalledTimes(1)
            expect(onDelete).toHaveBeenCalledWith({
                key: 'key',
                value: 'value',
                source: 'deleteAsync'
            })
        })

        it('should call onDelete via deleteByPrefix() for each entry', () => {
            const onDelete = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onDelete } })

            cache.set('user:1', 'Alice')
            cache.set('user:2', 'Bob')
            cache.set('post:1', 'Hello')
            cache.deleteByPrefix('user:')

            expect(onDelete).toHaveBeenCalledTimes(2)
            expect(onDelete).toHaveBeenCalledWith({
                key: 'user:1',
                value: 'Alice',
                source: 'deleteByPrefix'
            })
            expect(onDelete).toHaveBeenCalledWith({
                key: 'user:2',
                value: 'Bob',
                source: 'deleteByPrefix'
            })
        })

        it('should call onDelete via deleteByMagicString() for each entry', () => {
            const onDelete = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onDelete } })

            cache.set('user:1:name', 'Alice')
            cache.set('user:2:name', 'Bob')
            cache.set('user:1:email', 'alice@example.com')
            cache.deleteByMagicString('user:*:name')

            expect(onDelete).toHaveBeenCalledTimes(2)
            expect(onDelete).toHaveBeenCalledWith({
                key: 'user:1:name',
                value: 'Alice',
                source: 'deleteByMagicString'
            })
            expect(onDelete).toHaveBeenCalledWith({
                key: 'user:2:name',
                value: 'Bob',
                source: 'deleteByMagicString'
            })
        })

        it('should call onDelete via clear() for each entry', () => {
            const onDelete = vi.fn()
            const cache = new MemoryCache<string>({ hooks: { onDelete } })

            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            cache.clear()

            expect(onDelete).toHaveBeenCalledTimes(2)
            expect(onDelete).toHaveBeenCalledWith({ key: 'key1', value: 'value1', source: 'clear' })
            expect(onDelete).toHaveBeenCalledWith({ key: 'key2', value: 'value2', source: 'clear' })
        })
    })

    // ==========================================
    // HOOK ERROR HANDLING
    // ==========================================
    describe('Hook Error Handling', () => {
        it('should not crash when onHit throws', () => {
            const cache = new MemoryCache<string>({
                hooks: {
                    onHit: () => {
                        throw new Error('Hook error')
                    }
                }
            })

            cache.set('key', 'value')
            expect(() => cache.get('key')).not.toThrow()
            expect(cache.get('key')).toBe('value')
        })

        it('should not crash when onSet throws', () => {
            const cache = new MemoryCache<string>({
                hooks: {
                    onSet: () => {
                        throw new Error('Hook error')
                    }
                }
            })

            expect(() => cache.set('key', 'value')).not.toThrow()
            expect(cache.get('key')).toBe('value')
        })

        it('should not crash when onDelete throws', () => {
            const cache = new MemoryCache<string>({
                hooks: {
                    onDelete: () => {
                        throw new Error('Hook error')
                    }
                }
            })

            cache.set('key', 'value')
            expect(() => cache.delete('key')).not.toThrow()
            expect(cache.has('key')).toBe(false)
        })
    })

    // ==========================================
    // NO HOOKS PROVIDED
    // ==========================================
    describe('No Hooks Provided', () => {
        it('should work normally without hooks', () => {
            const cache = new MemoryCache<string>()

            cache.set('key', 'value')
            expect(cache.get('key')).toBe('value')
            expect(cache.has('key')).toBe(true)
            cache.delete('key')
            expect(cache.has('key')).toBe(false)
        })

        it('should work with empty hooks object', () => {
            const cache = new MemoryCache<string>({ hooks: {} })

            cache.set('key', 'value')
            expect(cache.get('key')).toBe('value')
            cache.delete('key')
            expect(cache.has('key')).toBe(false)
        })
    })

    // ==========================================
    // INTEGRATION
    // ==========================================
    describe('Integration', () => {
        it('should track full lifecycle correctly', () => {
            vi.useFakeTimers()

            const events: string[] = []
            const cache = new MemoryCache<string>({
                maxSize: 2,
                ttl: 100,
                hooks: {
                    onHit: ({ key }) => events.push(`hit:${key}`),
                    onMiss: ({ key, reason }) => events.push(`miss:${key}:${reason}`),
                    onSet: ({ key, isUpdate }) =>
                        events.push(`set:${key}:${isUpdate ? 'update' : 'new'}`),
                    onEvict: ({ key }) => events.push(`evict:${key}`),
                    onExpire: ({ key, source }) => events.push(`expire:${key}:${source}`),
                    onDelete: ({ key, source }) => events.push(`delete:${key}:${source}`)
                }
            })

            // Set initial entries
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')

            // Hit
            cache.get('key1')

            // Miss
            cache.get('nonexistent')

            // Eviction (key2 is LRU since key1 was accessed)
            cache.set('key3', 'value3')

            // Update
            cache.set('key1', 'updated')

            // Delete
            cache.delete('key3')

            // Expire via get
            vi.advanceTimersByTime(101)
            cache.get('key1')

            expect(events).toEqual([
                'set:key1:new',
                'set:key2:new',
                'hit:key1',
                'miss:nonexistent:not_found',
                'evict:key2',
                'set:key3:new',
                'set:key1:update',
                'delete:key3:delete',
                'expire:key1:get',
                'miss:key1:expired'
            ])

            vi.useRealTimers()
        })
    })

    // ==========================================
    // CACHED DECORATOR WITH HOOKS
    // ==========================================
    describe('cached decorator with hooks', () => {
        it('should use hooks provided in decorator options', () => {
            const onHit = vi.fn()
            const onSet = vi.fn()

            class TestClass {
                callCount = 0

                @cached<string>({ hooks: { onHit, onSet } })
                getValue(id: string): string {
                    this.callCount++
                    return `value-${id}`
                }
            }

            const instance = new TestClass()

            // First call - cache miss, then set
            instance.getValue('123')
            expect(onSet).toHaveBeenCalledTimes(1)
            expect(onHit).not.toHaveBeenCalled()

            // Second call - cache hit
            instance.getValue('123')
            expect(onHit).toHaveBeenCalledTimes(1)
            expect(instance.callCount).toBe(1)
        })
    })
})
