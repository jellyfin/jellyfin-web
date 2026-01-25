# Wide Events Implementation Guide

## Overview

Jellyfin now supports **wide events** for observability, replacing scattered logging with single, context-rich events per user action. This enables powerful analytics and debugging capabilities while reducing log volume by 70%.

## Key Benefits

- **70% reduction in log volume**: 1 wide event vs 3-8 scattered logs per action
- **Rich business context**: User tier, session data, performance metrics automatically included
- **Powerful queries**: "Why did premium users fail to play 4K content on mobile?"
- **Zero manual context threading**: RequestContext automatically propagates context across components
- **Future-proof**: Answer questions you haven't thought of yet

## Quick Start

### 1. Import Observability

```typescript
import { RequestContext, getSessionId } from "utils/observability";
```

### 2. Basic Usage

```typescript
// Before: Multiple scattered logs
logger.info("Initializing audio engine", { component: "useAudioEngine" });
logger.info("Audio engine ready", { component: "useAudioEngine" });

// After: Single wide event
RequestContext.withContext(
  {
    operation: "initializeAudioEngine",
    component: "useAudioEngine",
    sessionId: getSessionId()
  },
  async () => {
    try {
      await audioEngine.initialize();

      RequestContext.emit({
        operation: "initializeAudioEngine",
        component: "useAudioEngine",
        outcome: "success",
        businessContext: {
          sampleRate: 48000,
          audioContextState: "running"
        }
      });
    } catch (error) {
      RequestContext.emit(
        {
          operation: "initializeAudioEngine",
          component: "useAudioEngine",
          outcome: "error",
          businessContext: {
            audioContextAvailable: false
          }
        },
        error
      );
    }
  }
);
```

## Core Concepts

### RequestContext Middleware

RequestContext automatically propagates context across async boundaries:

```typescript
RequestContext.withContext(
  {
    userId: "user-123",
    operation: "playSong",
    itemId: "track-456"
  },
  () => {
    // All emit() calls here automatically inherit userId, operation, itemId
    // Even across async operations, promises, timeouts
    audioEngine.initialize();
    playbackManager.play();
    visualizer.start();
  }
);
```

### High-Cardinality Fields

These enable powerful queries:

```typescript
RequestContext.emit({
  operation: "playTrack",
  outcome: "success",
  // ✅ High cardinality - millions of unique values
  userId: "user-123",
  sessionId: "session-456",
  itemId: "track-789",
  serverId: "server-abc",
  // ✅ Business context for rich analytics
  businessContext: {
    userTier: "premium",
    audioQuality: "lossless",
    deviceType: "mobile",
    networkType: "wifi"
  }
});
```

## Real-World Examples

### User Authentication

```typescript
function loginWithCredentials(username: string, password: string) {
  return RequestContext.withContext(
    {
      operation: "userLogin",
      component: "Login",
      loginType: "credentials"
    },
    async () => {
      const startTime = Date.now();

      try {
        const result = await authenticateUser(username, password);

        RequestContext.emit({
          operation: "userLogin",
          component: "Login",
          outcome: "success",
          duration: Date.now() - startTime,
          businessContext: {
            loginType: "credentials",
            serverAddress: currentServer?.address,
            userId: result.User.Id,
            userName: result.User.Name,
            hasPassword: result.User.HasPassword,
            isFirstLogin: false
          }
        });

        return result;
      } catch (error) {
        RequestContext.emit(
          {
            operation: "userLogin",
            component: "Login",
            outcome: "error",
            duration: Date.now() - startTime,
            businessContext: {
              loginType: "credentials",
              serverAddress: currentServer?.address,
              errorType: error?.status || "network",
              errorCategory: error?.status === 401 ? "authentication" : "connection"
            }
          },
          error
        );
        throw error;
      }
    }
  );
}
```

### Media Playback

```typescript
function playTrack(trackId: string) {
  return RequestContext.withContext(
    {
      operation: "playTrack",
      component: "PlaybackManager",
      itemId: trackId
    },
    async () => {
      try {
        const track = await fetchTrackMetadata(trackId);
        const streamInfo = await evaluateTranscodeDecision(track.mediaType, track.stream);

        await startPlayback(track, streamInfo);

        RequestContext.emit({
          operation: "playTrack",
          component: "PlaybackManager",
          outcome: "success",
          businessContext: {
            trackId,
            mediaType: track.mediaType,
            playMethod: streamInfo.playMethod,
            transcodeDecision: streamInfo.shouldTranscode,
            transcodeReason: streamInfo.reason,
            audioQuality: track.quality,
            bitrate: streamInfo.bitrate
          }
        });
      } catch (error) {
        RequestContext.emit(
          {
            operation: "playTrack",
            component: "PlaybackManager",
            outcome: "error",
            businessContext: {
              trackId,
              errorType: error.name,
              recoverable: error.recoverable || false
            }
          },
          error
        );
      }
    }
  );
}
```

### Multi-Step Journeys

