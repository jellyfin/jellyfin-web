# Crossfade Preloader App Initialization - AI Investigation

## Current Situation

### Integration Status
- ✅ Crossfade preloader system fully built
- ✅ `initializeCrossfadePreloadHandler()` exported from `src/components/audioEngine/crossfadePreloadHandler.ts`
- ✅ Imported in QueuePage for queue view integration
- ⚠️ **NOT YET INITIALIZED IN APP STARTUP**

### The Missing Piece

**Need to add:**
```typescript
import { initializeCrossfadePreloadHandler } from 'components/audioEngine';
```

**Need to call:**
```typescript
initializeCrossfadePreloadHandler();
```

### App Initialization Location

Based on codebase analysis, the app initialization appears to be in:

**Option A:** `src/index.jsx` - `init()` function at end of file
- Pros: Central initialization point
- Cons: Already has many initialization tasks
- Easy to add one more import/call

**Option B:** `src/apps/stable/AppLayout.tsx` - Already imports audioEngine
- Pros: Closer to queue/stable app
- Cons: Might not be the main init point

**Option C:** Create dedicated initialization module
- Pros: Clean separation of concerns
- Cons: More complex refactoring

## Questions for User

1. **Where should I add the initialization?**
   - In `src/index.jsx` `init()` function?
   - In `src/apps/stable/AppLayout.tsx`?
   - Create new initialization module?
   - Somewhere else?

2. **Should I also add queue view preloader call?**
   - The queue view integration is ready but not called
   - Should I add `imagePreloader.preloadQueueImages()` call when queue loads?

3. **Implementation preference?**
   - Simple import + one-line initialization call?
   - Lazy import + conditional initialization?
   - Add with error handling?

4. **Priority of tasks?**
   - Focus on app startup initialization first (critical - system won't work without it)
   - Add queue preloading as enhancement (nice-to-have)
   - Both together in one commit?

## What I Need to Know

- Where does the app startup sequence happen?
- Are there any app lifecycle hooks or patterns I should follow?
- Should initialization be unconditional or conditional (e.g., only if audio feature enabled)?
- Any existing audio engine initialization patterns I should match?

## Recommended Next Steps

**Option 1 (Recommended):**
1. I add import to `src/index.jsx`
2. Add `initializeCrossfadePreloadHandler()` call in `init()` function
3. Add comment explaining initialization
4. Commit the change

**Option 2:**
1. I investigate the full app initialization flow
2. I find the optimal placement
3. I propose multiple options with pros/cons
4. You choose approach
5. I implement chosen approach

**Option 3:**
1. You provide more guidance on app architecture
2. I implement based on your direction

## Notes for AI Agent

When investigating:
- Check if `audioEngine` is already imported in `src/index.jsx`
- Look for existing audio/audioEngine imports
- Identify where `initializeMasterAudio()` is called for pattern matching
- Check for any lazy loading patterns to follow
- Verify the import path resolution (should work with current exports)
- Look for any cleanup or teardown patterns to match
