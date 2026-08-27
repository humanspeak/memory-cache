import type { PageLoad } from './$types'

export const load: PageLoad = ({ data }) => ({
    ...data,
    title: 'In-Memory Cache for TypeScript & Node | Memory Cache',
    description:
        'In-memory cache for TypeScript & Node with zero dependencies, TTL expiration, true LRU eviction, wildcard deletion, hooks, and @cached method decorators.'
})
