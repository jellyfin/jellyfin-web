# Audio System Technical Documentation

## Overview

The Jellyfin Web audio system provides sophisticated playback capabilities with crossfading, volume normalization, synchronization, and visualization support. This document details the technical architecture, component lifecycles, and interaction patterns.

## Audio Chain Architecture

### Complete Audio Processing Pipeline

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   HTMLMediaElement │ → │ MediaElementAudio │ → │   DelayNode      │ → │ Normalization   │ → │  CrossfadeGain  │
│   (Source)        │    │ SourceNode       │    │ (Visualizer Sync)│    │ GainNode        │    │ Node           │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
                                                                                                           │
                                                                                                           ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  MasterMixer    │ → │   Dynamics      │ → │   AudioWorklet   │ → │   AudioContext   │ → │   Speakers      │
│   GainNode      │    │   Compressor   │    │   Limiter        │    │   Destination   │    │   (Output)     │
│ (User Volume)   │    │   (Fallback)   │    │   (Primary)      │    │                 │    │                │
└─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Node Responsibilities

#### MediaElementAudioSourceNode
- **Purpose**: Bridges HTML5 media elements to Web Audio API
- **Lifecycle**: Created per media element, destroyed when element is removed
- **Connections**: Single output to delay node or normalization gain node
- **Behavior**: Passes raw audio data from media element to processing chain

#### DelayNode (Optional)
- **Purpose**: Synchronizes audio with visualizer rendering
- **Configuration**: 0.1 second delay for WaveSurfer visualizer compatibility
- **Conditional**: Only present when `visualizerSettings.waveSurfer.enabled`
- **Bus Registration**: Added to `delayNodeBus[]` for crossfade cleanup

#### NormalizationGainNode
- **Purpose**: Applies per-track/album volume normalization
- **Control**: `rampPlaybackGain()` function with dB-to-linear conversion
- **Persistence**: Maintains normalization levels throughout track lifecycle
- **Isolation**: Unaffected by crossfading or user volume controls

#### CrossfadeGainNode
- **Purpose**: Handles crossfading automation between tracks
- **Automation**: Exponential ramp curves for smooth transitions
- **Bus Registration**: Added to `audioNodeBus[0]` for crossfade targeting
- **State**: Resets to 1.0 (unity gain) for normal playback

#### MasterMixer GainNode
- **Purpose**: Global user volume control and final mixing
- **Control**: User volume slider affects `masterAudioOutput.mixerNode.gain`
- **Scope**: Affects entire audio output regardless of source
- **Smoothing**: `setTargetAtTime()` with 0.2s time constant for smooth changes

#### DynamicsCompressor/Limiter
- **Purpose**: Prevents audio clipping and maintains consistent dynamics
- **Implementation**: AudioWorklet preferred, DynamicsCompressor fallback
- **Configuration**:
  - Threshold: -1 dB (AudioWorklet) / -0.8 dB (Compressor)
  - Ratio: 20:1
  - Attack: 0.003 seconds
  - Release: 0.25 seconds

## Component Lifecycles

### AudioNodeBundle Lifecycle

#### Creation Phase
1. **Initialization**: `createNodeBundle()` called when media element needs audio processing
2. **Node Creation**:
   - `MediaElementAudioSourceNode` from media element
   - `NormalizationGainNode` with initial normalization value
   - `CrossfadeGainNode` set to unity gain
   - `DelayNode` (conditional for visualizer)
3. **Chain Assembly**: Nodes connected in series to master mixer
4. **Bus Registration**: Crossfade gain node added to `audioNodeBus[]`

#### Active Playback Phase
1. **Normalization Application**: `rampPlaybackGain()` sets normalization level
2. **Crossfade Participation**: Node becomes target for crossfade automation
3. **User Volume Application**: Master mixer affects entire output
4. **Visualizer Sync**: Delay node maintains A/V synchronization

#### Cleanup Phase
1. **Disconnection**: All audio nodes disconnected from graph
2. **Bus Removal**: Nodes removed from `audioNodeBus[]` and `delayNodeBus[]`
3. **Resource Release**: WeakMap entry removed, memory freed
4. **Element Association**: HTMLMediaElement can be garbage collected

### Track Lifecycle States

#### 1. Initialization State
```
State: PRE_LOAD
Audio Nodes: None
Playback: Stopped
UI: Loading indicators
```

#### 2. Ready State
```
State: READY
Audio Nodes: Bundle created, connected
Playback: Can start immediately
UI: Play button enabled
```

#### 3. Playing State
```
State: PLAYING
Audio Nodes: Active in chain
Normalization: Applied
Crossfade: Eligible
UI: Progress updating
```

#### 4. Crossfading State
```
State: CROSSFADING
Audio Nodes: Gain automation active
Normalization: Preserved
Crossfade: Exponential fade to 0.01
UI: Transition indicators
```

#### 5. End State
```
State: ENDED
Audio Nodes: Disconnected, cleaned up
Playback: Stopped
UI: Next track loaded
```

## Playback Functionality Interactions

### Play Operation Sequence

1. **User Action**: Play button clicked or auto-advance triggered
2. **Validation**: Check player state and permissions
3. **Crossfade Check**: `hijackMediaElementForCrossfade()` if crossfading enabled
4. **Stream Loading**: `changeStream()` fetches media and creates audio nodes
5. **Playback Start**: `playInternal()` with optional delay for crossfade timing
6. **Progress Tracking**: `timeupdate` events trigger UI updates and crossfade detection

### Crossfade Detection & Execution

#### Automatic Crossfade Trigger
```javascript
// In onPlaybackTimeUpdate()
if (timeRunningOut(player)) {
    // Track ending detected
    self.nextTrack(); // Triggers crossfade
}
```

