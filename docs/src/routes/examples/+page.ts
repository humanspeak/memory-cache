import type { PageLoad } from './$types'

type ExampleEntry = {
    title: string
    description: string
}

const EXAMPLES: Record<string, ExampleEntry> = {
    'basic-cache': {
        title: 'Basic Cache',
        description: 'Interactive demo of get, set, and delete operations with visual cache state.'
    },
    'ttl-expiration': {
        title: 'TTL Expiration',
        description: 'Watch cache entries expire in real time with countdown timers.'
    },
    'lru-eviction': {
        title: 'LRU Eviction',
        description:
            'See how expired entries are pruned before least recently used items are evicted.'
    },
    'cache-statistics': {
        title: 'Cache Statistics',
        description: 'Monitor hit rate, miss rate, and cache performance in real time.'
    }
}

export const load: PageLoad = () => ({
    title: 'Interactive Examples | Memory Cache',
    description:
        'Try interactive examples demonstrating Memory Cache features including TTL, LRU eviction, and cache statistics.',
    examples: EXAMPLES
})
