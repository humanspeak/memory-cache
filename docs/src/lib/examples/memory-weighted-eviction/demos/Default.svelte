<script lang="ts">
    import { MemoryCache, type CacheStats } from '@humanspeak/memory-cache'
    import MousePointer from '@lucide/svelte/icons/mouse-pointer'
    import Plus from '@lucide/svelte/icons/plus'
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw'

    type ApiRecord = {
        label: string
        logicalWeight: number
    }

    type EntryDisplay = ApiRecord & { key: string }

    const defaultMaxWeight = 8
    const weightChoices = [1, 2, 4, 8]

    let evictionLog = $state<string[]>([])
    let maxWeight = $state(defaultMaxWeight)
    let selectedWeight = $state(4)
    let nextId = $state(4)
    let lastAction = $state('seeded 1 + 2 + 4 KiB responses')

    const initialCache = createSeededCache(defaultMaxWeight)
    let cache = $state(initialCache)
    let entries = $state(readEntries(initialCache))
    let stats = $state<CacheStats>(initialCache.getStats())

    let lruKey = $derived(entries[0]?.key ?? 'none')
    let mruKey = $derived(entries.at(-1)?.key ?? 'none')
    let capacityPercent = $derived(Math.min((stats.weight / maxWeight) * 100, 100))

    function createCache(limit: number) {
        return new MemoryCache<ApiRecord>({
            maxSize: 0,
            maxWeight: limit,
            sizeCalculation: (value) => value.logicalWeight,
            hooks: {
                onEvict: ({ key, value }) => {
                    const weight = value?.logicalWeight ?? 0
                    evictionLog = [
                        `${key} · ${weight} KiB`,
                        ...evictionLog.slice(0, 9)
                    ]
                }
            }
        })
    }

    function createSeededCache(limit: number) {
        const nextCache = createCache(limit)
        nextCache.set('api:1', { label: 'profile response', logicalWeight: 1 })
        nextCache.set('api:2', { label: 'search response', logicalWeight: 2 })
        nextCache.set('api:3', { label: 'feed response', logicalWeight: 4 })
        return nextCache
    }

    function readEntries(nextCache: MemoryCache<ApiRecord>): EntryDisplay[] {
        return nextCache.entries().map(([key, value]) => ({
            key,
            label: value?.label ?? '',
            logicalWeight: value?.logicalWeight ?? 0
        }))
    }

    function syncTelemetry() {
        entries = readEntries(cache)
        stats = cache.getStats()
    }

    function addEntry() {
        const key = `api:${nextId}`
        cache.set(key, {
            label: `response ${nextId}`,
            logicalWeight: selectedWeight
        })
        lastAction = `added ${key} at ${selectedWeight} KiB`
        nextId += 1
        syncTelemetry()
    }

    function accessEntry(key: string) {
        cache.get(key)
        lastAction = `accessed ${key}; moved to MRU`
        syncTelemetry()
    }

    function resetCache() {
        evictionLog = []
        cache = createSeededCache(maxWeight)
        nextId = 4
        lastAction = 'reset 1 + 2 + 4 KiB responses'
        syncTelemetry()
    }
</script>

