import adapter from '@sveltejs/adapter-cloudflare'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import { mdsvex } from 'mdsvex'
import { createHighlighter } from 'shiki'

// Create highlighter instance
const highlighter = await createHighlighter({
    themes: ['github-light', 'one-dark-pro'],
    langs: ['javascript', 'typescript', 'html', 'css', 'json', 'bash', 'shell']
})

/** @type {import('@sveltejs/kit').Config} */
const config = {
    preprocess: [
        vitePreprocess(),
        mdsvex({
            extensions: ['.md', '.svx'],
            highlight: {
                highlighter: async (code, lang = 'text') => {
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

    kit: {
        adapter: adapter(),
        csp: {
            directives: {
                'default-src': ['self'],
                'script-src': ['self', 'https://analytics.ahrefs.com'],
                'style-src': ['self', 'unsafe-inline'],
                'img-src': ['self', 'data:'],
                'font-src': ['self'],
                'connect-src': ['self', 'https://analytics.ahrefs.com'],
                'object-src': ['none'],
                'base-uri': ['self'],
                'form-action': ['self'],
                'frame-ancestors': ['none']
            }
        }
    },

    extensions: ['.svelte', '.svx']
}

export default config
