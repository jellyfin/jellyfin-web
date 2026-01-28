# Advanced Features Implementation Plan - Phase C

**Status**: Ready for Implementation
**Last Updated**: 2026-01-28
**Base**: Built on Phase 1 & 2 - Fully working crossfade + preload system

---

## Overview

This phase adds professional DJ-style controls, advanced visual effects, and multi-zone synchronization to the playback system. Built on top of the tested crossfade architecture.

---

## Feature Set C: Advanced Features (3 Major Tracks)

### Track C1: DJ Channel Strip UI ⭐ HIGH PRIORITY

**Purpose**: Professional DJ deck controls for mixing and effects

#### Component: `DJChannelStrip.tsx`

**Features**:
- **Deck Identification**:
  - Left deck (A) vs Right deck (B)
  - Visual distinction with colors
  - Deck name display

- **Fader Section**:
  - Main volume fader (0-100%)
  - Linked gain reduction display
  - Peak meter animation
  - Mono/Stereo indicator

- **3-Band EQ**:
  - Low: -6 to +6 dB (100-500 Hz)
  - Mid: -6 to +6 dB (500-2k Hz)
  - High: -6 to +6 dB (2k-20k Hz)
  - Kill switch for each band (mute)
  - Real-time frequency response curve (optional)

- **Effects Section**:
  - FX Send 1 (0-100%)
  - FX Send 2 (0-100%)
  - Notch Filter toggle + frequency control
  - Visual feedback: active state, level meters

- **Monitoring**:
  - PFL (Pre-Fader Listen) button
  - Cue button (silent return monitoring)
  - Solo indicator

- **Status Indicators**:
  - Signal flow LED
  - Clipping indicator
  - Track info mini-display

**Visual Design**:
- Vertical layout matching DJ mixer conventions
- Dark theme with neon accents (matching Everforest Dark palette)
- Smooth animations on fader movements
- Tactile visual feedback

**Files to Create**:
- `src/components/dj/DJChannelStrip.tsx`
- `src/components/dj/DJChannelStrip.css.ts`
- `src/components/dj/__stories__/DJChannelStrip.stories.tsx`
- `src/components/dj/DJChannelStrip.test.tsx`

---

#### Component: `DJMasterFader.tsx`

**Features**:
- Crossfader (left to right)
- Crossfade curve selector:
  - Linear (constant power)
  - Logarithmic (sharp cuts)
  - Scalecut (DJ scratch standard)
- Master output fader
- Frequency spectrum visual feedback
- Clipping protection

**Files to Create**:
- `src/components/dj/DJMasterFader.tsx`
- `src/components/dj/DJMasterFader.css.ts`
- `src/components/dj/__stories__/DJMasterFader.stories.tsx`

---

#### Component: `DJMixerPanel.tsx` (Container)

**Purpose**: Unified DJ mixer interface combining:
- Left Channel Strip (Deck A)
- Master Fader Section
- Right Channel Strip (Deck B)
- Visual meters and indicators

**Files to Create**:
- `src/components/dj/DJMixerPanel.tsx`
- `src/components/dj/DJMixerPanel.css.ts`
- `src/components/dj/__stories__/DJMixerPanel.stories.tsx`

---

### Track C2: Advanced Visualizer Effects ⭐ MEDIUM PRIORITY

**Purpose**: Enhanced visual feedback for DJ mixing and track analysis

#### Feature: Spectrum Analyzer 3D

**Component**: `SpectrumAnalyzer3D.tsx`

**Capabilities**:
- Real-time 3D frequency spectrum
- 32-256 frequency bands (user selectable)
- Bar height = frequency magnitude
- Color gradient = frequency range
- Responsive to audio dynamics
- Optional logarithmic scale
- Smoothing algorithms (peak hold, exponential average)

**Uses**:
- Visual feedback during EQ adjustments
- Track comparison between decks
- Frequency balance monitoring

