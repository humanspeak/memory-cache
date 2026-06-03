<script lang="ts">
    import { MemoryCache } from '@humanspeak/memory-cache'
    import { motion, type MotionTransition } from '@humanspeak/svelte-motion'
    import Clock from '@lucide/svelte/icons/clock'
    import Plus from '@lucide/svelte/icons/plus'
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
    import Shuffle from '@lucide/svelte/icons/shuffle'

    type CachedItem = { value: string; createdAt: number }
    type EntryDisplay = {
        key: string
        value: string
        createdAt: number
        remainingMs: number
        remainingPercent: number
    }

    const defaultTtl = 10
    const maxSize = 20
    const ttlSpring: MotionTransition = {
        type: 'spring',
        stiffness: 180,
        damping: 24,
        mass: 0.7
    }

    const initialCache = createSeededCache(defaultTtl)

    let customTtl = $state(defaultTtl)
    let cache = $state(initialCache)
    let entries = $state(readEntries(initialCache, defaultTtl))
    let inputKey = $state('')
    let inputValue = $state('')
    let expiredCount = $state(0)
    let additions = $state(3)

    let ttlMs = $derived(customTtl * 1000)
    let shortestRemaining = $derived(
        entries.length ? Math.min(...entries.map((entry) => entry.remainingMs)) : 0
    )
    let meterScale = $derived((entries[0]?.remainingPercent ?? 0) / 100)
    let nextExpiration = $derived(entries[0]?.key ?? 'none')

    function createCache(ttlSeconds: number) {
        return new MemoryCache<CachedItem>({ ttl: ttlSeconds * 1000, maxSize })
    }

    function createSeededCache(ttlSeconds: number) {
        const now = Date.now()
        const nextCache = createCache(ttlSeconds)
        nextCache.set('session:abc', { value: 'user session data', createdAt: now })
        nextCache.set('token:xyz', { value: 'auth token', createdAt: now - 3000 })
        nextCache.set('temp:123', { value: 'temporary data', createdAt: now - 7000 })
        return nextCache
    }

    function readEntries(nextCache: MemoryCache<CachedItem>, ttlSeconds: number) {
        const now = Date.now()
        const nextTtlMs = ttlSeconds * 1000

        return nextCache
            .entries()
            .map(([key, data]) => {
                if (!data) return null

                const elapsed = now - data.createdAt
                const remainingMs = Math.max(0, nextTtlMs - elapsed)
                const remainingPercent = (remainingMs / nextTtlMs) * 100

                return {
                    key,
                    value: data.value,
                    createdAt: data.createdAt,
                    remainingMs,
                    remainingPercent
                }
            })
            .filter((entry): entry is EntryDisplay => entry !== null && entry.remainingMs > 0)
            .sort((a, b) => a.remainingMs - b.remainingMs)
    }

    function updateEntries() {
        entries = readEntries(cache, customTtl)
    }

    function handleAdd() {
        if (!inputKey.trim()) return

        const key = inputKey.trim()
        const value = inputValue.trim() || `value ${Date.now().toString(36)}`
        cache.set(key, { value, createdAt: Date.now() })
        additions += 1
        updateEntries()

        inputKey = ''
        inputValue = ''
    }

    function addRandomEntry() {
        const id = Math.random().toString(36).slice(2, 8)
        cache.set(`item:${id}`, { value: `random ${id}`, createdAt: Date.now() })
        additions += 1
        updateEntries()
    }

    function resetCache() {
        cache = createSeededCache(customTtl)
        entries = readEntries(cache, customTtl)
        expiredCount = 0
        additions = 3
        inputKey = ''
        inputValue = ''
    }

    function updateTtl() {
        resetCache()
    }

    function formatTime(ms: number): string {
        const seconds = Math.ceil(ms / 1000)
        return `${seconds}s`
    }

    function expiryClass(percent: number): 'fresh' | 'warn' | 'danger' {
        if (percent > 60) return 'fresh'
        if (percent > 30) return 'warn'
        return 'danger'
    }

    $effect(() => {
        const interval = setInterval(() => {
            const previousCount = entries.length
            updateEntries()
            const newCount = entries.length

            if (newCount < previousCount) {
                expiredCount += previousCount - newCount
            }
        }, 100)

        return () => clearInterval(interval)
    })
</script>