<div class="demo-shell">
    <div class="demo-telemetry">
        <div>weight · <span>{stats.weight}/{maxWeight} KiB</span></div>
        <div>entries · <span>{stats.size}</span></div>
        <div>lru · <span>{lruKey}</span></div>
        <div>mru · <span>{mruKey}</span></div>
        <div>evictions · <span>{stats.evictions}</span></div>
        <button type="button" onclick={resetCache}>reset</button>
    </div>

    <div class="demo-frame">
        <section class="control-panel" aria-label="Weighted eviction controls">
            <div class="capacity-panel">
                <div class="capacity-copy">
                    <span>aggregate weight</span>
                    <strong>{stats.weight}<small> / {maxWeight} KiB</small></strong>
                    <p>user-defined logical payload cost, not measured heap memory</p>
                </div>
                <div class="weight-meter" aria-label={`Aggregate weight ${stats.weight} of ${maxWeight}`}>
                    <div class="weight-meter-fill" style={`width: ${capacityPercent}%`}></div>
                </div>
            </div>

            <div class="setting-row">
                <label for="max-weight-slider">max weight · <span>{maxWeight} KiB</span></label>
                <input
                    id="max-weight-slider"
                    type="range"
                    bind:value={maxWeight}
                    onchange={resetCache}
                    min="7"
                    max="16"
                />
                <small>changing the limit resets the seeded cache</small>
            </div>

            <fieldset class="weight-picker">
                <legend>next response weight</legend>
                <div>
                    {#each weightChoices as weight}
                        <button
                            type="button"
                            class:selected={selectedWeight === weight}
                            aria-pressed={selectedWeight === weight}
                            onclick={() => (selectedWeight = weight)}
                        >
                            {weight} KiB
                        </button>
                    {/each}
                </div>
            </fieldset>

            <div class="control-grid">
                <button type="button" onclick={addEntry}>
                    <Plus size={13} />
                    add response
                </button>
                <button type="button" onclick={resetCache}>
                    <RotateCcw size={13} />
                    reset
                </button>
            </div>

            <div class="eviction-panel">
                <div class="eviction-head">
                    <span>onEvict log</span>
                    <span>{evictionLog.length}</span>
                </div>
                <div class="eviction-list" aria-live="polite">
                    {#if evictionLog.length === 0}
                        <div class="empty-note">select 8 KiB and add to trigger multi-eviction</div>
                    {:else}
                        {#each evictionLog as log, index (`${log}-${index}`)}
                            <div>{log}</div>
                        {/each}
                    {/if}
                </div>
            </div>
        </section>

        <section class="cache-panel" aria-label="Cache entries from LRU to MRU">
            <div class="cache-head">
                <div>rank</div>
                <div>api response</div>
                <div>weight / state</div>
            </div>

            <div class="entry-list">
                {#if entries.length === 0}
                    <div class="empty-state">
                        <span>cache empty</span>
                        <p>add a response or reset the demo</p>
                    </div>
                {:else}
                    {#each entries as entry, index (entry.key)}
                        <button
                            type="button"
                            onclick={() => accessEntry(entry.key)}
                            class="cache-entry"
                            class:lru={index === 0}
                            class:mru={index === entries.length - 1}
                            aria-label={`Access ${entry.key}, ${entry.logicalWeight} KiB`}
                        >
                            <div class="rank">
                                <span>{String(index + 1).padStart(2, '0')}</span>
                                <small>{index === 0 ? 'next out' : 'order'}</small>
                            </div>
                            <code>
                                <strong>{entry.key}</strong>
                                <span>{entry.label}</span>
                            </code>
                            <div class="entry-state">
                                <strong>{entry.logicalWeight} KiB</strong>
                                <span>
                                    {index === 0 ? 'LRU' : index === entries.length - 1 ? 'MRU' : 'warm'}
                                    <MousePointer size={13} />
                                </span>
                            </div>
                        </button>
                    {/each}
                {/if}
            </div>

            <div class="action-strip" aria-live="polite">// {lastAction}</div>
        </section>
    </div>

    <div class="demo-foot">
        <div>policy · <span>weighted LRU</span></div>
        <div>maxSize · <span>0</span></div>
        <div>calculator · <span>logicalWeight</span></div>
        <div>next out · <span>{lruKey}</span></div>
        <div>mode · <span>live</span></div>
    </div>
</div>

<style>
    .demo-shell {
        display: flex;
        height: 590px;
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
        border: 0;
        border-right: 1px solid var(--brut-rule);
        padding: 8px 12px;
        overflow: hidden;
        background: transparent;
        color: inherit;
        font: inherit;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .demo-telemetry button {
        color: var(--brut-accent);
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
        grid-template-columns: minmax(310px, 0.82fr) minmax(430px, 1.18fr);
    }

    .control-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        border-right: 1px solid var(--brut-rule);
        background: color-mix(in srgb, var(--brut-bg-2) 58%, var(--brut-bg));
    }

    .capacity-panel,
    .setting-row,
    .weight-picker,
    .control-grid {
        border-bottom: 1px solid var(--brut-rule);
    }

    .capacity-panel {
        display: grid;
        gap: 16px;
        padding: 20px;
    }

    .capacity-copy > span,
    .setting-row label,
    .weight-picker legend,
    .eviction-head span:first-child {
        color: var(--brut-accent);
        font-size: 11px;
        text-transform: uppercase;
    }

    .capacity-copy strong {
        display: block;
        margin-top: 8px;
        font-size: 40px;
        line-height: 1;
    }

    .capacity-copy strong small {
        color: var(--brut-ink-3);
        font-size: 14px;
    }

    .capacity-copy p,
    .setting-row small {
        margin: 8px 0 0;
        color: var(--brut-ink-3);
        font-size: 10px;
        line-height: 1.4;
    }

    .weight-meter {
        height: 12px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        padding: 2px;
    }

    .weight-meter-fill {
        height: 100%;
        background: var(--brut-accent);
        transition: width 180ms ease;
    }

    .setting-row {
        display: grid;
        gap: 8px;
        padding: 14px 20px;
    }

    .setting-row label span {
        color: var(--brut-ink);
    }

    input[type='range'] {
        width: 100%;
        accent-color: var(--brut-accent);
    }

    .weight-picker {
        margin: 0;
        border-top: 0;
        border-right: 0;
        border-left: 0;
        padding: 12px 20px 16px;
    }

    .weight-picker div,
    .control-grid {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .weight-picker button,
    .control-grid button {
        min-height: 38px;
        border: 1px solid var(--brut-rule);
        border-right: 0;
        border-radius: 0;
        background: var(--brut-bg);
        color: var(--brut-ink-3);
        font: inherit;
        font-size: 11px;
        cursor: pointer;
    }

    .weight-picker button:last-child {
        border-right: 1px solid var(--brut-rule);
    }

    .weight-picker button.selected {
        background: var(--brut-accent);
        color: var(--brut-bg);
    }

    .control-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .control-grid button {
        display: inline-flex;
        min-height: 46px;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border-top: 0;
        border-bottom: 0;
        border-left: 0;
        color: var(--brut-accent);
    }

    .control-grid button:last-child {
        border-right: 0;
    }

    button:hover,
    button:focus-visible {
        background: color-mix(in srgb, var(--brut-accent) 14%, var(--brut-bg));
        outline: none;
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
        padding: 10px 14px;
    }

    .eviction-list {
        min-height: 0;
        flex: 1;
        overflow-y: auto;
    }

    .eviction-list div {
        border-bottom: 1px dashed var(--brut-rule);
        padding: 8px 14px;
        color: var(--brut-ink-3);
        font-size: 10px;
    }

    .eviction-list .empty-note {
        border: 0;
        line-height: 1.5;
    }

    .cache-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
    }

    .cache-head,
    .cache-entry {
        display: grid;
        grid-template-columns: 80px minmax(0, 1fr) 130px;
    }

    .cache-head {
        border-bottom: 1px solid var(--brut-rule);
        color: var(--brut-accent);
        font-size: 10px;
        text-transform: uppercase;
    }

    .cache-head div,
    .cache-entry > div,
    .cache-entry > code {
        min-width: 0;
        border-right: 1px solid var(--brut-rule);
        padding: 10px 12px;
    }

    .entry-list {
        min-height: 0;
        flex: 1;
        overflow-y: auto;
    }

    .cache-entry {
        width: 100%;
        border: 0;
        border-bottom: 1px solid var(--brut-rule);
        background: transparent;
        color: var(--brut-ink);
        font: inherit;
        text-align: left;
        cursor: pointer;
    }

    .cache-entry.lru {
        box-shadow: inset 3px 0 0 #dc2626;
    }

    .cache-entry.mru {
        box-shadow: inset -3px 0 0 var(--brut-accent);
    }

    .rank span,
    .rank small,
    .cache-entry code span,
    .entry-state span {
        display: block;
    }

    .rank small,
    .cache-entry code span,
    .entry-state span {
        margin-top: 4px;
        color: var(--brut-ink-3);
        font-size: 9px;
    }

    .cache-entry code strong {
        color: var(--brut-accent);
    }

    .entry-state span {
        display: flex;
        align-items: center;
        gap: 5px;
    }

    .action-strip {
        border-top: 1px solid var(--brut-rule);
        padding: 10px 14px;
        color: var(--brut-ink-3);
        font-size: 10px;
    }

    .empty-state {
        padding: 36px 24px;
        color: var(--brut-ink-3);
        text-align: center;
    }

    .empty-state p {
        margin: 8px 0 0;
        font-size: 10px;
    }

    @media (max-width: 800px) {
        .demo-shell {
            height: auto;
            min-height: 760px;
        }

        .demo-telemetry {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .demo-frame {
            grid-template-columns: 1fr;
        }

        .control-panel {
            border-right: 0;
            border-bottom: 1px solid var(--brut-rule);
        }

        .eviction-panel {
            min-height: 110px;
        }

        .cache-panel {
            min-height: 330px;
        }
    }

    @media (max-width: 540px) {
        .demo-telemetry,
        .demo-foot {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .cache-head,
        .cache-entry {
            grid-template-columns: 60px minmax(0, 1fr) 100px;
        }

        .cache-head div,
        .cache-entry > div,
        .cache-entry > code {
            padding: 9px 7px;
        }
    }
</style>
