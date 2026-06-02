<script lang="ts">
    import {
        CodeReferenceV2,
        type DemoManifestEntry,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import BasicCache from '$lib/examples/basic-cache/demos/Default.svelte'
    import demoManifest from '$lib/demo-manifest.json'

    const SOURCE_URL =
        'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'
    const manifest = demoManifest as Record<string, DemoManifestEntry>

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
        seo.description =
            'Interactive demo of basic memory cache operations in TypeScript. Try get, set, and delete with a live visual cache state powered by @humanspeak/memory-cache.'
        seo.ogTitle = 'Basic Cache'
        seo.ogTagline = 'Try get, set, and delete with a live cache state'
        seo.ogFeatures = ['Set Values', 'Get Values', 'Delete Keys', 'Live State']
        seo.ogSlug = 'examples-basic-cache'
    }
</script>

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            {
                id: 'basic-cache-default',
                label: 'Default.svelte',
                ...manifest['basic-cache/demos/Default.svelte']
            }
        ]}
        columns={1}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="CACHE"
    title={{ prefix: 'basic ', accent: 'cache', end: '.' }}
    description="Try `get`, `set`, and `delete` against a live `MemoryCache` instance and watch the cache state update."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'basic operations' }]}
    sourceUrl={`${SOURCE_URL}basic-cache/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
>
    <BasicCache />
</ExampleV2>
