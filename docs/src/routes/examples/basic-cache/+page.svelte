<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import Example from '$lib/components/general/Example.svelte'
    import BasicCache from '$lib/examples/BasicCache.svelte'

    const breadcrumbs = getBreadcrumbContext()
    $effect(() => {
        if (breadcrumbs) {
            breadcrumbs.breadcrumbs = [
                { title: 'Examples', href: '/examples' },
                { title: 'Basic Cache' }
            ]
        }
    })
</script>

<svelte:head>
    <title>Basic Cache | Examples | Memory Cache</title>
    <meta name="description" content="Interactive demo of basic cache operations: get, set, and delete." />
</svelte:head>

<Example title="Basic Cache">
    <BasicCache />
</Example>
