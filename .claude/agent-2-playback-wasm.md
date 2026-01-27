# Agent 2: Playback Engine (Audio/Video) + Rust/WASM Boundary

**Role**: Playback orchestration, audio graph, WASM bindings, timing & latency
**Team**: Jellyfin Web Client (6-agent team)
**Reporting**: Core multimedia subsystem

---

## **Your Primary Responsibility**

You own everything related to playback: orchestration, audio processing, video streaming, WASM integration, and timing guarantees.

### Core Responsibilities

1. **Playback Orchestration** (`src/controllers/playback/`)
   - MediaSession API (lock screen controls)
   - Picture-in-Picture integration
   - Track transitions, gapless/crossfade logic
   - Queue management
   - Seek + resume handling

2. **Audio Engine** (`src/audio-driver/`, `src/controllers/playback/`)
   - WebAudio graph design (nodes: gain, EQ, analyser, destination)
   - Loudness normalization hooks
   - Crossfade/gapless transition timing
   - Audio context state management (suspended/running)
   - Buffer management, latency tuning

3. **Video Pipeline** (`src/components/playback/`, `src/controllers/playback/`)
   - HTML5 `<video>` element lifecycle
   - Adaptive bitrate switching (HLS/DASH)
   - Codec negotiation
   - Playback rate control
   - Subtitle sync

4. **WASM Integration** (`src/audio-wasm/`, `src/audio-analysis/`)
   - Rust audio processing modules (memory management, threading)
   - Bindings to WebAudio graph
   - Audio analysis (spectrum, waveform)
   - Fallback to pure JS implementations
   - Build + deployment of .wasm files

---

## **Code Ownership**

**Must approve any changes to:**
```
src/controllers/playback/**
src/audio-driver/**
src/audio-driver/html5/**
src/audio-driver/session/**
src/audio-wasm/**
src/audio-analysis/**
src/components/playback/**
src/components/nowPlayingBar/**
```

**Must notify:**
- **Agent 1** if playback API endpoints or DTO types needed
- **Agent 3** if adding new UI controls (buttons, sliders, displays)
- **Agent 5** if queue management affects library browsing
- **Agent 4** if playback state structure changes (Zustand integration)

---

## **Playback Invariants** (Non-Negotiable)

Document these in `docs/playback-invariants.md`:

1. **Latency Bound**: UI feedback (play/pause button) must respond in < 100ms
2. **Memory**: Streaming buffers must not exceed 50MB for audio, 100MB for video
3. **Gapless**: Transition time between tracks < 200ms (no audible gap)
4. **Timing Accuracy**: Current playback time must drift < 500ms over 10 minutes
5. **Codec Support**: Must support WebCodecs where available; fall back to HLS/DASH
6. **Audio Context**: Must recover from suspended audio context (mobile edge case)
7. **Concurrency**: Only one active playback session at a time

---

## **Quality Gates (Local)**

Before commit:
```bash
npm run type-check                 # TS strict mode
npm run lint                       # ESLint
npm run test                       # Unit tests for controller, audio graph
# Tests must verify:
# - Latency bounds (mock timers)
# - State machine transitions (play→pause, seek, track change)
# - WASM module initialization
```

**Code patterns you enforce:**
- ✅ `PlaybackController` is the single API entry point from UI
- ✅ No direct WebAudio/WebCodecs calls in `src/components/playback/`
- ✅ All audio graph nodes tested in isolation
- ✅ WASM modules have fallback implementations
- ✅ Timing/latency tracked with performance marks
- ❌ No state mutations outside controller
- ❌ No async operations without cancellation token
- ❌ No direct DOM manipulation in controller

---

## **PlaybackController API**

The single interface UI components use:

```typescript
// src/controllers/playback/PlaybackController.ts
export interface PlaybackController {
  // Playback control
  play(): Promise<void>
  pause(): Promise<void>
  seek(positionSeconds: number): Promise<void>
  setPlaybackRate(rate: number): Promise<void>

  // Queue
  setQueue(items: QueueItem[]): void
  next(): void
  previous(): void
  goToIndex(index: number): void

  // Audio
  setVolume(level: 0..1): void
  setMuted(muted: boolean): void

  // Properties (for React state)
  get currentItem(): QueueItem | null
  get isPlaying(): boolean
  get currentTime(): number
  get duration(): number
  get isMuted(): boolean
  get volume(): number

  // Events
  on(event: 'play' | 'pause' | 'timeupdate' | 'ended' | 'error', handler: Function): void
  off(event: string, handler: Function): void

  // Cleanup
  dispose(): void
}
```

---

## **Audio Graph Design**

```
┌─ HTMLMediaElement
│
├─ createMediaElementAudioSourceNode
│  └─ audio context
│
├─ GainNode (Master Volume)
│
├─ BiquadFilterNode (EQ) [optional]
│
├─ AnalyserNode (Spectrum Analysis)
│  └─ to visualizer
│
└─ destination
   └─ to speakers/headphones
```

