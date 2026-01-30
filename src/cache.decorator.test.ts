import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cached } from './cache.js'

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
        })

        describe('Options', () => {
            beforeEach(() => {
                vi.useFakeTimers()
            })

            afterEach(() => {
                vi.useRealTimers()
            })

            it('should respect TTL option', () => {
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
                expect(instance.callCount).toBe(1)

                vi.advanceTimersByTime(101)

                expect(instance.getValue('123')).toBe('value-123')
                expect(instance.callCount).toBe(2)
            })

            it('should respect maxSize option', () => {
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
                instance.getValue('3') // This should evict '1'

                expect(instance.callCount).toBe(3)

                // Call '1' again - should need to recalculate since it was evicted
                instance.getValue('1')
                expect(instance.callCount).toBe(4)

                // '2' and '3' - with maxSize=2 and LRU eviction, calling '1' evicted '2'
                // so calling '2' needs recalculation and evicts '3'
                // then calling '3' needs recalculation
                instance.getValue('2')
                instance.getValue('3')
                expect(instance.callCount).toBe(6)
            })
        })

        describe('Multiple instances', () => {
            it('should share cache across instances', () => {
                class TestClass {
                    static callCount = 0

                    @cached<string>()
                    getValue(id: string): string {
                        TestClass.callCount++
                        return `value-${id}`
                    }
                }

                const instance1 = new TestClass()
                const instance2 = new TestClass()

                TestClass.callCount = 0

                instance1.getValue('123')
                instance2.getValue('123')

                // Same cache key, same value - only 1 call
                expect(TestClass.callCount).toBe(1)
            })

            it('should maintain separate caches per decorated method', () => {
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

        it('should cache rejected promises (known limitation)', async () => {
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
