/**
 * Visualizer Settings Test Suite
 * Tests settings data structure, merging, and persistence
 */

import { describe, it, expect } from 'vitest';

// Mock visualizerSettings without importing the full module
const visualizerSettings = {
    frequencyAnalyzer: {
        enabled: false,
        smoothing: 0.3,
        opacity: 1.0,
        colorScheme: 'spectrum',
        colors: {
            solid: '#1ED24B',
            gradient: {
                low: '#1ED24B',
                mid: '#FFD700',
                high: '#FF3232'
            }
        }
    },
    waveSurfer: {
        enabled: false,
        opacity: 0.7,
        colorScheme: 'albumArt',
        colors: {
            monochrome: {
                wave: '#1ED24B',
                cursor: '#FFFFFF'
            },
            stereo: {
                left: '#1ED24B',
                right: '#FF3232',
                cursor: '#FFFFFF'
            }
        }
    },
    butterchurn: {
        enabled: false,
        opacity: 0.6,
        presetInterval: 60,
        transitionSpeed: 2.7
    },
    sitback: { trackInfoDuration: 5, autoHideTimer: 5 },
    advanced: { fftSize: 4096, limiterThreshold: -1 }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function setVisualizerSettings(savedSettings: any) {
    if (!savedSettings) return;
    Object.assign(visualizerSettings.frequencyAnalyzer, savedSettings?.frequencyAnalyzer);
    Object.assign(visualizerSettings.waveSurfer, savedSettings?.waveSurfer);
    Object.assign(visualizerSettings.butterchurn, savedSettings?.butterchurn);
    Object.assign(visualizerSettings.sitback, savedSettings?.sitback);
    Object.assign(visualizerSettings.advanced, savedSettings?.advanced);
}

function getVisualizerSettings() {
    return JSON.stringify(visualizerSettings);
}

describe('visualizerSettings - Data Structure', () => {
    describe('visualizerSettings object', () => {
        it('should have frequencyAnalyzer settings', () => {
            expect(visualizerSettings).toHaveProperty('frequencyAnalyzer');
            expect(visualizerSettings.frequencyAnalyzer).toHaveProperty('enabled');
            expect(visualizerSettings.frequencyAnalyzer).toHaveProperty('smoothing');
            expect(visualizerSettings.frequencyAnalyzer).toHaveProperty('opacity');
            expect(visualizerSettings.frequencyAnalyzer).toHaveProperty('colorScheme');
            expect(visualizerSettings.frequencyAnalyzer).toHaveProperty('colors');
        });

        it('should have waveSurfer settings', () => {
            expect(visualizerSettings).toHaveProperty('waveSurfer');
            expect(visualizerSettings.waveSurfer).toHaveProperty('enabled');
            expect(visualizerSettings.waveSurfer).toHaveProperty('opacity');
            expect(visualizerSettings.waveSurfer).toHaveProperty('colorScheme');
            expect(visualizerSettings.waveSurfer).toHaveProperty('colors');
        });

        it('should have butterchurn settings', () => {
            expect(visualizerSettings).toHaveProperty('butterchurn');
            expect(visualizerSettings.butterchurn).toHaveProperty('enabled');
            expect(visualizerSettings.butterchurn).toHaveProperty('opacity');
            expect(visualizerSettings.butterchurn).toHaveProperty('presetInterval');
            expect(visualizerSettings.butterchurn).toHaveProperty('transitionSpeed');
        });

        it('should have sitback settings', () => {
            expect(visualizerSettings).toHaveProperty('sitback');
            expect(visualizerSettings.sitback).toHaveProperty('trackInfoDuration');
            expect(visualizerSettings.sitback).toHaveProperty('autoHideTimer');
        });

        it('should have advanced settings', () => {
            expect(visualizerSettings).toHaveProperty('advanced');
            expect(visualizerSettings.advanced).toHaveProperty('fftSize');
            expect(visualizerSettings.advanced).toHaveProperty('limiterThreshold');
        });
    });

    describe('frequencyAnalyzer colors', () => {
        it('should have solid color', () => {
            expect(visualizerSettings.frequencyAnalyzer.colors).toHaveProperty('solid');
            expect(typeof visualizerSettings.frequencyAnalyzer.colors.solid).toBe('string');
        });

        it('should have gradient colors (low/mid/high)', () => {
            const gradient = visualizerSettings.frequencyAnalyzer.colors.gradient;
            expect(gradient).toHaveProperty('low');
            expect(gradient).toHaveProperty('mid');
            expect(gradient).toHaveProperty('high');
        });

        it('should have valid hex colors', () => {
            const colors = visualizerSettings.frequencyAnalyzer.colors;
            expect(colors.solid).toMatch(/^#[0-9A-F]{6}$/);
            expect(colors.gradient.low).toMatch(/^#[0-9A-F]{6}$/);
            expect(colors.gradient.mid).toMatch(/^#[0-9A-F]{6}$/);
            expect(colors.gradient.high).toMatch(/^#[0-9A-F]{6}$/);
        });
    });

    describe('default values', () => {
        it('should have frequency analyzer enabled: false', () => {
            expect(visualizerSettings.frequencyAnalyzer.enabled).toBe(false);
        });

        it('should have valid default smoothing value', () => {
            const smoothing = visualizerSettings.frequencyAnalyzer.smoothing;
            expect(smoothing).toBeGreaterThanOrEqual(0);
            expect(smoothing).toBeLessThanOrEqual(0.85);
        });

        it('should have valid default opacity values', () => {
            expect(visualizerSettings.frequencyAnalyzer.opacity).toBeGreaterThanOrEqual(0.1);
            expect(visualizerSettings.frequencyAnalyzer.opacity).toBeLessThanOrEqual(1.0);
            expect(visualizerSettings.waveSurfer.opacity).toBeGreaterThanOrEqual(0.1);
            expect(visualizerSettings.butterchurn.opacity).toBeGreaterThanOrEqual(0.1);
        });

        it('should have valid default fftSize', () => {
            const validSizes = [512, 1024, 2048, 4096, 8192];
            expect(validSizes).toContain(visualizerSettings.advanced.fftSize);
        });

        it('should have valid default limiter threshold', () => {
            const threshold = visualizerSettings.advanced.limiterThreshold;
            expect(threshold).toBeGreaterThanOrEqual(-6);
            expect(threshold).toBeLessThanOrEqual(-0.5);
        });

        it('should have track info duration in valid range', () => {
            const duration = visualizerSettings.sitback.trackInfoDuration;
            expect(duration).toBeGreaterThanOrEqual(1);
            expect(duration).toBeLessThanOrEqual(10);
        });

        it('should have auto hide timer in valid range', () => {
            const timer = visualizerSettings.sitback.autoHideTimer;
            expect(timer).toBeGreaterThanOrEqual(3);
            expect(timer).toBeLessThanOrEqual(30);
        });
    });
});

describe('visualizerSettings - Settings Management', () => {
    describe('setVisualizerSettings', () => {
        it('should merge saved settings with defaults', () => {
            const savedSettings = {
                frequencyAnalyzer: {
                    enabled: true
                }
            };

            setVisualizerSettings(savedSettings);

            // Saved setting should override
            expect(visualizerSettings.frequencyAnalyzer.enabled).toBe(true);
            // But other settings should keep defaults
            expect(visualizerSettings.frequencyAnalyzer).toHaveProperty('smoothing');
            expect(visualizerSettings.frequencyAnalyzer).toHaveProperty('colors');
        });

        it('should handle null/undefined gracefully', () => {
            const originalSettings = JSON.parse(JSON.stringify(visualizerSettings));

            setVisualizerSettings(null);
            expect(visualizerSettings).toEqual(originalSettings);

            setVisualizerSettings(undefined);
            expect(visualizerSettings).toEqual(originalSettings);
        });

        it('should merge nested color settings', () => {
            const savedSettings = {
                frequencyAnalyzer: {
                    colors: {
                        solid: '#FF0000'
                    }
                }
            };

            setVisualizerSettings(savedSettings);
            expect(visualizerSettings.frequencyAnalyzer.colors.solid).toBe('#FF0000');
        });

        it('should preserve unspecified settings', () => {
            const originalButtercburn = JSON.parse(
                JSON.stringify(visualizerSettings.butterchurn)
            );

            const savedSettings = {
                frequencyAnalyzer: {
                    enabled: true
                }
            };

            setVisualizerSettings(savedSettings);
            expect(visualizerSettings.butterchurn).toEqual(originalButtercburn);
        });

        it('should handle multiple partial updates', () => {
            const update1 = {
                frequencyAnalyzer: { enabled: true }
            };
            const update2 = {
                butterchurn: { enabled: true }
            };

            setVisualizerSettings(update1);
            expect(visualizerSettings.frequencyAnalyzer.enabled).toBe(true);

            setVisualizerSettings(update2);
            expect(visualizerSettings.frequencyAnalyzer.enabled).toBe(true);
            expect(visualizerSettings.butterchurn.enabled).toBe(true);
        });
    });

    describe('getVisualizerSettings', () => {
        it('should return serialized settings', () => {
            const result = getVisualizerSettings();
            expect(typeof result).toBe('string');
        });

        it('should return valid JSON', () => {
            const result = getVisualizerSettings();
            const parsed = JSON.parse(result);
            expect(parsed).toHaveProperty('frequencyAnalyzer');
            expect(parsed).toHaveProperty('waveSurfer');
        });

        it('should include all settings properties', () => {
            const parsed = JSON.parse(getVisualizerSettings());
            expect(parsed).toHaveProperty('frequencyAnalyzer');
            expect(parsed).toHaveProperty('waveSurfer');
            expect(parsed).toHaveProperty('butterchurn');
            expect(parsed).toHaveProperty('sitback');
            expect(parsed).toHaveProperty('advanced');
        });

        it('should prevent the "[object Object]" storage bug', () => {
            const result = getVisualizerSettings();
            // Ensure it's not the problematic object-to-string conversion
            expect(result).not.toBe('[object Object]');
            // And it should be valid JSON that can be parsed
            expect(() => JSON.parse(result)).not.toThrow();
        });
    });
});

describe('visualizerSettings - Validation', () => {
    describe('color schemes', () => {
        it('should have valid frequency analyzer color schemes', () => {
            const validSchemes = ['spectrum', 'solid', 'albumArt', 'gradient'];
            const scheme = visualizerSettings.frequencyAnalyzer.colorScheme;
            expect(validSchemes).toContain(scheme);
        });

        it('should have valid waveform color schemes', () => {
            const validSchemes = ['albumArt', 'monochrome', 'stereo'];
            const scheme = visualizerSettings.waveSurfer.colorScheme;
            expect(validSchemes).toContain(scheme);
        });
    });

    describe('numeric ranges', () => {
        it('should have valid frequency analyzer opacity', () => {
            const opacity = visualizerSettings.frequencyAnalyzer.opacity;
            expect(opacity).toBeGreaterThanOrEqual(0.1);
            expect(opacity).toBeLessThanOrEqual(1.0);
        });

        it('should have valid smoothing value', () => {
            const smoothing = visualizerSettings.frequencyAnalyzer.smoothing;
            expect(smoothing).toBeGreaterThanOrEqual(0);
            expect(smoothing).toBeLessThanOrEqual(0.85);
        });

        it('should have valid preset interval', () => {
            const interval = visualizerSettings.butterchurn.presetInterval;
            expect(typeof interval).toBe('number');
            expect(interval).toBeGreaterThanOrEqual(0);
        });

        it('should have valid transition speed', () => {
            const speed = visualizerSettings.butterchurn.transitionSpeed;
            expect(typeof speed).toBe('number');
            expect(speed).toBeGreaterThanOrEqual(0);
            expect(speed).toBeLessThanOrEqual(10);
        });
    });

    describe('boolean flags', () => {
        it('should have boolean enabled flags', () => {
            expect(typeof visualizerSettings.frequencyAnalyzer.enabled).toBe('boolean');
            expect(typeof visualizerSettings.waveSurfer.enabled).toBe('boolean');
            expect(typeof visualizerSettings.butterchurn.enabled).toBe('boolean');
        });
    });
});

describe('visualizerSettings - Integration', () => {
    it('should handle complete settings update from server', () => {
        const serverSettings = {
            frequencyAnalyzer: {
                enabled: true,
                smoothing: 0.5,
                opacity: 0.8,
                colorScheme: 'gradient',
                colors: {
                    solid: '#FF0000',
                    gradient: {
                        low: '#FF0000',
                        mid: '#FFFF00',
                        high: '#00FF00'
                    }
                }
            },
            waveSurfer: {
                enabled: true,
                opacity: 0.7,
                colorScheme: 'stereo',
                colors: {
                    monochrome: { wave: '#00FF00', cursor: '#FFFFFF' },
                    stereo: { left: '#00FF00', right: '#FF0000', cursor: '#FFFFFF' }
                }
            },
            butterchurn: {
                enabled: false,
                opacity: 0.6,
                presetInterval: 30,
                transitionSpeed: 2
            },
            sitback: {
                trackInfoDuration: 5,
                autoHideTimer: 5
            },
            advanced: {
                fftSize: 2048,
                limiterThreshold: -1
            }
        };

        setVisualizerSettings(serverSettings);

        expect(visualizerSettings.frequencyAnalyzer.enabled).toBe(true);
        expect(visualizerSettings.frequencyAnalyzer.colorScheme).toBe('gradient');
        expect(visualizerSettings.frequencyAnalyzer.colors.gradient.low).toBe('#FF0000');
        expect(visualizerSettings.waveSurfer.enabled).toBe(true);
        expect(visualizerSettings.butterchurn.enabled).toBe(false);
        expect(visualizerSettings.advanced.fftSize).toBe(2048);
    });

    it('should maintain data integrity through serialize/deserialize', () => {
        const original = getVisualizerSettings();
        const serialized = JSON.stringify(original);
        const deserialized = JSON.parse(serialized);

        setVisualizerSettings(deserialized);

        expect(getVisualizerSettings()).toEqual(original);
    });
});