**Files**:
- `src/ui-primitives/organisms/visualizers/SpectrumAnalyzer3D.tsx`
- `src/ui-primitives/organisms/visualizers/SpectrumAnalyzer3D.css.ts`
- `src/ui-primitives/__stories__/organisms/SpectrumAnalyzer3D.stories.tsx`

---

#### Feature: Waveform Peak Display

**Component**: `WaveformPeakDisplay.tsx`

**Enhancements to existing WaveSurfer**:
- Pre-computed peak data visualization
- Dual-channel stereo display (L/R separation)
- Click-to-seek functionality
- Loop region highlighting
- Cue point markers
- Waveform zoom (100% to 10000% playback time)
- Playhead cursor with time display

**Performance Optimization**:
- Canvas rendering (not SVG) for smooth animation
- Peak binning for large files
- WebGL acceleration (optional)
- Incremental rendering

**Files**:
- `src/ui-primitives/organisms/visualizers/WaveformPeakDisplay.tsx`
- `src/ui-primitives/organisms/visualizers/WaveformPeakDisplay.css.ts`
- `src/ui-primitives/__stories__/organisms/WaveformPeakDisplay.stories.tsx`

---

#### Feature: Real-Time Frequency Response Curve

**Component**: `FrequencyResponseCurve.tsx`

**Purpose**: Visual representation of applied EQ filters

**Features**:
- Real-time curve update as EQ changes
- Low/Mid/High band curves
- Combined curve display
- Phase response (optional, advanced)
- Magnitude response in dB
- Interactive: click to adjust bands

**Uses**:
- See EQ impact immediately
- Reference tone shaping
- Training tool for EQ technique

**Files**:
- `src/components/dj/FrequencyResponseCurve.tsx`
- `src/components/dj/FrequencyResponseCurve.css.ts`
- `src/components/dj/__stories__/FrequencyResponseCurve.stories.tsx`

---

#### Feature: Track Energy Graph

**Component**: `TrackEnergyGraph.tsx`

**Purpose**: Analyze track energy structure for beat matching

**Displays**:
- Energy level over time
- Peaks (drops, builds)
- Estimated BPM line
- Key sections (intro, verse, chorus, outro)
- Transition points (suggested crossfade points)

**Uses**:
- Visual guide for track mixing
- Beat matching assistance
- DJ transition planning

**Files**:
- `src/components/dj/TrackEnergyGraph.tsx`
- `src/components/dj/TrackEnergyGraph.css.ts`

---

### Track C3: Multi-Zone Playback Sync ⭐ LOWER PRIORITY

**Purpose**: Synchronized playback across multiple devices (whole-home audio)

#### Architecture

**Problem**: Users want to play same/synced music across multiple rooms/devices

**Solution**: Master-Slave synchronization with atomic playback

#### Components & Logic

**`MultiZoneController.tsx`**:
- Master device selector
- Zone list display
- Playback state viewer
- Network status indicator

**`ZonePlayerSync.ts`** (Logic):
- Master clock emission
- Slave clock synchronization
- Drift detection & correction
- Network latency accounting
- Failover handling

**`SyncLossRecovery.ts`**:
- Automatic re-sync when connection lost
- Gradual volume fade on loss
- Resumption logic

---

#### Key Implementation Details

**Master Device**:
- Broadcasts clock signal every 100ms
- Includes: currentTime, playbackRate, URI, playlistIndex
- Uses WebSocket or HTTP polling

**Slave Devices**:
- Receive clock, calculate drift
- Apply playbackRate correction (0.99 - 1.01x)
- Seek if drift > 0.5s
- Log sync metrics

**Network Tolerance**:
- Acceptable latency: ±500ms
- Jitter smoothing: 3-point moving average
- Timeout: 5 seconds (revert to local playback)

**Store Integration**:
```typescript
interface MultiZoneState {
  mode: 'standalone' | 'master' | 'slave';
  masterId: string; // device ID
  zones: ZoneInfo[];
  syncActive: boolean;
  syncHealth: {
    avgDrift: number;
    correctionCount: number;
    lostPackets: number;
  }
}
```

