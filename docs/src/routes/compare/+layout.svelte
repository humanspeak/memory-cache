<script lang="ts">
    import {
        buildCompareBreadcrumbs,
        CompareLayoutV2,
        enhanceCodeBlocks
    } from '@humanspeak/docs-kit'
    import favicon from '$lib/assets/logo.svg'
    import { getCompetitor } from '$lib/compare-data'
    import { docsConfig } from '$lib/docs-config'
    import rootPkg from '../../../../package.json'

    const { children } = $props()
    const PKG_VERSION = rootPkg.version

    const breadcrumbResolver = (pathname: string) =>
        buildCompareBreadcrumbs(pathname, { getCompetitor })
</script>

<CompareLayoutV2
    config={docsConfig}
    {favicon}
    version={PKG_VERSION}
    nav={[
        { label: 'docs', href: '/docs' },
        { label: 'examples', href: '/examples' },
        { label: 'compare', href: '/compare' }
    ]}
    {breadcrumbResolver}
>
    <div class="flex flex-1 flex-col" use:enhanceCodeBlocks>
        {@render children?.()}
    </div>
</CompareLayoutV2>
