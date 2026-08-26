import { competitors } from '$lib/compare-data'
import { createCompareSlugLoad } from '@humanspeak/docs-kit'

// No `prerender = true` here: app.html carries %sveltekit.nonce% for CSP,
// which SvelteKit cannot combine with prerendering. The pages SSR at
// request time like every other route on this site.
export const { entries, load } = createCompareSlugLoad(competitors)
