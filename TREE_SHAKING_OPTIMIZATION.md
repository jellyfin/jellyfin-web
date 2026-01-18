# Tree-Shaking Optimization Effort

## Overview

This project aims to split large, monolithic files into modular, focused components to improve tree-shaking capabilities and reduce bundle size.

## Goals

- **Improve tree-shaking**: Allow bundlers to remove unused code at the module/function level
- **Reduce bundle size**: Smaller initial payloads and better code splitting
- **Improve maintainability**: Focused modules are easier to understand and modify
- **Enable granular imports**: Consumers can import only what they need

## Strategy

### File Selection Criteria

We target files that are:
- Large (> 1,000 lines)
- Contains many functions/classes that can be logically grouped
- Imported by multiple modules where tree-shaking would be beneficial
- Currently imported as a whole (barrel import or default export)

### Splitting Approach

1. **Identify logical groups**: Functions/classes that serve similar purposes
2. **Create focused modules**: Each module has a single responsibility
3. **Use named exports**: Essential for tree-shaking (default exports prevent it)
4. **Maintain backward compatibility**: Create index.js for re-exports
5. **Type safety**: Ensure TypeScript types are properly exported where applicable

### Module Structure Pattern

```
src/path/to/largeFile.js (2,000+ lines)
├── index.js (main entry, exports for backward compatibility)
├── moduleA.js (100-300 lines, related functions)
├── moduleB.js (100-300 lines, related functions)
└── moduleC.js (100-300 lines, related functions)
```

### Import Patterns

**Before (no tree-shaking):**
```javascript
import browserDeviceProfile from './scripts/browserDeviceProfile';
// Bundles entire 1,600 line file
```

**After (tree-shaking enabled):**
```javascript
import { canPlayH264 } from './scripts/browserDeviceProfile';
// Only bundles canPlayH264 function (~30 lines)
```

## Progress

### Completed

#### 1. browserDeviceProfile (1,604 lines) → 7 modules
- **Status**: ✅ Completed
- **Commit**: 872eddc2ed
- **Modules Created**:
  - `videoCodecs.js` - H264, HEVC, AV1 detection
  - `audioCodecs.js` - AC3, DTS, EAC3, MP3, FLAC support
  - `containerSupport.js` - MKV, TS, MP4 container checks
  - `featureDetection.js` - Text tracks, canvas, HLS, anamorphic
  - `hdr.js` - HDR/HLG/Dolby Vision detection
  - `bitrate.js` - Bitrate and audio channel calculations
  - `secondaryAudio.js` - Secondary audio track support

**Benefits**:
- Players can import only codec functions they need
- Reduces bundle size for features not requiring full profile
- Makes browser capability detection more granular

### In Progress

#### 2. itemDetails/index.js (2,227 lines)
- **Status**: 🔄 Phase 1 Complete, Phase 2 Planned
- **Commit**: d0441459a6
- **Completed (Phase 1)**:
  - `renderers/backdropRenderer.js` - Backdrop rendering
  - `renderers/headerRenderer.js` - Header backdrop rendering
  - `renderers/imageRenderer.js` - Logo and year rendering
  - `actions/playbackActions.js` - Playback, shuffle, instant mix actions
  - `utils/viewHelpers.js` - getPromise, hideAll, autoFocus
  - `utils/trackHelpers.js` - Track selection helpers

**Expected Benefits**:
- Other controllers can reuse rendering logic
- Reduces initial load for non-item-detail views
- Separates UI concerns from business logic
- Playback actions can be imported independently

### In Progress

#### 3. htmlVideoPlayer/plugin.js (2,234 lines)
- **Status**: 🔄 Phase 1 Complete, Phase 2 Planned
- **Commit**: af6a7a5ecf
- **Completed (Phase 1)**:
  - `utils/domHelpers.js` - URL resolution, element removal, zoom animation
  - `features/trackSupport.js` - HLS detection, native track support, media stream helpers
  - `stream/profileHelper.js` - Device profile helper

**Expected Benefits**:
- Track support functions can be reused by other players
- DOM helpers are tree-shakeable
- Media stream utilities are modular and testable

**Planned (Phase 2)**:
- Subtitle/track rendering
- Media source handling

#### 4. cardbuilder/cardBuilder.js (1,428 lines)
- **Target Modules**:
  - `builders/` - cardHtmlBuilder, cardFooterBuilder
  - `renderers/` - overlayRenderer, userDataRenderer
  - `utils/` - cardLayout, itemCounts

#### 5. playbackmanager.ts (1,699 lines)
- **Status**: 🔄 Phase 1 Complete, Phase 2 Planned
- **Commit**: c49ca0e588
- **Completed (Phase 1)**:
  - `utils/nameUtils.ts` - Name normalization (normalizeName)
  - `utils/itemQuery.ts` - Item/query management (getItemsForPlayback)
  - `utils/streamInfoBuilder.ts` - Stream info creation (createStreamInfoFromUrlItem)
  - `utils/queryUtils.ts` - Query merging (mergePlaybackQueries)
  - `indexModules.js` - Re-exports for backward compatibility

**Benefits**:
- Utility functions can be imported independently
- Reduces size of main playbackManager class
- Makes utility functions tree-shakeable

**Planned (Phase 2)**:
- Stream URL building and media source handling
- Playback reporting and progress tracking
- Player selection and management
- Event handlers and state management

## Commit Message Format

All commits in this effort follow this format:

```
<type>: <concise description>

<extended description>

- Detail 1
- Detail 2
- Detail 3

Ref: #TREE-SHAKING-OPTIMIZATION
```

Example:
```
refactor: split browserDeviceProfile into modular structure for tree shaking

- Split codec support functions into separate modules (videoCodecs, audioCodecs, containerSupport)
- Split feature detection into separate module (featureDetection)
- Split HDR support into separate module (hdr)
- Split bitrate and audio channel logic into separate module (bitrate)
- Add secondary audio support as separate module (secondaryAudio)
- Create index.js for re-exports to maintain backward compatibility

This improves tree-shaking potential by allowing importers to only import
the specific functions they need instead of entire monolithic file.

Ref: #TREE-SHAKING-OPTIMIZATION
```

## Best Practices

### ✅ Do
- Use named exports: `export function foo() {}`
- Keep modules focused (< 300 lines)
- Add JSDoc comments to exported functions
- Export types separately from implementation
- Create index.js for backward compatibility
- Test builds after each split

### ❌ Don't
- Use default exports for modules meant to be tree-shaken
- Create barrel files that re-export everything (prevents tree-shaking)
- Mix concerns in a single module
- Forget to update imports after splitting
- Skip type definitions in TypeScript modules

## Metrics

### Bundle Size Impact
- **Before**: All imports bundle entire file
- **After**: Only imported functions are bundled
- **Expected**: 30-70% reduction in unused code for typical importers

### Maintainability Impact
- **File size**: 2,000 lines → 7-10 modules of 100-300 lines
- **Cognitive load**: Easier to understand focused modules
- **Testability**: Smaller modules easier to test

## References

- [Webpack Tree Shaking](https://webpack.js.org/guides/tree-shaking/)
- [Rollup Tree Shaking](https://rollupjs.org/guide/en/#tree-shaking)
- [ES Module Tree Shaking](https://github.com/microsoft/TypeScript/wiki/Performance#tree-shaking-of-emitted-modules)

---

**Started**: 2026-01-18  
**Last Updated**: 2026-01-18  
**Owner**: Tree-Shaking Optimization Effort
