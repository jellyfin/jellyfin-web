/**
 * Network Latency Monitor
 *
 * Automatically measures and estimates network latency for crossfade preload operations.
 * Uses weighted averaging with timeouts counting more heavily.
 * Stores per-connection-type history for smarter defaults.
 */

import { logger } from '../utils/logger';

export interface LatencySample {
    timestamp: number;
    latencyMs: number;
    status: 'success' | 'timeout' | 'error';
}

export interface ConnectionTypeSamples {
    samples: LatencySample[];
    lastUpdated: number;
}

const DEFAULT_LATENCY_MS = 1000;
const MAX_SAMPLES = 20;
const TIMEOUT_WEIGHT = 2.0;
const SAMPLE_HALF_LIFE_MS = 300000;

let globalSamples: LatencySample[] = [];
let connectionTypeSamples: Map<string, ConnectionTypeSamples> = new Map();

export class NetworkLatencyMonitor {
    private static instance: NetworkLatencyMonitor;
    private initialized = false;

    private constructor() {}

    static getInstance(): NetworkLatencyMonitor {
        if (!NetworkLatencyMonitor.instance) {
            NetworkLatencyMonitor.instance = new NetworkLatencyMonitor();
        }
        return NetworkLatencyMonitor.instance;
    }

    initialize(): void {
        if (this.initialized) return;
        this.initialized = true;

        if (typeof navigator !== 'undefined' && navigator.connection) {
            const conn = navigator.connection as unknown as EventTarget & {
                addEventListener: (type: string, listener: EventListener) => void;
            };
            conn.addEventListener('change', () => {
                this.handleNetworkChange();
            });
        }

        logger.debug('[NetworkLatencyMonitor] Initialized', { component: 'NetworkLatencyMonitor' });
    }

    record(success: boolean, latencyMs: number): void {
        const status: 'success' | 'timeout' | 'error' = success ? 'success' : 'timeout';
        const sample: LatencySample = {
            timestamp: Date.now(),
            latencyMs,
            status
        };

        globalSamples.push(sample);

        if (globalSamples.length > MAX_SAMPLES) {
            globalSamples.shift();
        }

        const connectionType = this.getConnectionType();
        if (connectionType && connectionType !== 'unknown') {
            let typeSamples = connectionTypeSamples.get(connectionType);
            if (!typeSamples) {
                typeSamples = { samples: [], lastUpdated: Date.now() };
                connectionTypeSamples.set(connectionType, typeSamples);
            }
            typeSamples.samples.push(sample);
            if (typeSamples.samples.length > MAX_SAMPLES) {
                typeSamples.samples.shift();
            }
            typeSamples.lastUpdated = Date.now();
        }

        logger.debug('[NetworkLatencyMonitor] Recorded latency', {
            component: 'NetworkLatencyMonitor',
            latencyMs,
            status,
            avgMs: this.getEstimatedLatency()
        });
    }

    getEstimatedLatency(): number {
        if (globalSamples.length === 0) {
            return DEFAULT_LATENCY_MS;
        }

        const now = Date.now();
        let weightedSum = 0;
        let weightTotal = 0;

        for (const sample of globalSamples) {
            const age = now - sample.timestamp;
            const ageWeight = Math.pow(0.5, age / SAMPLE_HALF_LIFE_MS);
            const statusWeight = sample.status === 'timeout' ? TIMEOUT_WEIGHT : 1.0;
            const weight = ageWeight * statusWeight;

            weightedSum += sample.latencyMs * weight;
            weightTotal += weight;
        }

        return weightTotal > 0 ? weightedSum / weightTotal : DEFAULT_LATENCY_MS;
    }

    getLatencyForConnectionType(): number {
        const connectionType = this.getConnectionType();
        if (!connectionType || connectionType === 'unknown') {
            return this.getEstimatedLatency();
        }

        const typeSamples = connectionTypeSamples.get(connectionType);
        if (!typeSamples || typeSamples.samples.length === 0) {
            return this.getEstimatedLatency();
        }

        const now = Date.now();
        let weightedSum = 0;
        let weightTotal = 0;

        for (const sample of typeSamples.samples) {
            const age = now - sample.timestamp;
            const ageWeight = Math.pow(0.5, age / SAMPLE_HALF_LIFE_MS);
            const statusWeight = sample.status === 'timeout' ? TIMEOUT_WEIGHT : 1.0;
            const weight = ageWeight * statusWeight;

            weightedSum += sample.latencyMs * weight;
            weightTotal += weight;
        }

        return weightTotal > 0 ? weightedSum / weightTotal : DEFAULT_LATENCY_MS;
    }

