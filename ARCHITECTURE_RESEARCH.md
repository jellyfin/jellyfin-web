# Architecture Research Findings

## Music Visualizer Branch - Current State Analysis

**Updated:** January 18, 2026
**Branch:** music-visualizer

---

## Executive Summary

The codebase demonstrates sophisticated audio processing and thoughtful visual effects implementation. Key strengths include excellent lazy loading patterns and AudioWorklet architecture. Primary improvement opportunities exist in state management modernization, migrating to a unified Vite build system, and adopting Wasm-based audio processing for high-fidelity stability.

**Overall Assessment:** Solid foundation with a clear path toward a "cutting-edge" 2026 music player architecture.

---

## 1. Component Library & UI/UX

### Current Stack

| Library | Version | Usage |
|---------|---------|-------|
| MUI (Material-UI) | 6.4.12 | Primary component library |
| Emotion | 11.14.0 | CSS-in-JS styling |

### Recommendations (Cutting Edge)

**P1 - Shared Element Transitions (Framer Motion):**
Implement "Magic Move" transitions between the Mini-Player and the Full-Screen Visualizer.
- Use `layoutId` to morph album art between views.
- Use `AnimatePresence` for smooth route transitions.

**P2 - List Virtualization (TanStack Virtual):**
For libraries with 5,000+ items, standard rendering causes frame drops. 
- **Goal:** Maintain 60fps scrolling on mobile devices by recycling DOM nodes.

---

## 2. Animation & Visual Effects

### Current Implementation

| Library | Usage | Status |
|---------|-------|--------|
| butterchurn | WebGL-based visualizer | ✅ Primary |
| requestAnimationFrame | Visualizer rendering | ✅ Primary |

### Recommendations (Cutting Edge)

**P1 - React Three Fiber (R3F):**
While Butterchurn provides great legacy presets, R3F (Three.js) allows for modern, shader-based visuals (e.g., Apple Music "Gradients" or 3D Mesh deformation).
- **Dependency:** `@react-three/fiber`, `@react-three/drei`

**P2 - Reduced-Motion Support:**
```scss
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 3. Audio Engine Architecture

### Current Pipeline

```
MediaElement → SourceNode → [DelayNode] → NormalizationGainNode → CrossfadeGainNode → MasterMixer → Limiter → Output
```

### Recommendations (Cutting Edge)

**P1 - Wasm-Powered Audio Processing:**
Migrate `limiterWorklet.ts` and `biquadWorklet.ts` logic to **Rust/Wasm**.
- **Reason:** JavaScript GC (Garbage Collection) pauses on the audio thread can cause micro-stuttering. Wasm ensures deterministic execution time.

**P2 - AudioContext State Monitoring:**
```typescript
audioContext.onstatechange = () => {
  if (audioContext.state === 'interrupted') {
    // Handle Bluetooth disconnect or OS-level audio interruption
  }
};
```

---

## 4. State Management

### Current Approach: Hybrid (React Context + Globals)

### Recommendations (Cutting Edge)

**P1 - Unified State with Zustand:**
Replace mutable globals in `master.logic.ts` and `visualizers.logic.ts` with a central store.

```typescript
// Proposed Audio Store
export const useAudioStore = create<AudioState>((set) => ({
  playbackState: 'stopped',
  volume: 100,
  isCrossfading: false,
  actions: {
    play: () => set({ playbackState: 'playing' }),
    // ...
  }
}));
```

**P2 - TanStack Query (Server State):**
Maintain the current usage for API data, ensuring a strict split between "Server Cache" and "Player State".

---

## 5. Build System & Performance

### Current State
- Webpack for production/dev.
- Vite for testing.

### Recommendations (Cutting Edge)

**P1 - Full Vite Migration:**
Eliminate Webpack to leverage Vite's instant HMR and faster build times.
- This unifies the testing and development environments.
- Optimizes bundle splitting via Rollup.

**P2 - Bundle Optimization:**
- Implement `lodash-es` across the entire project (currently mixed).
- Use `import type` for TypeScript to ensure zero-cost abstractions.

---

## Priority Roadmap (Q1 2026)

1.  **State Consolidation:** Migrate Audio/Visualizer globals to Zustand.
2.  **Cinematic UI:** Implement Framer Motion transitions for the playback bar.
3.  **Stability:** Implement Wasm-based Limiter to prevent clipping without GC pauses.
4.  **Developer Velocity:** Complete the migration from Webpack to Vite.

---

## Conclusion

The project is well-positioned. By moving from a "Legacy Web" mindset (Webpack/Mutable Globals) to a "Modern Native-Web" mindset (Vite/Wasm/Zustand), the Jellyfin-Web music experience can match the performance of native desktop applications.
