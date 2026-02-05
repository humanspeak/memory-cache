<script lang="ts">
    import Header from '$lib/components/general/Header.svelte'
    import Footer from '$lib/components/general/Footer.svelte'

    const { children } = $props()
</script>

<div class="relative flex min-h-screen flex-col bg-background">
    <Header />
    <div class="flex flex-1 flex-col">
        {@render children?.()}
    </div>
    <Footer />
</div>
