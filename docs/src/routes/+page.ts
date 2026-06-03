import type { PageLoad } from './$types'

export const load: PageLoad = ({ data }) => ({
    ...data,
    title: 'Memory Cache - Lightweight TypeScript In-Memory Caching Library',
    description:
        'A lightweight, zero-dependency TypeScript in-memory caching library with TTL expiration, LRU eviction, and decorator support.'
})
