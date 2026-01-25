// AudioCapabilities.ts - Centralized audio capability detection service

import browser from '../../scripts/browser';
import { logger } from '../../utils/logger';

export interface AudioCapabilities {
    webAudio: boolean;
    audioWorklet: boolean;
    crossfade: boolean;
    normalization: boolean;
    visualizers: {
        butterchurn: boolean;
        waveSurfer: boolean;
        frequencyAnalyzer: boolean;
    };
    device: {
        isTV: boolean;
        isMobile: boolean;
        supportsTouch: boolean;
    };
    fallbacks: {
        level: 'full' | 'partial' | 'minimal';
        html5Audio: boolean;
    };
}

class AudioCapabilitiesService {
    private capabilities: AudioCapabilities | null = null;
    private initialized = false;

    /**
     * Get all audio capabilities, detecting if not already done
     */
    async getCapabilities(): Promise<AudioCapabilities> {
        if (!this.initialized) {
            this.capabilities = await this.detectCapabilities();
            this.initialized = true;
        }
        return this.capabilities!;
    }

    /**
     * Force re-detection of capabilities
     */
    async refreshCapabilities(): Promise<AudioCapabilities> {
        this.initialized = false;
        return this.getCapabilities();
    }

    /**
     * Check if Web Audio API is supported
     */
    async supportsWebAudio(): Promise<boolean> {
        const caps = await this.getCapabilities();
        return caps.webAudio;
    }

    /**
     * Check if crossfading is supported
     */
    async supportsCrossfade(): Promise<boolean> {
        const caps = await this.getCapabilities();
        return caps.crossfade;
    }

    /**
     * Check if a specific visualizer is supported
     */
    async supportsVisualizer(type: keyof AudioCapabilities['visualizers']): Promise<boolean> {
        const caps = await this.getCapabilities();
        return caps.visualizers[type];
    }

    /**
     * Get the recommended fallback level
     */
    async getFallbackLevel(): Promise<AudioCapabilities['fallbacks']['level']> {
        const caps = await this.getCapabilities();
        return caps.fallbacks.level;
    }

    private async detectCapabilities(): Promise<AudioCapabilities> {
        const capabilities: AudioCapabilities = {
            webAudio: false,
            audioWorklet: false,
            crossfade: false,
            normalization: false,
            visualizers: {
                butterchurn: false,
                waveSurfer: false,
                frequencyAnalyzer: false
            },
            device: {
                isTV: browser.tv,
                isMobile: browser.mobile,
                supportsTouch: browser.touch
            },
            fallbacks: {
                level: 'minimal',
                html5Audio: true // Always available as baseline
            }
        };

        // Detect Web Audio API support
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                const audioContext = new AudioContextClass();
                capabilities.webAudio = true;

                // Test basic node creation
                const gainNode = audioContext.createGain();
                if (gainNode) {
                    capabilities.normalization = true;
                    // Crossfading requires Web Audio but may be disabled on TVs
                    capabilities.crossfade = !browser.tv;
                }

                // Test AudioWorklet support
                if (audioContext.audioWorklet && typeof audioContext.audioWorklet.addModule === 'function') {
                    capabilities.audioWorklet = true;
                }

                // Clean up test context
                if (audioContext && typeof audioContext.close === 'function') {
                    await audioContext.close().catch(() => {});
                }
            }
        } catch (error) {
            logger.debug(`Web Audio API not supported: ${error}`, { component: 'AudioCapabilities' });
        }

        // Detect visualizer support
        capabilities.visualizers.butterchurn = this.detectButterchurnSupport(capabilities);
        capabilities.visualizers.waveSurfer = this.detectWaveSurferSupport(capabilities);
        capabilities.visualizers.frequencyAnalyzer = this.detectFrequencyAnalyzerSupport(capabilities);

        // Determine fallback level
        if (capabilities.webAudio && capabilities.audioWorklet) {
            capabilities.fallbacks.level = 'full';
        } else if (capabilities.webAudio) {
            capabilities.fallbacks.level = 'partial';
        } else {
            capabilities.fallbacks.level = 'minimal';
        }

        logger.debug('Audio capabilities detected', { component: 'AudioCapabilities', capabilities });
        return capabilities;
    }

    private detectButterchurnSupport(capabilities: AudioCapabilities): boolean {
        // Butterchurn requires Web Audio and canvas support
        return (
            capabilities.webAudio && typeof document.createElement('canvas').getContext === 'function' && !browser.tv
        ); // Often too slow on TVs
    }

    private detectWaveSurferSupport(capabilities: AudioCapabilities): boolean {
        // WaveSurfer works with or without Web Audio
        return typeof document.createElement('canvas').getContext === 'function';
    }

    private detectFrequencyAnalyzerSupport(capabilities: AudioCapabilities): boolean {
        // Requires Web Audio API for analyzer nodes
        return capabilities.webAudio && typeof document.createElement('canvas').getContext === 'function';
    }
}

// Export singleton instance
export const audioCapabilities = new AudioCapabilitiesService();
export default audioCapabilities;
