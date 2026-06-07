import type { DocsKitConfig } from '@humanspeak/docs-kit'

export const docsConfig: DocsKitConfig = {
    name: 'Memory Cache',
    slug: 'memory',
    npmPackage: '@humanspeak/memory-cache',
    repo: 'humanspeak/memory-cache',
    url: 'https://memory.svelte.page',
    description:
        'A zero-dependency TypeScript in-memory cache with TTL expiration, true LRU eviction, wildcard deletion, hooks, and @cached method decorators.',
    keywords: [
        'cache',
        'memory-cache',
        'lru-cache',
        'ttl-cache',
        'typescript',
        'memoization',
        'decorator',
        'in-memory',
        'caching',
        'performance',
        'node.js',
        'javascript'
    ],
    defaultFeatures: ['Zero Dependencies', 'TypeScript First', 'TTL + LRU', 'Decorator Support'],
    fallbackStars: 10
}
