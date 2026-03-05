<script lang="ts">
    import { getBreadcrumbContext, getSeoContext } from '@humanspeak/docs-kit'
    import Example from '$lib/components/general/Example.svelte'
    import LruEviction from '$lib/examples/LruEviction.svelte'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'LRU Eviction' }
        ]
    }
    if (seo) {
        seo.title = 'LRU Eviction | Examples | Memory Cache'
        seo.description = 'See how least recently used items are evicted when the cache reaches capacity. Interactive demo of LRU eviction in @humanspeak/memory-cache for TypeScript.'
    }
</script>

<Example title="LRU Eviction">
    <LruEviction />
</Example>
