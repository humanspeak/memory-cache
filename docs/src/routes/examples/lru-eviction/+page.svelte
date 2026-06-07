<script lang="ts">
    import {
        CodeReferenceV2,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import Clock from '@lucide/svelte/icons/clock'
    import Lightbulb from '@lucide/svelte/icons/lightbulb'
    import MousePointer from '@lucide/svelte/icons/mouse-pointer'
    import Plus from '@lucide/svelte/icons/plus'
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
    import { demoCodeSample } from '$lib/demo-loaders'
    import LruEviction from '$lib/examples/lru-eviction/demos/Default.svelte'

    const SOURCE_URL = 'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'

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
        seo.h1 = { title: 'LRU Eviction' }
        seo.description =
            'Explore LRU eviction policies in @humanspeak/memory-cache with an interactive demo showing max-size behavior and expired-entry pruning in apps.'
        seo.ogTitle = 'LRU Eviction'
        seo.ogTagline = 'Watch least recently used entries leave the cache'
        seo.ogFeatures = ['Max Size', 'Access Order', 'TTL Pruning', 'Live State']
        seo.ogSlug = 'examples-lru-eviction'
    }
</script>

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample(
                'lru-eviction/demos/Default.svelte',
                'lru-eviction-default',
                'Default.svelte'
            )
        ]}
        columns={1}
    />
{/snippet}

{#snippet lruNotes()}
    <ul>
        <li>
            <Lightbulb />
            <span>
                LRU means <code>least recently used</code>: the oldest untouched key is the first
                candidate when the cache reaches capacity.
            </span>
        </li>
        <li>
            <MousePointer />
            <span>
                Clicking an entry calls <code>get(key)</code>, moving that key to the MRU end of the
                list.
            </span>
        </li>
        <li>
            <Plus />
            <span>
                <code>add entry</code> writes a new item. If <code>size === maxSize</code>
                after expired entries are pruned, the current LRU key is evicted.
            </span>
        </li>
        <li>
            <Clock />
            <span>
                When <code>ttl</code> and <code>maxSize</code> are both configured, expired entries are
                removed before any valid LRU entry is evicted.
            </span>
        </li>
        <li>
            <RotateCcw />
            <span>
                Changing <code>maxSize</code> resets the demo so capacity, rank, and eviction behavior
                stay easy to compare.
            </span>
        </li>
    </ul>
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="EVICTION-POLICY"
    title={{ prefix: 'trace lru ', accent: 'eviction', end: '.' }}
    description="Fill a bounded `MemoryCache`, access entries, and watch how expired entries are reclaimed before least recently used valid keys leave."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'least recently used' }]}
    sourceUrl={`${SOURCE_URL}lru-eviction/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
    notes={lruNotes}
>
    <LruEviction />
</ExampleV2>
