<!-- trunk-ignore-all(markdownlint/MD033) -->
<!-- trunk-ignore-all(markdownlint/MD036) -->
<!-- trunk-ignore(markdownlint/MD041) -->
<div align="center">

# @humanspeak/memory-cache

**A lightweight, zero-dependency in-memory cache for TypeScript and JavaScript**

[![NPM version](https://img.shields.io/npm/v/@humanspeak/memory-cache.svg)](https://www.npmjs.com/package/@humanspeak/memory-cache)
[![Build Status](https://github.com/humanspeak/memory-cache/actions/workflows/npm-publish.yml/badge.svg)](https://github.com/humanspeak/memory-cache/actions/workflows/npm-publish.yml)
[![Coverage Status](https://coveralls.io/repos/github/humanspeak/memory-cache/badge.svg?branch=main)](https://coveralls.io/github/humanspeak/memory-cache?branch=main)
[![License](https://img.shields.io/npm/l/@humanspeak/memory-cache.svg)](https://github.com/humanspeak/memory-cache/blob/main/LICENSE)
[![Downloads](https://img.shields.io/npm/dm/@humanspeak/memory-cache.svg)](https://www.npmjs.com/package/@humanspeak/memory-cache)
[![Install size](https://packagephobia.com/badge?p=@humanspeak/memory-cache)](https://packagephobia.com/result?p=@humanspeak/memory-cache)
[![TypeScript](https://img.shields.io/badge/%3C%2F%3E-TypeScript-%230074c1.svg)](http://www.typescriptlang.org/)
[![Types](https://img.shields.io/npm/types/@humanspeak/memory-cache.svg)](https://www.npmjs.com/package/@humanspeak/memory-cache)

</div>

A powerful, feature-rich in-memory caching solution with TTL expiration, true LRU (Least Recently Used) eviction, wildcard pattern deletion, and a `@cached` decorator for effortless method-level memoization. Perfect for API response caching, session storage, expensive computation caching, and performance optimization.

Visit the [documentation](https://memory.svelte.page/) for detailed API reference and examples.

## Features

- **Zero Dependencies** - Lightweight and fast
- **TTL Expiration** - Automatic cache entry expiration
- **LRU Eviction** - Least recently used entries are evicted when cache is full
- **Wildcard Deletion** - Delete entries by prefix or wildcard patterns
- **Full TypeScript Support** - Complete type definitions included
- **Method Decorator** - `@cached` decorator for automatic memoization
- **Null/Undefined Support** - Properly caches falsy values
- **Cache Statistics** - Track hits, misses, evictions, and expirations
- **Introspection** - Query cache size, keys, values, and entries
- **Lifecycle Hooks** - Observe cache events for monitoring and debugging

## Installation

```bash
npm install @humanspeak/memory-cache
```

```bash
pnpm add @humanspeak/memory-cache
```

```bash
yarn add @humanspeak/memory-cache
```

## Quick Start

### Basic Usage

```typescript
import { MemoryCache } from '@humanspeak/memory-cache'

// Create a cache with default options (100 entries, 5 minute TTL)
const cache = new MemoryCache<string>()

// Or customize the options
const customCache = new MemoryCache<string>({
    maxSize: 1000, // Maximum entries before eviction
    ttl: 10 * 60 * 1000 // 10 minutes TTL
})

// Store and retrieve values
cache.set('user:123', 'John Doe')
const name = cache.get('user:123') // 'John Doe'

// Check if key exists
if (cache.has('user:123')) {
    // Key exists and hasn't expired
}

// Delete entries
cache.delete('user:123')
cache.clear() // Remove all entries
```

### Wildcard Pattern Deletion

```typescript
const cache = new MemoryCache<string>()

cache.set('user:123:name', 'John')
cache.set('user:123:email', 'john@example.com')
cache.set('user:456:name', 'Jane')
cache.set('post:789', 'Hello World')

// Delete by prefix
cache.deleteByPrefix('user:123:') // Removes user:123:name and user:123:email

// Delete by wildcard pattern
cache.deleteByMagicString('user:*:name') // Removes all user names
cache.deleteByMagicString('*:123:*') // Removes all entries with :123:
```

### Method Decorator

```typescript
import { cached } from '@humanspeak/memory-cache'

class UserService {
    @cached<User>({ ttl: 60000, maxSize: 100 })
    async getUser(id: string): Promise<User> {
        // This expensive operation will be cached
        return await database.findUser(id)
    }

    @cached<string[]>()
    getUserPermissions(userId: string, role: string): string[] {
        // Results are cached per unique argument combination
        return computePermissions(userId, role)
    }
}

const service = new UserService()

// First call - executes the method
await service.getUser('123')

// Second call - returns cached result
await service.getUser('123')
```

#### Custom Key Generator

Use `keyGenerator` to control how cache keys are derived from arguments:

```typescript
class UserService {
    @cached<string>({ keyGenerator: (args) => args[0].id })
    getDisplayName(user: { id: string; name: string }): string {
        return computeDisplayName(user)
    }
}
```

#### Hashed Keys

Use `hashKeys` for shorter, fixed-length keys (useful with complex arguments):

```typescript
class AnalyticsService {
    @cached<Report>({ hashKeys: true, ttl: 60000 })
    generateReport(filters: ComplexFilterObject): Report {
        return buildReport(filters)
    }
}
```

> When both `keyGenerator` and `hashKeys` are set, `keyGenerator` takes precedence.

### Async Fetch with getOrSet

```typescript
import { MemoryCache } from '@humanspeak/memory-cache'

const cache = new MemoryCache<User>({ ttl: 60000 })

// Automatically fetch and cache on miss
const user = await cache.getOrSet('user:123', async () => {
    return await fetchUserFromDB(123)
})

// Concurrent requests share the same fetch (thundering herd prevention)
const promises = Array.from({ length: 100 }, () =>
    cache.getOrSet('popular-key', fetchExpensiveData)
)
await Promise.all(promises) // fetchExpensiveData called only once
```

## API Reference

### `MemoryCache<T>`

#### Constructor Options

| Option    | Type         | Default  | Description                                      |
| --------- | ------------ | -------- | ------------------------------------------------ |
| `maxSize` | `number`     | `100`    | Maximum entries before eviction (0 = unlimited)  |
| `ttl`     | `number`     | `300000` | Time-to-live in milliseconds (0 = no expiration) |
| `hooks`   | `CacheHooks` | `{}`     | Lifecycle hooks for observing cache events       |

#### Methods

| Method                         | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `get(key)`                     | Retrieves a value from the cache                     |
| `set(key, value)`              | Stores a value in the cache                          |
| `getOrSet(key, fetcher)`       | Gets cached value or fetches and caches on miss      |
| `has(key)`                     | Checks if a key exists (useful for cached undefined) |
| `delete(key)`                  | Removes a specific entry                             |
| `deleteAsync(key)`             | Async version of delete                              |
| `clear()`                      | Removes all entries                                  |
| `deleteByPrefix(prefix)`       | Removes entries starting with prefix                 |
| `deleteByMagicString(pattern)` | Removes entries matching wildcard pattern            |
| `size()`                       | Returns the number of entries in cache               |
| `keys()`                       | Returns array of all cache keys                      |
| `values()`                     | Returns array of all cached values                   |
| `entries()`                    | Returns array of [key, value] pairs                  |
| `getStats()`                   | Returns cache statistics (hits, misses, etc.)        |
| `resetStats()`                 | Resets statistics counters to zero                   |
| `prune()`                      | Removes all expired entries, returns count           |

### `@cached<T>(options?)`

A method decorator for automatic result caching.

```typescript
@cached<ReturnType>({ ttl: 60000, maxSize: 100 })
methodName(args): ReturnType { ... }
```

## Configuration Examples

```typescript
// High-traffic API cache
const apiCache = new MemoryCache<Response>({
    maxSize: 10000,
    ttl: 5 * 60 * 1000 // 5 minutes
})

// Session storage (longer TTL, smaller size)
const sessionCache = new MemoryCache<Session>({
    maxSize: 1000,
    ttl: 30 * 60 * 1000 // 30 minutes
})

// Computation cache (no TTL, size-limited)
const computeCache = new MemoryCache<Result>({
    maxSize: 500,
    ttl: 0 // No expiration
})

// Unlimited cache (use with caution)
const unlimitedCache = new MemoryCache<Data>({
    maxSize: 0, // No size limit
    ttl: 0 // No expiration
})
```

## Cache Statistics

Track cache performance with built-in statistics:

```typescript
const cache = new MemoryCache<string>()

cache.set('key', 'value')
cache.get('key') // hit
cache.get('missing') // miss

const stats = cache.getStats()
// { hits: 1, misses: 1, evictions: 0, expirations: 0, size: 1 }

// Reset statistics
cache.resetStats()

// Proactively remove expired entries
const prunedCount = cache.prune()
```

## Cache Hooks

Monitor cache lifecycle events with optional hooks:

```typescript
const cache = new MemoryCache<string>({
    maxSize: 100,
    ttl: 60000,
    hooks: {
        onHit: ({ key, value }) => console.log(`Cache hit: ${key}`),
        onMiss: ({ key, reason }) => console.log(`Cache miss: ${key} (${reason})`),
        onSet: ({ key, isUpdate }) => console.log(`Set: ${key} ${isUpdate ? '(update)' : '(new)'}`),
        onEvict: ({ key }) => console.log(`Evicted: ${key}`),
        onExpire: ({ key, source }) => console.log(`Expired: ${key} via ${source}`),
        onDelete: ({ key, source }) => console.log(`Deleted: ${key} via ${source}`)
    }
})
```

### Hook Events

| Hook       | When Called                         | Context                                     |
| ---------- | ----------------------------------- | ------------------------------------------- |
| `onHit`    | Successful cache retrieval          | `{ key, value }`                            |
| `onMiss`   | Cache miss (not found or expired)   | `{ key, reason: 'not_found' \| 'expired' }` |
| `onSet`    | Value stored in cache               | `{ key, value, isUpdate }`                  |
| `onEvict`  | Entry evicted due to size limit     | `{ key, value }`                            |
| `onExpire` | Entry removed due to TTL expiration | `{ key, value, source }`                    |
| `onDelete` | Entry explicitly deleted            | `{ key, value, source }`                    |

Hooks are synchronous and errors are silently caught to prevent cache corruption.

## Documentation

For complete documentation, examples, and API reference, visit [memory.svelte.page](https://memory.svelte.page/).

## License

MIT © [Humanspeak, Inc.](LICENSE)

## Credits

Made with ❤️ by [Humanspeak](https://humanspeak.com)
