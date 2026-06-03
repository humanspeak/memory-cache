import {
    demoManifestPlugin,
    docMirrorsPlugin,
    llmsFullPlugin,
    llmsPlugin,
    sitemapManifestPlugin
} from '@humanspeak/docs-kit/vite'
import { svelteMotionOptimize } from '@humanspeak/svelte-motion/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { docsConfig } from './src/lib/docs-config'

export default defineConfig({
    plugins: [
        sitemapManifestPlugin({ blogDir: false }),
        demoManifestPlugin({ split: true }),
        docMirrorsPlugin({ siteUrl: docsConfig.url }),
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
