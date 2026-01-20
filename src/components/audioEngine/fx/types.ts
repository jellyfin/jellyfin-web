export interface FXSendConfig {
    send1Level: number;
    send2Level: number;
}

export interface NotchFilterConfig {
    frequency: number;
    resonance: number;
    enabled: boolean;
}

export interface FXBusConfig {
    wetMix: number;
    returnLevel: number;
    enabled: boolean;
}

export interface ReverbConfig {
    decay: number;
    preDelay: number;
    wetMix: number;
}

export interface EchoConfig {
    time: number;
    feedback: number;
    wetMix: number;
}

export interface RubberBandingConfig {
    enabled: boolean;
    rateHz: number;
    intensity: number;
}

export interface DJAudioChain {
    source: MediaElementAudioSourceNode;
    normalizationGain: GainNode;
    notchFilter: unknown;
    crossfadeWithFX: unknown;
    fxBus1: unknown;
    fxBus2: unknown;
    masterMixer: GainNode;
    limiter: DynamicsCompressorNode | AudioWorkletNode;
}

export interface DJChannelStripState {
    deckId: string;
    gain: number;
    highEQ: number;
    midEQ: number;
    lowEQ: number;
    notchEnabled: boolean;
    notchFrequency: number;
    notchResonance: number;
    volume: number;
    fxSend1: number;
    fxSend2: number;
    pfl: boolean;
}

export interface FXRackState {
    deckAFXSend1: number;
    deckAFXSend2: number;
    deckBFXSend1: number;
    deckBFXSend2: number;
    notchEnabled: boolean;
    notchFrequency: number;
    notchResonance: number;
    fxBus1WetMix: number;
    fxBus2WetMix: number;
    fxBus1ReturnLevel: number;
    fxBus2ReturnLevel: number;
}
