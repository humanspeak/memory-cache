<script lang="ts">
    import {
        CodeReferenceV2,
        ExampleV2,
        formatSheetLabel,
        getBreadcrumbContext,
        getSeoContext,
        type ExampleSection
    } from '@humanspeak/docs-kit'
    import Activity from '@lucide/svelte/icons/activity'
    import Gauge from '@lucide/svelte/icons/gauge'
    import ListRestart from '@lucide/svelte/icons/list-restart'
    import Zap from '@lucide/svelte/icons/zap'
    import { demoCodeSample } from '$lib/demo-loaders'
    import CacheStatistics from '$lib/examples/cache-statistics/demos/Default.svelte'

    const SOURCE_URL =
        'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'

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
        seo.h1 = { title: 'Cache Statistics' }
        seo.description =
            'Monitor @humanspeak/memory-cache performance with built-in statistics for hits, misses, and evictions in a real-time interactive TypeScript demo app.'
        seo.ogTitle = 'Cache Statistics'
        seo.ogTagline = 'Monitor cache hit rate, miss rate, and performance'
        seo.ogFeatures = ['Hit Rate', 'Miss Rate', 'Evictions', 'Live Metrics']
        seo.ogSlug = 'examples-cache-statistics'
    }

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'OBSERVABILITY',
            title: { prefix: 'watch cache ', accent: 'hooks', end: '.' },
            description:
                'Measure `hit`, `miss`, `set`, `delete`, and `evict` events as live traffic moves through a `MemoryCache`.',
            snippet: statisticsDemo,
            codeSnippet: defaultCode,
            notes: statisticsNotes,
            barCells: [{ k: 'pattern', v: 'live metrics' }],
            sourceUrl: `${SOURCE_URL}cache-statistics/demos/Default.svelte`
        }
    ]
</script>

{#snippet statisticsDemo()}
    <CacheStatistics />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'cache-statistics/demos/Default.svelte',
                'cache-statistics-default',
                'Default.svelte'
            )
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

{#each sections as section, i (section.figId)}
    <ExampleV2
        figId={section.figId}
        tag={section.tag}
        title={section.title}
        description={section.description}
        mode={section.mode ?? 'live'}
        sheetLabel={formatSheetLabel(i, sections.length)}
        barCells={section.barCells}
        sourceUrl={section.sourceUrl}
        codeSnippet={section.codeSnippet}
        codeLabel="show code"
        notes={section.notes}
    >
        {@render section.snippet()}
    </ExampleV2>
{/each}
