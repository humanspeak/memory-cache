# Memory Cache

- Package: `@humanspeak/memory-cache`
- License: MIT
- Requires: TypeScript or JavaScript
- Maintained by: [Humanspeak, Inc.](https://humanspeak.com)
- Current version: see <https://www.npmjs.com/package/@humanspeak/memory-cache>

## Installation

```bash
npm install @humanspeak/memory-cache
```

```bash
pnpm add @humanspeak/memory-cache
```

## Basic Usage

```typescript
import { MemoryCache } from '@humanspeak/memory-cache'

const cache = new MemoryCache<string>({
    maxSize: 100,
    ttl: 60_000
})

cache.set('user:123', 'Ada')
const value = cache.get('user:123')
```

## Method Memoization

Use the `@cached` decorator to memoize method results with TTL support.

```typescript
import { cached } from '@humanspeak/memory-cache'

class UserService {
    @cached({ ttl: 60_000 })
    async getUser(id: string) {
        return fetch(`/api/users/${id}`).then((res) => res.json())
    }
}
```

## Key Features

- Zero-dependency in-memory cache for TypeScript and JavaScript
- TTL expiration for time-bound cache entries
- LRU eviction when the cache reaches capacity
- `@cached` decorator for method-level memoization
- Wildcard pattern deletion for grouped invalidation
- Cache statistics and lifecycle hooks for monitoring
- Works well for API response caching, session storage, computed values, and database query caching
