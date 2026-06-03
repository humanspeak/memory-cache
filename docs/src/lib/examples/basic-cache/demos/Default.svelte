<script lang="ts">
    import { MemoryCache } from '@humanspeak/memory-cache'
    import Trash2 from '@lucide/svelte/icons/trash-2'
    import { onMount } from 'svelte'

    const capacity = 10

    // Create a cache instance
    const cache = new MemoryCache<string>({ maxSize: capacity })

    // State
    let entries = $state<{ key: string; value: string }[]>([])
    let inputKey = $state('')
    let inputValue = $state('')
    let lastOperation = $state<{ type: string; key: string; result?: string | null } | null>(null)
    let getKey = $state('')
    let getResult = $state<string | null>(null)
    let operationCount = $state(0)

    let lastOperationLabel = $derived(lastOperation ? lastOperation.type.toLowerCase() : 'seeded')
    let isLookupMiss = $derived(lastOperation?.type === 'GET' && getResult === null)
    let lookupLabel = $derived(
        lastOperation?.type === 'GET' ? (isLookupMiss ? 'miss' : 'hit') : 'idle'
    )
    let resultLabel = $derived(
        lastOperation?.type === 'GET' ? (getResult ?? 'undefined (miss)') : 'waiting'
    )

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
        operationCount += 1
        updateEntries()
        inputKey = ''
        inputValue = ''
    }

    function handleGet() {
        if (!getKey.trim()) return
        const result = cache.get(getKey)
        getResult = result ?? null
        lastOperation = { type: 'GET', key: getKey, result: result ?? 'undefined (miss)' }
        operationCount += 1
    }

    function handleDelete(key: string) {
        cache.delete(key)
        lastOperation = { type: 'DELETE', key }
        operationCount += 1
        updateEntries()
        if (getKey === key) getResult = null
    }

    function handleClear() {
        cache.clear()
        lastOperation = { type: 'CLEAR', key: 'all' }
        operationCount += 1
        entries = []
        getResult = null
    }

    function seedInitialData() {
        cache.clear()
        cache.set('user:1', 'Alice')
        cache.set('user:2', 'Bob')
        cache.set('config', 'production')
        updateEntries()
    }

    function handleReset() {
        seedInitialData()
        inputKey = ''
        inputValue = ''
        getKey = ''
        getResult = null
        operationCount = 0
        lastOperation = null
    }

    // Seed some initial data on mount
    onMount(() => {
        seedInitialData()
    })
</script>

