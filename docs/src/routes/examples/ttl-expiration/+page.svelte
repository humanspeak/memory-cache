<script lang="ts">
    import { getBreadcrumbContext } from '$lib/components/contexts/Breadcrumb/Breadcrumb.context'
    import Example from '$lib/components/general/Example.svelte'
    import TtlExpiration from '$lib/examples/TtlExpiration.svelte'

    const breadcrumbs = getBreadcrumbContext()
    $effect(() => {
        if (breadcrumbs) {
            breadcrumbs.breadcrumbs = [
                { title: 'Examples', href: '/examples' },
                { title: 'TTL Expiration' }
            ]
        }
    })
</script>

<svelte:head>
    <title>TTL Expiration | Examples | Memory Cache</title>
    <meta name="description" content="Watch cache entries expire in real-time with countdown timers." />
</svelte:head>

<Example title="TTL Expiration">
    <TtlExpiration />
</Example>
