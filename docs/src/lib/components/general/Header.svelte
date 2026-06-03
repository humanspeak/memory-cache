<script lang="ts">
    import { HeaderV2 } from '@humanspeak/docs-kit'
    import { docsConfig } from '$lib/docs-config'
    import favicon from '$lib/assets/logo.svg'
    import rootPkg from '../../../../../package.json'

    const PKG_VERSION = rootPkg.version
</script>

<HeaderV2
    config={docsConfig}
    {favicon}
    version={PKG_VERSION}
    nav={[
        { label: 'docs', href: '/docs' },
        { label: 'examples', href: '/examples' }
    ]}
/>
