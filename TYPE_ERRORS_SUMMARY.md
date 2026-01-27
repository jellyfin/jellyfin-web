# TypeScript Type Errors Analysis & Resolution Guide

## Overview
**Total Type Errors**: 395 (reduced from 401 initially)
**Fixed**: 6 errors
**Estimated Impact**: Low-medium (most are pre-existing, not blocking)

## Error Categories

### 1. **Null/Undefined Safety Issues** (~80 errors)
Most common: Cannot pass `null`, `undefined`, or optional values to required parameters

**Examples:**
```typescript
// TS2345: Argument of type 'string | undefined' is not assignable to parameter of type 'string'
function requiresString(str: string) { }
const optionalStr: string | undefined = getValue();
requiresString(optionalStr); // Error
```

**Fix Pattern:**
```typescript
// Use type guard or default
requiresString(optionalStr || '');
requiresString(optionalStr ?? 'default');
if (optionalStr) {
    requiresString(optionalStr);
}
```

**Affected Files:**
- `src/components/playbackSettings/playbackSettings.tsx`
- `src/components/shortcuts.ts`
- `src/elements/CheckBoxElement.tsx`
- `src/elements/SelectElement.tsx`

### 2. **Element Type Coercion Issues** (~30 errors)
DOM API returns `Element | null` but code expects `HTMLElement`

**Examples:**
```typescript
// TS2345: Element is not assignable to HTMLElement
const elem = document.querySelector('.selector');
elem.addEventListener('click', handler); // Element missing HTMLElement properties
```

**Fix Pattern:**
```typescript
const elem = document.querySelector('.selector') as HTMLElement;
const elem = document.getElementById('id'); // Already HTMLElement
if (elem instanceof HTMLElement) {
    elem.addEventListener('click', handler);
}
```

**Affected Files:**
- `src/components/playback/skipsegment.ts`
- `src/components/viewManager/viewManager.ts`
- `src/elements/emby-scrollbuttons/ScrollButtons.tsx`

### 3. **Missing Type Definitions** (~50 errors)
Properties/methods don't exist on types - usually due to API changes or version mismatches

**Examples:**
```typescript
// TS2339: Property 'credentialProvider' does not exist
connectionManager.credentialProvider // Property not found

// TS2551: Property 'getDownloadUrl' does not exist
libraryApi.getDownloadUrl(); // Did you mean 'getDownload'?
```

**Fix Pattern:**
- Check SDK/library versions
- Look at actual API implementation
- Use available alternatives
- Add type declarations if needed

**Affected Areas:**
- `src/index.tsx` - ConnectionManager API changes
- `src/lib/jellyfin-apiclient/` - API client mismatches
- `src/plugins/chromecastPlayer/plugin.ts` - API client issues
- `src/plugins/htmlVideoPlayer/plugin.ts` - PlaybackManager API

### 4. **Private vs Public Member Issues** (~20 errors)
Code casts private members to match interfaces

**Examples:**
```typescript
// TS2345: Private members in type but not in interface
class HtmlVideoPlayer {
    private destroyCustomTrack() { }
}
// Called from function expecting PlayerInstance interface
// where destroyCustomTrack is public
```

**Fix Pattern:**
- Change member visibility (private → public/protected)
- Create adapter/wrapper class
- Refactor to avoid private member use in interfaces

**Affected Files:**
- `src/plugins/htmlVideoPlayer/plugin.ts` (multiple errors)

### 5. **Module Resolution Errors** (~40 errors)
Type definitions not found in node_modules or module resolution issues

**Examples:**
```
Cannot find module '@vitest/utils/display'
Cannot find module '#types/hmrPayload'
```

**Status**: Pre-existing, from Vite/Vitest infrastructure
**Fix**: Update moduleResolution to 'bundler' (already done in tsconfig.json)

### 6. **Unknown Type Casting** (~50 errors)
Functions accept `unknown` type but code passes specific types

**Examples:**
```typescript
// TS2345: Argument of type 'unknown' is not assignable to 'Error | undefined'
logger.error(unknownCaughtError);
```

**Fix Pattern:**
```typescript
// Add type guard
if (error instanceof Error || error === undefined) {
    logger.error(error);
}
// Or cast with explicit type
logger.error(error as Error | undefined);
```

**Affected Files:**
- `src/index.tsx` - Error handling
- `src/utils/observability/` - Event emission

## Priority Fixes

### High Priority (Blocking or Common)
1. **Element type coercions** - Affects DOM manipulation
   - Estimated: 30 errors, 2-3 hours to fix
   - Pattern: `as HTMLElement` or `instanceof` checks

2. **Null/undefined safety** - Type safety improvement
   - Estimated: 80 errors, 4-5 hours to fix
   - Pattern: `|| ''`, `?? default`, type guards

### Medium Priority (Functional)
3. **API client type issues** - May cause runtime errors
   - Estimated: 30 errors, 3-4 hours to fix
   - Pattern: Update method calls to match API

4. **Private member access** - Design issue
   - Estimated: 20 errors, 2-3 hours to fix
   - Pattern: Change visibility or refactor interfaces

### Low Priority (Pre-existing)
5. **Module resolution errors** - Infrastructure issue
   - Status: Pre-existing from build system
   - Fix: Already applied (moduleResolution: 'bundler')

6. **Vite/Vitest types** - Build tool configuration
   - Status: Not critical for functionality
   - May resolve with dependency updates

## Testing Recommendations

1. **Run tests after fixes:**
```bash
npm run test -- --run
npm run test:coverage
```

2. **Verify no regressions:**
- All 1192 tests should pass
- No new type errors introduced

3. **Focus areas:**
- Element handling in interactive components
- Error handling in edge cases
- API client integration with new versions

## Pre-existing vs New Errors

**Pre-existing** (not caused by our changes):
- Vite/Vitest module resolution issues
- API client method mismatches
- Missing type definitions
- Private member access patterns

**Related to test implementation**:
- vitest/globals type definitions (FIXED)
- WideEvent object structure (FIXED)
- Mock typing issues (FIXED)

## Action Items

- [ ] Fix Element → HTMLElement coercions (30 errors)
- [ ] Add null/undefined type guards (80 errors)
- [ ] Update API client method calls (30 errors)
- [ ] Fix private member visibility (20 errors)
- [ ] Verify all tests pass after fixes
- [ ] Update documentation on type safety

## Notes

- TypeScript strict mode is enabled (`"strict": true`)
- strictNullChecks is enabled (`"strictNullChecks": true`)
- These provide good safety but require careful type handling
- The error count is high but manageable with systematic fixes
- Most errors are type safety improvements, not blocking issues
