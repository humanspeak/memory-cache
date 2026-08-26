import {
    demoManifestPlugin,
    docMirrorsPlugin,
    exampleMirrorsPlugin,
    indexNowPlugin,
    llmsFullPlugin,
    llmsPlugin,
    sitemapManifestPlugin
} from '@humanspeak/docs-kit/vite'
import { svelteMotionOptimize } from '@humanspeak/svelte-motion/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { docsConfig } from './src/lib/docs-config'

// IndexNow key for memory.svelte.page — must match the key file at
// docs/static/<key>.txt so search engines can verify ownership.
const indexNowKey = 'cbe16057-131f-41ee-ae1c-15bdf06578c8'

export default defineConfig({
    plugins: [
        sitemapManifestPlugin({ blogDir: false }),
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
            append: 'static/llms-append.md'
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
