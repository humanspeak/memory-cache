<!--
  @component
  Examples-gallery pager: docs-kit's `PagerV2` driven by the same sorted
  `/examples/<slug>` routes from the sitemap manifest that the examples
  index grid renders, so the `№` numbering always agrees with the index.
  Renders nothing outside example detail routes, so the examples layout
  can mount it unconditionally.
-->
<script lang="ts">
    import { PagerV2 } from '@humanspeak/docs-kit'
    import sitemapManifest from '$lib/sitemap-manifest.json'

    const items = Object.keys(sitemapManifest)
        .filter((route) => route.startsWith('/examples/') && route !== '/examples')
        .sort()
        .map((route) => ({
            href: route,
            label: `${route.replace('/examples/', '')}.`
        }))
</script>

<PagerV2 {items} ariaLabel="Example pagination" />