<div class="demo-shell">
    <div class="demo-telemetry">
        <div>active · <span>{entries.length}</span></div>
        <div>ttl · <span>{customTtl}s</span></div>
        <div>next · <span>{nextExpiration}</span></div>
        <div>remaining · <span>{shortestRemaining ? formatTime(shortestRemaining) : 'none'}</span></div>
        <div>expired · <span>{expiredCount}</span></div>
        <button type="button" onclick={resetCache}>reset</button>
    </div>

    <div class="demo-frame">
        <section class="control-panel" aria-label="TTL controls">
            <div class="ttl-panel">
                <div class="ttl-copy">
                    <span>time to live</span>
                    <strong>{customTtl}s</strong>
                    <p>entries disappear when their countdown reaches zero</p>
                </div>
                <div
                    class="ttl-meter"
                    aria-label="Next expiration meter"
                    class:danger={entries[0] && entries[0].remainingPercent <= 30}
                >
                    <motion.div
                        class="ttl-meter-fill"
                        initial={false}
                        animate={{ scaleY: meterScale }}
                        transition={ttlSpring}
                    />
                </div>
            </div>

            <div class="setting-row">
                <label for="ttl-slider">ttl · <span>{customTtl}s</span></label>
                <input
                    id="ttl-slider"
                    type="range"
                    bind:value={customTtl}
                    onchange={updateTtl}
                    min="3"
                    max="30"
                />
            </div>

            <div class="input-grid">
                <input id="ttl-key" type="text" bind:value={inputKey} placeholder="key" />
                <input id="ttl-value" type="text" bind:value={inputValue} placeholder="value" />
            </div>

            <div class="control-grid">
                <button type="button" onclick={handleAdd}>
                    <Plus size={13} />
                    add
                </button>
                <button type="button" onclick={addRandomEntry}>
                    <Shuffle size={13} />
                    random
                </button>
                <button type="button" onclick={resetCache}>
                    <RotateCcw size={13} />
                    reset
                </button>
            </div>

            <div class="stat-grid">
                <div>
                    <span>created</span>
                    <strong>{additions}</strong>
                </div>
                <div>
                    <span>expired</span>
                    <strong>{expiredCount}</strong>
                </div>
            </div>
        </section>

        <section class="entries-panel" aria-label="TTL entries">
            <div class="entry-head">
                <div>key</div>
                <div>value</div>
                <div>ttl</div>
            </div>

            <div class="entry-list">
                {#if entries.length === 0}
                    <div class="empty-state">
                        <Clock size={22} />
                        <span>no active entries</span>
                        <p>add an entry or reset the cache</p>
                    </div>
                {:else}
                    {#each entries as entry (entry.key)}
                        <div class={`ttl-entry ${expiryClass(entry.remainingPercent)}`}>
                            <code>
                                <strong>{entry.key}</strong>
                                <span>{new Date(entry.createdAt).toLocaleTimeString()}</span>
                            </code>
                            <div>{entry.value}</div>
                            <div class="ttl-cell">
                                <strong>{formatTime(entry.remainingMs)}</strong>
                                <span style={`--remaining: ${entry.remainingPercent.toFixed(1)}%`}></span>
                            </div>
                        </div>
                    {/each}
                {/if}
            </div>
        </section>
    </div>

    <div class="demo-foot">
        <div>policy · <span>time to live</span></div>
        <div>ttl · <span>{customTtl}s</span></div>
        <div>max size · <span>{maxSize}</span></div>
        <div>entries · <span>{entries.length}</span></div>
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
        grid-template-columns: minmax(300px, 0.78fr) minmax(420px, 1.22fr);
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

    .ttl-panel {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(110px, 0.45fr);
        gap: 18px;
        align-items: end;
        border-bottom: 1px solid var(--brut-rule);
        padding: 24px 22px;
    }

    .ttl-copy span,
    .setting-row label,
    .stat-grid span {
        color: var(--brut-accent);
        font-size: 11px;
        text-transform: uppercase;
    }

    .ttl-copy strong {
        display: block;
        margin-top: 10px;
        color: var(--brut-ink);
        font-size: 42px;
        line-height: 0.95;
    }

    .ttl-copy p {
        margin: 10px 0 0;
        color: var(--brut-ink-3);
        font-size: 11px;
        line-height: 1.45;
    }

    .ttl-meter {
        display: flex;
        height: 96px;
        align-items: end;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        padding: 6px;
    }

    .ttl-meter :global(.ttl-meter-fill) {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 3px;
        background: var(--brut-accent);
        transform-origin: bottom;
        will-change: transform;
    }

    .ttl-meter.danger :global(.ttl-meter-fill) {
        background: #dc2626;
    }

    .setting-row,
    .input-grid,
    .control-grid,
    .stat-grid {
        border-bottom: 1px solid var(--brut-rule);
    }

    .setting-row {
        display: grid;
        gap: 12px;
        padding: 18px 22px;
    }

    .setting-row label span {
        color: var(--brut-ink);
    }

    input {
        min-width: 0;
        border: 1px solid var(--brut-rule);
        border-radius: 0;
        background: var(--brut-bg);
        color: var(--brut-ink);
        font: inherit;
        font-size: 12px;
        outline: none;
    }

    input[type='range'] {
        width: 100%;
        accent-color: var(--brut-accent);
    }

    input[type='text'] {
        padding: 10px 12px;
    }

    input::placeholder {
        color: var(--brut-ink-3);
    }

    input:focus {
        border-color: var(--brut-accent);
    }

    .input-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        padding: 14px 22px;
    }

    .control-grid,
    .stat-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
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

    .control-grid button:hover {
        background: color-mix(in srgb, var(--brut-accent) 12%, transparent);
    }

    .stat-grid {
        margin-top: auto;
    }

    .stat-grid div {
        min-width: 0;
        border-right: 1px solid var(--brut-rule);
        padding: 14px 18px;
    }

    .stat-grid strong {
        display: block;
        margin-top: 8px;
        color: var(--brut-ink);
        font-size: 24px;
    }

    .entries-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        background: var(--brut-bg);
    }

    .entry-head,
    .ttl-entry {
        display: grid;
        grid-template-columns: minmax(180px, 0.9fr) minmax(180px, 1fr) 120px;
        align-items: center;
        border-bottom: 1px solid var(--brut-rule);
    }

    .entry-head {
        background: var(--brut-bg-2);
        color: var(--brut-ink-3);
        font-size: 11px;
        text-transform: uppercase;
    }

    .entry-head div,
    .ttl-entry code,
    .ttl-entry > div {
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

    .ttl-entry {
        min-height: 64px;
        color: var(--brut-ink);
        font-size: 12px;
        animation: slideIn 0.16s ease-out;
    }

    .ttl-entry:nth-child(even) {
        background: color-mix(in srgb, var(--brut-bg-2) 42%, var(--brut-bg));
    }

    .ttl-entry.warn {
        background: color-mix(in srgb, #facc15 9%, var(--brut-bg));
    }

    .ttl-entry.danger {
        background: color-mix(in srgb, #dc2626 8%, var(--brut-bg));
    }

    .ttl-entry code strong,
    .ttl-entry code span {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .ttl-entry code strong {
        color: var(--brut-ink);
        font-size: 13px;
    }

    .ttl-entry code span {
        color: var(--brut-ink-3);
        font-size: 11px;
    }

    .ttl-cell strong {
        display: block;
        color: var(--brut-accent);
        font-size: 18px;
    }

    .ttl-entry.warn .ttl-cell strong {
        color: #ca8a04;
    }

    .ttl-entry.danger .ttl-cell strong {
        color: #dc2626;
    }

    .ttl-cell span {
        display: block;
        height: 3px;
        width: var(--remaining);
        margin-top: 8px;
        background: currentColor;
    }

    .empty-state {
        display: grid;
        min-height: 320px;
        place-content: center;
        gap: 8px;
        padding: 32px;
        color: var(--brut-ink-3);
        text-align: center;
    }

    .empty-state :global(svg) {
        margin: 0 auto 4px;
        color: var(--brut-accent);
    }

    .empty-state span {
        color: var(--brut-ink);
        font-size: 14px;
        font-weight: 700;
        text-transform: uppercase;
    }

    .empty-state p {
        margin: 0;
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
        .ttl-panel,
        .input-grid,
        .control-grid,
        .stat-grid,
        .entry-head,
        .ttl-entry {
            grid-template-columns: 1fr;
        }

        .entry-head {
            display: none;
        }

        .ttl-entry code,
        .ttl-entry > div {
            border-right: 0;
        }
    }
</style>
