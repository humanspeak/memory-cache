import { beforeEach, describe, expect, it } from 'vitest'
import { MemoryCache } from './cache.js'

describe('MemoryCache Pattern Deletion', () => {
    let cache: MemoryCache<string>

    beforeEach(() => {
        cache = new MemoryCache<string>()
    })

    // ==========================================
    // DELETE BY PREFIX
    // ==========================================
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

        it('should handle empty prefix (matches all)', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')

            const removed = cache.deleteByPrefix('')

            expect(removed).toBe(2)
            expect(cache.get('key1')).toBeUndefined()
            expect(cache.get('key2')).toBeUndefined()
        })
    })

    // ==========================================
    // DELETE BY MAGIC STRING
    // ==========================================
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

        it('should handle single wildcard matching all', () => {
            cache.set('key1', 'value1')
            cache.set('key2', 'value2')
            cache.set('anything', 'value3')

            const removed = cache.deleteByMagicString('*')

            expect(removed).toBe(3)
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

    // ==========================================
    // COMPLEX DELETION SCENARIOS
    // ==========================================
    describe('Complex Deletion Scenarios', () => {
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
