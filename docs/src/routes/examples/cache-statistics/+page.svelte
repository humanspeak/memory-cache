<script lang="ts">
    import {
        CodeReferenceV2,
        type DemoManifestEntry,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import CacheStatistics from '$lib/examples/cache-statistics/demos/Default.svelte'
    import demoManifest from '$lib/demo-manifest.json'

    const SOURCE_URL =
        'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'
    const manifest = demoManifest as Record<string, DemoManifestEntry>

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
        seo.description =
            'Monitor cache hit rate, miss rate, and overall performance in real-time. Interactive demo of built-in statistics tracking in @humanspeak/memory-cache.'
        seo.ogTitle = 'Cache Statistics'
        seo.ogTagline = 'Monitor cache hit rate, miss rate, and performance'
        seo.ogFeatures = ['Hit Rate', 'Miss Rate', 'Evictions', 'Live Metrics']
        seo.ogSlug = 'examples-cache-statistics'
    }
</script>

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            {
                id: 'cache-statistics-default',
                label: 'Default.svelte',
                ...manifest['cache-statistics/demos/Default.svelte']
            }
        ]}
        columns={1}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="METRICS"
    title={{ prefix: 'cache ', accent: 'statistics', end: '.' }}
    description="Monitor hit rate, miss rate, evictions, and cache size as operations run against a live cache."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'live metrics' }]}
    sourceUrl={`${SOURCE_URL}cache-statistics/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
>
    <CacheStatistics />
</ExampleV2>
