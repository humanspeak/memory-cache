import type { DocsKitConfig } from '@humanspeak/docs-kit'

export const docsConfig: DocsKitConfig = {
    name: 'Memory Cache',
    slug: 'memory',
    npmPackage: '@humanspeak/memory-cache',
    repo: 'humanspeak/memory-cache',
    url: 'https://memory.svelte.page',
    description:
        'A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, and @cached decorator for method-level memoization.',
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
