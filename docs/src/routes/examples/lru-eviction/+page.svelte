<script lang="ts">
    import {
        CodeReferenceV2,
        type DemoManifestEntry,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import LruEviction from '$lib/examples/lru-eviction/demos/Default.svelte'
    import demoManifest from '$lib/demo-manifest.json'

    const SOURCE_URL =
        'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'
    const manifest = demoManifest as Record<string, DemoManifestEntry>

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
        seo.description =
            'See how least recently used items are evicted when the cache reaches capacity. Interactive demo of LRU eviction in @humanspeak/memory-cache for TypeScript.'
        seo.ogTitle = 'LRU Eviction'
        seo.ogTagline = 'Watch least recently used entries leave the cache'
        seo.ogFeatures = ['Max Size', 'Access Order', 'Eviction', 'Live State']
        seo.ogSlug = 'examples-lru-eviction'
    }
</script>

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            {
                id: 'lru-eviction-default',
                label: 'Default.svelte',
                ...manifest['lru-eviction/demos/Default.svelte']
            }
        ]}
        columns={1}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="EVICTION"
    title={{ prefix: 'lru ', accent: 'eviction', end: '.' }}
    description="Fill a bounded cache and watch the least recently used entry get evicted when capacity is reached."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'least recently used' }]}
    sourceUrl={`${SOURCE_URL}lru-eviction/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
>
    <LruEviction />
</ExampleV2>
