<script lang="ts">
    import { BrutIndexV2, getBreadcrumbContext, getSeoContext } from '@humanspeak/docs-kit'
    import sitemapManifest from '$lib/sitemap-manifest.json'
    import type { PageData } from './$types'

    type ExampleData = {
        title: string
        description: string
    }

    type ExamplesData = Record<string, ExampleData>

    const { data }: { data: PageData } = $props()

    const breadcrumbs = getBreadcrumbContext()
    const seo = getSeoContext()
    if (breadcrumbs) {
        breadcrumbs.breadcrumbs = [{ title: 'Examples' }]
    }
    if (seo) {
        seo.title = 'Interactive Examples | Memory Cache'
        seo.description =
            'Try interactive @humanspeak/memory-cache demos for basic operations, TTL expiration, LRU eviction, and live cache statistics in TypeScript apps.'
        seo.ogTitle = 'Examples'
        seo.ogTagline = 'Interactive cache examples built with Memory Cache'
        seo.ogFeatures = ['Basic Cache', 'TTL Expiration', 'LRU Eviction', 'Cache Statistics']
        seo.ogSlug = 'examples'
    }

    const examples = $derived.by(() => {
        const exampleRoutes = Object.keys(sitemapManifest)
            .filter((route) => route.startsWith('/examples/') && route !== '/examples')
            .sort()

        return exampleRoutes.map((route) => {
            const slug = route.replace('/examples/', '')
            const exampleData = (data.examples as ExamplesData)[slug]
            const title = exampleData?.title || formatTitle(slug)
            return {
                route,
                slug,
                title,
                description:
                    exampleData?.description || `Interactive ${title.toLowerCase()} cache example`
            }
        })
    })

    function formatTitle(slug: string): string {
        return slug
            .split('-')
            .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ')
    }

    const pad2 = (n: number) => String(n).padStart(2, '0')
</script>

<BrutIndexV2
    hero={{
        figLabel: 'FIG-001 · EXAMPLES INDEX',
        figId: 'FIG-001',
        sheetLabel: 'SHEET 01 / 02',
        meta: [
            { k: 'demos', v: String(examples.length) },
            { k: 'format', v: 'live examples' },
            { k: 'tone', v: 'interactive' },
            { rule: 'dashed' },
            { k: 'library', v: '@humanspeak/memory-cache' },
            { k: 'runtime', v: 'typescript', accent: true },
            { rule: 'dashed' }
        ],
        metaFooter: '// scroll for demos',
        kicker: '// examples / live demos',
        title: { accent: 'examples', end: '.' },
        subHtml:
            'Interactive cache demos built with <b>@humanspeak/memory-cache</b> — basic operations, TTL expiration, LRU eviction, and live cache statistics. Pick a card, inspect behavior, ship.',
        ctas: [
            {
                label: 'browse basic-cache ↗',
                href: '/examples/basic-cache',
                primary: true
            },
            { label: 'get started', href: '/docs/getting-started' }
        ]
    }}
    lede={{
        kicker: 'FIG-002 / DEMOS',
        title: { prefix: 'pick an ', accent: 'example', suffix: '.' },
        body: 'Each page is a self-contained, interactive demo with the cache behavior you need.'
    }}
    items={examples.map((example, i) => ({
        href: example.route,
        id: `№ ${pad2(i + 1)} / ${pad2(examples.length)}`,
        title: `${example.slug}.`,
        line: example.description
    }))}
    footer={{
        big: {
            prefix: 'try ',
            accent: 'basic-cache',
            href: '/examples/basic-cache',
            hint: 'set + get + delete operations'
        }
    }}
/>
