<script lang="ts">
    import { MemoryCache } from '@humanspeak/memory-cache'
    import MousePointer from '@lucide/svelte/icons/mouse-pointer'
    import Plus from '@lucide/svelte/icons/plus'
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw'

    const defaultMaxSize = 5

    type EntryDisplay = {
        key: string
        value: string
        accessOrder: number
    }

    const initialCache = createSeededCache(defaultMaxSize)

    let maxSize = $state(defaultMaxSize)
    let cache = $state(initialCache)
    let entries = $state(readEntries(initialCache))
    let evictionLog = $state<string[]>([])
    let nextId = $state(4)
    let accessCounter = $state(0)

    let capacityRatio = $derived(entries.length / maxSize)
    let lruKey = $derived(entries[0]?.key ?? 'none')
    let mruKey = $derived(entries.at(-1)?.key ?? 'none')

    function createCache(size: number) {
        return new MemoryCache<string>({ maxSize: size })
    }

    function createSeededCache(size: number) {
        const nextCache = createCache(size)
        for (let i = 1; i <= 3; i += 1) {
            nextCache.set(`item:${i}`, `value ${i}`)
        }
        return nextCache
    }

    function readEntries(nextCache: MemoryCache<string>) {
        return nextCache.entries().map(([key, value], index) => ({
            key,
            value: value ?? '',
            accessOrder: index
        }))
    }

    function updateEntries() {
        entries = readEntries(cache)
    }

    function addEntry() {
        const key = `item:${nextId}`
        const value = `value ${nextId}`

        if (cache.size() >= maxSize) {
            const nextEviction = cache.keys()[0]
            evictionLog = [`${nextEviction} -> ${key}`, ...evictionLog.slice(0, 11)]
        }

        cache.set(key, value)
        nextId += 1
        updateEntries()
    }

    function accessEntry(key: string) {
        cache.get(key)
        accessCounter += 1
        updateEntries()
    }

    function resetCache() {
        cache = createSeededCache(maxSize)
        entries = readEntries(cache)
        evictionLog = []
        nextId = 4
        accessCounter = 0
    }

    function updateMaxSize() {
        cache = createCache(maxSize)
        resetCache()
    }

</script>

