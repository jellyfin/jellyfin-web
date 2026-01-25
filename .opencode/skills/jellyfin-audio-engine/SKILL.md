---
name: jellyfin-audio-engine
description: Capture the Rust/WASM audio chain, crossfade preload strategy, and FX send architecture so audio tweaks stay seamless.
---

## What I do

- Describe the dual preload strategy (full preload for queued tracks, streaming mode for one-offs) and how `queueStore` drives the decision.
- Summarize the crossfade controller, preload handler/manager, and master audio logic that democratize smooth fade-ins and crossfades.
- Explain the DJ-style FX send architecture (notch filter, FX sends, FX busses, reverb/echo) that the audio chain exposes through `crossfadeWithFX` nodes.

## When to use me

- Updating playback behavior that touches crossfade timing, preload strategy, or queue-aware loading.
- Adding FX controls, notch filters, or DJ channel strip state so UI knobs connect to the audio pipeline.
- Extending the audio chain (gain nodes, worklets, synchronization) with zero-glitch transitions.

## Architecture notes

- Preloading uses `preload='auto'`, image + peak buffering, and 10-15s timeouts for queue members; streaming mode restricts metadata/image/peak loads.
- FX sends split the crossfade output into master, send1, send2, and connect to FX busses that manage wet/dry mix, effects chaining, and knob-friendly actions.
- State is persisted via stores (audioStore, fxStore) that expose normalized levels, notch settings, crossfade curves, and send levels; use `setTargetAtTime`/low-latency ramps for glitch-free updates.
- Tests cover preload handlers, crossfade controllers, FX nodes, and integration scenarios to guard against artifacts.
