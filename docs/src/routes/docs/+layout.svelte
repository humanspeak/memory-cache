<script lang="ts">
    import { page } from '$app/state'
    import { Book, Code, Lightbulb, Home, Sun, Moon } from 'lucide-svelte'
    import { toggleMode, mode } from 'mode-watcher'

    const { children } = $props()

    const navigation = [
        {
            title: 'Getting Started',
            icon: Book,
            items: [
                { title: 'Overview', href: '/docs/getting-started' }
            ]
        },
        {
            title: 'API Reference',
            icon: Code,
            items: [
                { title: 'MemoryCache', href: '/docs/api/memory-cache' },
                { title: '@cached Decorator', href: '/docs/api/cached-decorator' }
            ]
        },
        {
            title: 'Examples',
            icon: Lightbulb,
            items: [
                { title: 'Usage Examples', href: '/docs/examples' }
            ]
        }
    ]

    function isActive(href: string): boolean {
        return page.url.pathname === href
    }
</script>

<div class="min-h-screen bg-white dark:bg-gray-950">
    <!-- Header -->
    <header class="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-950/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-950/60">
        <div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
            <div class="flex items-center gap-6">
                <a href="/" class="flex items-center gap-2">
                    <Home class="h-5 w-5 text-primary-600" />
                    <span class="font-semibold text-gray-900 dark:text-white">memory-cache</span>
                </a>
            </div>
            <div class="flex items-center gap-4">
                <a
                    href="https://github.com/humanspeak/memory-cache"
                    class="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                    GitHub
                </a>
                <a
                    href="https://www.npmjs.com/package/@humanspeak/memory-cache"
                    class="text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                >
                    NPM
                </a>
                <button
                    onclick={toggleMode}
                    class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
                    aria-label="Toggle dark mode"
                >
                    {#if $mode === 'dark'}
                        <Sun class="h-5 w-5" />
                    {:else}
                        <Moon class="h-5 w-5" />
                    {/if}
                </button>
            </div>
        </div>
    </header>

    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex gap-12 py-10">
            <!-- Sidebar -->
            <aside class="hidden w-64 shrink-0 lg:block">
                <nav class="sticky top-24 space-y-8">
                    {#each navigation as section}
                        <div>
                            <h3 class="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
                                <section.icon class="h-4 w-4" />
                                {section.title}
                            </h3>
                            <ul class="mt-3 space-y-2">
                                {#each section.items as item}
                                    <li>
                                        <a
                                            href={item.href}
                                            class="block rounded-lg px-3 py-2 text-sm transition-colors {isActive(item.href)
                                                ? 'bg-primary-50 text-primary-700 dark:bg-primary-900/20 dark:text-primary-400 font-medium'
                                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50 hover:text-gray-900 dark:hover:text-gray-200'}"
                                        >
                                            {item.title}
                                        </a>
                                    </li>
                                {/each}
                            </ul>
                        </div>
                    {/each}
                </nav>
            </aside>

            <!-- Main content -->
            <main class="min-w-0 flex-1">
                <article class="prose prose-gray dark:prose-invert max-w-none">
                    {@render children?.()}
                </article>
            </main>
        </div>
    </div>
</div>

