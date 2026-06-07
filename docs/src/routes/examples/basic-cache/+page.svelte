<script lang="ts">
    import {
        CodeReferenceV2,
        ExampleV2,
        getBreadcrumbContext,
        getSeoContext
    } from '@humanspeak/docs-kit'
    import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right'
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
    import SearchX from '@lucide/svelte/icons/search-x'
    import Sparkles from '@lucide/svelte/icons/sparkles'
    import { demoCodeSample } from '$lib/demo-loaders'
    import BasicCache from '$lib/examples/basic-cache/demos/Default.svelte'

    const SOURCE_URL =
        'https://github.com/humanspeak/memory-cache/blob/main/docs/src/lib/examples/'

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
        seo.h1 = { title: 'Basic Cache' }
        seo.description =
            'Create and use a basic in-memory cache with get, set, and delete operations in an interactive @humanspeak/memory-cache demo for TypeScript apps.'
        seo.ogTitle = 'Basic Cache'
        seo.ogTagline = 'Try get, set, and delete with a live cache state'
        seo.ogFeatures = ['Set Values', 'Get Values', 'Delete Keys', 'Live State']
        seo.ogSlug = 'examples-basic-cache'
    }
</script>

{#snippet defaultCode()}
    <CodeReferenceV2
        samples={[
            demoCodeSample('basic-cache/demos/Default.svelte', 'basic-cache-default', 'Default.svelte')
        ]}
        columns={1}
    />
{/snippet}

{#snippet cacheNotes()}
    <ul>
        <li>
            <Sparkles />
            <span>
                The demo starts with <code>user:1</code>, <code>user:2</code>, and
                <code>config</code>, then mirrors every operation into the live table.
            </span>
        </li>
        <li>
            <ArrowLeftRight />
            <span>
                <code>set(key, value)</code> writes a value; <code>get(key)</code>
                returns the cached value without changing the store.
            </span>
        </li>
        <li>
            <SearchX />
            <span>
                A missing <code>get</code> returns <code>undefined</code> and marks
                the <code>lookup</code> telemetry plus <code>result</code> row red.
            </span>
        </li>
        <li>
            <RotateCcw />
            <span>
                Use <code>delete</code>, <code>clear()</code>, and <code>reset</code>
                to compare one-key removal, an empty cache, and the seeded baseline.
            </span>
        </li>
    </ul>
{/snippet}

<ExampleV2
    figId="FIG-001"
    tag="CACHE-BASICS"
    title={{ prefix: 'set + get with ', accent: 'memorycache', end: '.' }}
    description="Create a `MemoryCache` and drive the core `set`, `get`, and `delete` methods against live state."
    sheetLabel="SHEET 01 / 01"
    barCells={[{ k: 'pattern', v: 'basic operations' }]}
    sourceUrl={`${SOURCE_URL}basic-cache/demos/Default.svelte`}
    codeSnippet={defaultCode}
    codeLabel="show code"
    notes={cacheNotes}
>
    <BasicCache />
</ExampleV2>
