<script lang="ts">
    import {
        CodeReferenceV2,
        ExampleV2,
        formatSheetLabel,
        getBreadcrumbContext,
        getSeoContext,
        type ExampleSection
    } from '@humanspeak/docs-kit'
    import Gauge from '@lucide/svelte/icons/gauge'
    import Layers from '@lucide/svelte/icons/layers'
    import Lightbulb from '@lucide/svelte/icons/lightbulb'
    import MousePointer from '@lucide/svelte/icons/mouse-pointer'
    import { demoCodeSample } from '$lib/demo-loaders'
    import WeightedEviction from '$lib/examples/memory-weighted-eviction/demos/Default.svelte'

    const SOURCE_URL = 'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [
            { title: 'Examples', href: '/examples' },
            { title: 'Memory-Weighted Eviction' }
        ]
    }
    if (seo) {
        seo.title = 'Memory-Weighted Eviction | Examples | Memory Cache'
        seo.h1 = { title: 'Memory-Weighted Eviction' }
        seo.description =
            'Explore weighted LRU eviction in @humanspeak/memory-cache with an interactive API-response demo showing aggregate weight, recency, and multi-eviction.'
        seo.ogTitle = 'Memory-Weighted Eviction'
        seo.ogTagline = 'Bound user-defined weight while preserving LRU policy'
        seo.ogFeatures = ['Aggregate Weight', 'Multi-Eviction', 'LRU Access', 'Live Telemetry']
        seo.ogSlug = 'examples-memory-weighted-eviction'
    }

    const sections: ExampleSection[] = [
        {
            figId: 'FIG-001',
            tag: 'WEIGHTED-LRU',
            title: { prefix: 'bound aggregate ', accent: 'weight', end: '.' },
            description:
                'Cache API-response-like records with logical KiB weights, protect entries through access, and trigger single or multiple LRU evictions from one insertion.',
            snippet: weightedDemo,
            codeSnippet: defaultCode,
            notes: weightedNotes,
            barCells: [{ k: 'policy', v: 'weighted least recently used' }],
            sourceUrl: `${SOURCE_URL}memory-weighted-eviction/demos/Default.svelte`
        }
    ]
</script>

{#snippet weightedDemo()}
    <WeightedEviction />
{/snippet}

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'memory-weighted-eviction/demos/Default.svelte',
                'memory-weighted-eviction-default',
                'Default.svelte'
            )
        ]}
        columns={1}
    />
{/snippet}

{#snippet weightedNotes()}
    <ul>
        <li>
            <Gauge />
            <span>
                <code>maxWeight</code> limits aggregate application-defined weight. It does not
                measure retained JavaScript heap automatically.
            </span>
        </li>
        <li>
            <Lightbulb />
            <span>
                This cache uses <code>maxSize: 0</code> so weight is its only capacity limit; the
                normal default remains 100 entries.
            </span>
        </li>
        <li>
            <MousePointer />
            <span>
                Access calls <code>cache.get(key)</code> and moves that record to MRU. Weighted LRU
                removes the least recently used record, not the physically largest one.
            </span>
        </li>
        <li>
            <Layers />
            <span>
                Select an 8 KiB record at the default limit and add it to watch one insertion evict
                multiple older records until the aggregate fits.
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
