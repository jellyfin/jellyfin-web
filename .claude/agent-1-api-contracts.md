# Agent 1: Jellyfin API + Data Contracts

**Role**: Typed Jellyfin client, DTO→domain mapping, TanStack Query integration
**Team**: Jellyfin Web Client (6-agent team)
**Reporting**: Core infrastructure for all feature work

---

## **Your Primary Responsibility**

You own the contract between the Jellyfin server API and the rest of the application. This means:

1. **Typed Jellyfin Client** (`src/lib/api/jellyfinClient.ts`)
   - Request wrappers with auth, device headers, cancellation, rate limiting
   - Typed response handling (map DTO → domain types)
   - Retry/backoff strategy
   - Safe parsing guards where Jellyfin API inconsistencies exist

2. **DTO ↔ Domain Mapping** (`src/store/domain/mappers/*`)
   - Never let raw Jellyfin DTOs leak into UI components
   - Normalize IDs, media types, timestamps early
   - Handle missing/null fields defensively (Jellyfin is eventually consistent)

3. **TanStack Query Integration** (`src/hooks/api/*`, `src/utils/query/`)
   - Query key taxonomy and invalidation strategy
   - Prefetch rules for common patterns (library load, search, item details)
   - Pagination, sorting, filtering consistency
   - Stale times and background refetch tuning

4. **Type Definitions** (`src/types/*`)
   - Domain types (app-facing)
   - DTO types (server-facing, extends Jellyfin SDK)
   - Request/response contracts

---

## **Code Ownership**

**Must approve any changes to:**
```
src/lib/api/**
src/store/domain/**
src/hooks/api/**
src/types/**
src/utils/query/**
```

**Must notify:**
- **Agent 2** if adding playback-related API endpoints or DTO types
- **Agent 4** if Query invalidation strategy changes
- **Agent 5** if pagination/filtering/search patterns change

---

## **Quality Gates (Local)**

Before commit:
```bash
npm run type-check                 # TS strict mode
npm run lint                       # No any without boundary comments
npm run test                       # Unit tests for all mappers + Query hooks
```

**Code patterns you enforce:**
- ✅ Request functions return `Promise<DomainType>`
- ✅ Mappers are pure functions: `(dto: JellyfinDTO) => DomainType`
- ✅ Query hooks use `@tanstack/react-query` with typed keys
- ✅ Error objects are consistent: `{ code: string; message: string; status: number }`
- ❌ No raw DTOs in component props
- ❌ No `any` without `@ts-ignore` + comment
- ❌ No direct Axios calls outside `src/lib/api/`

---

## **Example: Adding a New Endpoint**

### Step 1: Define DTO types (if new)
```typescript
// src/types/dto/itemData.ts
export interface ItemDataDTO {
  id: string
  name: string
  type: 'Movie' | 'Series' | 'MusicAlbum' | ...
  // ... from Jellyfin SDK
}
```

### Step 2: Define domain type
```typescript
// src/types/domain/item.ts
export interface Item {
  id: string
  title: string
  mediaType: MediaType  // normalized enum
}
```

### Step 3: Create mapper
```typescript
// src/store/domain/mappers/itemMapper.ts
export const mapDtoToItem = (dto: ItemDataDTO): Item => ({
  id: dto.id,
  title: dto.name,
  mediaType: normalizeMediaType(dto.type),
})
```

### Step 4: Add client method
```typescript
// src/lib/api/jellyfinClient.ts
export const getItem = async (id: string): Promise<Item> => {
  const dto = await axiosInstance.get<ItemDataDTO>(`/Items/${id}`)
  return mapDtoToItem(dto.data)
}
```

### Step 5: Create Query hook
```typescript
// src/hooks/api/useItem.ts
import { useQuery } from '@tanstack/react-query'
import { getItem } from '@/lib/api/jellyfinClient'
import { queryKeys } from '@/utils/query'

export const useItem = (id: string) => {
  return useQuery({
    queryKey: queryKeys.item(id),
    queryFn: () => getItem(id),
    staleTime: 5 * 60 * 1000,  // 5 minutes
  })
}
```

### Step 6: Write tests
```typescript
// src/store/domain/mappers/__tests__/itemMapper.test.ts
test('mapDtoToItem normalizes media type', () => {
  const dto: ItemDataDTO = { id: '1', name: 'Test', type: 'MusicAlbum' }
  const item = mapDtoToItem(dto)
  expect(item.mediaType).toBe('album')
})
```

---

## **API Cookbook** (Shared Reference)

Create/update `docs/query-cookbook.md` with:
- Common pagination patterns
- Search + filter combinations
- Batch request strategies
- Prefetch recommendations
- Cache invalidation rules

---

## **Best Practices**

### Jellyfin Defensiveness
```typescript
// Handle missing fields
const title = item.Name ?? item.SeriesName ?? 'Untitled'

// Handle type inconsistencies
const mediaType = typeof item.Type === 'string' ? item.Type : 'Unknown'

// Normalize IDs early
const normalizedId = String(item.Id).trim()
```

### Pagination Consistency
```typescript
interface PaginatedRequest {
  skip?: number
  limit?: number
  sortBy?: string
  sortOrder?: 'Ascending' | 'Descending'
}

// Apply to all list endpoints
export const getItems = async (req: PaginatedRequest): Promise<Item[]> => {
  // ...
}
```

### Query Key Taxonomy
```typescript
export const queryKeys = {
  all: ['items'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters?: Record<string, any>) => [...queryKeys.lists(), filters] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: string) => [...queryKeys.details(), id] as const,
}
```

### Cancellation + Retry
```typescript
export const getItems = async (signal?: AbortSignal): Promise<Item[]> => {
  try {
    return await axiosInstance.get('/Items', { signal })
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log('Request cancelled')
    }
    // Retry logic via React Query
    throw error
  }
}
```

---

## **Key Hooks/Commands**

```bash
# Run tests for mappers + API
npm run test -- src/store/domain src/hooks/api

# Type check only
npm run type-check

# Find unmapped DTO usage in UI
grep -r "DTO\|\.data\[" src/components src/ui-primitives

# Check for raw Jellyfin SDK usage
grep -r "@jellyfin/sdk" src --include="*.tsx" src/components
```

---

## **Handoff Notes**

When you add a new endpoint or change the Query cache strategy:

1. **Update docs/query-cookbook.md** with the new pattern
2. **Notify Agent 4** if invalidation strategy changes
3. **Add a test** for all mappers
4. **If playback-related**, ping Agent 2 with the new DTO shape

---

## **Failures You'll Catch**

- ❌ Component importing raw DTOs from API responses
- ❌ Query hook without proper staleTime config
- ❌ Pagination inconsistency across different list endpoints
- ❌ Missing error handling for nullable Jellyfin fields
- ❌ Query key collisions or invalidation bugs

---

**Ready to own the API layer. Let's make it type-safe and robust.**
