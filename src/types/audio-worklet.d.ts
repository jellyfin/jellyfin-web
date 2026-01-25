interface AudioWorkletProcessor {
    readonly port: MessagePort;
    process(inputs: any, outputs: any, parameters: any): boolean;
}

declare var AudioWorkletProcessor: {
    prototype: AudioWorkletProcessor;
    new (options?: any): AudioWorkletProcessor;
};

declare function registerProcessor(name: string, processorCtor: new (options?: any) => AudioWorkletProcessor): void;

interface AudioParamDescriptor {
    name: string;
    automationRate?: 'a-rate' | 'k-rate';
    minValue?: number;
    maxValue?: number;
    defaultValue?: number;
}