---

## Implementation Roadmap

### Phase C1: DJ Channel Strip (Estimated: 6-8 hours)

**Step 1**: Create DJ component structure
- `src/components/dj/` directory
- Base styles and theme integration
- Storybook setup

**Step 2**: Build individual controls
- Volume fader component (reusable)
- EQ knobs (3-band)
- FX send sliders
- Toggle switches

**Step 3**: Implement DJChannelStrip
- Integrate controls
- Connect to FX store
- Add animations
- Visual feedback (meters, LEDs)

**Step 4**: Build DJMasterFader
- Crossfader with curves
- Master output fader
- Curve selection UI
- Real-time frequency display

**Step 5**: Create DJMixerPanel container
- Layout left/right channel strips
- Add visual separation
- Responsive design
- Mobile adaptation

**Step 6**: Storybook & Tests
- Interactive stories for each control
- Unit tests for state management
- Integration tests for fader interactions

---

### Phase C2: Advanced Visualizers (Estimated: 8-10 hours)

**Step 1**: Spectrum Analyzer 3D
- Web Audio API frequency data extraction
- Canvas rendering
- Color mapping
- Performance optimization

**Step 2**: Waveform Peak Display
- Extend existing WaveSurfer component
- Peak data visualization
- Seek functionality
- Zoom controls

**Step 3**: Frequency Response Curve
- Real-time filter response calculation
- SVG or Canvas rendering
- Interactive band adjustment
- Live filter preview

**Step 4**: Track Energy Graph
- Audio analysis (offline processing)
- Energy envelope detection
- Peak finding algorithm
- BPM estimation integration

**Step 5**: Integration
- Add visualizer selection toggle
- Settings for each visualizer
- Performance monitoring
- Memory cleanup on unmount

---

### Phase C3: Multi-Zone Sync (Estimated: 10-12 hours)

**Step 1**: Architecture Design
- Define protocol (WebSocket vs HTTP polling)
- Clock message format
- Error scenarios
- Fallback behaviors

**Step 2**: Master Device Implementation
- Clock broadcaster
- Device discovery
- State synchronization
- Network error handling

**Step 3**: Slave Device Implementation
- Clock listener
- Drift calculation
- Playback correction
- Graceful sync loss

**Step 4**: UI Components
- Multi-zone controller
- Zone player list
- Sync status display
- Master selection dialog

**Step 5**: Store & Persistence
- Multi-zone state management
- User preferences (default master)
- Sync metrics tracking
- History logging

**Step 6**: Testing
- Simulate network conditions
- Test drift correction
- Multi-device scenarios
- Failover scenarios

---

## Success Criteria

### DJ Channel Strip
- ✅ All controls responsive and smooth
- ✅ Real-time EQ frequency response display
- ✅ FX sends properly route audio
- ✅ Performance: <16ms latency on UI updates
- ✅ 90%+ test coverage
- ✅ Storybook stories for all states

### Advanced Visualizers
- ✅ Smooth 60 FPS animation
- ✅ Responsive to audio changes (<100ms)
- ✅ Memory usage stable (no leaks)
- ✅ Works on mobile (reduced quality optional)
- ✅ 80%+ test coverage

### Multi-Zone Sync
- ✅ <1s sync acquisition time
- ✅ Maintains sync within ±500ms
- ✅ Handles network interruptions
- ✅ Graceful degradation
- ✅ Metrics logging for debugging

---

## Technical Dependencies

### Already Available ✅
- FX Send infrastructure (store + audio nodes)
- Web Audio API (context, analyzer)
- Crossfade timing logic
- Zustand state management
- CSS-in-JS (Vanilla Extract)
- Storybook setup

### To Add
- Three.js or Babylon.js (optional, for 3D visualizers)
- WebSocket support (Node.js/Express if needed)
- Canvas rendering utilities
- Performance monitoring library

