import { rehypeKeepCase } from '@humanspeak/docs-kit/mdsvex'
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
import adapter from '@sveltejs/adapter-cloudflare'
import { sveltekit } from '@sveltejs/kit/vite'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { mdsvex } from 'mdsvex'
import { createHighlighter } from 'shiki'
import { defineConfig } from 'vite'

import { competitors, ours } from './src/lib/compare-data'
import { docsConfig } from './src/lib/docs-config'

// IndexNow key for memory.svelte.page — must match the key file at
// docs/static/<key>.txt so search engines can verify ownership.
const indexNowKey = 'cbe16057-131f-41ee-ae1c-15bdf06578c8'

// Create highlighter instance
const highlighter = await createHighlighter({
    themes: ['github-light', 'one-dark-pro'],
    langs: ['javascript', 'typescript', 'html', 'css', 'json', 'bash', 'shell']
})

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
        sveltekit({
            preprocess: [
                vitePreprocess(),
                mdsvex({
                    rehypePlugins: [rehypeKeepCase],
                    extensions: ['.md', '.svx'],
                    highlight: {
                        highlighter: async (code, lang) => {
                            lang ??= 'text'
                            const lightHtml = highlighter.codeToHtml(code, {
                                lang,
                                theme: 'github-light'
                            })
                            const darkHtml = highlighter.codeToHtml(code, {
                                lang,
                                theme: 'one-dark-pro'
                            })

                            const combinedHtml = `
                        <div class="shiki-container">
                            <div class="shiki-light">${lightHtml}</div>
                            <div class="shiki-dark">${darkHtml}</div>
                        </div>
                    `

                            return `{@html ${JSON.stringify(combinedHtml)}}`
                        }
                    }
                })
            ],
            extensions: ['.svelte', '.svx'],
            adapter: adapter(),
            csp: {
                mode: 'hash',
                directives: {
                    'default-src': ['self'],
                    'script-src': [
                        'self',
                        'https://analytics.ahrefs.com',
                        'https://j.svelte.page',
                        'unsafe-inline'
                    ],
                    'style-src': ['self', 'unsafe-inline'],
                    'img-src': ['self', 'data:'],
                    'font-src': ['self'],
                    'connect-src': [
                        'self',
                        'https://analytics.ahrefs.com',
                        'https://j.svelte.page'
                    ],
                    'object-src': ['none'],
                    'base-uri': ['self'],
                    'form-action': ['self'],
                    'frame-ancestors': ['none']
                }
            }
        })
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
    server: {
        port: 8288
    }
})
