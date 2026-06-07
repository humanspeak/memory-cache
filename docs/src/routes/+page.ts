import type { PageLoad } from './$types'

export const load: PageLoad = ({ data }) => ({
    ...data,
    title: 'Memory Cache - Lightweight TypeScript In-Memory Caching Library',
    description:
        'A zero-dependency TypeScript in-memory cache with TTL expiration, true LRU eviction, wildcard deletion, hooks, and @cached method decorators.'
})
