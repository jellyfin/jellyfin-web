# Implementation Gaps - Test Coverage Analysis

This document identifies currently skipped tests that represent implementation gaps and areas needing enhancement.

## Summary

- **Total Skipped Tests**: 14
- **Test Files**: 4 files
- **All Unit Tests Passing**: 729 passing, 12 skipped, 0 failing
- **Coverage Baseline**: 28.88% lines, 23.68% functions, 22.88% branches, 28.90% statements

---

## Detailed Implementation Gaps

### 1. Audio Engine - Crossfade Lifecycle Integration Tests

**File**: `src/components/audioEngine/crossfade-lifecycle.integration.test.ts`

#### Skipped Tests (5 total)

##### a. `should handle rapid setting changes`

- **Status**: Skipped
- **Impact**: Medium - Affects rapid UI/setting transitions during crossfade
- **Required Fix**: Implement debouncing/throttling for rapid setting changes
- **Location**: Line 505

##### b. `Memory Management` (describe block)

- **Status**: Skipped (empty describe block)
- **Impact**: High - Critical for long-running audio playback
- **Required Fix**: Implement and test memory cleanup for preloaded tracks
- **Tests Needed**:
  - Verify preload elements are garbage collected
  - Ensure no memory leaks with repeated preloads
  - Test cleanup during strategy changes
- **Location**: Line 517

##### c. `State Consistency` (describe block)

- **Status**: Skipped (empty describe block)
- **Impact**: High - Essential for reliable crossfade behavior
- **Required Fix**: Implement comprehensive state validation
- **Tests Needed**:
  - Verify state transitions are valid
  - Test atomic state updates
  - Validate state after errors
- **Location**: Line 520

##### d. `should timeout slow preloads`

- **Status**: Skipped
- **Reason**: `IndexSizeError` in DOM manipulation (document.body.innerHTML)
- **Impact**: Medium - Affects slow network scenarios
- **Required Fix**: Fix test DOM setup, improve timeout handling in implementation
- **Location**: Line 790

##### e. `should clear preload state on timeout`

- **Status**: Skipped
- **Reason**: `IndexSizeError` in DOM manipulation
- **Impact**: Medium - Important for cleanup after timeout
- **Required Fix**: Fix test DOM setup, ensure proper state cleanup
- **Location**: Line 812

---

### 2. Audio Engine - Crossfade Controller Tests

**File**: `src/components/audioEngine/crossfadeController.test.ts`

#### Skipped Tests (3 total)

##### a. `returns false when audio engine is not initialized`

- **Status**: Skipped
- **Impact**: High - Critical error handling case
- **Required Fix**: Implement proper initialization checks
- **Test Goal**: Verify preload fails gracefully when audio engine is undefined
- **Location**: Line 61

##### b. `starts a crossfade and schedules gain ramps`

- **Status**: Skipped
- **Impact**: High - Core crossfade functionality
- **Required Fix**: Complete crossfade implementation with proper gain scheduling
- **Test Goal**: Verify audio parameter scheduling works correctly
- **Location**: Line 123

##### c. `clears preloaded element when strategy changes`

- **Status**: Skipped
- **Reason**: Strategy not updating from "full" to "streaming"
- **Impact**: High - User-facing behavior issue
- **Required Fix**: Implement strategy switching logic
- **Test Goal**: Verify old preload is replaced when strategy changes
- **Current Issue**: Element retains "full" strategy instead of updating to "streaming"
- **Location**: Line 356

---

### 3. Audio Engine - Master Logic Tests

**File**: `src/components/audioEngine/master.logic.test.ts`

#### Skipped Tests (5 total - conditional skip)

**Configuration**: `shouldSkip = true` at line 302

##### a. `should set threshold to -1 dB`

- **Status**: Skipped (conditional)
- **Reason**: `limiterNode` not exposed on masterAudioOutput
- **Impact**: Low - Testing internal limiter configuration
- **Required Fix**: Expose limiterNode in audio engine API
- **Location**: Line 304

##### b. `should set knee to 0 (hard knee)`

- **Status**: Skipped (conditional)
- **Reason**: `limiterNode` not exposed on masterAudioOutput
- **Impact**: Low - Testing internal limiter configuration
- **Location**: Line 310

##### c. `should set ratio to 20:1 (limiting)`

- **Status**: Skipped (conditional)
- **Reason**: `limiterNode` not exposed on masterAudioOutput
- **Impact**: Low - Testing internal limiter configuration
- **Location**: Line 316

##### d. `should set attack to 3ms`

- **Status**: Skipped (conditional)
- **Reason**: `limiterNode` not exposed on masterAudioOutput
- **Impact**: Low - Testing internal limiter configuration
- **Location**: Line 322

##### e. `should set release to 250ms`

- **Status**: Skipped (conditional)
- **Reason**: `limiterNode` not exposed on masterAudioOutput
- **Impact**: Low - Testing internal limiter configuration
- **Location**: Line 328

**Solution**: Either:

1. Expose limiterNode through a getter function
2. Add tests for limiter behavior through public API
3. Remove if brick-wall limiter is not user-facing

---

### 4. Controllers - Item Details Tests

**File**: `src/controllers/itemDetails/__tests__/ItemDetails.test.tsx`

#### Skipped Tests (1 total)

##### `ItemDetails Component Tests`

- **Status**: Skipped (describe block)
- **Reason**: Module resolution issues - broken imports from `scripts/browserDeviceProfile`
- **Impact**: High - Component testing for item details view
- **Required Fix**:
  1. Fix imports in ItemDetails component
  2. Verify browserDeviceProfile exports correctly
  3. Re-enable and implement full component tests
- **Location**: Line 9

---

## Improvement Roadmap

### Phase 1: Critical Fixes (P0)

1. **Audio Engine Initialization** - Implement null checks for uninitialized audio context
2. **Strategy Switching** - Fix strategy property update logic
3. **Component Imports** - Fix ItemDetails module resolution

### Phase 2: Core Features (P1)

1. **Crossfade Scheduling** - Complete gain ramp scheduling
2. **Timeout Handling** - Fix preload timeout tests and implementation
3. **Limiter Node Exposure** - Decide on API design and expose or remove

### Phase 3: Quality (P2)

1. **Memory Management** - Implement comprehensive memory leak tests
2. **State Consistency** - Add state validation tests
3. **Rapid Setting Changes** - Implement throttling/debouncing

---

## Testing Strategy

When re-enabling these tests:

1. **Keep tests enabled** - Don't re-skip unless explicitly confirmed as "not applicable"
2. **Document reasons** - Add comments explaining why a test might fail
3. **Track progress** - Update this document as gaps are addressed
4. **Measure impact** - Monitor coverage improvements

### Running Skipped Tests

To see all skipped tests:

```bash
npm test -- --reporter=verbose 2>&1 | grep -i skip
```

To run a specific skipped test (after enabling):

```bash
npm test -- --grep "should handle rapid setting changes"
```

---

## Coverage Goals

As coverage improves, update the thresholds in `vite.config.ts`:

- **Phase 1** (Current): 28% baseline
- **Phase 2** (Q1 2025): 40% target
- **Phase 3** (Q2 2025): 55% target
- **Phase 4** (Q3 2025): 70% target

---

## Notes

- All skipped tests represent real implementation work, not mock issues
- Skipping is a temporary measure to identify work clearly
- The goal is to enable all tests and make them pass
- Each skipped test should have a corresponding issue/task
