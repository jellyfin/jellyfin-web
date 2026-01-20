# FX Send Architecture Implementation Guide

## Overview

This document outlines the file structure and implementation details for the DJ-style FX send architecture with notch filter, 2 FX busses, and crossfader integration.

## File Structure

```
src/components/audioEngine/
├── fx/
│   ├── index.ts                    # Main exports and types
│   ├── notchFilter.ts              # Notch filter with bypass
│   ├── fxSend.ts                   # CrossfadeGain with FX sends
│   ├── fxBus.ts                    # FX bus implementation
│   ├── reverbProcessor.ts          # Reverb effect
│   ├── echoProcessor.ts            # Echo/delay effect
│   └── types.ts                    # TypeScript interfaces
├── master.logic.ts                 # MODIFY: Integrate FX sends
├── crossfadeController.ts          # MODIFY: Pass FX send levels
└── index.ts                        # MODIFY: Export new modules
```

## Type Definitions (`src/components/audioEngine/fx/types.ts`)

```typescript
// FX Send Types
export interface FXSendConfig {
    send1Level: number;      // 0-1 (0% to 100%)
    send2Level: number;      // 0-1 (0% to 100%)
}

export interface NotchFilterConfig {
    frequency: number;       // 20-20000 Hz
    resonance: number;       // 0.1-20 Q factor
    enabled: boolean;        // Bypass toggle
}

export interface FXBusConfig {
    wetMix: number;          // 0-1 (0% to 100%)
    returnLevel: number;     // 0-1 (0% to 100%)
    enabled: boolean;
}

export interface ReverbConfig {
    decay: number;           // 0.1-10 seconds
    preDelay: number;        // 0-100 ms
    wetMix: number;          // 0-1
}

export interface EchoConfig {
    time: number;            // 1-2000 ms
    feedback: number;        // 0-1 (0% to 100%)
    wetMix: number;          // 0-1
}

// Audio Chain Interfaces
export interface DJAudioChain {
    source: MediaElementAudioSourceNode;
    normalizationGain: GainNode;
    notchFilter: NotchFilterNode;
    crossfadeWithFX: CrossfadeWithFXSends;
    fxBus1: FXBus;
    fxBus2: FXBus;
    masterMixer: GainNode;
    limiter: DynamicsCompressorNode | AudioWorkletNode;
}

export interface DJChannelStripState {
    deckId: string;
    gain: number;
    highEQ: number;          // -6 to +6 dB
    midEQ: number;           // -6 to +6 dB
    lowEQ: number;           // -6 to +6 dB
    notchEnabled: boolean;
    notchFrequency: number;
    notchResonance: number;
    volume: number;
    fxSend1: number;         // 0-1
    fxSend2: number;         // 0-1
    pfl: boolean;
}
```

## Notch Filter (`src/components/audioEngine/fx/notchFilter.ts`)

```typescript
import { GainNode, BiquadFilterNode, AudioContext } from 'webmad-audio-types';

export class NotchFilterNode {
    private context: AudioContext;
    private notch: BiquadFilterNode;
    private bypassNode: GainNode;
    private wetGain: GainNode;
    private dryGain: GainNode;
    private enabled: boolean = false;
    
    constructor(context: AudioContext) {
        this.context = context;
        
        // Create nodes
        this.notch = context.createBiquadFilter();
        this.notch.type = 'notch';
        this.notch.frequency.value = 60;      // Default: 60Hz for hum removal
        this.notch.Q.value = 10;              // High Q for narrow notch
        this.notch.gain.value = 0;
        
        this.bypassNode = context.createGain();
        this.bypassNode.gain.value = 1;
        
        this.wetGain = context.createGain();
        this.wetGain.gain.value = 0;
        
        this.dryGain = context.createGain();
        this.dryGain.gain.value = 1;
        
        // Connect: Input → [notch → wetGain] + [bypass → dryGain]
        // Output is wetGain + dryGain mixed
    }
    
    getInputNode(): GainNode {
        return this.bypassNode;
    }
    
    getOutputNode(): GainNode {
        // Return a summing node that combines wet and dry
        return this.dryGain;
    }
    
    setFrequency(frequency: number): void {
        this.notch.frequency.value = frequency;
    }
    
    setResonance(resonance: number): void {
        this.notch.Q.value = resonance;
    }
    
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        const now = this.context.currentTime;
        const rampTime = 0.005; // 5ms for click-free switching
        
        if (enabled) {
            this.wetGain.gain.setTargetAtTime(1, now, rampTime);
            this.dryGain.gain.setTargetAtTime(0, now, rampTime);
        } else {
            this.wetGain.gain.setTargetAtTime(0, now, rampTime);
            this.dryGain.gain.setTargetAtTime(1, now, rampTime);
        }
    }
    
    getEnabled(): boolean {
        return this.enabled;
    }
    
    getFrequency(): number {
        return this.notch.frequency.value;
    }
    
    getResonance(): number {
        return this.notch.Q.value;
    }
    
    disconnect(): void {
        this.notch.disconnect();
        this.bypassNode.disconnect();
        this.wetGain.disconnect();
        this.dryGain.disconnect();
    }
}
```

