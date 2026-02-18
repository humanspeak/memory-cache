<!--
  Left sidebar navigation component
  Hierarchical structure with FontAwesome icons and proper styling
-->
<script lang="ts">
    import { motion } from '@humanspeak/svelte-motion'
    import { onMount } from 'svelte'
    import { slide } from 'svelte/transition'
    import { PersistedState } from 'runed'

    const { currentPath } = $props()

    type NavItem = {
        title: string
        href: string
        icon: string
        external?: boolean
    }

    type NavSection = {
        title: string
        icon: string
        items: NavItem[]
    }

    type OtherProject = {
        url: string
        slug: string
        shortDescription: string
    }

    let otherProjects: NavItem[] = $state([])
    const openSections = new PersistedState<Record<string, boolean>>(
        'sidebar-sections',
        {}
    )

    // Navigation aligned with memory-cache documentation structure
    let navigation: NavSection[] = $derived([
        {
            title: 'Get Started',
            icon: 'fa-solid fa-rocket',
            items: [
                {
                    title: 'Getting Started',
                    href: '/docs/getting-started',
                    icon: 'fa-solid fa-rocket'
                }
            ]
        },
        {
            title: 'Interactive Demos',
            icon: 'fa-solid fa-play',
            items: [
                {
                    title: 'All Examples',
                    href: '/examples',
                    icon: 'fa-solid fa-play'
                },
                {
                    title: 'Basic Cache',
                    href: '/examples/basic-cache',
                    icon: 'fa-solid fa-box'
                },
                {
                    title: 'TTL Expiration',
                    href: '/examples/ttl-expiration',
                    icon: 'fa-solid fa-clock'
                },
                {
                    title: 'LRU Eviction',
                    href: '/examples/lru-eviction',
                    icon: 'fa-solid fa-layer-group'
                },
                {
                    title: 'Cache Statistics',
                    href: '/examples/cache-statistics',
                    icon: 'fa-solid fa-chart-line'
                }
            ]
        },
        {
            title: 'API Reference',
            icon: 'fa-solid fa-book',
            items: [
                {
                    title: 'MemoryCache',
                    href: '/docs/api/memory-cache',
                    icon: 'fa-solid fa-database'
                },
                {
                    title: '@cached Decorator',
                    href: '/docs/api/cached-decorator',
                    icon: 'fa-solid fa-at'
                }
            ]
        },
        {
            title: 'Examples',
            icon: 'fa-solid fa-code',
            items: [
                {
                    title: 'Overview',
                    href: '/docs/examples',
                    icon: 'fa-solid fa-code'
                },
                {
                    title: 'Configuration',
                    href: '/docs/examples/configuration',
                    icon: 'fa-solid fa-sliders'
                },
                {
                    title: 'API Caching',
                    href: '/docs/examples/api-caching',
                    icon: 'fa-solid fa-cloud'
                },
                {
                    title: 'Async Fetching',
                    href: '/docs/examples/async-fetching',
                    icon: 'fa-solid fa-rotate'
                },
                {
                    title: 'Computed Values',
                    href: '/docs/examples/computed-values',
                    icon: 'fa-solid fa-calculator'
                },
                {
                    title: 'Database Caching',
                    href: '/docs/examples/database-caching',
                    icon: 'fa-solid fa-database'
                },
                {
                    title: 'Monitoring',
                    href: '/docs/examples/monitoring',
                    icon: 'fa-solid fa-chart-line'
                },
                {
                    title: 'Multi-Tenant',
                    href: '/docs/examples/multi-tenant',
                    icon: 'fa-solid fa-building'
                },
                {
                    title: 'Rate Limiting',
                    href: '/docs/examples/rate-limiting',
                    icon: 'fa-solid fa-gauge-high'
                },
                {
                    title: 'Service Class',
                    href: '/docs/examples/service-class',
                    icon: 'fa-solid fa-cube'
                },
                {
                    title: 'Sessions',
                    href: '/docs/examples/sessions',
                    icon: 'fa-solid fa-user-clock'
                }
            ]
        },
        {
            title: 'Love and Respect',
            icon: 'fa-solid fa-heart',
            items: [
                {
                    title: 'Beye.ai',
                    href: 'https://beye.ai',
                    icon: 'fa-solid fa-heart',
                    external: true
                }
            ]
        },
        ...(otherProjects.length > 0
            ? [
                  {
                      title: 'Other Projects',
                      icon: 'fa-solid fa-cube',
                      items: otherProjects
                  }
              ]
            : [])
    ])

    const isSectionOpen = (section: NavSection): boolean => {
        if (section.title in openSections.current) return openSections.current[section.title]
        return true
    }

    const toggleSection = (section: NavSection) => {
        openSections.current = {
            ...openSections.current,
            [section.title]: !isSectionOpen(section)
        }
    }

    onMount(async () => {
        try {
            const response = await fetch('/api/other-projects')
            if (!response.ok) {
                return
            }
            const projects: OtherProject[] = await response.json()

            // Convert to nav items format
            otherProjects = projects.map((project) => ({
                title: formatTitle(project.slug),
                href: project.url,
                icon: 'fa-solid fa-heart',
                external: true
            }))
        } catch (error) {
            console.error('Failed to load other projects:', error)
        }
    })

    const formatTitle = (slug: string): string => slug.toLowerCase()

    const isActive = (href: string) => {
        const basePath = currentPath.split(/[?#]/)[0]
        if (href === '/docs' || href === '/docs/examples') {
            return (
                basePath === href ||
                currentPath.startsWith(`${href}?`) ||
                currentPath.startsWith(`${href}#`)
            )
        }
        return (
            basePath === href ||
            currentPath.startsWith(`${href}?`) ||
            currentPath.startsWith(`${href}#`) ||
            basePath.startsWith(`${href}/`)
        )
    }
</script>

<nav class="p-2">
    <div class="space-y-2">
        {#each navigation as section (section.title)}
            <div>
                <button
                    onclick={() => toggleSection(section)}
                    class="flex w-full items-center justify-between rounded-md px-3 py-1.5 text-sm font-semibold tracking-wide text-text-primary uppercase transition-colors duration-150 hover:bg-muted"
                >
                    <span class="flex items-center gap-2 text-left">
                        <motion.span
                            class="inline-flex shrink-0"
                            whileHover={{ scale: 1.25 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 15 }}
                        >
                            <i class="{section.icon} fa-fw text-sm text-muted-foreground"></i>
                        </motion.span>
                        {section.title}
                    </span>
                    <i
                        class="fa-solid fa-chevron-down text-xs text-muted-foreground transition-transform duration-200 shrink-0 {isSectionOpen(section) ? 'rotate-180' : ''}"
                    ></i>
                </button>
                {#if isSectionOpen(section)}
                    <ul
                        class="mt-1 ml-3 space-y-1 border-l border-border pl-1"
                        transition:slide={{ duration: 200 }}
                    >
                        {#each section.items as item (item.href)}
                            <motion.li
                                whileHover={{ x: 2 }}
                                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                            >
                                <a
                                    href={item.href}
                                    target={item?.external ? '_blank' : undefined}
                                    rel={item?.external ? 'noopener' : undefined}
                                    class="group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors duration-150
                                     {isActive(item.href)
                                        ? 'bg-accent text-accent-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'}"
                                >
                                    {#if item.icon}
                                        <motion.span
                                            class="mr-3 inline-flex"
                                            whileHover={{ scale: 1.25 }}
                                            transition={{
                                                type: 'spring',
                                                stiffness: 500,
                                                damping: 15
                                            }}
                                        >
                                            <i
                                                class="{item.icon} fa-fw text-sm {isActive(
                                                    item.href
                                                )
                                                    ? 'text-accent-foreground'
                                                    : 'text-muted-foreground group-hover:text-foreground'}"
                                            ></i>
                                        </motion.span>
                                    {:else}
                                        <i
                                            class="fa-solid fa-arrow-right fa-fw mr-3 text-xs text-muted-foreground"
                                        ></i>
                                    {/if}
                                    {item.title}
                                    {#if item?.external}
                                        <i
                                            class="fa-solid fa-arrow-up-right-from-square ml-2 text-xs opacity-50"
                                        ></i>
                                    {/if}
                                </a>
                            </motion.li>
                        {/each}
                    </ul>
                {/if}
            </div>
        {/each}
    </div>
</nav>
