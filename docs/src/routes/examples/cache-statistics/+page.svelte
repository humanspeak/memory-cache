<script lang="ts">
    import { getBreadcrumbContext, getSeoContext } from '@humanspeak/docs-kit'
    import Example from '$lib/components/general/Example.svelte'
    import CacheStatistics from '$lib/examples/CacheStatistics.svelte'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Cache Statistics' }
        ]
    }
    if (seo) {
        seo.title = 'Cache Statistics | Examples | Memory Cache'
        seo.description = 'Monitor cache hit rate, miss rate, and overall performance in real-time. Interactive demo of built-in statistics tracking in @humanspeak/memory-cache.'
    }
</script>

<Example title="Cache Statistics">
    <CacheStatistics />
</Example>
