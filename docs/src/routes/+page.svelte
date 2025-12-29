<script lang="ts">
    import { Database, Zap, Clock, Trash2, Code, Package } from 'lucide-svelte'
</script>

<div class="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
    <!-- Hero Section -->
    <header class="relative overflow-hidden">
        <div class="absolute inset-0 bg-gradient-to-br from-primary-500/10 via-transparent to-primary-600/10"></div>
        <div class="relative mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8">
            <div class="text-center">
                <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                    <span class="bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        @humanspeak/memory-cache
                    </span>
                </h1>
                <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                    A lightweight, zero-dependency in-memory cache for TypeScript and JavaScript with
                    TTL expiration, LRU-style eviction, wildcard pattern deletion, and a powerful
                    <code class="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm">@cached</code>
                    decorator for method-level memoization.
                </p>
                <div class="mt-10 flex items-center justify-center gap-x-6">
                    <a
                        href="/docs/getting-started"
                        class="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
                    >
                        Get Started
                    </a>
                    <a
                        href="https://github.com/humanspeak/memory-cache"
                        class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        View on GitHub <span aria-hidden="true">→</span>
                    </a>
                </div>

                <!-- Install command -->
                <div class="mt-10 flex justify-center">
                    <div class="bg-gray-900 dark:bg-gray-800 rounded-lg px-6 py-3 font-mono text-sm text-gray-100 shadow-lg">
                        <span class="text-gray-500">$</span> npm install @humanspeak/memory-cache
                    </div>
                </div>
            </div>
        </div>
    </header>

    <!-- Features Section -->
    <section class="py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-2xl text-center">
                <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Everything you need for caching
                </h2>
                <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                    A complete caching solution with all the features you'd expect, and zero dependencies.
                </p>
            </div>

            <div class="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
                <dl class="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                <Clock class="h-6 w-6 text-white" />
                            </div>
                            TTL Expiration
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                            <p class="flex-auto">
                                Automatic cache entry expiration with configurable time-to-live.
                                Set entries to expire after a specific duration.
                            </p>
                        </dd>
                    </div>

                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                <Database class="h-6 w-6 text-white" />
                            </div>
                            Size-Based Eviction
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                            <p class="flex-auto">
                                LRU-style eviction when the cache reaches its maximum size.
                                Oldest entries are automatically removed to make room for new ones.
                            </p>
                        </dd>
                    </div>

                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                <Trash2 class="h-6 w-6 text-white" />
                            </div>
                            Wildcard Deletion
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                            <p class="flex-auto">
                                Delete cache entries by prefix or wildcard patterns.
                                Perfect for invalidating related cache entries at once.
                            </p>
                        </dd>
                    </div>

                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                <Code class="h-6 w-6 text-white" />
                            </div>
                            Method Decorator
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                            <p class="flex-auto">
                                Use the <code class="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded text-sm">@cached</code> decorator
                                for automatic method-level memoization with zero boilerplate.
                            </p>
                        </dd>
                    </div>

                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                <Zap class="h-6 w-6 text-white" />
                            </div>
                            Zero Dependencies
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                            <p class="flex-auto">
                                Lightweight and fast with no external dependencies.
                                Keep your bundle size small and your app fast.
                            </p>
                        </dd>
                    </div>

                    <div class="flex flex-col">
                        <dt class="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900 dark:text-white">
                            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600">
                                <Package class="h-6 w-6 text-white" />
                            </div>
                            Full TypeScript Support
                        </dt>
                        <dd class="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600 dark:text-gray-300">
                            <p class="flex-auto">
                                Written in TypeScript with complete type definitions.
                                Get full IntelliSense and type safety out of the box.
                            </p>
                        </dd>
                    </div>
                </dl>
            </div>
        </div>
    </section>

    <!-- Quick Example Section -->
    <section class="bg-gray-50 dark:bg-gray-900/50 py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-2xl text-center">
                <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Simple to use
                </h2>
                <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                    Get started in seconds with an intuitive API.
                </p>
            </div>

            <div class="mt-16 mx-auto max-w-3xl">
                <div class="bg-gray-900 dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
                    <div class="flex items-center gap-2 px-4 py-3 bg-gray-800 dark:bg-gray-700/50 border-b border-gray-700">
                        <div class="w-3 h-3 rounded-full bg-red-500"></div>
                        <div class="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div class="w-3 h-3 rounded-full bg-green-500"></div>
                        <span class="ml-2 text-sm text-gray-400">example.ts</span>
                    </div>
                    <pre class="p-6 text-sm leading-relaxed overflow-x-auto"><code class="text-gray-100"><span class="text-purple-400">import</span> {'{'} <span class="text-yellow-300">MemoryCache</span>, <span class="text-yellow-300">cached</span> {'}'} <span class="text-purple-400">from</span> <span class="text-green-400">'@humanspeak/memory-cache'</span>

