import { docMirrorsPlugin, llmsFullPlugin, llmsPlugin } from '@humanspeak/docs-kit/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

import { docsConfig } from './src/lib/docs-config'

export default defineConfig({
    plugins: [
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
        tailwindcss(),
        sveltekit()
    ],
    server: {
        port: 8288
    }
})
