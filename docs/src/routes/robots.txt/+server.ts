export function GET() {
    const body = `User-agent: *
Allow: /

Sitemap: https://memory.svelte.page/sitemap.xml`

    return new Response(body, {
        headers: { 'Content-Type': 'text/plain' }
    })
}
