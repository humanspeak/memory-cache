<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'

    const breadcrumbs = $derived(getBreadcrumbContext())
    $effect(() => {
        if (breadcrumbs) {
            breadcrumbs.breadcrumbs = [{ title: 'Examples' }]
        }
    })

    const examples = [
        {
            slug: 'basic-cache',
            title: 'Basic Cache',
            description: 'Interactive demo of get, set, and delete operations with visual cache state.',
            icon: 'fa-solid fa-box'
        },
        {
            slug: 'ttl-expiration',
            title: 'TTL Expiration',
            description: 'Watch cache entries expire in real-time with countdown timers.',
            icon: 'fa-solid fa-clock'
        },
        {
            slug: 'lru-eviction',
            title: 'LRU Eviction',
            description: 'See how least recently used items are evicted when the cache is full.',
            icon: 'fa-solid fa-layer-group'
        },
        {
            slug: 'cache-statistics',
            title: 'Cache Statistics',
            description: 'Monitor hit rate, miss rate, and cache performance in real-time.',
            icon: 'fa-solid fa-chart-line'
        }
    ]
</script>

<svelte:head>
    <title>Interactive Examples | Memory Cache</title>
    <meta name="description" content="Interactive examples demonstrating @humanspeak/memory-cache features" />
</svelte:head>

<div class="container mx-auto px-4 py-12">
    <!-- Hero Section -->
    <div class="mb-12 text-center">
        <h1 class="mb-4 bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl">
            Interactive Examples
        </h1>
        <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
            Explore how memory-cache works with live, interactive demos. See cache operations, TTL expiration, and LRU eviction in action.
        </p>
    </div>

    <!-- Examples Grid -->
    <div class="mx-auto grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
        {#each examples as example, index}
            <a
                href="/examples/{example.slug}"
                class="example-card group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10"
                style="animation-delay: {index * 100}ms"
            >
                <!-- Gradient overlay -->
                <div class="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>

                <div class="relative z-10">
                    <!-- Icon -->
                    <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white transition-transform duration-300 group-hover:scale-110">
                        <i class="{example.icon} text-lg"></i>
                    </div>

                    <h2 class="mb-2 text-xl font-semibold text-foreground transition-colors group-hover:text-brand-600">
                        {example.title}
                    </h2>

                    <p class="mb-4 text-sm text-muted-foreground">
                        {example.description}
                    </p>

                    <div class="flex items-center text-sm font-medium text-brand-600 group-hover:text-brand-700">
                        Try it
                        <i class="fa-solid fa-arrow-right ml-2 transition-transform duration-200 group-hover:translate-x-1"></i>
                    </div>
                </div>

                <!-- Decorative corner -->
                <div class="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-gradient-to-bl from-brand-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
            </a>
        {/each}
    </div>

    <!-- CTA Section -->
    <div class="mt-16 text-center">
        <div class="mx-auto max-w-xl rounded-2xl border border-brand-500/20 bg-gradient-to-r from-brand-500/10 to-brand-600/10 p-8">
            <h2 class="mb-3 text-xl font-semibold text-foreground">Ready to use Memory Cache?</h2>
            <p class="mb-6 text-muted-foreground">
                Check out the documentation for installation and API reference.
            </p>
            <a
                href="/docs/getting-started"
                class="inline-flex items-center rounded-lg bg-gradient-to-r from-brand-500 to-brand-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:from-brand-600 hover:to-brand-700"
            >
                Get Started
                <i class="fa-solid fa-rocket ml-2"></i>
            </a>
        </div>
    </div>
</div>

<style>
    .example-card {
        animation: fadeInUp 0.5s ease-out both;
    }

    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(16px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
</style>
