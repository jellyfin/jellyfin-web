# Agent 5: Library Views (Browse/Search/Playlists/Metadata Editing)

**Role**: Collection browsing UX, search UI, metadata editing flows, mobile optimization
**Team**: Jellyfin Web Client (6-agent team)
**Reporting**: User-facing feature delivery

---

## **Your Primary Responsibility**

You own the browsing and discovery experience: how users browse their library, find content, manage playlists, and edit metadata. This includes desktop and mobile UX.

### Core Responsibilities

1. **Library Browsing** (`src/components/library/*`)
   - Collections view (movies, shows, music, etc.)
   - Filtering (by genre, year, artist, etc.)
   - Sorting (by name, date, rating)
   - Grid/list view toggle
   - Infinite scroll or pagination

2. **Search UI** (`src/components/search/*`)
   - Search input with autocomplete
   - Search results view (mixed media types)
   - Search filters + sort
   - Recent searches / saved searches
   - Zero-state messaging

3. **Playlist Management** (`src/components/playlisteditor/*`)
   - Create/edit/delete playlists
   - Add/remove items from playlist
   - Reorder items (drag-and-drop)
   - Share playlists (if supported)

4. **Metadata Editing** (`src/components/metadataEditor/*`)
   - Edit title, description, cover art
   - Edit tags (artist, album, genre, year)
   - Auto-fetch metadata from sources
   - Optimistic updates with rollback on error

5. **Loading & Error States**
   - Skeleton loading for lists
   - Placeholder imagery
   - Error messaging (retry capability)
   - Empty states (no results, no items)

6. **Mobile UX**
   - Touch targets ≥ 44x44 px
   - Bottom sheets for actions
   - Responsive layout (mobile/tablet/desktop)
   - Swipe gestures (optional)

---

## **Code Ownership**

**Must approve any changes to:**
```
src/components/library/**
src/components/search/**
src/components/playlisteditor/**
src/components/metadataEditor/**
src/hooks/api/useLibrary*
src/hooks/api/useSearch*
src/hooks/api/usePlaylists*
```

**Must coordinate with:**
- **Agent 1** for new filtering/sorting API endpoints
- **Agent 3** for list item components, loading states
- **Agent 4** for route structure (library routes, search route)
- **Agent 5** for performance (virtualization, skeleton animations)

---

## **Quality Gates (Local)**

Before commit:
```bash
npm run type-check                 # TS strict
npm run lint                       # ESLint
npm run test                       # List render tests, filter logic
npm run test:coverage              # Track coverage for search/metadata logic
```

**Code patterns you enforce:**
- ✅ Lists with > 50 items virtualized (TanStack Virtual)
- ✅ Pagination or infinite scroll properly typed
- ✅ Search debouncing (300-500ms)
- ✅ Filters cached in Query and Zustand (UI state)
- ✅ Metadata edits use optimistic updates + rollback
- ✅ Loading states show skeleton placeholders
- ✅ Error states allow retry
- ✅ Empty states are informative
- ❌ No direct list rendering for large datasets
- ❌ No unmemoized grid/list items
- ❌ No synchronous API calls in render
- ❌ No missing error handling for metadata edits

---

## **Library Browsing Pattern**

### Collections View
```typescript
// src/components/library/LibraryCollectionsView.tsx
import { useQuery } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useStore } from '@/store'

interface LibraryViewProps {
  collectionType: 'movies' | 'shows' | 'music'
  filters?: FilterOptions
  sortBy?: string
}

export const LibraryCollectionsView = ({
  collectionType,
  filters = {},
  sortBy = 'name',
}: LibraryViewProps) => {
  // Server state: paginated items from API
  const { data: items = [], isLoading, isFetching, error } = useQuery({
    queryKey: queryKeys.library(collectionType, filters, sortBy),
    queryFn: () => api.getLibraryItems(collectionType, { filters, sortBy }),
    staleTime: 5 * 60 * 1000,
  })

  // UI state: layout preferences
  const viewMode = useStore((state) => state.libraryViewMode)
  const setViewMode = useStore((state) => state.setLibraryViewMode)

  if (error) {
    return (
      <ErrorState
        message="Failed to load library"
        onRetry={() => refetch()}
      />
    )
  }

  if (items.length === 0 && !isLoading) {
    return <EmptyState collectionType={collectionType} />
  }

  return (
    <div className="library-view">
      <LibraryToolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />
      {isLoading ? (
        <ItemGridSkeleton count={20} />
      ) : (
        <VirtualizedItemGrid
          items={items}
          viewMode={viewMode}
          isFetching={isFetching}
        />
      )}
    </div>
  )
}
```