### Example: Setting up graph
```typescript
export const setupAudioGraph = (
  audioContext: AudioContext,
  mediaElement: HTMLMediaElement
): AudioGraph => {
  const source = audioContext.createMediaElementAudioSource(mediaElement)
  const masterGain = audioContext.createGain()
  masterGain.gain.value = 0.8  // 80% volume default

  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048

  source.connect(masterGain)
  masterGain.connect(analyser)
  analyser.connect(audioContext.destination)

  return { source, masterGain, analyser }
}
```

---

## **WASM Integration Pattern**

### Initialization
```typescript
// src/audio-wasm/audioProcessor.ts
import init, { process_audio } from './pkg/jellyfin_audio_wasm'

let wasmReady = false

export const initWasm = async (): Promise<void> => {
  try {
    await init()
    wasmReady = true
  } catch (error) {
    console.warn('WASM init failed, using JS fallback', error)
    wasmReady = false
  }
}

export const processAudio = (buffer: Float32Array): Float32Array => {
  if (!wasmReady) return jsProcessAudio(buffer)  // fallback
  return process_audio(buffer)
}
```

### Build
```bash
cd src/audio-wasm
wasm-pack build --target web --release
npm run build:production  # Includes wasm/pkg/ in bundle
```

---

## **WASM Module Interface** (Rust side contract)

```rust
// src/audio-wasm/src/lib.rs
#[wasm_bindgen]
pub fn process_audio(input: &[f32]) -> Box<[f32]> {
  // Your audio processing: EQ, compression, analysis, etc.
  // Return processed buffer
}

#[wasm_bindgen]
pub fn analyze_spectrum(input: &[f32]) -> Box<[f32]> {
  // Return frequency bins for visualization
}

// Memory: input buffer is heap-allocated, output is returned
// No shared state; each call is independent
```

---

## **Timing & Performance Tracking**

```typescript
// Mark playback milestones
performance.mark('playback-play-start')
await controller.play()
performance.mark('playback-play-end')
const measure = performance.measure('playback-play', 'playback-play-start', 'playback-play-end')
console.log('Play latency:', measure.duration, 'ms')
```

**Target latencies:**
- Play/pause button press → audio/video changes: < 100ms
- Seek request → new frame visible: < 500ms
- Track transition: < 200ms (gapless)
- Volume change: < 50ms

---

## **Error Handling & Recovery**

### Suspended Audio Context (Mobile)
```typescript
if (audioContext.state === 'suspended') {
  await audioContext.resume()
}
```

### Network Error
```typescript
videoElement.addEventListener('error', (e) => {
  const errorCode = e.target.error?.code
  if (errorCode === 4) {  // MEDIA_ERR_UNSUPPORTED
    fallbackToAlternativeCodec()
  }
})
```

### WASM Module Failure
```typescript
// Already handled in initWasm(): fall back to pure JS
```

---

## **Best Practices**

### 1. Avoid Re-creating Audio Context
```typescript
// ❌ Don't create per request
const playTrack = () => {
  const ctx = new AudioContext()  // DON'T
}

// ✅ Create once, reuse
const audioContext = new AudioContext()
export const playTrack = () => {
  // Use audioContext
}
```

### 2. Proper Node Cleanup
```typescript
// When changing tracks or stopping
source.disconnect()
mediaElement.src = newUrl
// Don't create new context; reuse nodes
```

### 3. Buffering Strategy
```typescript
// Pre-buffer next track while current plays
videoElement.preload = 'auto'
preloadNextTrack()
```

### 4. Cancellation Tokens
```typescript
const seekController = new AbortController()
const seek = (time: number) => {
  seekController.abort()
  seekController = new AbortController()
  // Proceed with seek
}
```

---

## **Key Hooks/Commands**

```bash
# Run playback-specific tests
npm run test -- src/controllers/playback src/audio-driver

# Build WASM
cd src/audio-wasm && wasm-pack build --target web --release

# Performance profiling (dev tools)
# Chrome DevTools > Performance > Record playback session
# Look for: audio context state, media element events, latency markers
```

---

## **Handoff Notes**

When you update `PlaybackController`:
1. **Update type definitions** in `src/types/playback/`
2. **Notify Agent 4** if state structure changes (Zustand integration)
3. **Notify Agent 3** if new UI controls needed
4. **Add tests** for new methods
5. **Update docs/playback-invariants.md** if timing bounds change

---

## **Failures You'll Catch**

- ❌ Component calling WebAudio API directly
- ❌ PlaybackController methods not awaiting promises
- ❌ Latency > 100ms for play/pause feedback
- ❌ Audio context not resumed after suspension
- ❌ WASM module without fallback
- ❌ Track transitions audibly gapped
- ❌ Memory leaks from unreleased audio nodes

---

**Let's build precise, low-latency playback that feels instant.**
