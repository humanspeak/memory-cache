<script lang="ts">
    import '../app.css'
    import { ModeWatcher } from 'mode-watcher'
    import { page } from '$app/state'

    const { children } = $props()
    const imageLocation = `${page.url.origin}/`
</script>

<svelte:head>
    <title>Memory Cache - TypeScript In-Memory Caching Library</title>
    <meta
        name="description"
        content="A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, wildcard deletion, and method decorator support."
    />

    <!-- Open Graph / Social Media -->
    <meta property="og:title" content="Memory Cache - TypeScript In-Memory Caching Library" />
    <meta
        property="og:description"
        content="A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, wildcard deletion, and method decorator support."
    />
    <meta property="og:type" content="website" />
    <meta property="og:url" content="https://memory.svelte.page" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Memory Cache - TypeScript In-Memory Caching Library" />
    <meta
        name="twitter:description"
        content="A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, wildcard deletion, and method decorator support."
    />

    <!-- Keywords -->
    <meta
        name="keywords"
        content="typescript, cache, memory-cache, lru-cache, ttl-cache, memoization, decorator, javascript, node, caching, performance"
    />

    <!-- Additional Meta -->
    <meta name="author" content="Humanspeak, Inc." />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="https://memory.svelte.page" />

    <!-- JSON-LD structured data -->
    <script type="application/ld+json">
        {
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "applicationCategory": "DeveloperApplication",
            "author": {
                "@type": "Organization",
                "name": "Humanspeak, Inc.",
                "url": "https://humanspeak.com"
            },
            "description": "A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, wildcard deletion, and method decorator support.",
            "downloadUrl": "https://www.npmjs.com/package/@humanspeak/memory-cache",
            "keywords": "typescript, cache, memory-cache, lru-cache, memoization",
            "license": "MIT",
            "name": "Memory Cache",
            "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
            },
            "operatingSystem": "Any",
            "programmingLanguage": ["TypeScript", "JavaScript"],
            "releaseNotes": "https://github.com/humanspeak/memory-cache/releases",
            "url": "https://memory.svelte.page"
        }
    </script>
</svelte:head>

<ModeWatcher />
{@render children?.()}

