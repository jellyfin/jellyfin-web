import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FXStoreState {
    // Deck gains (0-1)
    deckAGain: number;
    deckBGain: number;

    // Deck FX sends (0-1)
    deckAFXSend1: number;
    deckAFXSend2: number;
    deckBFXSend1: number;
    deckBFXSend2: number;

    // 3-Band EQ (-6 to +6 dB)
    eqLow: number;
    eqMid: number;
    eqHigh: number;

    // Crossfader (0-1, 0.5 = center)
    crossfaderPosition: number;
    crossfaderCurve: 'linear' | 'logarithmic' | 'scalecut';

    // Master fader (0-1)
    masterGain: number;

    notchEnabled: boolean;
    notchFrequency: number;
    notchResonance: number;

    fxBus1WetMix: number;
    fxBus2WetMix: number;
    fxBus1ReturnLevel: number;
    fxBus2ReturnLevel: number;

    rubberBandingEnabled: boolean;
    rubberBandingRate: number;
    rubberBandingIntensity: number;

    // Deck gain setters
    setDeckAGain: (gain: number) => void;
    setDeckBGain: (gain: number) => void;

    // Deck FX send setters
    setDeckAFXSend1: (level: number) => void;
    setDeckAFXSend2: (level: number) => void;
    setDeckBFXSend1: (level: number) => void;
    setDeckBFXSend2: (level: number) => void;

    // EQ setters
    setEQLow: (value: number) => void;
    setEQMid: (value: number) => void;
    setEQHigh: (value: number) => void;

    // Crossfader setters
    setCrossfaderPosition: (position: number) => void;
    setCrossfaderCurve: (curve: 'linear' | 'logarithmic' | 'scalecut') => void;

    // Master gain setter
    setMasterGain: (gain: number) => void;

    setNotchEnabled: (enabled: boolean) => void;
    setNotchFrequency: (frequency: number) => void;
    setNotchResonance: (resonance: number) => void;
    setFXBus1WetMix: (mix: number) => void;
    setFXBus2WetMix: (mix: number) => void;
    setFXBus1ReturnLevel: (level: number) => void;
    setFXBus2ReturnLevel: (level: number) => void;
    setRubberBandingEnabled: (enabled: boolean) => void;
    setRubberBandingRate: (rate: number) => void;
    setRubberBandingIntensity: (intensity: number) => void;
}

export const useFXStore = create<FXStoreState>()(
    persist(
        set => ({
            // Deck gains
            deckAGain: 1,
            deckBGain: 1,

            // Deck FX sends
            deckAFXSend1: 0,
            deckAFXSend2: 0,
            deckBFXSend1: 0,
            deckBFXSend2: 0,

            // 3-Band EQ
            eqLow: 0,
            eqMid: 0,
            eqHigh: 0,

            // Crossfader
            crossfaderPosition: 0.5,
            crossfaderCurve: 'linear',

            // Master fader
            masterGain: 1,

            notchEnabled: false,
            notchFrequency: 60,
            notchResonance: 10,

            fxBus1WetMix: 0.3,
            fxBus2WetMix: 0.3,
            fxBus1ReturnLevel: 1,
            fxBus2ReturnLevel: 1,

            rubberBandingEnabled: false,
            rubberBandingRate: 2,
            rubberBandingIntensity: 0.5,

            // Deck gain setters
            setDeckAGain: gain => set({ deckAGain: Math.max(0, Math.min(1, gain)) }),
            setDeckBGain: gain => set({ deckBGain: Math.max(0, Math.min(1, gain)) }),

            // Deck FX send setters
            setDeckAFXSend1: level => set({ deckAFXSend1: Math.max(0, Math.min(1, level)) }),
            setDeckAFXSend2: level => set({ deckAFXSend2: Math.max(0, Math.min(1, level)) }),
            setDeckBFXSend1: level => set({ deckBFXSend1: Math.max(0, Math.min(1, level)) }),
            setDeckBFXSend2: level => set({ deckBFXSend2: Math.max(0, Math.min(1, level)) }),

            // EQ setters
            setEQLow: value => set({ eqLow: Math.max(-6, Math.min(6, value)) }),
            setEQMid: value => set({ eqMid: Math.max(-6, Math.min(6, value)) }),
            setEQHigh: value => set({ eqHigh: Math.max(-6, Math.min(6, value)) }),

            // Crossfader setters
            setCrossfaderPosition: position => set({ crossfaderPosition: Math.max(0, Math.min(1, position)) }),
            setCrossfaderCurve: curve => set({ crossfaderCurve: curve }),

            // Master gain setter
            setMasterGain: gain => set({ masterGain: Math.max(0, Math.min(1, gain)) }),

            setNotchEnabled: enabled => set({ notchEnabled: enabled }),
            setNotchFrequency: frequency => set({ notchFrequency: Math.max(20, Math.min(20000, frequency)) }),
            setNotchResonance: resonance => set({ notchResonance: Math.max(0.1, Math.min(20, resonance)) }),

            setFXBus1WetMix: mix => set({ fxBus1WetMix: Math.max(0, Math.min(1, mix)) }),
            setFXBus2WetMix: mix => set({ fxBus2WetMix: Math.max(0, Math.min(1, mix)) }),
            setFXBus1ReturnLevel: level => set({ fxBus1ReturnLevel: Math.max(0, Math.min(1, level)) }),
            setFXBus2ReturnLevel: level => set({ fxBus2ReturnLevel: Math.max(0, Math.min(1, level)) }),

            setRubberBandingEnabled: enabled => set({ rubberBandingEnabled: enabled }),
            setRubberBandingRate: rate => set({ rubberBandingRate: Math.max(0.5, Math.min(10, rate)) }),
            setRubberBandingIntensity: intensity => set({ rubberBandingIntensity: Math.max(0, Math.min(1, intensity)) })
        }),
        {
            name: 'jellyfin-fx-store'
        }
    )
);
