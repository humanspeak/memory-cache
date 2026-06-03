<script lang="ts">
    import {
        MemoryCache,
        type OnDeleteContext,
        type OnEvictContext,
        type OnHitContext,
        type OnMissContext,
        type OnSetContext
    } from '@humanspeak/memory-cache'
    import RotateCcw from '@lucide/svelte/icons/rotate-ccw'
    import Zap from '@lucide/svelte/icons/zap'
    import { onMount } from 'svelte'

    const capacity = 5
    const ttl = 30_000

    type OperationType = 'SET' | 'HIT' | 'MISS' | 'DELETE' | 'EVICT'
    type Operation = { type: OperationType; key: string; timestamp: number }

    let hits = $state(0)
    let misses = $state(0)
    let sets = $state(0)
    let deletes = $state(0)
    let evictions = $state(0)
    let operationLog = $state<Operation[]>([])
    let cache = $state<MemoryCache<string> | null>(null)
    let tick = $state(0)

    let requests = $derived(hits + misses)
    let totalOperations = $derived(hits + misses + sets + deletes + evictions)
    let hitRate = $derived(requests > 0 ? (hits / requests) * 100 : 0)
    let cacheSize = $derived(cache?.size() ?? 0)
    let recentOperation = $derived(operationLog[0]?.type.toLowerCase() ?? 'seeded')

    function logOperation(type: OperationType, key: string) {
        operationLog = [{ type, key, timestamp: Date.now() }, ...operationLog.slice(0, 19)]
    }

    function initCache() {
        cache = new MemoryCache<string>({
            maxSize: capacity,
            ttl,
            hooks: {
                onSet: (ctx: OnSetContext<string>) => {
                    sets += 1
                    logOperation('SET', ctx.key)
                },
                onHit: (ctx: OnHitContext<string>) => {
                    hits += 1
                    logOperation('HIT', ctx.key)
                },
                onMiss: (ctx: OnMissContext) => {
                    misses += 1
                    logOperation('MISS', ctx.key)
                },
                onDelete: (ctx: OnDeleteContext<string>) => {
                    deletes += 1
                    logOperation('DELETE', ctx.key)
                },
                onEvict: (ctx: OnEvictContext<string>) => {
                    evictions += 1
                    logOperation('EVICT', ctx.key)
                }
            }
        })

        cache.set('user:1', 'Alice')
        cache.set('user:2', 'Bob')
        cache.set('config', 'production')
    }

    function simulateHit() {
        if (!cache) return
        const keys = cache.keys()
        if (!keys.length) return

        const key = keys[Math.floor(Math.random() * keys.length)]
        cache.get(key)
    }

    function simulateMiss() {
        cache?.get(`missing:${Date.now().toString(36)}`)
    }

    function simulateSet() {
        if (!cache) return

        const id = Math.random().toString(36).slice(2, 6)
        cache.set(`item:${id}`, `value ${id}`)
    }

    function simulateDelete() {
        if (!cache) return

        const keys = cache.keys()
        if (keys.length) cache.delete(keys[0])
    }

    function simulateBurst() {
        if (!cache) return

        for (let i = 0; i < 10; i += 1) {
            setTimeout(() => {
                const rand = Math.random()
                if (rand < 0.6) simulateHit()
                else if (rand < 0.8) simulateMiss()
                else if (rand < 0.95) simulateSet()
                else simulateDelete()
            }, i * 100)
        }
    }

    function resetStats() {
        hits = 0
        misses = 0
        sets = 0
        deletes = 0
        evictions = 0
        operationLog = []
        initCache()
    }

    function formatTime(timestamp: number): string {
        const seconds = Math.floor((Date.now() - timestamp) / 1000)
        if (seconds < 1) return 'now'
        if (seconds < 60) return `${seconds}s`
        return `${Math.floor(seconds / 60)}m`
    }

    function operationClass(type: OperationType): string {
        return `op-${type.toLowerCase()}`
    }

    onMount(() => {
        initCache()
    })

    $effect(() => {
        const interval = setInterval(() => {
            tick += 1
        }, 1000)

        return () => clearInterval(interval)
    })
