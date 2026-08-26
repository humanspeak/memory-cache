import {
    demoManifestPlugin,
    docMirrorsPlugin,
    exampleMirrorsPlugin,
    indexNowPlugin,
    llmsFullPlugin,
    llmsPlugin,
    sitemapManifestPlugin,
    socialCardsPlugin
} from '@humanspeak/docs-kit/vite'
import { svelteMotionOptimize } from '@humanspeak/svelte-motion/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { competitors, ours } from './src/lib/compare-data'
import { docsConfig } from './src/lib/docs-config'

// IndexNow key for memory.svelte.page — must match the key file at
// docs/static/<key>.txt so search engines can verify ownership.
const indexNowKey = 'cbe16057-131f-41ee-ae1c-15bdf06578c8'

export default defineConfig({
    plugins: [
        sitemapManifestPlugin({
            blogDir: false,
            // `/compare/[slug]` is one dynamic SvelteKit page, so filesystem
            // discovery can't see the concrete competitor slugs. Inject them so
            // each comparison lands in the sitemap manifest with its own
            // lastmod (driven by compare-data.ts's mtime).
            extraPages: competitors.map((competitor) => ({
                route: `/compare/${competitor.slug}`,
                source: 'src/lib/compare-data.ts'
            }))
        }),
        demoManifestPlugin({ split: true }),
        docMirrorsPlugin({ siteUrl: docsConfig.url }),
        exampleMirrorsPlugin({
            siteUrl: docsConfig.url,
            sourceBaseUrl: 'https://github.com/humanspeak/memory-cache/blob/main/docs'
        }),
        llmsFullPlugin({
            siteUrl: docsConfig.url,
            pkgName: docsConfig.npmPackage
        }),
        llmsPlugin({
            siteUrl: docsConfig.url,
            pkgName: docsConfig.name,
            description: docsConfig.description,
            prepend: 'static/llms-prepend.md',
            append: 'static/llms-append.md',
            comparisons: { ours, competitors }
        }),
        // Renders static/og-default.png, twitter-default.png, and per-page
        // cards into static/social-cards/ at build time (dev skips it), with
        // dedupe across Vite's client/SSR build environments — replaces the
        // old standalone `tsx scripts/generate-social-cards.ts` step.
        socialCardsPlugin({
            npmPackage: docsConfig.npmPackage,
            defaultTitle: docsConfig.name,
            defaultDescription: docsConfig.description,
            defaultFeatures: docsConfig.defaultFeatures,
            // ComparisonPageV2 builds its ogSlug from a prop at runtime, so the
            // compare pages are invisible to the static `seo.ogSlug = '...'`
            // regex scan — inject them explicitly.
            extraPages: [
                {
                    ogSlug: 'compare',
                    ogTitle: 'Compare',
                    ogTagline:
                        'Honest, side-by-side comparisons against the caching libraries you’d consider instead.',
                    ogFeatures: [
                        'All Comparisons',
                        'Feature Matrices',
                        'Pros & Cons',
                        'Honest Verdicts'
                    ]
                },
                ...competitors.map((c) => ({
                    ogSlug: `compare-${c.slug}`,
                    ogTitle: `vs ${c.name}`,
                    ogTagline: c.tagline,
                    ogFeatures: [
                        'Feature Comparison',
                        'Pros & Cons',
                        'Honest Verdict',
                        'Migration Notes'
                    ]
                }))
            ]
        }),
        // Pings IndexNow with every sitemap URL after a production build, but
        // only in `--mode indexnow` (the deploy path) so plain `vite build`
        // and PR preview builds never notify search engines.
        indexNowPlugin({
            siteUrl: docsConfig.url,
            key: indexNowKey,
            productionMode: 'indexnow',
            // Best-effort ping; a rejected submission must not fail the deploy.
            failOnError: false
        }),
        svelteMotionOptimize(),
        tailwindcss(),
        sveltekit()
    ],
    optimizeDeps: {
        exclude: [
            '@humanspeak/docs-kit',
            '@humanspeak/svelte-motion',
            '@humanspeak/svelte-satori-fix',
            '@resvg/resvg-js',
            'satori',
            'satori-html'
        ]
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('@humanspeak/svelte-motion')) return 'svelte-motion'
                    if (id.includes('mode-watcher')) return 'mode-watcher'
                }
            }
        }
    },
    server: {
        port: 8288
    }
})
