<script lang="ts">
    import { enhanceCodeBlocks, ExampleLayoutV2 } from '@humanspeak/docs-kit'
    import { MotionConfig } from '@humanspeak/svelte-motion'
    import favicon from '$lib/assets/logo.svg'
    import { docsConfig } from '$lib/docs-config'
    import rootPkg from '../../../../package.json'

    const { children } = $props()
    const PKG_VERSION = rootPkg.version
</script>

<ExampleLayoutV2
    config={docsConfig}
    {favicon}
    version={PKG_VERSION}
    nav={[
        { label: 'docs', href: '/docs' },
        { label: 'examples', href: '/examples' }
    ]}
>
    <div class="flex flex-1 flex-col" use:enhanceCodeBlocks>
        <MotionConfig transition={{ duration: 0.6 }}>
            {@render children?.()}
        </MotionConfig>
    </div>
</ExampleLayoutV2>
