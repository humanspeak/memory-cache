<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import Example from '$lib/components/general/Example.svelte'
    import CacheStatistics from '$lib/examples/CacheStatistics.svelte'

    const breadcrumbs = getBreadcrumbContext()
    $effect(() => {
        if (breadcrumbs) {
            breadcrumbs.breadcrumbs = [
                { title: 'Examples', href: '/examples' },
                { title: 'Cache Statistics' }
            ]
        }
    })
</script>

<svelte:head>
    <title>Cache Statistics | Examples | Memory Cache</title>
    <meta name="description" content="Monitor hit rate, miss rate, and cache performance in real-time." />
</svelte:head>

<Example title="Cache Statistics">
    <CacheStatistics />
</Example>
