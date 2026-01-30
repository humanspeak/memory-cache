<script lang="ts">
    import '../app.css'
    import { ModeWatcher } from 'mode-watcher'
    import { page } from '$app/state'
    import { MotionConfig } from '@humanspeak/svelte-motion'
    import BreadcrumbContext from '$lib/components/contexts/Breadcrumb/BreadcrumbContext.svelte'

    const { children } = $props()
    const imageLocation = `${page.url.origin}/`

    // Dynamic canonical URL based on current page path
    const canonicalUrl = $derived(`${page.url.origin}${page.url.pathname}`)
</script>

<svelte:head>
    <title>Memory Cache - High-Performance In-Memory Caching for TypeScript</title>
    <meta
        name="description"
        content="A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, and @cached decorator for method-level memoization."
    />

    <!-- Open Graph / Social Media -->
    <meta property="og:title" content="Memory Cache - High-Performance In-Memory Caching for TypeScript" />
    <meta
        property="og:description"
        content="A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, and @cached decorator for method-level memoization."
    />
    <meta property="og:type" content="website" />
    <meta property="og:url" content={canonicalUrl} />
    <meta property="og:image" content="{imageLocation}memory-cache-opengraph.png" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="Memory Cache - High-Performance In-Memory Caching for TypeScript" />
    <meta
        name="twitter:description"
        content="A lightweight, zero-dependency in-memory cache for TypeScript with TTL expiration, LRU eviction, and @cached decorator for method-level memoization."
    />
    <meta name="twitter:image" content="{imageLocation}memory-cache-twitter.png" />

    <!-- Keywords -->
    <meta
        name="keywords"
        content="cache, memory-cache, lru-cache, ttl-cache, typescript, memoization, decorator, in-memory, caching, performance, node.js, javascript"
    />

    <!-- Additional Meta -->
    <meta name="author" content="Humanspeak, Inc." />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href={canonicalUrl} />

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
            "description": "A high-performance, in-memory caching library for TypeScript with TTL expiration, LRU eviction, and a powerful @cached decorator for automatic method memoization.",
            "downloadUrl": "https://www.npmjs.com/package/@humanspeak/memory-cache",
            "keywords": "cache, memory-cache, typescript, memoization, lru, ttl",
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
            "requirements": "Node.js 18+ or modern browser",
            "url": "https://memory.svelte.page"
        }
    </script>
</svelte:head>

<ModeWatcher />
<BreadcrumbContext>
    <MotionConfig transition={{ duration: 0.5 }}>
        {@render children?.()}
    </MotionConfig>
</BreadcrumbContext>
