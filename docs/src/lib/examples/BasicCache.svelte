<script lang="ts">
    import { MemoryCache } from '@humanspeak/memory-cache'
    import { onMount } from 'svelte'

    // Create a cache instance
    const cache = new MemoryCache<string>({ maxSize: 10 })

    // State
    let entries = $state<{ key: string; value: string }[]>([])
    let inputKey = $state('')
    let inputValue = $state('')
    let lastOperation = $state<{ type: string; key: string; result?: string | null } | null>(null)
    let getKey = $state('')
    let getResult = $state<string | null>(null)

    function updateEntries() {
        entries = cache.keys().map((key) => ({
            key,
            value: cache.get(key) ?? ''
        }))
    }

    function handleSet() {
        if (!inputKey.trim()) return
        cache.set(inputKey, inputValue || `Value for ${inputKey}`)
        lastOperation = { type: 'SET', key: inputKey }
        updateEntries()
        inputKey = ''
        inputValue = ''
    }

    function handleGet() {
        if (!getKey.trim()) return
        const result = cache.get(getKey)
        getResult = result ?? null
        lastOperation = { type: 'GET', key: getKey, result: result ?? 'undefined (miss)' }
    }

    function handleDelete(key: string) {
        cache.delete(key)
        lastOperation = { type: 'DELETE', key }
        updateEntries()
        if (getKey === key) getResult = null
    }

    function handleClear() {
        cache.clear()
        lastOperation = { type: 'CLEAR', key: 'all' }
        entries = []
        getResult = null
    }

    // Seed some initial data on mount
    onMount(() => {
        cache.set('user:1', 'Alice')
        cache.set('user:2', 'Bob')
        cache.set('config', 'production')
        updateEntries()
    })
</script>

<div class="flex w-full max-w-4xl flex-col gap-6 lg:flex-row">
    <!-- Controls Panel -->
    <div class="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm">
        <h3 class="mb-4 text-lg font-semibold text-foreground">Cache Operations</h3>

        <!-- Set Operation -->
        <div class="mb-6">
            <span class="mb-2 block text-sm font-medium text-foreground">Set Value</span>
            <div class="flex gap-2">
                <input
                    type="text"
                    bind:value={inputKey}
                    placeholder="Key"
                    aria-label="Cache key"
                    class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                />
                <input
                    type="text"
                    bind:value={inputValue}
                    placeholder="Value"
                    aria-label="Cache value"
                    class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                />
                <button
                    onclick={handleSet}
                    class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                    Set
                </button>
            </div>
        </div>

        <!-- Get Operation -->
        <div class="mb-6">
            <label for="get-key-input" class="mb-2 block text-sm font-medium text-foreground">Get Value</label>
            <div class="flex gap-2">
                <input
                    id="get-key-input"
                    type="text"
                    bind:value={getKey}
                    placeholder="Key to retrieve"
                    class="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand-500 focus:outline-none"
                />
                <button
                    onclick={handleGet}
                    class="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-700"
                >
                    Get
                </button>
            </div>
            {#if getResult !== null}
                <div class="mt-2 rounded-md bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
                    Result: <code class="font-mono">{getResult}</code>
                </div>
            {/if}
        </div>

        <!-- Clear -->
        <button
            onclick={handleClear}
            class="rounded-md border border-red-500/50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10"
        >
            Clear All
        </button>

        <!-- Last Operation -->
        {#if lastOperation}
            <div class="mt-4 rounded-md bg-muted/50 px-3 py-2 text-sm">
                <span class="font-medium text-brand-600">{lastOperation.type}</span>
                <span class="text-muted-foreground"> → </span>
                <code class="font-mono text-foreground">{lastOperation.key}</code>
                {#if lastOperation.result}
                    <span class="text-muted-foreground"> = </span>
                    <code class="font-mono text-foreground">{lastOperation.result}</code>
                {/if}
            </div>
        {/if}
    </div>

    <!-- Cache State Panel -->
    <div class="flex-1 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div class="mb-4 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-foreground">Cache State</h3>
            <span class="rounded-full bg-brand-500/10 px-2.5 py-1 text-xs font-medium text-brand-600">
                {entries.length} items
            </span>
        </div>

        {#if entries.length === 0}
            <div class="flex h-48 items-center justify-center text-muted-foreground">
                Cache is empty
            </div>
        {:else}
            <div class="space-y-2">
                {#each entries as entry (entry.key)}
                    <div class="cache-entry flex items-center justify-between rounded-lg border border-border bg-background p-3">
                        <div class="min-w-0 flex-1">
                            <div class="truncate font-mono text-sm font-medium text-foreground">
                                {entry.key}
                            </div>
                            <div class="truncate font-mono text-xs text-muted-foreground">
                                {entry.value}
                            </div>
                        </div>
                        <button
                            onclick={() => handleDelete(entry.key)}
                            class="ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-600"
                            title="Delete entry"
                        >
                            <i class="fa-solid fa-trash-can text-xs"></i>
                        </button>
                    </div>
                {/each}
            </div>
        {/if}
    </div>
</div>

<style>
    .cache-entry {
        animation: slideIn 0.2s ease-out;
    }

    @keyframes slideIn {
        from {
            opacity: 0;
            transform: translateX(-8px);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
</style>
