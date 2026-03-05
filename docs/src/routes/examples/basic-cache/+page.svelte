<script lang="ts">
    import { getBreadcrumbContext, getSeoContext } from '@humanspeak/docs-kit'
    import Example from '$lib/components/general/Example.svelte'
    import BasicCache from '$lib/examples/BasicCache.svelte'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Basic Cache' }
        ]
    }
    if (seo) {
        seo.title = 'Basic Cache | Examples | Memory Cache'
        seo.description = 'Interactive demo of basic memory cache operations in TypeScript. Try get, set, and delete with a live visual cache state powered by @humanspeak/memory-cache.'
    }
</script>

<Example title="Basic Cache">
    <BasicCache />
</Example>