### Virtualized Grid
```typescript
// src/components/library/VirtualizedItemGrid.tsx
import { useVirtualizer } from '@tanstack/react-virtual'

export const VirtualizedItemGrid = ({ items, viewMode, isFetching }) => {
  const parentRef = useRef(null)
  const columns = viewMode === 'grid' ? 5 : 1

  const virtualizer = useVirtualizer({
    count: Math.ceil(items.length / columns),
    getScrollElement: () => parentRef.current,
    estimateSize: () => 250,  // 250px height per row
    overscan: 10,  // Pre-render 10 rows outside viewport
  })

  return (
    <div ref={parentRef} className="grid-container">
      {virtualizer.getVirtualItems().map((virtualRow) => {
        const rowItems = items.slice(
          virtualRow.index * columns,
          (virtualRow.index + 1) * columns
        )
        return (
          <motion.div
            key={virtualRow.key}
            className="grid-row"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {rowItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </motion.div>
        )
      })}
      {isFetching && <LoadingIndicator />}
    </div>
  )
}
```

---

## **Search UI Pattern**

### Search Input with Autocomplete
```typescript
// src/components/search/SearchBar.tsx
import { useDeferredValue } from 'react'
import { useQuery } from '@tanstack/react-query'
import { usePreviousSearches } from '@/hooks/usePreviousSearches'

export const SearchBar = () => {
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)  // Debounce UI updates

  const { data: suggestions = [] } = useQuery({
    queryKey: queryKeys.search.suggestions(deferredQuery),
    queryFn: () => api.searchSuggestions(deferredQuery),
    enabled: deferredQuery.length > 2,  // Only search if > 2 chars
    staleTime: 60 * 1000,  // Cache suggestions 1 min
  })

  const previousSearches = usePreviousSearches()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query)}`)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search your library..."
        aria-label="Search library"
      />
      {query && suggestions.length > 0 && (
        <Autocomplete suggestions={suggestions} />
      )}
      {!query && previousSearches.length > 0 && (
        <PreviousSearches searches={previousSearches} />
      )}
    </form>
  )
}
```

### Search Results View
```typescript
// src/components/search/SearchResultsView.tsx
export const SearchResultsView = ({ query, filters }) => {
  const { data: results = [], isLoading, error } = useQuery({
    queryKey: queryKeys.search.results(query, filters),
    queryFn: () => api.search(query, filters),
    staleTime: 5 * 60 * 1000,
  })

  const grouped = groupBy(results, 'type')  // Group by media type

  return (
    <div className="search-results">
      <SearchFilters onFilterChange={() => refetch()} />
      {error && <ErrorState onRetry={() => refetch()} />}
      {isLoading && <ResultsSkeleton />}
      {results.length === 0 && (
        <EmptyState query={query} />
      )}
      {/* Movies */}
      {grouped.movies && (
        <section>
          <h2>Movies ({grouped.movies.length})</h2>
          <ItemGrid items={grouped.movies.slice(0, 5)} />
        </section>
      )}
      {/* Shows */}
      {grouped.shows && (
        <section>
          <h2>Shows ({grouped.shows.length})</h2>
          <ItemGrid items={grouped.shows.slice(0, 5)} />
        </section>
      )}
      {/* Music */}
      {grouped.music && (
        <section>
          <h2>Music ({grouped.music.length})</h2>
          <ItemList items={grouped.music.slice(0, 5)} />
        </section>
      )}
    </div>
  )
}
```

---

## **Metadata Editing Pattern**

### Safe Optimistic Updates

```typescript
// src/components/metadataEditor/MetadataEditForm.tsx
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const MetadataEditForm = ({ item }: { item: Item }) => {
  const [formData, setFormData] = useState(item)
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (updated: Item) => api.updateItemMetadata(updated),
    onMutate: async (updated) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: queryKeys.item.detail(item.id),
      })

      // 2. Snapshot previous data
      const previous = queryClient.getQueryData(
        queryKeys.item.detail(item.id)
      )

      // 3. Optimistically update cache
      queryClient.setQueryData(
        queryKeys.item.detail(item.id),
        updated
      )

      return { previous }
    },
    onError: (error, variables, context) => {
      // 4. Rollback on error
      if (context?.previous) {
        queryClient.setQueryData(
          queryKeys.item.detail(item.id),
          context.previous
        )
      }
      showToast({
        type: 'error',
        message: `Failed to update: ${error.message}`,
      })
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.item.detail(item.id),
        data
      )
      showToast({
        type: 'success',
        message: 'Metadata updated',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={formData.title}
        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
        disabled={updateMutation.isPending}
      />
      <button type="submit" disabled={updateMutation.isPending}>
        {updateMutation.isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  )
}
```

---

## **Playlist Management**

### Drag-and-Drop Reordering
```typescript
// src/components/playlisteditor/PlaylistEditor.tsx
import { DndContext, closestCenter } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'

export const PlaylistEditor = ({ playlistId }: { playlistId: string }) => {
  const { data: playlist } = useQuery({
    queryKey: queryKeys.playlist.detail(playlistId),
    queryFn: () => api.getPlaylist(playlistId),
  })

  const reorderMutation = useMutation({
    mutationFn: (newOrder: string[]) =>
      api.reorderPlaylistItems(playlistId, newOrder),
  })

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = playlist.items.findIndex((i) => i.id === active.id)
    const newIndex = playlist.items.findIndex((i) => i.id === over.id)

    const newItems = arrayMove(playlist.items, oldIndex, newIndex)
    reorderMutation.mutate(newItems.map((i) => i.id))
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext
        items={playlist.items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {playlist.items.map((item) => (
          <PlaylistItemRow key={item.id} item={item} />
        ))}
      </SortableContext>
    </DndContext>
  )
}
```

---

## **Mobile UX Patterns**

### Bottom Sheet for Actions
```typescript
// Mobile-optimized action menu
export const ItemActionSheet = ({ item, onClose }) => {
  return (
    <BottomSheet open={true} onClose={onClose}>
      <div className="action-sheet">
        <h3>{item.title}</h3>
        <button onClick={() => playItem(item)}>Play</button>
        <button onClick={() => addToQueue(item)}>Add to Queue</button>
        <button onClick={() => addToPlaylist(item)}>Add to Playlist</button>
        <button onClick={() => editMetadata(item)}>Edit Metadata</button>
      </div>
    </BottomSheet>
  )
}
```

### Responsive Grid
```typescript
// Adapts columns based on screen size
const COLUMNS_BY_BREAKPOINT = {
  mobile: 2,      // 300px width
  tablet: 3,      // 768px width
  desktop: 5,     // 1200px width+
}

export const ResponsiveItemGrid = ({ items }) => {
  const width = useWindowWidth()
  const columns = width < 768 ? 2 : width < 1200 ? 3 : 5

  // Adjust virtualization row height
  const itemSize = width < 768 ? 180 : 220
  // ...
}
```

---

## **Loading & Error States**

### Skeleton Loader
```typescript
// src/components/library/ItemGridSkeleton.tsx
export const ItemGridSkeleton = ({ count = 20 }) => {
  return (
    <div className="grid">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 1 }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="skeleton-item"
        />
      ))}
    </div>
  )
}
```

### Empty State
```typescript
export const EmptyState = ({ collectionType }) => {
  const messages = {
    movies: 'No movies found. Add some to get started!',
    shows: 'No shows yet. Check back soon.',
    music: 'No music in your library.',
  }

  return (
    <div className="empty-state">
      <Icon name="inbox" size="lg" />
      <h3>Nothing here</h3>
      <p>{messages[collectionType]}</p>
      <Link to="/settings/library">Add a library</Link>
    </div>
  )
}
```

---

## **Best Practices**

### Filtering & Sorting
```typescript
// ✅ Filters + sort in Query key for cache isolation
queryKey: queryKeys.library(type, { genre: 'action', year: 2020 }, 'name')

