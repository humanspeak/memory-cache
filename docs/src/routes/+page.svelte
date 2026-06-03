<script lang="ts">
    import Header from '$lib/components/general/Header.svelte'
    import Footer from '$lib/components/general/Footer.svelte'
    import { getBreadcrumbContext } from '@humanspeak/docs-kit'
    import { MemoryCache } from '@humanspeak/memory-cache'
    import {
        AnimatePresence,
        MotionButton,
        MotionSpan,
        type MotionTransition
    } from '@humanspeak/svelte-motion'
    import ArrowRight from '@lucide/svelte/icons/arrow-right'
    import AtSign from '@lucide/svelte/icons/at-sign'
    import Clock from '@lucide/svelte/icons/clock'
    import Feather from '@lucide/svelte/icons/feather'
    import FileCode from '@lucide/svelte/icons/file-code'
    import Layers from '@lucide/svelte/icons/layers'
    import Zap from '@lucide/svelte/icons/zap'
    import type { Component } from 'svelte'
    import type { PageData } from './$types'

    const { data }: { data: PageData } = $props()
    const packageStats = $derived(data.packageStats)
    const breadcrumbContext = getBreadcrumbContext()

    if (breadcrumbContext) {
        breadcrumbContext.breadcrumbs = []
    }

    const PKG_NAME = $derived(packageStats.name)
    const PKG_VERSION = $derived(packageStats.version)
    const TARBALL_KB = $derived(
        packageStats.tarballBytes !== null
            ? Math.round(packageStats.tarballBytes / 102.4) / 10
            : null
    )
    const DEP_COUNT = 0
    const installCmd = $derived(`npm i ${PKG_NAME}`)
    let copied = $state(false)
    const demoCapacity = 6
    const demoTtl = 300_000
    const demoSpring: MotionTransition = {
        type: 'spring',
        stiffness: 360,
        damping: 24,
        mass: 0.8
    }

    type DemoEntry = {
        key: string
        value: string
        rank: number
    }

    function createDemoCache() {
        const nextCache = new MemoryCache<string>({ maxSize: demoCapacity, ttl: demoTtl })
        nextCache.set('user:1', 'Ada')
        nextCache.set('user:2', 'Grace')
        nextCache.set('config', 'prod')
        nextCache.set('session', 'warm')
        return nextCache
    }

    function readDemoEntries(nextCache: MemoryCache<string>) {
        return nextCache.entries().map(([key, value], index) => ({
            key,
            value: value ?? 'undefined',
            rank: index + 1
        }))
    }

    const initialDemoCache = createDemoCache()
    let demoCache = $state(initialDemoCache)
    let demoEntries = $state(readDemoEntries(initialDemoCache))
    let demoHits = $state(0)
    let demoMisses = $state(0)
    let demoSets = $state(0)
    let demoEvictions = $state(0)
    let demoNextId = $state(3)
    let demoLastOp = $state<'seed' | 'hit' | 'miss' | 'set' | 'evict'>('seed')
    let demoLastKey = $state('session')
    let demoLastValue = $state('warm')
    let demoLastEvicted = $state('none')

    let demoRequests = $derived(demoHits + demoMisses)
    let demoHitRate = $derived(demoRequests > 0 ? Math.round((demoHits / demoRequests) * 100) : 100)
    let demoLruKey = $derived(demoEntries[0]?.key ?? 'none')
    let demoMruKey = $derived(demoEntries.at(-1)?.key ?? 'none')
    let demoStatus = $derived(demoLastOp === 'miss' ? 'miss' : 'ready')

    function syncDemoEntries() {
        demoEntries = readDemoEntries(demoCache)
    }

    function runDemoHit() {
        const key = demoEntries.at(-1)?.key ?? demoEntries[0]?.key
        if (!key) return

        const value = demoCache.get(key)
        demoHits += 1
        demoLastOp = 'hit'
        demoLastKey = key
        demoLastValue = value ?? 'undefined'
        syncDemoEntries()
    }

    function runDemoMiss() {
        const key = `ghost:${demoMisses + 1}`
        demoCache.get(key)
        demoMisses += 1
        demoLastOp = 'miss'
        demoLastKey = key
        demoLastValue = 'undefined'
        syncDemoEntries()
    }

    function runDemoSet() {
        const key = `item:${demoNextId}`
        const value = `value ${demoNextId}`
        const isNewKey = !demoCache.has(key)

        if (isNewKey && demoCache.size() >= demoCapacity) {
            demoLastEvicted = demoCache.keys()[0] ?? 'none'
            demoEvictions += 1
            demoLastOp = 'evict'
        } else {
            demoLastOp = 'set'
        }

        demoCache.set(key, value)
        demoSets += 1
        demoNextId += 1
        demoLastKey = key
        demoLastValue = value
        syncDemoEntries()
    }

    function resetDemo() {
        demoCache = createDemoCache()
        demoEntries = readDemoEntries(demoCache)
        demoHits = 0
        demoMisses = 0
        demoSets = 0
        demoEvictions = 0
        demoNextId = 3
        demoLastOp = 'seed'
        demoLastKey = 'session'
        demoLastValue = 'warm'
        demoLastEvicted = 'none'
    }

    interface StatItem {
        k: string
        v: string
        sup?: string
        n: string
        ac?: boolean
    }

    const stats: StatItem[] = $derived([
        { k: 'exports', v: '3', n: 'MemoryCache · cached · types', ac: true },
        { k: 'policies', v: '2', n: 'TTL · LRU eviction' },
        { k: 'hooks', v: '6', n: 'hit · miss · set · evict · expire · delete', ac: true },
        {
            k: 'tarball',
            v: TARBALL_KB !== null ? String(TARBALL_KB) : '—',
            sup: TARBALL_KB !== null ? 'kB' : undefined,
            n: 'packed (npm gz)'
        },
        { k: 'runtime deps', v: String(DEP_COUNT), n: 'zero-dependency runtime' },
        { k: 'licence', v: 'MIT', n: 'on GitHub' }
    ])

    const copyInstall = async () => {
        if (typeof navigator === 'undefined') return
        try {
            await navigator.clipboard?.writeText(installCmd)
        } catch {
            /* clipboard blocked - fail quiet */
        }

        copied = true
        setTimeout(() => (copied = false), 1500)
    }

    const features: { title: string; description: string; icon: Component }[] = [
        {
            title: 'Lightning Fast',
            description:
                'In-memory storage with O(1) lookups. No network latency, no disk I/O—just pure speed.',
            icon: Zap
        },
        {
            title: 'TTL Expiration',
            description:
                'Set time-to-live for cache entries. Expired items are automatically cleaned up.',
            icon: Clock
        },
        {
            title: 'LRU Eviction',
            description:
                'Smart eviction policy removes least recently used items when the cache reaches max size.',
            icon: Layers
        },
        {
            title: '@cached Decorator',
            description:
                'Automatic method-level caching with a simple decorator. No boilerplate required.',
            icon: AtSign
        },
        {
            title: 'TypeScript First',
            description: 'Full type safety with generics. Your cached values are properly typed.',
            icon: FileCode
        },
        {
            title: 'Zero Dependencies',
            description: 'Lightweight and self-contained. No bloat, no supply chain risks.',
            icon: Feather
        }
    ]
