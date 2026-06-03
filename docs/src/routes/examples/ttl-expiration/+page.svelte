<script lang="ts">
    import {
        CodeReferenceV2,
        type DemoManifestEntry,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import Clock from '@lucide/svelte/icons/clock'
    import Hourglass from '@lucide/svelte/icons/hourglass'
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
    import TimerOff from '@lucide/svelte/icons/timer-off'
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

{#snippet ttlNotes()}
    <ul>
        <li>
            <Clock />
            <span>
                <code>ttl</code> sets the lifetime for every entry created by this
                cache instance.
            </span>
        </li>
        <li>
            <Hourglass />
            <span>
                The list is sorted by <code>remainingMs</code>, so the next key to
                expire stays at the top.
            </span>
        </li>
        <li>
            <TimerOff />
            <span>
                When an entry expires, <code>MemoryCache</code> stops returning it
                and the active list removes it on the next tick.
            </span>
        </li>
        <li>
            <RotateCcw />
            <span>
                Changing <code>ttl</code> creates a fresh cache so countdowns,
                expiration counts, and seed data stay aligned.
            </span>
        </li>
    </ul>
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="EXPIRATION-WINDOW"
    title={{ prefix: 'watch ttl ', accent: 'countdown', end: '.' }}
    description="Create short-lived entries in a `MemoryCache` and watch each key disappear when its time-to-live window closes."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'time to live' }]}
    sourceUrl={`${SOURCE_URL}ttl-expiration/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
    notes={ttlNotes}
>
    <TtlExpiration />
</ExampleV2>
