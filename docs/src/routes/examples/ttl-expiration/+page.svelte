<script lang="ts">
    import {
        CodeReferenceV2,
        type DemoManifestEntry,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import TtlExpiration from '$lib/examples/ttl-expiration/demos/Default.svelte'
    import demoManifest from '$lib/demo-manifest.json'

    const SOURCE_URL =
        'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'
    const manifest = demoManifest as Record<string, DemoManifestEntry>

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'TTL Expiration' }
        ]
    }
    if (seo) {
        seo.title = 'TTL Expiration | Examples | Memory Cache'
        seo.description =
            'Watch cache entries expire in real-time with countdown timers. Explore how TTL-based expiration works in @humanspeak/memory-cache with this interactive demo.'
        seo.ogTitle = 'TTL Expiration'
        seo.ogTagline = 'Watch cache entries expire in real time'
        seo.ogFeatures = ['TTL', 'Countdowns', 'Expiration', 'Cleanup']
        seo.ogSlug = 'examples-ttl-expiration'
    }
</script>

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            {
                id: 'ttl-expiration-default',
                label: 'Default.svelte',
                ...manifest['ttl-expiration/demos/Default.svelte']
            }
        ]}
        columns={1}
    />
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="EXPIRATION"
    title={{ prefix: 'ttl ', accent: 'expiration', end: '.' }}
    description="Create short-lived entries and watch time-to-live expiration remove them from the cache."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'time to live' }]}
    sourceUrl={`${SOURCE_URL}ttl-expiration/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
>
    <TtlExpiration />
</ExampleV2>