    getLatencyMs(): number {
        const state =
            typeof window !== 'undefined' ? require('../store/preferencesStore').usePreferencesStore.getState() : null;

        if (state?.crossfade.networkLatencyMode === 'manual') {
            return state.crossfade.manualLatencyOffset * 1000;
        }

        return this.getLatencyForConnectionType();
    }

    getLatencySeconds(): number {
        return this.getLatencyMs() / 1000;
    }

    getSampleCount(): number {
        return globalSamples.length;
    }

    getSuccessRate(): number {
        if (globalSamples.length === 0) return 1.0;
        const successCount = globalSamples.filter(s => s.status === 'success').length;
        return successCount / globalSamples.length;
    }

    handleNetworkChange(): void {
        const connectionType = this.getConnectionType();
        logger.info('[NetworkLatencyMonitor] Network changed', {
            component: 'NetworkLatencyMonitor',
            connectionType
        });

        globalSamples = [];

        const conn = navigator.connection as any;
        if (conn) {
            const typeSamples = connectionTypeSamples.get(connectionType);
            if (typeSamples) {
                typeSamples.samples = [];
                typeSamples.lastUpdated = Date.now();
            }
        }
    }

    clear(): void {
        globalSamples = [];
        logger.debug('[NetworkLatencyMonitor] Cleared all samples', { component: 'NetworkLatencyMonitor' });
    }

    clearForConnectionType(): void {
        const connectionType = this.getConnectionType();
        if (connectionType && connectionType !== 'unknown') {
            const typeSamples = connectionTypeSamples.get(connectionType);
            if (typeSamples) {
                typeSamples.samples = [];
                typeSamples.lastUpdated = Date.now();
            }
        }
    }

    getConnectionType(): string {
        if (typeof navigator === 'undefined' || !navigator.connection) {
            return 'unknown';
        }
        return navigator.connection.effectiveType || 'unknown';
    }

    getConnectionInfo(): { type: string; downlink: number; rtt: number } | null {
        if (typeof navigator === 'undefined' || !navigator.connection) {
            return null;
        }
        return {
            type: navigator.connection.effectiveType || 'unknown',
            downlink: navigator.connection.downlink || 0,
            rtt: navigator.connection.rtt || 0
        };
    }

    exportData(): { samples: LatencySample[]; connectionTypes: Record<string, ConnectionTypeSamples> } {
        const connectionTypesRecord: Record<string, ConnectionTypeSamples> = {};
        connectionTypeSamples.forEach((value, key) => {
            connectionTypesRecord[key] = value;
        });
        return {
            samples: [...globalSamples],
            connectionTypes: connectionTypesRecord
        };
    }

    importData(data: { samples: LatencySample[]; connectionTypes: Record<string, ConnectionTypeSamples> }): void {
        globalSamples = data.samples || [];

        connectionTypeSamples.clear();
        Object.entries(data.connectionTypes || {}).forEach(([key, value]) => {
            connectionTypeSamples.set(key, value);
        });
    }
}

export const networkLatencyMonitor = NetworkLatencyMonitor.getInstance();

export function getNetworkLatencyMs(): number {
    return networkLatencyMonitor.getLatencyMs();
}

export function getNetworkLatencySeconds(): number {
    return networkLatencyMonitor.getLatencySeconds();
}

export function recordNetworkLatency(success: boolean, latencyMs: number): void {
    networkLatencyMonitor.record(success, latencyMs);
}

export function getLatencySampleCount(): number {
    return networkLatencyMonitor.getSampleCount();
}

export function getLatencySuccessRate(): number {
    return networkLatencyMonitor.getSuccessRate();
}

export function clearNetworkLatencyHistory(): void {
    networkLatencyMonitor.clear();
}
