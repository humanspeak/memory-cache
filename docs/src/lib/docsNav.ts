import type { NavSection } from '@humanspeak/docs-kit'
import AtSign from '@lucide/svelte/icons/at-sign'
import BarChart3 from '@lucide/svelte/icons/bar-chart-3'
import Building from '@lucide/svelte/icons/building'
import Calculator from '@lucide/svelte/icons/calculator'
import Cloud from '@lucide/svelte/icons/cloud'
import Code from '@lucide/svelte/icons/code'
import Database from '@lucide/svelte/icons/database'
import Gauge from '@lucide/svelte/icons/gauge'
import Package from '@lucide/svelte/icons/package'
import RefreshCw from '@lucide/svelte/icons/refresh-cw'
import Rocket from '@lucide/svelte/icons/rocket'
import Sliders from '@lucide/svelte/icons/sliders'
import Swords from '@lucide/svelte/icons/swords'
import Timer from '@lucide/svelte/icons/timer'

export const docsSections: NavSection[] = [
    {
        title: 'Get Started',
        icon: Rocket,
        items: [
            {
                title: 'Getting Started',
                href: '/docs/getting-started',
                icon: Rocket
            }
        ]
    },
    {
        title: 'API Reference',
        icon: Database,
        items: [
            { title: 'MemoryCache', href: '/docs/api/memory-cache', icon: Database },
            { title: '@cached Decorator', href: '/docs/api/cached-decorator', icon: AtSign }
        ]
    },
    {
        title: 'Examples',
        icon: Code,
        items: [
            { title: 'Overview', href: '/docs/examples', icon: Code, exact: true },
            { title: 'Configuration', href: '/docs/examples/configuration', icon: Sliders },
            { title: 'API Caching', href: '/docs/examples/api-caching', icon: Cloud },
            { title: 'Async Fetching', href: '/docs/examples/async-fetching', icon: RefreshCw },
            { title: 'Async Decorator', href: '/docs/examples/async-decorator', icon: AtSign },
            { title: 'Computed Values', href: '/docs/examples/computed-values', icon: Calculator },
            { title: 'Database Caching', href: '/docs/examples/database-caching', icon: Database },
            { title: 'Monitoring', href: '/docs/examples/monitoring', icon: BarChart3 },
            { title: 'Multi-Tenant', href: '/docs/examples/multi-tenant', icon: Building },
            { title: 'Rate Limiting', href: '/docs/examples/rate-limiting', icon: Gauge },
            { title: 'Service Class', href: '/docs/examples/service-class', icon: Package },
            { title: 'Sessions', href: '/docs/examples/sessions', icon: Timer }
        ]
    },
    {
        title: 'Compare',
        icon: Swords,
        items: [
            { title: 'All Comparisons', href: '/compare', icon: Swords, exact: true },
            { title: 'vs node-cache', href: '/compare/vs-node-cache', icon: Swords },
            { title: 'vs lru-cache', href: '/compare/vs-lru-cache', icon: Swords },
            { title: 'vs Keyv', href: '/compare/vs-keyv', icon: Swords }
        ]
    }
]
