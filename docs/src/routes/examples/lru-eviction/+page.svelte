<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import Example from '$lib/components/general/Example.svelte'
    import LruEviction from '$lib/examples/LruEviction.svelte'

    const breadcrumbs = getBreadcrumbContext()
    $effect(() => {
        if (breadcrumbs) {
            breadcrumbs.breadcrumbs = [
                { title: 'Examples', href: '/examples' },
                { title: 'LRU Eviction' }
            ]
        }
    })
</script>

<svelte:head>
    <title>LRU Eviction | Examples | Memory Cache</title>
    <meta name="description" content="See how least recently used items are evicted when the cache is full." />
</svelte:head>

<Example title="LRU Eviction">
    <LruEviction />
</Example>