## FX Send with Crossfade (`src/components/audioEngine/fx/fxSend.ts`)

```typescript
import { GainNode, AudioContext } from 'webmad-audio-types';

export class CrossfadeWithFXSends {
    private context: AudioContext;
    private crossfadeGain: GainNode;
    private send1Gain: GainNode;
    private send2Gain: GainNode;
    private masterOutput: GainNode;
    
    constructor(context: AudioContext) {
        this.context = context;
        
        // Main crossfade gain (0-1 based on crossfader position)
        this.crossfadeGain = context.createGain();
        this.crossfadeGain.gain.value = 1;
        
        // FX sends (0-1, percentage of crossfade signal)
        this.send1Gain = context.createGain();
        this.send1Gain.gain.value = 0; // 0% initially
        
        this.send2Gain = context.createGain();
        this.send2Gain.gain.value = 0; // 0% initially
        
        // Master output (what goes to main mixer)
        this.masterOutput = context.createGain();
        this.masterOutput.gain.value = 1;
        
        // Connect: CrossfadeGain splits to: Master, Send1, Send2
        this.crossfadeGain.connect(this.masterOutput);
        this.crossfadeGain.connect(this.send1Gain);
        this.crossfadeGain.connect(this.send2Gain);
    }
    
    getInputNode(): GainNode {
        return this.crossfadeGain;
    }
    
    getMasterOutput(): GainNode {
        return this.masterOutput;
    }
    
    getSend1Node(): GainNode {
        return this.send1Gain;
    }
    
    getSend2Node(): GainNode {
        return this.send2Gain;
    }
    
    setCrossfadePosition(position: number): void {
        // position: -1 (Deck A only) to +1 (Deck B only)
        // Output: cos curve for constant power
        const gain = Math.cos((position + 1) * Math.PI / 4);
        this.crossfadeGain.gain.value = Math.max(0, gain);
    }
    
    setSendLevels(send1: number, send2: number): void {
        // Clamp to 0-1 range
        this.send1Gain.gain.value = Math.max(0, Math.min(1, send1));
        this.send2Gain.gain.value = Math.max(0, Math.min(1, send2));
    }
    
    getSend1Level(): number {
        return this.send1Gain.gain.value;
    }
    
    getSend2Level(): number {
        return this.send2Gain.gain.value;
    }
    
    disconnect(): void {
        this.crossfadeGain.disconnect();
        this.send1Gain.disconnect();
        this.send2Gain.disconnect();
        this.masterOutput.disconnect();
    }
}
```

## FX Bus (`src/components/audioEngine/fx/fxBus.ts`)