<div class="demo-shell">
    <div class="demo-telemetry">
        <div>items · <span>{entries.length}</span></div>
        <div>capacity · <span>{capacity}</span></div>
        <div>ops · <span>{operationCount}</span></div>
        <div>last · <span>{lastOperationLabel}</span></div>
        <div class:miss={isLookupMiss}>lookup · <span>{lookupLabel}</span></div>
        <button type="button" onclick={handleReset}>reset</button>
    </div>

    <div class="demo-frame">
        <section class="operation-panel" aria-label="Cache operations">
            <div class="operation-row">
                <div class="operation-label">
                    <span>set</span>
                    <p>write or update a key</p>
                </div>
                <div class="operation-controls set-controls">
                    <input
                        type="text"
                        bind:value={inputKey}
                        placeholder="key"
                        aria-label="Cache key"
                    />
                    <input
                        type="text"
                        bind:value={inputValue}
                        placeholder="value"
                        aria-label="Cache value"
                    />
                    <button type="button" onclick={handleSet}>set</button>
                </div>
            </div>

            <div class="operation-row">
                <div class="operation-label">
                    <label for="get-key-input">get</label>
                    <p>read without mutating state</p>
                </div>
                <div class="operation-controls get-controls">
                    <input
                        id="get-key-input"
                        type="text"
                        bind:value={getKey}
                        placeholder="key"
                    />
                    <button type="button" onclick={handleGet}>get</button>
                </div>
            </div>

            <div class="result-row" class:miss={isLookupMiss}>
                <div>result · <span>{resultLabel}</span></div>
                <button type="button" onclick={handleClear}>clear all</button>
            </div>

        </section>

        <section class="cache-panel" aria-label="Cache state">
            <div class="cache-head">
                <div>key</div>
                <div>value</div>
                <div>action</div>
            </div>

            {#if entries.length === 0}
                <div class="empty-state">
                    <span>cache empty</span>
                    <p>set a key to populate the in-memory store</p>
                </div>
            {:else}
                {#each entries as entry, index (entry.key)}
                    <div class="cache-entry">
                        <div>
                            <span>{String(index + 1).padStart(2, '0')}</span>
                            <code>{entry.key}</code>
                        </div>
                        <code>{entry.value}</code>
                        <button
                            type="button"
                            onclick={() => handleDelete(entry.key)}
                            title="Delete entry"
                            aria-label={`Delete ${entry.key}`}
                        >
                            <Trash2 size={13} />
                        </button>
                    </div>
                {/each}
            {/if}
        </section>
    </div>

    <div class="demo-foot">
        <div>store · <span>memory</span></div>
        <div>eviction · <span>lru ready</span></div>
        <div>ttl · <span>none</span></div>
        <div>keys · <span>{entries.length}</span></div>
        <div>mode · <span>live</span></div>
    </div>
</div>

<style>
    .demo-shell {
        display: flex;
        min-height: 560px;
        width: 100%;
        flex-direction: column;
        background: var(--brut-bg);
        color: var(--brut-ink);
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
    }

    .demo-telemetry,
    .demo-foot {
        display: grid;
        background: var(--brut-bg-2);
        color: var(--brut-ink-3);
        font-size: 11px;
    }

    .demo-telemetry {
        grid-template-columns: repeat(6, minmax(0, 1fr));
        border-bottom: 1px solid var(--brut-rule);
    }

    .demo-foot {
        grid-template-columns: repeat(5, minmax(0, 1fr));
        border-top: 1px solid var(--brut-rule);
    }

    .demo-telemetry div,
    .demo-telemetry button,
    .demo-foot div {
        min-width: 0;
        border-right: 1px solid var(--brut-rule);
        padding: 8px 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .demo-telemetry button {
        border: 0;
        border-right: 1px solid var(--brut-rule);
        background: transparent;
        color: var(--brut-accent);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .demo-telemetry span,
    .demo-foot span {
        color: var(--brut-ink);
    }

    .demo-telemetry .miss,
    .demo-telemetry .miss span {
        color: #dc2626;
    }

    .demo-frame {
        display: grid;
        min-height: 0;
        flex: 1;
        grid-template-columns: minmax(300px, 0.8fr) minmax(360px, 1.2fr);
        background: var(--brut-bg);
    }

    .operation-panel {
        display: flex;
        min-width: 0;
        flex-direction: column;
        border-right: 1px solid var(--brut-rule);
        background: color-mix(in srgb, var(--brut-bg-2) 58%, var(--brut-bg));
    }

    .operation-row {
        display: grid;
        grid-template-columns: 120px minmax(0, 1fr);
        gap: 16px;
        border-bottom: 1px solid var(--brut-rule);
        padding: 18px 22px;
    }

    .operation-label span,
    .operation-label label {
        display: block;
        margin-bottom: 6px;
        color: var(--brut-ink);
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
    }

    .operation-label p {
        margin: 0;
        color: var(--brut-ink-3);
        font-size: 11px;
        line-height: 1.45;
    }

    .operation-controls {
        display: grid;
        min-width: 0;
        gap: 8px;
    }

    .set-controls {
        grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
    }

    .get-controls {
        grid-template-columns: minmax(0, 1fr) auto;
    }

    input,
    button {
        border-radius: 0;
        font: inherit;
    }

    input {
        min-width: 0;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        color: var(--brut-ink);
        padding: 9px 10px;
        font-size: 12px;
        outline: none;
    }

    input::placeholder {
        color: var(--brut-ink-3);
    }

    input:focus {
        border-color: var(--brut-accent);
    }

    .operation-controls button,
    .result-row button {
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        color: var(--brut-accent);
        padding: 9px 12px;
        font-size: 12px;
        cursor: pointer;
    }

    .operation-controls button:hover,
    .result-row button:hover,
    .demo-telemetry button:hover,
    .cache-entry button:hover {
        background: color-mix(in srgb, var(--brut-accent) 12%, transparent);
    }

    .result-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        border-bottom: 1px solid var(--brut-rule);
        padding: 14px 22px;
        color: var(--brut-ink-3);
        font-size: 11px;
    }

    .result-row span {
        color: var(--brut-ink);
    }

    .result-row.miss {
        background: color-mix(in srgb, #dc2626 9%, transparent);
        color: #b91c1c;
    }

    .result-row.miss span {
        color: #dc2626;
    }

    .cache-panel {
        min-width: 0;
        background: var(--brut-bg);
    }

    .cache-head,
    .cache-entry {
        display: grid;
        grid-template-columns: minmax(180px, 0.9fr) minmax(180px, 1fr) 72px;
        align-items: center;
        border-bottom: 1px solid var(--brut-rule);
    }

    .cache-head {
        background: var(--brut-bg-2);
        color: var(--brut-ink-3);
        font-size: 11px;
        text-transform: uppercase;
    }

    .cache-head div,
    .cache-entry > div,
    .cache-entry > code,
    .cache-entry > button {
        min-width: 0;
        border-right: 1px solid var(--brut-rule);
        padding: 12px 14px;
    }

    .cache-entry {
        min-height: 58px;
        color: var(--brut-ink);
        font-size: 12px;
        animation: slideIn 0.18s ease-out;
    }

    .cache-entry:nth-child(even) {
        background: color-mix(in srgb, var(--brut-bg-2) 42%, var(--brut-bg));
    }

    .cache-entry > div {
        display: flex;
        align-items: center;
        gap: 12px;
    }

    .cache-entry span {
        color: var(--brut-ink-3);
        font-size: 11px;
    }

    .cache-entry code {
        overflow: hidden;
        color: var(--brut-ink);
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .cache-entry button {
        display: grid;
        height: 100%;
        place-items: center;
        border: 0;
        border-right: 1px solid var(--brut-rule);
        background: transparent;
        color: var(--brut-ink-3);
        cursor: pointer;
    }

    .empty-state {
        display: grid;
        min-height: 260px;
        place-content: center;
        gap: 8px;
        padding: 32px;
        text-align: center;
    }

    .empty-state span {
        color: var(--brut-ink);
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
    }

    .empty-state p {
        margin: 0;
        color: var(--brut-ink-3);
        font-size: 12px;
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

    @media (max-width: 900px) {
        .demo-telemetry,
        .demo-foot {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .demo-frame {
            grid-template-columns: 1fr;
        }

        .operation-panel {
            border-right: 0;
            border-bottom: 1px solid var(--brut-rule);
        }
    }

    @media (max-width: 640px) {
        .operation-row,
        .set-controls,
        .get-controls,
        .cache-head,
        .cache-entry {
            grid-template-columns: 1fr;
        }

        .cache-head {
            display: none;
        }

        .cache-entry > div,
        .cache-entry > code,
        .cache-entry > button {
            border-right: 0;
        }

        .cache-entry > button {
            justify-content: start;
            border-top: 1px solid var(--brut-rule);
        }
    }
</style>