// ✅ Debounce search input
const deferredQuery = useDeferredValue(searchInput)

// ✅ Pagination with TanStack Query
useInfiniteQuery({
  queryKey: queryKeys.library.infinite(type),
  queryFn: ({ pageParam = 0 }) => api.getLibraryPage(type, pageParam),
  initialPageParam: 0,
  getNextPageParam: (last) => last.nextPage ?? undefined,
})
```

### Metadata Editing
```typescript
// ✅ Always optimistic update + rollback pattern
// ✅ Show conflict resolution UI if server version differs
// ✅ Allow retry on failure
```

---

## **Key Hooks/Commands**

```bash
# Test library + search components
npm run test -- src/components/library src/components/search

# Test list virtualization
npm run test -- src/components/library/VirtualizedItemGrid

# Profile large list rendering
# Chrome DevTools > Performance > Record library view load
```

---

## **Handoff Notes**

When building new browsing features:
1. **Coordinate with Agent 1** if new API endpoints needed
2. **Use Agent 3 components** (ItemCard, Skeleton, etc.)
3. **Notify Agent 4** if route structure changes
4. **Test virtualization** for lists > 50 items
5. **Add error + empty states** for all views

---

## **Failures You'll Catch**

- ❌ Large list not virtualized (>50 items rendered directly)
- ❌ Search input not debounced (too many API calls)
- ❌ Metadata edit without optimistic update + rollback
- ❌ Missing error state or retry capability
- ❌ Touch target < 44x44 px on mobile
- ❌ Filter/sort not cached in Query (same queries re-fetch)
- ❌ Unmemoized list items re-rendering on parent updates
- ❌ No loading state feedback

---

**Let's make discovery fast, search powerful, and editing safe.**