</script>

<div class="demo-shell">
    <div class="demo-telemetry">
        <div>requests · <span>{requests}</span></div>
        <div>hit rate · <span>{hitRate.toFixed(1)}%</span></div>
        <div>size · <span>{cacheSize}/{capacity}</span></div>
        <div>ttl · <span>{ttl / 1000}s</span></div>
        <div>last · <span>{recentOperation}</span></div>
        <button type="button" onclick={resetStats}>reset</button>
    </div>

    <div class="demo-frame">
        <section class="metrics-panel" aria-label="Cache statistics">
            <div class="rate-band">
                <div class="rate-copy">
                    <span>hit rate</span>
                    <strong>{hitRate.toFixed(1)}%</strong>
                    <p>{hits} hits / {requests} reads</p>
                </div>
                <div
                    class="rate-meter"
                    aria-label="Hit rate meter"
                    style={`--rate: ${hitRate.toFixed(1)}%`}
                >
                    <span></span>
                </div>
            </div>

            <div class="metric-grid">
                <div class="metric hit">
                    <span>hits</span>
                    <strong>{hits}</strong>
                </div>
                <div class="metric miss">
                    <span>misses</span>
                    <strong>{misses}</strong>
                </div>
                <div class="metric set">
                    <span>sets</span>
                    <strong>{sets}</strong>
                </div>
                <div class="metric delete">
                    <span>deletes</span>
                    <strong>{deletes}</strong>
                </div>
                <div class="metric evict">
                    <span>evictions</span>
                    <strong>{evictions}</strong>
                </div>
                <div class="metric total">
                    <span>ops</span>
                    <strong>{totalOperations}</strong>
                </div>
            </div>

            <div class="control-grid">
                <button type="button" onclick={simulateHit}>hit</button>
                <button type="button" onclick={simulateMiss}>miss</button>
                <button type="button" onclick={simulateSet}>set</button>
                <button type="button" onclick={simulateDelete}>delete</button>
                <button type="button" class="burst" onclick={simulateBurst}>
                    <Zap size={13} />
                    burst
                </button>
                <button type="button" class="icon" onclick={resetStats} title="Reset statistics">
                    <RotateCcw size={13} />
                </button>
            </div>
        </section>

        <section class="log-panel" aria-label="Operation log">
            <div class="log-head">
                <div>event</div>
                <div>key</div>
                <div>age</div>
            </div>

            <div class="log-list">
                {#if operationLog.length === 0}
                    <div class="empty-state">
                        <span>no operations</span>
                        <p>run traffic to populate the hook log</p>
                    </div>
                {:else}
                    {#each operationLog as op, index (op.timestamp + index)}
                        <div class={`log-entry ${operationClass(op.type)}`}>
                            <div>{op.type}</div>
                            <code>{op.key}</code>
                            <span>
                                {#key tick}
                                    {formatTime(op.timestamp)}
                                {/key}
                            </span>
                        </div>
                    {/each}
                {/if}
            </div>
        </section>
    </div>

    <div class="demo-foot">
        <div>hooks · <span>set hit miss delete evict</span></div>
        <div>capacity · <span>{capacity}</span></div>
        <div>entries · <span>{cacheSize}</span></div>
        <div>events · <span>{operationLog.length}</span></div>
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
        grid-template-columns: minmax(320px, 0.9fr) minmax(380px, 1.1fr);
        background: var(--brut-bg);
    }

    .metrics-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        border-right: 1px solid var(--brut-rule);
        background: color-mix(in srgb, var(--brut-bg-2) 58%, var(--brut-bg));
    }

    .rate-band {
        display: grid;
        grid-template-columns: minmax(0, 0.8fr) minmax(120px, 0.5fr);
        gap: 20px;
        align-items: end;
        border-bottom: 1px solid var(--brut-rule);
        padding: 24px 22px;
    }

    .rate-copy span {
        color: var(--brut-accent);
        font-size: 11px;
        text-transform: uppercase;
    }

    .rate-copy strong {
        display: block;
        margin-top: 10px;
        color: var(--brut-ink);
        font-size: 42px;
        line-height: 0.95;
    }

    .rate-copy p {
        margin: 10px 0 0;
        color: var(--brut-ink-3);
        font-size: 11px;
    }

    .rate-meter {
        display: flex;
        height: 96px;
        align-items: end;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        padding: 6px;
    }

    .rate-meter span {
        display: block;
        width: 100%;
        height: var(--rate);
        min-height: 3px;
        background: var(--brut-accent);
        transition: height 0.2s ease;
    }

    .metric-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border-bottom: 1px solid var(--brut-rule);
    }

    .metric {
        min-width: 0;
        border-right: 1px solid var(--brut-rule);
        border-bottom: 1px solid var(--brut-rule);
        padding: 16px 18px;
    }

    .metric span {
        display: block;
        color: var(--brut-ink-3);
        font-size: 11px;
        text-transform: uppercase;
    }

    .metric strong {
        display: block;
        margin-top: 10px;
        color: var(--brut-ink);
        font-size: 26px;
        line-height: 1;
    }

    .metric.hit strong {
        color: #15803d;
    }

    .metric.miss strong {
        color: #dc2626;
    }

    .metric.set strong {
        color: #2563eb;
    }

    .metric.delete strong {
        color: #c2410c;
    }

    .metric.evict strong {
        color: #7c3aed;
    }

    .control-grid {
        display: grid;
        margin-top: auto;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        border-top: 1px solid var(--brut-rule);
    }

    .control-grid button {
        display: inline-flex;
        min-height: 46px;
        align-items: center;
        justify-content: center;
        gap: 6px;
        border: 0;
        border-right: 1px solid var(--brut-rule);
        border-bottom: 1px solid var(--brut-rule);
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

    .control-grid .burst {
        grid-column: span 2;
    }

    .log-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
        background: var(--brut-bg);
    }

    .log-list {
        min-height: 0;
        flex: 1;
        overflow-y: auto;
        overscroll-behavior: contain;
    }

    .log-head,
    .log-entry {
        display: grid;
        grid-template-columns: 108px minmax(180px, 1fr) 80px;
        align-items: center;
        border-bottom: 1px solid var(--brut-rule);
    }

    .log-head {
        background: var(--brut-bg-2);
        color: var(--brut-ink-3);
        font-size: 11px;
        text-transform: uppercase;
    }

    .log-head div,
    .log-entry div,
    .log-entry code,
    .log-entry span {
        min-width: 0;
        border-right: 1px solid var(--brut-rule);
        padding: 12px 14px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .log-entry {
        min-height: 48px;
        color: var(--brut-ink);
        font-size: 12px;
        animation: slideIn 0.15s ease-out;
    }

    .log-entry:nth-child(even) {
        background: color-mix(in srgb, var(--brut-bg-2) 42%, var(--brut-bg));
    }

    .log-entry div {
        color: var(--brut-accent);
        font-weight: 700;
    }

    .log-entry.op-hit div {
        color: #15803d;
    }

    .log-entry.op-miss div {
        color: #dc2626;
    }

    .log-entry.op-set div {
        color: #2563eb;
    }

    .log-entry.op-delete div {
        color: #c2410c;
    }

    .log-entry.op-evict div {
        color: #7c3aed;
    }

    .log-entry span {
        color: var(--brut-ink-3);
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

        .metrics-panel {
            border-right: 0;
            border-bottom: 1px solid var(--brut-rule);
        }
    }

    @media (max-width: 640px) {
        .rate-band,
        .metric-grid,
        .control-grid,
        .log-head,
        .log-entry {
            grid-template-columns: 1fr;
        }

        .log-head {
            display: none;
        }

        .log-entry div,
        .log-entry code,
        .log-entry span {
            border-right: 0;
        }
    }
</style>