<span class="text-gray-500">// Create a cache with custom options</span>
<span class="text-purple-400">const</span> <span class="text-blue-300">cache</span> = <span class="text-purple-400">new</span> <span class="text-yellow-300">MemoryCache</span>&lt;<span class="text-blue-300">string</span>&gt;({'{'}
    <span class="text-blue-300">maxSize</span>: <span class="text-orange-400">1000</span>,
    <span class="text-blue-300">ttl</span>: <span class="text-orange-400">5</span> * <span class="text-orange-400">60</span> * <span class="text-orange-400">1000</span>  <span class="text-gray-500">// 5 minutes</span>
{'}'})

<span class="text-gray-500">// Store and retrieve values</span>
<span class="text-blue-300">cache</span>.<span class="text-yellow-300">set</span>(<span class="text-green-400">'user:123'</span>, <span class="text-green-400">'John Doe'</span>)
<span class="text-purple-400">const</span> <span class="text-blue-300">name</span> = <span class="text-blue-300">cache</span>.<span class="text-yellow-300">get</span>(<span class="text-green-400">'user:123'</span>)

<span class="text-gray-500">// Use the decorator for automatic caching</span>
<span class="text-purple-400">class</span> <span class="text-yellow-300">UserService</span> {'{'}
    <span class="text-yellow-300">@cached</span>&lt;<span class="text-blue-300">User</span>&gt;({'{'} <span class="text-blue-300">ttl</span>: <span class="text-orange-400">60000</span> {'}'})
    <span class="text-purple-400">async</span> <span class="text-yellow-300">getUser</span>(<span class="text-blue-300">id</span>: <span class="text-blue-300">string</span>): <span class="text-yellow-300">Promise</span>&lt;<span class="text-blue-300">User</span>&gt; {'{'}
        <span class="text-purple-400">return await</span> <span class="text-blue-300">database</span>.<span class="text-yellow-300">findUser</span>(<span class="text-blue-300">id</span>)
    {'}'}
{'}'}</code></pre>
                </div>
            </div>
        </div>
    </section>

    <!-- CTA Section -->
    <section class="py-24 sm:py-32">
        <div class="mx-auto max-w-7xl px-6 lg:px-8">
            <div class="mx-auto max-w-2xl text-center">
                <h2 class="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                    Ready to get started?
                </h2>
                <p class="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                    Check out the documentation for detailed API reference and examples.
                </p>
                <div class="mt-10 flex items-center justify-center gap-x-6">
                    <a
                        href="/docs/getting-started"
                        class="rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 transition-colors"
                    >
                        Read the Docs
                    </a>
                    <a
                        href="https://www.npmjs.com/package/@humanspeak/memory-cache"
                        class="text-sm font-semibold leading-6 text-gray-900 dark:text-gray-100 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                        View on NPM <span aria-hidden="true">→</span>
                    </a>
                </div>
            </div>
        </div>
    </section>

    <!-- Footer -->
    <footer class="border-t border-gray-200 dark:border-gray-800">
        <div class="mx-auto max-w-7xl px-6 py-12 lg:px-8">
            <p class="text-center text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Humanspeak, Inc. All rights reserved.
                <a href="https://github.com/humanspeak/memory-cache" class="hover:text-primary-600 dark:hover:text-primary-400">
                    MIT License
                </a>
            </p>
        </div>
    </footer>
</div>