</script>

<div class="brut-wrap flex min-h-svh flex-col">
    <Header />
    <div class="relative flex flex-1 flex-col overflow-hidden">
        <main class="brut">
            <div class="brut-coord" aria-hidden="true">
                {#each Array.from({ length: 12 }, (_, i) => i) as i (i)}
                    <div>{String(i + 1).padStart(2, '0')}</div>
                {/each}
            </div>

            <section class="brut-hero">
                <div class="corner tr">FIG-001 · MASTHEAD</div>
                <aside class="meta">
                    <div><span class="k">pkg</span> · <span class="v">{PKG_NAME}</span></div>
                    <div><span class="k">version</span> · <span class="v">{PKG_VERSION}</span></div>
                    <div>
                        <span class="k">tarball</span> ·
                        <span class="v">{TARBALL_KB !== null ? `${TARBALL_KB} kB gz` : '—'}</span>
                    </div>
                    <div><span class="k">deps</span> · <span class="v">{DEP_COUNT}</span></div>
                    <div><span class="k">licence</span> · <span class="v">MIT</span></div>
                    <hr />
                    <div><span class="k">ttl</span> · <span class="v accent">expiration</span></div>
                    <div><span class="k">lru</span> · <span class="v">eviction</span></div>
                    <div><span class="k">decorator</span> · <span class="v">@cached</span></div>
                    <hr />
                    <div class="k">// scroll for full spec</div>
                </aside>
                <div class="hero-body">
                    <h1>
                        <span class="mark" aria-hidden="true">
                            <span>memory</span><span class="slash">/</span><span>cache</span><span
                                class="end">.</span
                            >
                        </span>
                        <span class="sr-only"
                            >Memory Cache - a lightweight TypeScript in-memory caching library</span
                        >
                    </h1>
                    <p class="sub">
                        <b>Zero-dependency caching for TypeScript.</b> In-memory
                        <code>MemoryCache</code> storage with TTL expiration, LRU eviction, wildcard
                        pattern deletion, and a powerful <code>@cached</code> decorator for method-level
                        memoization. Built for API responses, sessions, computed values, and fast local
                        data reuse.
                    </p>
                    <div class="cta-row">
                        <a class="pri" href="/docs/getting-started">get started ↗</a>
                        <a href="/docs/api/memory-cache">api reference</a>
                        <a href="/examples">examples</a>
                        <MotionButton
                            class="inst"
                            type="button"
                            onclick={copyInstall}
                            aria-label="Copy install command"
                            whileTap={{ scale: 0.97 }}
                            whileHover={{ scale: 1.01 }}
                            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
                        >
                            <span class="inst-prompt">$</span>
                            <span class="inst-cmd">npm i <span class="pkg">{PKG_NAME}</span></span>
                            <span class="inst-copy {copied ? 'is-copied' : ''}">
                                <AnimatePresence initial={false}>
                                    <MotionSpan
                                        key={copied ? 'copied' : 'idle'}
                                        class="inst-copy-label"
                                        initial={{ opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -6 }}
                                        transition={{ duration: 0.18, ease: 'easeOut' }}
                                    >
                                        {copied ? '✓ copied' : 'copy'}
                                    </MotionSpan>
                                </AnimatePresence>
                            </span>
                        </MotionButton>
                    </div>
                </div>
                <div class="corner bl">FIG-001</div>
                <div class="corner br">SHEET 01 / 03</div>
            </section>

            <section class="brut-stats">
                {#each stats as s, i (s.k)}
                    <div class="s {s.ac ? 'ac' : ''}" data-idx="/0{i + 1}">
                        <div class="k">{s.k}</div>
                        <div class="v">
                            <span class="v-num">{s.v}</span>{#if s.sup}<span class="v-unit"
                                    >{s.sup}</span
                                >{/if}
                        </div>
                        <div class="note">{s.n}</div>
                    </div>
                {/each}
            </section>

            <section class="brut-demo">
                <div class="lede">
                    <div class="k">FIG-002 / CACHE</div>
                    <h2>cache with <span>live telemetry</span>.</h2>
                    <p>
                        Drive a bounded <code>MemoryCache</code> and watch hits, misses, LRU order, and
                        eviction pressure update against the same in-memory store.
                    </p>
                </div>
                <div class="panel">
                    <div class="bar">
                        <span><span class="lbl">file</span> · <span class="v">cache.ts</span></span>
                        <span
                            ><span class="lbl">hit</span>
                            <span class="v">{demoHitRate}%</span></span
                        >
                        <span
                            ><span class="lbl">size</span>
                            <span class="v">{demoEntries.length}/{demoCapacity}</span></span
                        >
                        <span
                            ><span class="lbl">last</span> <span class="v">{demoLastOp}</span></span
                        >
                        <span class="live">
                            {#if demoStatus === 'miss'}● MISS{:else}○ READY{/if}
                        </span>
                        <button class="ctrl" type="button" onclick={resetDemo}>↻ reset store</button
                        >
                    </div>
                    <div class="stage">
                        <section class="operation-panel" aria-label="Cache demo controls">
                            <div class="operation-card">
                                <span>operation</span>
                                <strong>{demoLastOp}</strong>
                                <p>
                                    last key · <code>{demoLastKey}</code>
                                </p>
                            </div>

                            <div class="operation-grid">
                                <MotionButton
                                    type="button"
                                    onclick={runDemoHit}
                                    whileTap={{ scale: 0.96 }}
                                    transition={demoSpring}
                                >
                                    get hit
                                </MotionButton>
                                <MotionButton
                                    type="button"
                                    onclick={runDemoMiss}
                                    whileTap={{ scale: 0.96 }}
                                    transition={demoSpring}
                                >
                                    get miss
                                </MotionButton>
                                <MotionButton
                                    type="button"
                                    onclick={runDemoSet}
                                    whileTap={{ scale: 0.96 }}
                                    transition={demoSpring}
                                >
                                    set item
                                </MotionButton>
                            </div>

                            <div class="result-card" class:miss={demoLastOp === 'miss'}>
                                <span>result</span>
                                <strong>{demoLastValue}</strong>
                            </div>
                        </section>

                        <section
                            class="cache-panel"
                            aria-label="Cache entries ordered from LRU to MRU"
                        >
                            <div class="cache-head">
                                <div>rank</div>
                                <div>key</div>
                                <div>value</div>
                                <div>state</div>
                            </div>

                            <div class="cache-list">
                                {#each demoEntries as entry (entry.key)}
                                    <div
                                        class="cache-row {entry.key === demoLruKey
                                            ? 'lru'
                                            : ''} {entry.key === demoMruKey ? 'mru' : ''}"
                                    >
                                        <div>{String(entry.rank).padStart(2, '0')}</div>
                                        <code>{entry.key}</code>
                                        <code>{entry.value}</code>
                                        <div>
                                            {#if entry.key === demoLruKey}
                                                LRU
                                            {:else if entry.key === demoMruKey}
                                                MRU
                                            {:else}
                                                warm
                                            {/if}
                                        </div>
                                    </div>
                                {/each}

                                {#each Array.from({ length: demoCapacity - demoEntries.length }, (_, i) => i) as slot (slot)}
                                    <div class="cache-row empty">
                                        <div>
                                            {String(demoEntries.length + slot + 1).padStart(2, '0')}
                                        </div>
                                        <code>empty</code>
                                        <code>slot</code>
                                        <div>open</div>
                                    </div>
                                {/each}
                            </div>
                        </section>
                    </div>
                    <div class="footer">
                        <div>hits · <span class="v">{demoHits}</span></div>
                        <div>
                            misses · <span class="v {demoLastOp === 'miss' ? 'danger' : ''}"
                                >{demoMisses}</span
                            >
                        </div>
                        <div>evictions · <span class="v">{demoEvictions}</span></div>
                        <div>evicted · <span class="v">{demoLastEvicted}</span></div>
                        <div>status · <span class="v accent">{demoStatus}</span></div>
                    </div>
                </div>
            </section>
        </main>

        <!-- Features Section -->
        <section class="relative px-6 py-10">
            <div class="container mx-auto max-w-7xl">
                <div class="mb-16 text-center">
                    <h2
                        class="mb-4 bg-gradient-to-r from-brand-500 to-brand-600 bg-clip-text text-4xl font-bold text-transparent md:text-5xl"
                    >
                        Why Memory Cache
                    </h2>
                    <p class="mx-auto max-w-2xl text-lg text-muted-foreground">
                        Simple, fast, and reliable caching for your TypeScript applications.
                    </p>
                </div>
                <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {#each features as feature}
                        {@const FeatureIcon = feature.icon}
                        <div
                            class="group relative overflow-hidden rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/50 hover:shadow-lg hover:shadow-brand-500/10"
                        >
                            <div
                                class="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            ></div>
                            <div class="relative z-10">
                                <div
                                    class="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-600 text-white"
                                >
                                    <FeatureIcon size={20} />
                                </div>
                                <h3
                                    class="mb-2 text-xl font-semibold transition-colors group-hover:text-brand-600"
                                >
                                    {feature.title}
                                </h3>
                                <p class="text-sm leading-relaxed text-muted-foreground">
                                    {feature.description}
                                </p>
                            </div>
                            <div
                                class="absolute top-0 right-0 h-20 w-20 rounded-bl-full bg-gradient-to-bl from-brand-500/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                            ></div>
                        </div>
                    {/each}
                </div>
            </div>
        </section>

        <!-- Code Example Section -->
        <section class="relative px-6 py-10">
            <div class="container mx-auto max-w-4xl">
                <div class="mb-8 text-center">
                    <h2 class="mb-4 text-3xl font-bold text-foreground">Quick Example</h2>
                    <p class="text-muted-foreground">
                        Get started in seconds with simple, intuitive APIs.
                    </p>
                </div>
                <div class="overflow-hidden rounded-xl border border-border">
                    <!-- Toolbar -->
                    <div
                        class="flex items-center justify-between border-b border-border bg-card/80 px-4 py-2"
                    >
                        <div class="flex items-center gap-3">
                            <div class="flex gap-1.5">
                                <div class="h-3 w-3 rounded-full bg-red-400/60"></div>
                                <div class="h-3 w-3 rounded-full bg-yellow-400/60"></div>
                                <div class="h-3 w-3 rounded-full bg-green-400/60"></div>
                            </div>
                            <span class="text-xs font-medium text-muted-foreground">example.ts</span
                            >
                        </div>
                        <a
                            href="/docs/getting-started"
                            class="inline-flex items-center gap-1 text-xs font-medium text-brand-600 transition-colors hover:text-brand-700"
                        >
                            Get Started
                            <ArrowRight size={12} />
                        </a>
                    </div>
                    <!-- Code -->
                    <div class="bg-code-block-background p-6 font-mono text-sm">
                        <pre class="text-code-block-foreground"><code
                                ><span class="text-brand-500">import</span
                                > {'{'} MemoryCache, cached {'}'} <span class="text-brand-500"
                                    >from</span
                                > <span class="text-green-500">'@humanspeak/memory-cache'</span>

<span class="text-muted-foreground">// Create a cache with 5 minute TTL and max 100 items</span>
<span class="text-brand-500">const</span> cache = <span class="text-brand-500">new</span
                                > MemoryCache&lt;<span class="text-yellow-500">User</span>&gt;({'{'}
    ttl: <span class="text-orange-500">300000</span>,
    maxSize: <span class="text-orange-500">100</span>
{'}'})

<span class="text-muted-foreground">// Simple get/set operations</span>
cache.set(<span class="text-green-500">'user:123'</span>, {'{'} name: <span class="text-green-500"
                                    >'Alice'</span
                                > {'}'})
<span class="text-brand-500">const</span> user = cache.get(<span class="text-green-500"
                                    >'user:123'</span
                                >)

<span class="text-muted-foreground">// Or use the @cached decorator</span>
<span class="text-brand-500">class</span> <span class="text-yellow-500">UserService</span> {'{'}
    <span class="text-purple-500">@cached</span>({'{'} ttl: <span class="text-orange-500"
                                    >60000</span
                                > {'}'})
    <span class="text-brand-500">async</span> getUser(id: <span class="text-yellow-500">string</span
                                >) {'{'}
        <span class="text-brand-500">return</span> <span class="text-brand-500">await</span
                                > fetchUserFromDb(id)
    {'}'}
{'}'}</code
                            ></pre>
                    </div>
                </div>
            </div>
        </section>
    </div>
    <Footer />
</div>

<style>
    .brut-coord {
        display: grid;
        grid-template-columns: repeat(12, 1fr);
        border-bottom: 1px solid var(--brut-rule);
        color: var(--brut-ink-3);
        font-size: 10px;
        letter-spacing: 0.14em;
    }

    .brut-coord div {
        border-right: 1px solid var(--brut-rule);
        padding: 6px 8px;
    }

    .brut-coord div:last-child {
        border-right: 0;
    }

    .brut-hero {
        position: relative;
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 24px;
        border-bottom: 1px solid var(--brut-rule);
        padding: 80px 24px 32px;
    }

    .brut-hero .meta {
        display: flex;
        margin: 0;
        flex-direction: column;
        gap: 8px;
        color: var(--brut-ink-3);
        font-size: 11px;
    }

    .brut-hero .meta .k {
        color: var(--brut-ink-3);
    }

    .brut-hero .meta .v {
        color: var(--brut-ink);
    }

    .brut-hero .meta .v.accent {
        color: var(--brut-accent);
    }

    .brut-hero .meta hr {
        margin: 8px 0;
        border: 0;
        border-top: 1px dashed var(--brut-rule);
    }

    .brut-hero h1 {
        margin: 0;
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: clamp(56px, 11vw, 152px);
        font-weight: 500;
        line-height: 0.88;
        letter-spacing: -0.06em;
        text-transform: lowercase;
    }

    .brut-hero h1 .slash {
        color: var(--brut-accent);
    }

    .brut-hero h1 .end {
        color: var(--brut-ink-3);
    }

    .brut-hero .sub {
        max-width: 720px;
        margin: 28px 0 0;
        color: var(--brut-ink-2);
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 17px;
        line-height: 1.5;
        letter-spacing: -0.01em;
    }

    .brut-hero .sub b {
        color: var(--brut-ink);
        font-weight: 600;
    }

    .brut-hero .sub code {
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        color: var(--brut-ink);
        padding: 0 5px;
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 14.5px;
    }

    .brut-hero .cta-row {
        display: flex;
        width: fit-content;
        max-width: 100%;
        align-items: stretch;
        flex-wrap: wrap;
        gap: 0;
        margin-top: 28px;
    }

    .brut-hero .cta-row > * {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        color: var(--brut-ink);
        padding: 10px 14px;
        font-family: inherit;
        font-size: 13px;
        text-decoration: none;
        cursor: pointer;
        transition:
            background 0.15s,
            border-color 0.15s;
    }

    .brut-hero .cta-row > * + * {
        margin-left: -1px;
    }

    .brut-hero .cta-row > *:hover {
        z-index: 2;
    }

    .brut-hero .cta-row .pri {
        border-color: var(--brut-accent);
        background: var(--brut-accent);
        color: var(--brut-accent-ink);
        font-weight: 600;
    }

    .brut-hero .cta-row .pri:hover {
        border-color: var(--brut-accent-hover);
        background: var(--brut-accent-hover);
    }

    .brut-hero .cta-row a:not(.pri):hover,
    .brut-hero .cta-row :global(.inst:hover) {
        border-color: var(--brut-rule-2);
        background: var(--brut-bg-2);
    }

    .brut-hero .cta-row :global(.inst) {
        position: relative;
        z-index: 1;
        display: inline-flex;
        align-items: center;
        gap: 10px;
        margin-left: -1px;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        color: var(--brut-ink-2);
        padding: 10px 18px;
        font-family: inherit;
        font-size: 13px;
        cursor: pointer;
        transition:
            background 0.15s,
            border-color 0.15s;
    }

    .brut-hero .cta-row :global(.inst:hover) {
        z-index: 2;
    }

    .brut-hero .cta-row :global(.inst .inst-prompt) {
        color: var(--brut-ink-3);
    }

    .brut-hero .cta-row :global(.inst .inst-cmd) {
        color: var(--brut-ink-2);
    }

    .brut-hero .cta-row :global(.inst .inst-cmd .pkg) {
        color: var(--brut-ink);
    }

    .brut-hero .cta-row :global(.inst .inst-copy) {
        display: inline-grid;
        width: 84px;
        height: 20px;
        align-items: center;
        justify-items: center;
        margin-left: 4px;
        overflow: hidden;
        border: 1px solid var(--brut-rule);
        color: var(--brut-accent);
        padding: 2px 8px;
        font-size: 10.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        transition:
            border-color 0.2s,
            background 0.2s;
    }

    .brut-hero .cta-row :global(.inst .inst-copy.is-copied) {
        border-color: var(--brut-accent);
        background: var(--brut-accent-soft);
    }

    .brut-hero .cta-row :global(.inst .inst-copy-label) {
        grid-area: 1 / 1;
        display: inline-block;
        white-space: nowrap;
        will-change: transform, opacity;
    }

    .brut-hero .corner {
        position: absolute;
        color: var(--brut-ink-3);
        font-size: 10px;
        letter-spacing: 0.14em;
    }

    .brut-hero .corner.tr {
        top: 12px;
        right: 24px;
    }

    .brut-hero .corner.bl {
        bottom: 12px;
        left: 24px;
    }

    .brut-hero .corner.br {
        right: 24px;
        bottom: 12px;
    }

    .brut-stats {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        border-bottom: 1px solid var(--brut-rule);
    }

    .brut-stats .s {
        position: relative;
        display: flex;
        min-height: 160px;
        flex-direction: column;
        justify-content: space-between;
        border-right: 1px solid var(--brut-rule);
        padding: 28px 24px;
    }

    .brut-stats .s:last-child {
        border-right: 0;
    }

    .brut-stats .s .k {
        color: var(--brut-ink-3);
        font-size: 10.5px;
        letter-spacing: 0.14em;
    }

    .brut-stats .s .v {
        display: inline-flex;
        align-items: baseline;
        gap: 4px;
        color: var(--brut-ink);
        font-size: 64px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: -0.04em;
        white-space: nowrap;
    }

    .brut-stats .s .v-num {
        line-height: 1;
    }

    .brut-stats .s .v-unit {
        color: inherit;
        font-size: 22px;
        font-weight: 500;
        line-height: 1;
        letter-spacing: 0;
    }

    .brut-stats .s .note {
        color: var(--brut-ink-2);
        font-size: 11px;
    }

    .brut-stats .s.ac .v {
        color: var(--brut-accent);
    }

    .brut-stats .s::after {
        position: absolute;
        top: 12px;
        right: 14px;
        color: var(--brut-ink-3);
        font-size: 10px;
        content: attr(data-idx);
    }

    .brut-demo {
        display: grid;
        grid-template-columns: minmax(260px, 0.22fr) minmax(0, 1fr);
        gap: 24px;
        border-bottom: 1px solid var(--brut-rule);
        padding: 28px 24px;
    }

    .brut-demo .lede .k {
        color: var(--brut-ink-3);
        font-size: 10.5px;
        letter-spacing: 0.14em;
        text-transform: uppercase;
    }

    .brut-demo .lede h2 {
        margin: 20px 0 18px;
        color: var(--brut-ink);
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: clamp(30px, 3vw, 42px);
        font-weight: 700;
        line-height: 1.05;
        letter-spacing: 0;
        overflow-wrap: anywhere;
    }

    .brut-demo .lede h2 span {
        color: var(--brut-accent);
    }

    .brut-demo .lede p {
        margin: 0;
        color: var(--brut-ink-2);
        font-family: 'Inter Variable', 'Inter', system-ui, sans-serif;
        font-size: 15px;
        line-height: 1.5;
    }

    .brut-demo .lede code {
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        color: var(--brut-ink);
        padding: 0 4px;
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-size: 13px;
    }

    .brut-demo .panel {
        min-width: 0;
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
    }

    .brut-demo .panel .bar {
        display: flex;
        align-items: center;
        gap: 18px;
        flex-wrap: wrap;
        border-bottom: 1px solid var(--brut-rule);
        background: var(--brut-bg-2);
        color: var(--brut-ink-2);
        padding: 8px 14px;
        font-size: 11px;
    }

    .brut-demo .panel .bar .lbl {
        color: var(--brut-ink-3);
    }

    .brut-demo .panel .bar .v {
        color: var(--brut-ink);
    }

    .brut-demo .panel .bar .live {
        margin-left: auto;
        color: var(--brut-accent);
    }

    .brut-demo .panel .ctrl {
        border: 1px solid var(--brut-rule);
        background: transparent;
        color: var(--brut-ink-2);
        padding: 4px 10px;
        font-family: inherit;
        font-size: 11px;
        cursor: pointer;
    }

    .brut-demo .panel .ctrl:hover {
        background: var(--brut-bg);
        color: var(--brut-ink);
    }

    .brut-demo .panel .stage {
        display: grid;
        grid-template-columns: minmax(280px, 0.78fr) minmax(420px, 1.22fr);
        min-height: 404px;
        align-items: stretch;
        overflow: hidden;
        background: var(--brut-bg);
    }

    .brut-demo .panel .operation-panel {
        display: flex;
        min-width: 0;
        flex-direction: column;
        border-right: 1px solid var(--brut-rule);
        background: color-mix(in srgb, var(--brut-bg-2) 55%, var(--brut-bg));
    }

    .brut-demo .panel .operation-card,
    .brut-demo .panel .result-card {
        display: grid;
        gap: 10px;
        border-bottom: 1px solid var(--brut-rule);
        padding: 22px;
    }

    .brut-demo .panel .operation-card span,
    .brut-demo .panel .result-card span {
        color: var(--brut-accent);
        font-size: 11px;
        text-transform: uppercase;
    }

    .brut-demo .panel .operation-card strong,
    .brut-demo .panel .result-card strong {
        overflow: hidden;
        color: var(--brut-ink);
        font-size: 40px;
        line-height: 1;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .brut-demo .panel .operation-card p {
        margin: 0;
        color: var(--brut-ink-2);
        font-size: 12px;
    }

    .brut-demo .panel .operation-card code {
        border: 1px solid var(--brut-rule);
        background: var(--brut-bg);
        color: var(--brut-ink);
        padding: 1px 5px;
    }

    .brut-demo .panel .result-card {
        margin-top: auto;
        border-top: 1px solid var(--brut-rule);
        border-bottom: 0;
    }

    .brut-demo .panel .result-card.miss strong {
        color: #dc2626;
    }

    .brut-demo .panel .operation-grid {
        display: grid;
        grid-template-columns: 1fr;
        border-bottom: 1px solid var(--brut-rule);
    }

    .brut-demo .panel .operation-grid :global(button) {
        min-height: 54px;
        border: 0;
        border-bottom: 1px solid var(--brut-rule);
        border-radius: 0;
        background: var(--brut-bg);
        color: var(--brut-accent);
        padding: 10px 14px;
        font-family: inherit;
        font-size: 13px;
        text-align: left;
        cursor: pointer;
    }

    .brut-demo .panel .operation-grid :global(button:last-child) {
        border-bottom: 0;
    }

    .brut-demo .panel .operation-grid :global(button:hover) {
        background: var(--brut-bg-2);
    }

    .brut-demo .panel .cache-panel {
        display: flex;
        min-width: 0;
        min-height: 0;
        flex-direction: column;
    }

    .brut-demo .panel .cache-head,
    .brut-demo .panel :global(.cache-row),
    .brut-demo .panel .cache-row {
        display: grid;
        grid-template-columns: 82px minmax(120px, 1fr) minmax(120px, 1fr) 100px;
        align-items: center;
        border-bottom: 1px solid var(--brut-rule);
    }

    .brut-demo .panel .cache-head {
        background: var(--brut-bg-2);
        color: var(--brut-ink-3);
        font-size: 11px;
        text-transform: uppercase;
    }

    .brut-demo .panel .cache-head div,
    .brut-demo .panel :global(.cache-row > div),
    .brut-demo .panel :global(.cache-row > code),
    .brut-demo .panel .cache-row > div,
    .brut-demo .panel .cache-row > code {
        min-width: 0;
        overflow: hidden;
        border-right: 1px solid var(--brut-rule);
        padding: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .brut-demo .panel .cache-head div:last-child,
    .brut-demo .panel :global(.cache-row > div:last-child),
    .brut-demo .panel .cache-row > div:last-child {
        border-right: 0;
    }

    .brut-demo .panel .cache-list {
        display: grid;
        grid-auto-rows: 58px;
        min-height: 0;
        flex: 1;
        overflow: auto;
    }

    .brut-demo .panel :global(.cache-row),
    .brut-demo .panel .cache-row {
        min-height: 58px;
        background: var(--brut-bg);
        color: var(--brut-ink);
        font-size: 12px;
    }

    .brut-demo .panel :global(.cache-row:nth-child(even)),
    .brut-demo .panel .cache-row:nth-child(even) {
        background: color-mix(in srgb, var(--brut-bg-2) 42%, var(--brut-bg));
    }

    .brut-demo .panel :global(.cache-row.lru) {
        background: color-mix(in srgb, #dc2626 8%, var(--brut-bg));
    }

    .brut-demo .panel :global(.cache-row.mru) {
        background: color-mix(in srgb, var(--brut-accent) 9%, var(--brut-bg));
    }

    .brut-demo .panel .cache-row.empty {
        color: var(--brut-ink-3);
        opacity: 0.75;
    }

    .brut-demo .panel :global(.cache-row code),
    .brut-demo .panel .cache-row code {
        color: var(--brut-ink);
        font-family: 'JetBrains Mono Variable', 'JetBrains Mono', ui-monospace, monospace;
        font-weight: 700;
    }

    .brut-demo .panel .footer {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        border-top: 1px solid var(--brut-rule);
        color: var(--brut-ink-2);
        font-size: 11px;
    }

    .brut-demo .panel .footer > div {
        min-width: 0;
        overflow: hidden;
        border-right: 1px solid var(--brut-rule);
        padding: 8px 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .brut-demo .panel .footer > div:last-child {
        border-right: 0;
    }

    .brut-demo .panel .footer .v {
        color: var(--brut-ink);
    }

    .brut-demo .panel .footer .v.accent {
        color: var(--brut-accent);
    }

    .brut-demo .panel .footer .v.danger {
        color: #dc2626;
    }

    @media (max-width: 720px) {
        .brut-coord {
            display: none;
        }

        .brut-hero,
        .brut-demo {
            grid-template-columns: 1fr;
            padding: 56px 16px 32px;
        }

        .brut-stats {
            grid-template-columns: repeat(2, 1fr);
        }

        .brut-stats .s {
            min-height: 130px;
            padding: 20px 16px;
        }

        .brut-stats .s .v {
            font-size: 44px;
        }

        .brut-demo .panel .stage {
            grid-template-columns: 1fr;
            min-height: 0;
        }

        .brut-demo .panel .bar .live {
            margin-left: 0;
        }

        .brut-demo .panel .operation-panel {
            border-right: 0;
            border-bottom: 1px solid var(--brut-rule);
        }

        .brut-demo .panel .operation-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .brut-demo .panel .operation-grid :global(button) {
            border-right: 1px solid var(--brut-rule);
            border-bottom: 0;
            padding-right: 8px;
            padding-left: 8px;
            text-align: center;
        }

        .brut-demo .panel .operation-grid :global(button:last-child) {
            border-right: 0;
        }

        .brut-demo .panel .cache-head,
        .brut-demo .panel :global(.cache-row),
        .brut-demo .panel .cache-row {
            grid-template-columns: 58px minmax(92px, 1fr) minmax(92px, 1fr) 74px;
        }

        .brut-demo .panel .cache-head div,
        .brut-demo .panel :global(.cache-row > div),
        .brut-demo .panel :global(.cache-row > code),
        .brut-demo .panel .cache-row > div,
        .brut-demo .panel .cache-row > code {
            padding: 11px 8px;
        }

        .brut-demo .panel .footer {
            grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .brut-demo .panel .footer > div {
            border-bottom: 1px solid var(--brut-rule);
        }
    }
</style>