```typescript
import { GainNode, AudioContext, AudioNode, Convolver, DelayNode } from 'webmad-audio-types';

export class FXBus {
    private context: AudioContext;
    private busId: number;
    private inputGain: GainNode;
    private wetGain: GainNode;
    private dryGain: GainNode;
    private returnGain: GainNode;
    private effects: AudioNode[] = [];
    private enabled: boolean = true;
    
    constructor(context: AudioContext, busId: number) {
        this.context = context;
        this.busId = busId;
        
        // Input from crossfade send
        this.inputGain = context.createGain();
        this.inputGain.gain.value = 1;
        
        // Wet/dry mix
        this.wetGain = context.createGain();
        this.wetGain.gain.value = 0.5; // 50% wet by default
        
        this.dryGain = context.createGain();
        this.dryGain.gain.value = 0.5;
        
        // Return to master
        this.returnGain = context.createGain();
        this.returnGain.gain.value = 1;
    }
    
    getInputNode(): GainNode {
        return this.inputGain;
    }
    
    getReturnNode(): GainNode {
        return this.returnGain;
    }
    
    addEffect(effect: AudioNode): void {
        if (this.effects.length === 0) {
            this.inputGain.connect(effect);
        } else {
            this.effects[this.effects.length - 1].connect(effect);
        }
        effect.connect(this.wetGain);
        this.effects.push(effect);
    }
    
    addReverb(decay: number = 2, wetMix: number = 0.3): void {
        const convolver = this.context.createConvolver();
        
        // Generate impulse response for reverb
        const length = this.context.sampleRate * decay;
        const impulse = this.context.createBuffer(2, length, this.context.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                // Exponential decay
                const amplitude = Math.pow(1 - i / length, 2);
                data[i] = (Math.random() * 2 - 1) * amplitude;
            }
        }
        
        convolver.buffer = impulse;
        this.addEffect(convolver);
        this.setWetMix(wetMix);
    }
    
    addEcho(time: number = 500, feedback: number = 0.4, wetMix: number = 0.3): void {
        const delay = this.context.createDelay(2);
        delay.delayTime.value = time / 1000; // Convert ms to seconds
        
        const feedbackGain = this.context.createGain();
        feedbackGain.gain.value = feedback;
        
        // Connect: delay → feedback → delay (feedback loop)
        // Also connect to wet output
        delay.connect(feedbackGain);
        feedbackGain.connect(delay);
        delay.connect(this.wetGain);
        
        this.addEffect(delay);
        this.setWetMix(wetMix);
    }
    
    addRubberBanding(intensity: number = 0.5): void {
        // Rubber banding: LFO-controlled filter sweep for "bouncing" effect
        // Creates a rhythmic filter movement like a rubber band being plucked
        
        const lfo = this.context.createOscillator();
        lfo.type = 'sine';
        lfo.frequency.value = 2; // 2 Hz bounce rate
        
        const lfoGain = this.context.createGain();
        lfoGain.gain.value = 500 * intensity; // Frequency sweep range in Hz
        
        const filter = this.context.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = 1000; // Base frequency
        filter.Q.value = 10; // Resonance for "rubbery" sound
        
        // Connect: LFO → filter frequency (creating sweep)
        lfo.connect(lfoGain);
        lfoGain.connect(filter.frequency);
        
        // Create wet/dry blend
        const wetOutput = this.context.createGain();
        wetOutput.gain.value = 0.5 * intensity;
        
        filter.connect(wetOutput);
        
        this.addEffect(filter);
        
        // Store LFO reference for modulation
        (this as any).rubberLFO = lfo;
        (this as any).rubberFilter = filter;
        
        // Start LFO
        lfo.start();
    }
    
    setRubberBandingRate(rateHz: number): void {
        if ((this as any).rubberLFO) {
            (this as any).rubberLFO.frequency.value = rateHz;
        }
    }
    
    setRubberBandingIntensity(intensity: number): void {
        if ((this as any).rubberFilter && (this as any).rubberLFO) {
            (this as any).rubberLFO.gain.value = 500 * intensity;
            (this as any).rubberFilter.Q.value = 5 + (10 * intensity);
        }
    }
    
    stopRubberBanding(): void {
        if ((this as any).rubberLFO) {
            (this as any).rubberLFO.stop();
            (this as any).rubberLFO = null;
            (this as any).rubberFilter = null;
        }
    }
    
    setWetMix(mix: number): void {
        const now = this.context.currentTime;
        const rampTime = 0.01;
        this.wetGain.gain.setTargetAtTime(mix, now, rampTime);
        this.dryGain.gain.setTargetAtTime(1 - mix, now, rampTime);
    }
    
    setReturnLevel(level: number): void {
        this.returnGain.gain.value = Math.max(0, Math.min(1, level));
    }
    
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        if (enabled) {
            // Reconnect input to effects chain or wet/dry
            if (this.effects.length > 0) {
                this.inputGain.connect(this.effects[0]);
            } else {
                this.inputGain.connect(this.wetGain);
            }
        } else {
            this.inputGain.disconnect();
        }
    }
    
    getEnabled(): boolean {
        return this.enabled;
    }
    
    disconnect(): void {
        this.inputGain.disconnect();
        this.wetGain.disconnect();
        this.dryGain.disconnect();
        this.returnGain.disconnect();
        this.effects.forEach(effect => effect.disconnect());
    }
}
```

