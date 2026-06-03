<script lang="ts">
    import {
        CodeReferenceV2,
        type DemoManifestEntry,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import Activity from '@lucide/svelte/icons/activity'
    import Gauge from '@lucide/svelte/icons/gauge'
    import ListRestart from '@lucide/svelte/icons/list-restart'
    import Zap from '@lucide/svelte/icons/zap'
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

{#snippet statisticsNotes()}
    <ul>
        <li>
            <Activity />
            <span>
                The cache wires <code>hooks</code> for <code>onHit</code>,
                <code>onMiss</code>, <code>onSet</code>, <code>onDelete</code>,
                and <code>onEvict</code>.
            </span>
        </li>
        <li>
            <Gauge />
            <span>
                The <code>hit rate</code> is calculated from reads only:
                <code>hits / (hits + misses)</code>.
            </span>
        </li>
        <li>
            <Zap />
            <span>
                <code>burst</code> runs ten mixed operations so the event stream
                can show hits, misses, writes, deletes, and evictions together.
            </span>
        </li>
        <li>
            <ListRestart />
            <span>
                <code>reset</code> clears the counters and creates a fresh cache
                with <code>maxSize: 5</code> and a <code>30s</code> TTL.
            </span>
        </li>
    </ul>
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="OBSERVABILITY"
    title={{ prefix: 'watch cache ', accent: 'hooks', end: '.' }}
    description="Measure `hit`, `miss`, `set`, `delete`, and `evict` events as live traffic moves through a `MemoryCache`."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'live metrics' }]}
    sourceUrl={`${SOURCE_URL}cache-statistics/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
    notes={statisticsNotes}
>
    <CacheStatistics />
</ExampleV2>