#### Manual Crossfade Trigger
```javascript
// User clicks next/previous
if (shouldCrossfade) {
    hijackMediaElementForCrossfade(true); // Manual flag
    // Delay next track start for crossfade timing
}
```

#### Crossfade Execution Phases

1. **Hijack Phase** (Synchronous):
   - Element renamed to 'crossFadeMediaElement'
   - Audio nodes registered in buses
   - Playback controls overridden

2. **Sustain Phase** (Timeout: `xDuration.sustain * 1000`):
   - UI controls re-enabled
   - Crossfade state reset
   - Ready for next track

3. **Fade Phase** (Web Audio Automation):
   - Exponential ramp from current gain to 0.01
   - Duration: `xDuration.fadeOut` seconds

4. **Cleanup Phase** (Timeout: fade completion):
   - Audio nodes disconnected
   - Element removed from DOM
   - Resources freed

### Volume Control Interactions

#### User Volume Changes
```javascript
// Affects only master mixer
masterAudioOutput.mixerNode.gain.setTargetAtTime(
    volumeLevel, // 0.0 to 1.0
    audioContext.currentTime,
    0.2 // 200ms smoothing
);
```

#### Normalization Application
```javascript
// Affects normalization gain node
normalizationGainNode.gain.cancelScheduledValues(currentTime);
normalizationGainNode.gain.exponentialRampToValueAtTime(
    Math.pow(10, dBValue / 20), // dB to linear
    currentTime + rampDuration
);
```

#### Crossfade Automation
```javascript
// Affects crossfade gain node
crossfadeGainNode.gain.exponentialRampToValueAtTime(
    0.01, // Near silence
    audioContext.currentTime + xDuration.fadeOut
);
```

### Synchronization Mechanisms

#### SyncManager Operation
```typescript
class SyncManager {
    private elements = new Map<HTMLMediaElement, number>();
    private masterTime = 0;

    registerElement(element, startTime) {
        this.elements.set(element, startTime);
    }

    startSync() {
        setInterval(() => this.checkSync(), 100); // 100ms checks
    }

    checkSync() {
        // Calculate average playback position
        // Apply corrections to drifting elements
        // Handle buffering states
    }
}
```

#### Correction Strategies

1. **Rate Adjustment** (< 500ms drift):
   ```javascript
   element.playbackRate = drift > 0 ? 0.99 : 1.01;
   setTimeout(() => element.playbackRate = 1.0, 500);
   ```

2. **Seeking** (> 500ms drift, buffered):
   ```javascript
   element.currentTime = targetTime;
   ```

3. **Buffering Awareness**:
   - Only seek if `bufferedAhead > 2.0` seconds
   - Skip corrections during crossfade operations
   - Prevent seeking during insufficient buffer

## Error Handling & Recovery

### Audio Context Failures
```javascript
try {
    const audioContext = new AudioContext();
    // Initialize audio chain
} catch (error) {
    console.warn('Web Audio API not supported:', error);
    // Fallback to HTML5 audio only
}
```

### Node Creation Failures
```javascript
function createNodeBundle(elem) {
    try {
        const sourceNode = audioContext.createMediaElementSource(elem);
        // Create remaining nodes
    } catch (error) {
        console.error('Failed to create audio nodes:', error);
        return null; // Graceful degradation
    }
}
```

### Crossfade Recovery
```javascript
function cancelCrossfadeTimeouts() {
    // Clear all pending timeouts
    // Reset crossfade state
    // Restore normal playback controls
}
```

## Performance Considerations

### Memory Management
- **WeakMap Usage**: `elementNodeMap` prevents memory leaks
- **Bus Cleanup**: Nodes removed from buses after crossfade completion
- **Element Lifecycle**: Audio nodes destroyed when media elements are removed

### CPU Optimization
- **Worklet Usage**: AudioWorklet for off-main-thread processing
- **Automation Efficiency**: Web Audio API handles timing precisely
- **Event Throttling**: Progress updates batched, not per-frame

### Network Efficiency
- **Buffering Awareness**: Crossfades delayed for insufficient buffer
- **Stream Management**: Single active stream during crossfades
- **Cache Utilization**: Random sort cache reduces API calls

## Browser Compatibility

### AudioWorklet Support
- **Modern Browsers**: Full AudioWorklet support with all worklets
- **Legacy Browsers**: Fallback to native Web Audio API nodes
- **Detection**: Runtime capability checking before worklet loading

### Web Audio API Requirements
- **Baseline**: `AudioContext` and `GainNode` support
- **Enhanced**: `AudioWorklet`, `DynamicsCompressorNode`
- **Fallbacks**: Graceful degradation for unsupported features

## Testing & Validation

### Unit Test Coverage
- Audio node creation and destruction
- Crossfade timing and automation
- Volume control interactions
- Synchronization accuracy
- Error condition handling

### Integration Test Scenarios
- Complete playback lifecycle with crossfading
- Manual vs automatic crossfade triggers
- Volume normalization preservation
- Multi-track transitions
- Error recovery scenarios

## Future Enhancements

### Advanced Crossfading
- **Multi-band Crossfading**: Frequency-specific fade behaviors
- **Gapless Playback**: Zero-crossing detection for seamless transitions
- **Spatial Audio**: 3D positioning during crossfades

### Enhanced Synchronization
- **NTP-based Sync**: Network time protocol for distributed playback
- **Adaptive Correction**: Machine learning-based drift prediction
- **Multi-device Groups**: Synchronized playback across multiple clients

### Audio Processing
- **Real-time EQ**: Dynamic equalization based on content analysis
- **Loudness Normalization**: Advanced loudness measurement and correction
- **Spatial Enhancement**: Virtual surround sound processing

This documentation provides the technical foundation for understanding, maintaining, and extending the Jellyfin Web audio system.