## Main Index (`src/components/audioEngine/fx/index.ts`)

```typescript
// Main exports for FX architecture
export { NotchFilterNode } from './notchFilter';
export { CrossfadeWithFXSends } from './fxSend';
export { FXBus } from './fxBus';
export * from './types';
```

## Integration Points

### 1. Modify `master.logic.ts`

```typescript
// Add imports
import { NotchFilterNode } from './fx/notchFilter';
import { CrossfadeWithFXSends } from './fx/fxSend';
import { FXBus } from './fx/fxBus';

// In createNodeBundle or new setup function:
function createDJNodeBundle(elem: HTMLMediaElement, options?: DJNodeBundleOptions) {
    // ... existing normalization code ...
    
    // Add notch filter (pre-fader)
    const notchFilter = new NotchFilterNode(audioContext);
    
    // Add crossfade with FX sends
    const crossfadeWithFX = new CrossfadeWithFXSends(audioContext);
    
    // Add FX busses
    const fxBus1 = new FXBus(audioContext, 1); // Reverb
    fxBus1.addReverb(2, 0.3);
    fxBus1.connectToMaster(masterAudioOutput.mixerNode);
    
    const fxBus2 = new FXBus(audioContext, 2); // Echo
    fxBus2.addEcho(500, 0.4, 0.3);
    fxBus2.connectToMaster(masterAudioOutput.mixerNode);
    
    // Connect sends
    crossfadeWithFX.getSend1Node().connect(fxBus1.getInputNode());
    crossfadeWithFX.getSend2Node().connect(fxBus2.getInputNode());
    
    // Chain: Source → Normalization → Notch → Crossfade → [Master + FX1 + FX2]
    source.connect(normalizationGain);
    normalizationGain.connect(notchFilter.getInputNode());
    notchFilter.getOutputNode().connect(crossfadeWithFX.getInputNode());
    crossfadeWithFX.getMasterOutput().connect(masterAudioOutput.mixerNode);
    
    return {
        // ... existing bundle properties ...
        notchFilter,
        crossfadeWithFX,
        fxBus1,
        fxBus2
    };
}
```

### 2. Modify `crossfadeController.ts`

```typescript
// Update crossfadeController to handle FX sends
interface CrossfadeOptions {
    // ... existing options ...
    fxSend1?: number;
    fxSend2?: number;
    notchEnabled?: boolean;
    notchFrequency?: number;
    notchResonance?: number;
}

class CrossfadeController {
    // ... existing code ...
    
    setFXSendLevels(send1: number, send2: number): void {
        if (this.currentBundle?.crossfadeWithFX) {
            this.currentBundle.crossfadeWithFX.setSendLevels(send1, send2);
        }
    }
    
    setNotchFilter(enabled: boolean, frequency?: number, resonance?: number): void {
        if (this.currentBundle?.notchFilter) {
            if (frequency !== undefined) {
                this.currentBundle.notchFilter.setFrequency(frequency);
            }
            if (resonance !== undefined) {
                this.currentBundle.notchFilter.setResonance(resonance);
            }
            this.currentBundle.notchFilter.setEnabled(enabled);
        }
    }
}
```

### 3. Update `audioStore.ts`

```typescript
interface AudioState {
    // ... existing state ...
    fxSend1: number;         // 0-1
    fxSend2: number;         // 0-1
    notchEnabled: boolean;
    notchFrequency: number;
    notchResonance: number;
}

interface AudioActions {
    // ... existing actions ...
    setFXSend1: (level: number) => void;
    setFXSend2: (level: number) => void;
    setNotchFilter: (enabled: boolean, frequency?: number, resonance?: number) => void;
}
```