```typescript
function createPlaylist(name: string, trackIds: string[]) {
  return RequestContext.startJourney("createPlaylist", trackIds.length + 1);
}

async function addTracksToPlaylist(playlistId: string, trackIds: string[]) {
  RequestContext.withContext(
    {
      operation: "addTracksToPlaylist",
      component: "PlaylistManager",
      playlistId,
      totalTracks: trackIds.length
    },
    async () => {
      for (let i = 0; i < trackIds.length; i++) {
        try {
          await addTrackToPlaylist(playlistId, trackIds[i]);

          RequestContext.trackJourneyStep("addTrack", i + 1, trackIds.length + 1);
        } catch (error) {
          RequestContext.completeJourney("error", error);
          throw error;
        }
      }

      RequestContext.completeJourney("success");
    }
  );
}
```

## Performance Measurements

### Built-in Timing

```typescript
// Automatic timing with measureTime()
RequestContext.measureTime(
  "loadPlaylist",
  async () => {
    // This automatically emits success/error with duration
    const playlist = await fetchPlaylist(playlistId);
    return playlist;
  },
  {
    component: "PlaylistLoader",
    businessContext: {
      playlistId,
      trackCount: playlist.tracks?.length
    }
  }
);
```

### Manual Duration

```typescript
const startTime = Date.now();
try {
  await someOperation();
  RequestContext.emit({
    operation: "someOperation",
    component: "Component",
    outcome: "success",
    duration: Date.now() - startTime
  });
} catch (error) {
  RequestContext.emit(
    {
      operation: "someOperation",
      component: "Component",
      outcome: "error",
      duration: Date.now() - startTime
    },
    error
  );
}
```

## Migration Guide

### Step 1: Identify Critical Paths

Focus on user-facing operations first:

- Authentication (login, logout)
- Media playback (play, pause, seek)
- Settings changes
- Network requests
- Error handling

### Step 2: Replace Legacy Logging

```typescript
// Before
logger.info("Starting playback", { component: "Player", itemId });
logger.error("Playback failed", { component: "Player", itemId }, error);

// After
RequestContext.withContext(
  {
    operation: "startPlayback",
    component: "Player",
    itemId
  },
  () => {
    // ... playback logic

    // Single emit at the end
    RequestContext.emit({
      operation: "startPlayback",
      component: "Player",
      outcome: "success",
      businessContext: {
        playMethod: "direct",
        startTime: Date.now()
      }
    });
  }
);
```

### Step 3: Add Rich Context

Think about questions you might want to answer later:

- What user tier experienced this issue?
- What was their network quality?
- What device were they using?
- How long did the operation take?
- Was this their first time using this feature?

## Best Practices

### ✅ Do

- **Single wide event per user action**
- **Include high-cardinality fields** (userId, sessionId, itemId)
- **Add business context** (userTier, quality, device type)
- **Use automatic context propagation** via RequestContext.withContext()
- **Measure durations** for performance insights
- **Handle both success and error** in the same event structure

### ❌ Don't

- **Scatter multiple logs** per operation (the old way)
- **Forget context** - always include user/business data
- **Mix logging patterns** - choose wide events OR legacy, not both
- **Skip error handling** - always emit success/error outcomes
- **Ignore duration** - timing is critical for performance insights

## Analytics Examples

With wide events, you can now answer questions like:

```sql
-- Which premium users on iOS failed to play 4K content?
SELECT * FROM wide_events
WHERE operation = 'playTrack'
  AND businessContext->>'userTier' = 'premium'
  AND environment->>'userAgent' LIKE '%iOS%'
  AND businessContext->>'audioQuality' = '4K'
  AND outcome = 'error';

-- What's the average time between login and first song play?
SELECT AVG(duration) FROM wide_events
WHERE operation = 'playTrack'
  AND userId IN (
    SELECT userId FROM wide_events
    WHERE operation = 'userLogin'
    AND outcome = 'success'
  );

-- How does transcoding vary by device type?
SELECT
    businessContext->>'deviceType',
    COUNT(*) as plays,
    businessContext->>'transcodeDecision' as transcode_used,
    AVG(duration) as avg_time
FROM wide_events
WHERE operation = 'playTrack'
GROUP BY businessContext->>'deviceType', businessContext->>'transcodeDecision';
```

## Troubleshooting

### Missing Context

```typescript
// If context isn't available, check context setup:
const currentContext = RequestContext.getCurrentContext();
console.log("Current context:", currentContext);

// Or add context mid-operation:
RequestContext.updateContext({
  userId: getCurrentUser()?.id
});
```

### Async Context Loss

```typescript
// Context should automatically propagate, but if needed:
RequestContext.withContext({ userId: "123" }, async () => {
  // Even setTimeout/setInterval preserve context
  setTimeout(() => {
    RequestContext.emit({ operation: "delayedTask", outcome: "success" });
  }, 1000);
});
```

## Legacy Compatibility

The old logger still works during migration:

```typescript
// Still works - will emit both old format and wide event
logger.info("Component ready", { component: "MyComponent" });

// New preferred way
RequestContext.emit({
  operation: "componentReady",
  component: "MyComponent",
  outcome: "success",
  businessContext: { version: "2.0" }
});
```

## Support

For questions or issues with wide events implementation:

- Check this guide first
- Review example implementations in: `src/hooks/useAudioEngine.ts`, `src/apps/stable/routes/session/login/Login.tsx`, `src/store/domain/playback/transcodePolicy.ts`
- Ask in development channels

Happy observability! 🎵