---

## Architecture Decisions

### Why Canvas for Visualizers?
- SVG too slow for real-time updates (60 FPS)
- Canvas provides native 2D drawing
- WebGL optional for 3D (Three.js wrapper)
- Better performance on lower-end devices

### Why Separate DJ Components?
- Clear separation of concerns
- Reusable control components
- Can be added to existing UI
- Optional feature (not required for basic playback)

### Why MultiZone at End?
- Lowest priority (not core feature)
- Requires network architecture
- Can be added later without breaking changes
- Advanced use case (whole-home audio)

---

## Risk Mitigation

### Performance Risk
- **Mitigation**: WebWorker audio analysis, requestAnimationFrame throttling
- **Fallback**: Degraded visuals on low-end devices

### Sync Reliability Risk
- **Mitigation**: Test with simulated latency/packet loss
- **Fallback**: Automatic failover to standalone playback

### Browser Compatibility
- **Mitigation**: Feature detection, graceful degradation
- **Fallback**: Simplified UI for unsupported features

---

## Optional Enhancements (Later Phases)

- 🎹 MIDI controller support (CDJ-style)
- 🎯 Beatgrid visualization
- 🔄 Loop recording/manipulation
- 📊 Advanced audio analysis (key detection)
- 🎨 Custom visualizer themes
- 🌐 Cloud sync for settings
- 📱 Touch gesture controls (swipe faders)
- 🎧 Stereo headphone cueing

---

## Testing Strategy

### Unit Tests
- Component rendering
- Control value changes
- State management
- Calculations (EQ curves, sync drift)

### Integration Tests
- FX store integration
- Audio routing
- Cross-component communication
- Store persistence

### Performance Tests
- Canvas rendering frame rate
- Audio analyzer callback latency
- Memory usage during playback
- Network packet loss simulation

### E2E Tests
- Multi-zone sync scenarios
- Failover + recovery
- Real WebSocket communication
- Device synchronization

---

## Commit Strategy

**C1.1**: DJ Channel Strip components (fader, EQ, FX sends)
**C1.2**: DJMasterFader with crossfade curves
**C1.3**: DJMixerPanel container + styling
**C1.4**: DJChannelStrip tests + Storybook stories

**C2.1**: Spectrum Analyzer 3D
**C2.2**: Waveform Peak Display enhancements
**C2.3**: Frequency Response Curve
**C2.4**: Track Energy Graph + visualization tests

**C3.1**: MultiZone architecture + master device
**C3.2**: Slave device sync logic
**C3.3**: MultiZone UI components
**C3.4**: Integration + full test suite

---

## Next Steps

1. **Choose Focus Track**:
   - C1 (DJ UI) - Immediate visual impact
   - C2 (Visualizers) - Enhances existing features
   - C3 (Multi-Zone) - Advanced infrastructure

2. **Start with C1** (Recommended):
   - Builds on existing FX architecture
   - Clear UI requirements
   - Testable in isolation
   - Visual feedback for user

3. **Then C2**:
   - Leverages analysis data
   - Improves visual experience
   - Lower technical risk

4. **Finally C3**:
   - Most complex
   - Lowest priority for single-user
   - Can be skipped initially

---

## Questions for Product Owner

1. **DJ UI Priority**: How important is the DJ mixer interface?
   - Essential for DJs
   - Nice-to-have for casual users
   - Not needed initially

2. **Visualizer Focus**: Which visualizer matters most?
   - Spectrum analyzer (frequency analysis)
   - Waveform editor (navigation + loop points)
   - Energy graph (beat matching)
   - All equally important

3. **Multi-Zone Scope**: Is whole-home audio needed?
   - Now
   - Later (Phase D+)
   - Not a priority

---

**Created**: 2026-01-28
**Base**: Playback System v1.0 (Phase 1 & 2 complete)
**Status**: Ready for implementation