<div class="demo-shell">
    <div class="demo-telemetry">
        <div>size · <span>{entries.length}/{maxSize}</span></div>
        <div>lru · <span>{lruKey}</span></div>
        <div>mru · <span>{mruKey}</span></div>
        <div>accesses · <span>{accessCounter}</span></div>
        <div>evictions · <span>{evictionLog.length}</span></div>
        <button type="button" onclick={resetCache}>reset</button>
    </div>

    <div class="demo-frame">
        <section class="control-panel" aria-label="LRU controls">
            <div class="capacity-panel">
                <div class="capacity-copy">
                    <span>capacity</span>
                    <strong>{entries.length}/{maxSize}</strong>
                    <p>full cache evicts the least recently used key</p>
                </div>
                <div
                    class="capacity-meter"
                    aria-label="Capacity meter"
                    style={`--capacity: ${(capacityRatio * 100).toFixed(1)}%`}
                    class:full={entries.length >= maxSize}
                >
                    <span></span>
                </div>
            </div>

            <div class="setting-row">
                <label for="max-size-slider">max size · <span>{maxSize}</span></label>
                <input
                    id="max-size-slider"
                    type="range"
                    bind:value={maxSize}
                    onchange={updateMaxSize}
                    min="3"
                    max="10"
                />
            </div>

            <div class="control-grid">
                <button type="button" onclick={addEntry}>
                    <Plus size={13} />
                    add entry
                </button>
                <button type="button" onclick={resetCache}>
                    <RotateCcw size={13} />
                    reset
                </button>
            </div>

            <div class="eviction-panel">
                <div class="eviction-head">
                    <span>eviction log</span>
                    <span>{evictionLog.length}</span>
                </div>

                <div class="eviction-list">
                    {#if evictionLog.length === 0}
                        <div class="empty-note">fill the cache, then add one more item</div>
                    {:else}
                        {#each evictionLog as log, index (`${log}-${index}`)}
                            <div>{log}</div>
                        {/each}
                    {/if}
                </div>
            </div>
        </section>

        <section class="cache-panel" aria-label="Cache entries in LRU order">
            <div class="cache-head">
                <div>rank</div>
                <div>key</div>
                <div>state</div>
            </div>

            <div class="entry-list">
                {#if entries.length === 0}
                    <div class="empty-state">
                        <span>cache empty</span>
                        <p>reset to seed the LRU list</p>
                    </div>
                {:else}
                    {#each entries as entry, index (entry.key)}
                        <button
                            type="button"
                            onclick={() => accessEntry(entry.key)}
                            class="lru-entry"
                            class:lru={index === 0}
                            class:mru={index === entries.length - 1}
                        >
                            <div>
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                <small>{index === 0 ? 'next out' : 'order'}</small>
                            </div>
                            <code>
                                <strong>{entry.key}</strong>
                                <span>{entry.value}</span>
                            </code>
                            <div class="entry-state">
                                {#if index === 0}
                                    LRU
                                {:else if index === entries.length - 1}
                                    MRU
                                {:else}
                                    warm
                                {/if}
                                <MousePointer size={13} />
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>
        </section>
    </div>

    <div class="demo-foot">
        <div>policy · <span>least recently used</span></div>
        <div>capacity · <span>{maxSize}</span></div>
        <div>entries · <span>{entries.length}</span></div>
        <div>next eviction · <span>{lruKey}</span></div>
        <div>mode · <span>live</span></div>
    </div>
</div>

<style>
    .demo-shell {
        display: flex;
        height: 560px;
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

    .demo-frame {
        display: grid;
        min-height: 0;
        flex: 1;
        grid-template-columns: minmax(300px, 0.75fr) minmax(420px, 1.25fr);
        background: var(--brut-bg);
    }

    .control-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        border-right: 1px solid var(--brut-rule);
        background: color-mix(in srgb, var(--brut-bg-2) 58%, var(--brut-bg));
    }

    .capacity-panel {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(110px, 0.45fr);
        gap: 18px;
        align-items: end;
        border-bottom: 1px solid var(--brut-rule);
        padding: 24px 22px;
    }

    .capacity-copy span,
    .eviction-head span:first-child,
    .setting-row label {
        color: var(--brut-accent);
        font-size: 11px;
        text-transform: uppercase;
    }

    .capacity-copy strong {
        display: block;
        margin-top: 10px;
        color: var(--brut-ink);
        font-size: 42px;
        line-height: 0.95;
    }

    .capacity-copy p {
        margin: 10px 0 0;
        color: var(--brut-ink-3);
        font-size: 11px;
        line-height: 1.45;
    }

    .capacity-meter {
        display: flex;
        height: 96px;
        align-items: end;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        padding: 6px;
    }

    .capacity-meter span {
        display: block;
        width: 100%;
        height: var(--capacity);
        min-height: 3px;
        background: var(--brut-accent);
        transition: height 0.2s ease;
    }

    .capacity-meter.full span {
        background: #dc2626;
    }

    .setting-row {
        display: grid;
        gap: 12px;
        border-bottom: 1px solid var(--brut-rule);
        padding: 18px 22px;
    }

    .setting-row label span {
        color: var(--brut-ink);
    }

    input[type='range'] {
        width: 100%;
        accent-color: var(--brut-accent);
    }

    .control-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        border-bottom: 1px solid var(--brut-rule);
    }

    .control-grid button {
        display: inline-flex;
        min-height: 48px;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border: 0;
        border-right: 1px solid var(--brut-rule);
        border-radius: 0;
        background: var(--brut-bg);
        color: var(--brut-accent);
        font: inherit;
        font-size: 12px;
        cursor: pointer;
    }

    .control-grid button:hover,
    .lru-entry:hover {
        background: color-mix(in srgb, var(--brut-accent) 12%, transparent);
    }

    .eviction-panel {
        display: flex;
        min-height: 0;
        flex: 1;
        flex-direction: column;
    }

    .eviction-head {
        display: flex;
        justify-content: space-between;
        border-bottom: 1px solid var(--brut-rule);
        padding: 12px 14px;
    }

    .eviction-head span:last-child {
        color: var(--brut-ink);
        font-size: 11px;
    }

    .eviction-list {
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
    }

    .eviction-list div,
    .empty-note {
        border-bottom: 1px solid var(--brut-rule);
        padding: 10px 14px;
        color: #dc2626;
        font-size: 11px;
    }

    .empty-note {
        color: var(--brut-ink-3);
    }

    .cache-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        background: var(--brut-bg);
    }

    .cache-head,
    .lru-entry {
        display: grid;
        grid-template-columns: 120px minmax(180px, 1fr) 120px;
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
    .lru-entry > div,
    .lru-entry > code {
        min-width: 0;
        border-right: 1px solid var(--brut-rule);
        padding: 12px 14px;
    }

    .entry-list {
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
    }

    .lru-entry {
        width: 100%;
        min-height: 68px;
        border-top: 0;
        border-right: 0;
        border-left: 0;
        border-radius: 0;
        background: transparent;
        color: var(--brut-ink);
        font: inherit;
        text-align: left;
        cursor: pointer;
        animation: slideIn 0.16s ease-out;
    }

    .lru-entry:nth-child(even) {
        background: color-mix(in srgb, var(--brut-bg-2) 42%, var(--brut-bg));
    }

    .lru-entry.lru {
        background: color-mix(in srgb, #dc2626 8%, var(--brut-bg));
    }

    .lru-entry.mru {
        background: color-mix(in srgb, var(--brut-accent) 8%, var(--brut-bg));
    }

    .lru-entry span,
    .lru-entry small {
        display: block;
        color: var(--brut-ink-3);
        font-size: 11px;
    }

    .lru-entry code strong,
    .lru-entry code span {
        display: block;
    }

    .lru-entry code strong {
        color: var(--brut-ink);
        font-size: 13px;
    }

    .entry-state {
        display: inline-flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        color: var(--brut-accent);
        font-size: 12px;
    }

    .lru-entry.lru .entry-state {
        color: #dc2626;
    }

    .empty-state {
        display: grid;
        min-height: 320px;
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

        .control-panel {
            border-right: 0;
            border-bottom: 1px solid var(--brut-rule);
        }
    }

    @media (max-width: 640px) {
        .capacity-panel,
        .control-grid,
        .cache-head,
        .lru-entry {
            grid-template-columns: 1fr;
        }

        .cache-head {
            display: none;
        }

        .lru-entry > div,
        .lru-entry > code {
            border-right: 0;
        }
    }
</style>