### 4. Add Store Slice (`src/store/fxStore.ts`)

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FXStoreState {
    // FX Send levels per deck
    deckAFXSend1: number;
    deckAFXSend2: number;
    deckBFXSend1: number;
    deckBFXSend2: number;
    
    // Notch filter settings (global, affects both decks)
    notchEnabled: boolean;
    notchFrequency: number;
    notchResonance: number;
    
    // FX Bus settings
    fxBus1WetMix: number;
    fxBus2WetMix: number;
    fxBus1ReturnLevel: number;
    fxBus2ReturnLevel: number;
    
    // Actions
    setDeckAFXSend1: (level: number) => void;
    setDeckAFXSend2: (level: number) => void;
    setDeckBFXSend1: (level: number) => void;
    setDeckBFXSend2: (level: number) => void;
    setNotchEnabled: (enabled: boolean) => void;
    setNotchFrequency: (frequency: number) => void;
    setNotchResonance: (resonance: number) => void;
    setFXBus1WetMix: (mix: number) => void;
    setFXBus2WetMix: (mix: number) => void;
    setFXBus1ReturnLevel: (level: number) => void;
    setFXBus2ReturnLevel: (level: number) => void;
}

export const useFXStore = create<FXStoreState>()(
    persist(
        (set) => ({
            // Defaults
            deckAFXSend1: 0,
            deckAFXSend2: 0,
            deckBFXSend1: 0,
            deckBFXSend2: 0,
            
            notchEnabled: false,
            notchFrequency: 60,
            notchResonance: 10,
            
            fxBus1WetMix: 0.3,
            fxBus2WetMix: 0.3,
            fxBus1ReturnLevel: 1,
            fxBus2ReturnLevel: 1,
            
            // Actions
            setDeckAFXSend1: (level) => set({ deckAFXSend1: Math.max(0, Math.min(1, level)) }),
            setDeckAFXSend2: (level) => set({ deckAFXSend2: Math.max(0, Math.min(1, level)) }),
            setDeckBFXSend1: (level) => set({ deckBFXSend1: Math.max(0, Math.min(1, level)) }),
            setDeckBFXSend2: (level) => set({ deckBFXSend2: Math.max(0, Math.min(1, level)) }),
            
            setNotchEnabled: (enabled) => set({ notchEnabled: enabled }),
            setNotchFrequency: (frequency) => set({ notchFrequency: Math.max(20, Math.min(20000, frequency)) }),
            setNotchResonance: (resonance) => set({ notchResonance: Math.max(0.1, Math.min(20, resonance)) }),
            
            setFXBus1WetMix: (mix) => set({ fxBus1WetMix: Math.max(0, Math.min(1, mix)) }),
            setFXBus2WetMix: (mix) => set({ fxBus2WetMix: Math.max(0, Math.min(1, mix)) }),
            setFXBus1ReturnLevel: (level) => set({ fxBus1ReturnLevel: Math.max(0, Math.min(1, level)) }),
            setFXBus2ReturnLevel: (level) => set({ fxBus2ReturnLevel: Math.max(0, Math.min(1, level)) }),
        }),
        {
            name: 'jellyfin-fx-store',
        }
    )
);
```

## Implementation Order

1. **Create types** (`src/components/audioEngine/fx/types.ts`)
2. **Create NotchFilterNode** (`src/components/audioEngine/fx/notchFilter.ts`)
3. **Create CrossfadeWithFXSends** (`src/components/audioEngine/fx/fxSend.ts`)
4. **Create FXBus** (`src/components/audioEngine/fx/fxBus.ts`)
5. **Create main index** (`src/components/audioEngine/fx/index.ts`)
6. **Create FX store** (`src/store/fxStore.ts`)
7. **Integrate into master.logic.ts**
8. **Update crossfadeController.ts**
9. **Update audioStore.ts**
10. **Create UI components** for FX controls
11. **Add tests** for new components
12. **Update MCP server documentation**

## Testing Strategy

```typescript
// Tests to write:
// 1. NotchFilterNode - frequency, resonance, bypass
// 2. CrossfadeWithFXSends - send levels, crossfade curve
// 3. FXBus - wet/dry mix, effects chaining
// 4. Integration - full audio chain with FX
// 5. Performance - no audio artifacts during parameter changes
```

## Performance Considerations

- Use `setTargetAtTime` for smooth parameter transitions (5-10ms)
- Limit FX bus wet/dry mixing to prevent excessive processing
- Consider lazy-loading heavy FX (reverb impulse generation)
- Monitor audio context state for proper cleanup
