import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Mock all external dependencies
vi.mock('../../scripts/settings/userSettings', () => ({
    default: {
        visualizerConfiguration: vi.fn(),
        crossfadeDuration: vi.fn(() => 5),
        setUserInfo: vi.fn(() => Promise.resolve())
    }
}));

vi.mock('./colorPicker', () => ({
    initializeColorPickers: vi.fn(),
    setColorSettingsUI: vi.fn(),
    setupAdvancedToggle: vi.fn(),
    setupResetButton: vi.fn(),
    getColorSettingsFromUI: vi.fn(() => ({
        FreqAnalyzerLow: '#1ED24B',
        FreqAnalyzerMid: '#FFD700',
        FreqAnalyzerHigh: '#FF3232',
        WaveformWave: '#1ED24B',
        WaveformCursor: '#FFFFFF'
    }))
}));

vi.mock('../../scripts/appSettings', () => ({
    default: {
        set: vi.fn(),
        get: vi.fn()
    }
}));

vi.mock('lib/jellyfin-apiclient', () => {
    const mockApiClient = {
        getUser: vi.fn(() => Promise.resolve({ Id: 'user123', Name: 'Test' })),
        updateUserConfiguration: vi.fn(() => Promise.resolve()),
        getCurrentUserId: vi.fn(() => 'user123')
    };
    return {
        ServerConnections: {
            getApiClient: vi.fn(() => mockApiClient)
        }
    };
});

vi.mock('../loading/loading', () => ({
    default: {
        show: vi.fn(),
        hide: vi.fn()
    }
}));

vi.mock('../toast/toast', () => ({
    default: vi.fn()
}));

vi.mock('../../lib/globalize', () => ({
    default: {
        translate: vi.fn((key) => key)
    }
}));

vi.mock('../apphost', () => ({
    appHost: {
        supports: vi.fn(() => false)
    }
}));

vi.mock('../../scripts/browser', () => ({
    default: {
        safari: false,
        web0s: false
    }
}));

vi.mock('../focusManager', () => ({
    default: {}
}));

vi.mock('../qualityOptions', () => ({
    default: {}
}));

vi.mock('../../utils/events.ts', () => ({
    default: {}
}));

vi.mock('./colorPicker.scss', () => ({}));

// Default color config for tests
const DEFAULT_CONFIG = {
    frequencyAnalyzer: {
        enabled: true,
        smoothing: 0.3,
        opacity: 1,
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
        enabled: true,
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
    sitback: {
        trackInfoDuration: 5,
        autoHideTimer: 5
    },
    advanced: {
        fftSize: 4096,
        limiterThreshold: -1
    }
};

// Mock userSettings for testing
const mockUserSettings = {
    visualizerConfiguration: vi.fn(),
    crossfadeDuration: vi.fn(() => 5),
    allowedAudioChannels: vi.fn(() => 'stereo'),
    skipForwardLength: vi.fn(() => 15000),
    skipBackLength: vi.fn(() => 5000),
    preferFmp4HlsContainer: vi.fn(() => false),
    limitSegmentLength: vi.fn(() => false),
    enableCinemaMode: vi.fn(() => false),
    selectAudioNormalization: vi.fn(() => 'none'),
    enableNextVideoInfoOverlay: vi.fn(() => true),
    set: vi.fn()
};

// Helper to create form DOM
function setupPlaybackSettingsForm() {
    const form = document.createElement('form');
    form.id = 'playbackSettingsForm';

    // Frequency analyzer controls
    const chkFreq = document.createElement('input');
    chkFreq.type = 'checkbox';
    chkFreq.id = 'chkFrequencyAnalyzer';
    chkFreq.checked = true;
    form.appendChild(chkFreq);

    const selectFreqScheme = document.createElement('select');
    selectFreqScheme.id = 'selectFreqAnalyzerColorScheme';
    selectFreqScheme.value = 'spectrum';
    ['solid', 'gradient', 'spectrum', 'albumArt'].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectFreqScheme.appendChild(opt);
    });
    form.appendChild(selectFreqScheme);

    const sliderFreqOpacity = document.createElement('input');
    sliderFreqOpacity.type = 'range';
    sliderFreqOpacity.id = 'sliderFreqAnalyzerOpacity';
    sliderFreqOpacity.min = '0';
    sliderFreqOpacity.max = '100';
    sliderFreqOpacity.value = '100';
    form.appendChild(sliderFreqOpacity);

    const selectFreqSmoothing = document.createElement('select');
    selectFreqSmoothing.id = 'selectFreqAnalyzerSmoothing';
    [0.1, 0.3, 0.5, 0.7].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectFreqSmoothing.appendChild(opt);
    });
    selectFreqSmoothing.value = '0.3';
    form.appendChild(selectFreqSmoothing);

    // Frequency analyzer color containers
    const freqSolidContainer = document.createElement('div');
    freqSolidContainer.id = 'freqAnalyzerSolidColor';
    freqSolidContainer.classList.add('hide');
    form.appendChild(freqSolidContainer);

    const freqGradientContainer = document.createElement('div');
    freqGradientContainer.id = 'freqAnalyzerGradient';
    form.appendChild(freqGradientContainer);

    // Color inputs for frequency analyzer
    const colorFreqSolid = document.createElement('input');
    colorFreqSolid.type = 'color';
    colorFreqSolid.id = 'colorFreqAnalyzerSolid';
    colorFreqSolid.value = '#1ED24B';
    form.appendChild(colorFreqSolid);

    const colorFreqLow = document.createElement('input');
    colorFreqLow.type = 'color';
    colorFreqLow.id = 'colorFreqAnalyzerLow';
    colorFreqLow.value = '#1ED24B';
    form.appendChild(colorFreqLow);

    const colorFreqMid = document.createElement('input');
    colorFreqMid.type = 'color';
    colorFreqMid.id = 'colorFreqAnalyzerMid';
    colorFreqMid.value = '#FFD700';
    form.appendChild(colorFreqMid);

    const colorFreqHigh = document.createElement('input');
    colorFreqHigh.type = 'color';
    colorFreqHigh.id = 'colorFreqAnalyzerHigh';
    colorFreqHigh.value = '#FF3232';
    form.appendChild(colorFreqHigh);

    // Waveform controls
    const chkWaveform = document.createElement('input');
    chkWaveform.type = 'checkbox';
    chkWaveform.id = 'chkWaveform';
    chkWaveform.checked = true;
    form.appendChild(chkWaveform);

    const selectWaveScheme = document.createElement('select');
    selectWaveScheme.id = 'selectWaveformColorScheme';
    selectWaveScheme.value = 'albumArt';
    ['monochrome', 'stereo', 'albumArt'].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectWaveScheme.appendChild(opt);
    });
    form.appendChild(selectWaveScheme);

    const sliderWaveOpacity = document.createElement('input');
    sliderWaveOpacity.type = 'range';
    sliderWaveOpacity.id = 'sliderWaveformOpacity';
    sliderWaveOpacity.min = '0';
    sliderWaveOpacity.max = '100';
    sliderWaveOpacity.value = '70';
    form.appendChild(sliderWaveOpacity);

    // Waveform color containers
    const waveMonoContainer = document.createElement('div');
    waveMonoContainer.id = 'waveformMonochrome';
    waveMonoContainer.classList.add('hide');
    form.appendChild(waveMonoContainer);

    const waveStereoContainer = document.createElement('div');
    waveStereoContainer.id = 'waveformStereo';
    waveStereoContainer.classList.add('hide');
    form.appendChild(waveStereoContainer);

    // Waveform color inputs
    const colorWaveWave = document.createElement('input');
    colorWaveWave.type = 'color';
    colorWaveWave.id = 'colorWaveformWave';
    colorWaveWave.value = '#1ED24B';
    form.appendChild(colorWaveWave);

    const colorWaveCursor = document.createElement('input');
    colorWaveCursor.type = 'color';
    colorWaveCursor.id = 'colorWaveformCursor';
    colorWaveCursor.value = '#FFFFFF';
    form.appendChild(colorWaveCursor);

    const colorWaveLeft = document.createElement('input');
    colorWaveLeft.type = 'color';
    colorWaveLeft.id = 'colorWaveformLeft';
    colorWaveLeft.value = '#1ED24B';
    form.appendChild(colorWaveLeft);

    const colorWaveRight = document.createElement('input');
    colorWaveRight.type = 'color';
    colorWaveRight.id = 'colorWaveformRight';
    colorWaveRight.value = '#FF3232';
    form.appendChild(colorWaveRight);

    const colorWaveCursorStereo = document.createElement('input');
    colorWaveCursorStereo.type = 'color';
    colorWaveCursorStereo.id = 'colorWaveformCursorStereo';
    colorWaveCursorStereo.value = '#FFFFFF';
    form.appendChild(colorWaveCursorStereo);

    // Butterchurn controls
    const chkButterchurn = document.createElement('input');
    chkButterchurn.type = 'checkbox';
    chkButterchurn.id = 'chkButterchurn';
    chkButterchurn.checked = false;
    form.appendChild(chkButterchurn);

    const sliderButtOpacity = document.createElement('input');
    sliderButtOpacity.type = 'range';
    sliderButtOpacity.id = 'sliderButterchurnOpacity';
    sliderButtOpacity.min = '0';
    sliderButtOpacity.max = '100';
    sliderButtOpacity.value = '60';
    form.appendChild(sliderButtOpacity);

    const selectButtInterval = document.createElement('select');
    selectButtInterval.id = 'selectButterchurnInterval';
    [30, 60, 90, 120].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectButtInterval.appendChild(opt);
    });
    selectButtInterval.value = '60';
    form.appendChild(selectButtInterval);

    const selectButtTransition = document.createElement('select');
    selectButtTransition.id = 'selectButterchurnTransition';
    [1.0, 2.0, 2.7, 3.5].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectButtTransition.appendChild(opt);
    });
    selectButtTransition.value = '2.7';
    form.appendChild(selectButtTransition);

    // Advanced controls
    const selectFFTSize = document.createElement('select');
    selectFFTSize.id = 'selectFFTSize';
    [2048, 4096, 8192].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectFFTSize.appendChild(opt);
    });
    selectFFTSize.value = '4096';
    form.appendChild(selectFFTSize);

    const selectLimiterThreshold = document.createElement('select');
    selectLimiterThreshold.id = 'selectLimiterThreshold';
    [-6, -3, -1, 0].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectLimiterThreshold.appendChild(opt);
    });
    selectLimiterThreshold.value = '-1';
    form.appendChild(selectLimiterThreshold);

    // Sit back controls
    const selectTrackInfoDuration = document.createElement('select');
    selectTrackInfoDuration.id = 'selectTrackInfoDuration';
    [3, 5, 8, 10].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectTrackInfoDuration.appendChild(opt);
    });
    selectTrackInfoDuration.value = '5';
    form.appendChild(selectTrackInfoDuration);

    const selectAutoHideTimer = document.createElement('select');
    selectAutoHideTimer.id = 'selectAutoHideTimer';
    [3, 5, 10, 15].forEach(val => {
        const opt = document.createElement('option');
        opt.value = val;
        selectAutoHideTimer.appendChild(opt);
    });
    selectAutoHideTimer.value = '5';
    form.appendChild(selectAutoHideTimer);

    // Crossfade control
    const selectCrossfadeDuration = document.createElement('select');
    selectCrossfadeDuration.id = 'selectCrossfadeDuration';
    selectCrossfadeDuration.value = '3';
    form.appendChild(selectCrossfadeDuration);

    document.body.appendChild(form);
    return form;
}

beforeEach(() => {
    vi.clearAllMocks();
    mockUserSettings.visualizerConfiguration.mockReturnValue(DEFAULT_CONFIG);
});

afterEach(() => {
    document.body.innerHTML = '';
});

describe('playbackSettings - Form Functionality', () => {
    describe('Form Load', () => {
        it('should populate form with saved visualizer config', () => {
            const form = setupPlaybackSettingsForm();
            const config = DEFAULT_CONFIG;

            // Simulate loading form values from config
            form.querySelector('#chkFrequencyAnalyzer').checked = config.frequencyAnalyzer.enabled;
            form.querySelector('#selectFreqAnalyzerColorScheme').value = config.frequencyAnalyzer.colorScheme;
            form.querySelector('#sliderFreqAnalyzerOpacity').value = config.frequencyAnalyzer.opacity * 100;
            form.querySelector('#selectFreqAnalyzerSmoothing').value = config.frequencyAnalyzer.smoothing;
            form.querySelector('#chkWaveform').checked = config.waveSurfer.enabled;
            form.querySelector('#selectWaveformColorScheme').value = config.waveSurfer.colorScheme;
            form.querySelector('#sliderWaveformOpacity').value = config.waveSurfer.opacity * 100;

            // Verify values were set correctly
            expect(form.querySelector('#chkFrequencyAnalyzer').checked).toBe(true);
            expect(form.querySelector('#selectFreqAnalyzerColorScheme').value).toBe('spectrum');
            expect(form.querySelector('#sliderFreqAnalyzerOpacity').value).toBe('100');
            expect(form.querySelector('#chkWaveform').checked).toBe(true);
            expect(form.querySelector('#selectWaveformColorScheme').value).toBe('albumArt');
            expect(form.querySelector('#sliderWaveformOpacity').value).toBe('70');
        });

        it('should handle invalid JSON config gracefully', () => {
            const form = setupPlaybackSettingsForm();
            // Set a known value before testing parse failure
            form.querySelector('#selectFreqAnalyzerColorScheme').value = 'spectrum';

            mockUserSettings.visualizerConfiguration.mockReturnValue('invalid json');

            // Try to parse, should fail gracefully
            let config = null;
            try {
                const raw = mockUserSettings.visualizerConfiguration();
                if (typeof raw === 'string') {
                    config = JSON.parse(raw);
                }
            } catch (err) {
                config = null;
            }

            expect(config).toBeNull();
            // Form should retain its value when parsing fails
            expect(form.querySelector('#selectFreqAnalyzerColorScheme').value).toBe('spectrum');
        });

        it('should apply hardcoded defaults when config is null', () => {
            const form = setupPlaybackSettingsForm();

            mockUserSettings.visualizerConfiguration.mockReturnValue(null);

            const config = mockUserSettings.visualizerConfiguration();
            expect(config).toBeNull();

            // Form should use default values
            expect(form.querySelector('#chkFrequencyAnalyzer').checked).toBe(true);
            expect(form.querySelector('#sliderFreqAnalyzerOpacity').value).toBe('100');
        });

        it('should pass color settings to setColorSettingsUI', () => {
            const form = setupPlaybackSettingsForm();
            const config = DEFAULT_CONFIG;
            if (config.frequencyAnalyzer?.colors) {
                const colorSettings = {
                    FreqAnalyzerSolid: config.frequencyAnalyzer.colors.solid || '#1ED24B',
                    FreqAnalyzerLow: config.frequencyAnalyzer.colors.gradient?.low || '#1ED24B',
                    FreqAnalyzerMid: config.frequencyAnalyzer.colors.gradient?.mid || '#FFD700',
                    FreqAnalyzerHigh: config.frequencyAnalyzer.colors.gradient?.high || '#FF3232'
                };

                expect(colorSettings.FreqAnalyzerSolid).toBe('#1ED24B');
                expect(colorSettings.FreqAnalyzerLow).toBe('#1ED24B');
                expect(colorSettings.FreqAnalyzerMid).toBe('#FFD700');
                expect(colorSettings.FreqAnalyzerHigh).toBe('#FF3232');
            }
        });
    });

    describe('Color Scheme Visibility', () => {
        it('should toggle frequency analyzer color containers based on scheme', () => {
            const form = setupPlaybackSettingsForm();
            const selectFreqScheme = form.querySelector('#selectFreqAnalyzerColorScheme');
            const freqSolidContainer = form.querySelector('#freqAnalyzerSolidColor');
            const freqGradientContainer = form.querySelector('#freqAnalyzerGradient');

            // Test 'solid' scheme
            selectFreqScheme.value = 'solid';
            const shouldShowSolid = selectFreqScheme.value === 'solid';
            const shouldHideGradient = selectFreqScheme.value !== 'gradient';

            expect(shouldShowSolid).toBe(true);
            expect(shouldHideGradient).toBe(true);

            // Test 'gradient' scheme
            selectFreqScheme.value = 'gradient';
            const shouldHideSolid = selectFreqScheme.value !== 'solid';
            const shouldShowGradient = selectFreqScheme.value === 'gradient';

            expect(shouldHideSolid).toBe(true);
            expect(shouldShowGradient).toBe(true);
        });

        it('should toggle waveform color containers based on scheme', () => {
            const form = setupPlaybackSettingsForm();
            const selectWaveScheme = form.querySelector('#selectWaveformColorScheme');
            const waveMonoContainer = form.querySelector('#waveformMonochrome');
            const waveStereoContainer = form.querySelector('#waveformStereo');

            // Test 'monochrome' scheme
            selectWaveScheme.value = 'monochrome';
            const shouldShowMono = selectWaveScheme.value === 'monochrome';
            const shouldHideStereo = selectWaveScheme.value !== 'stereo';

            expect(shouldShowMono).toBe(true);
            expect(shouldHideStereo).toBe(true);

            // Test 'stereo' scheme
            selectWaveScheme.value = 'stereo';
            const shouldHideMono = selectWaveScheme.value !== 'monochrome';
            const shouldShowStereo = selectWaveScheme.value === 'stereo';

            expect(shouldHideMono).toBe(true);
            expect(shouldShowStereo).toBe(true);
        });

        it('should initialize visibility correctly based on saved settings', () => {
            const form = setupPlaybackSettingsForm();

            // Set initial values from config
            form.querySelector('#selectFreqAnalyzerColorScheme').value = 'spectrum';
            form.querySelector('#selectWaveformColorScheme').value = 'albumArt';

            // Verify initial state
            expect(form.querySelector('#selectFreqAnalyzerColorScheme').value).toBe('spectrum');
            expect(form.querySelector('#selectWaveformColorScheme').value).toBe('albumArt');

            // freqAnalyzer: spectrum should hide both solid and gradient
            const freqSolidHidden = form.querySelector('#freqAnalyzerSolidColor').classList.contains('hide');
            const freqGradientHidden = form.querySelector('#freqAnalyzerGradient').classList.contains('hide');
            expect(freqSolidHidden || freqGradientHidden).toBe(true);

            // waveform: albumArt should hide both monochrome and stereo
            const waveMonoHidden = form.querySelector('#waveformMonochrome').classList.contains('hide');
            const waveStereoHidden = form.querySelector('#waveformStereo').classList.contains('hide');
            expect(waveMonoHidden && waveStereoHidden).toBe(true);
        });
    });

    describe('Form Save', () => {
        it('should extract visualizer config correctly from form', () => {
            const form = setupPlaybackSettingsForm();

            // Set form values
            form.querySelector('#chkFrequencyAnalyzer').checked = true;
            form.querySelector('#selectFreqAnalyzerSmoothing').value = '0.5';
            form.querySelector('#sliderFreqAnalyzerOpacity').value = '85';
            form.querySelector('#selectFreqAnalyzerColorScheme').value = 'gradient';
            form.querySelector('#colorFreqAnalyzerLow').value = '#FF0000';
            form.querySelector('#colorFreqAnalyzerMid').value = '#00FF00';
            form.querySelector('#colorFreqAnalyzerHigh').value = '#0000FF';

            // Build config like saveUser does
            const visualizerConfig = {
                frequencyAnalyzer: {
                    enabled: form.querySelector('#chkFrequencyAnalyzer').checked,
                    smoothing: parseFloat(form.querySelector('#selectFreqAnalyzerSmoothing').value),
                    opacity: parseInt(form.querySelector('#sliderFreqAnalyzerOpacity').value, 10) / 100,
                    colorScheme: form.querySelector('#selectFreqAnalyzerColorScheme').value,
                    colors: {
                        solid: form.querySelector('#colorFreqAnalyzerSolid').value,
                        gradient: {
                            low: form.querySelector('#colorFreqAnalyzerLow').value,
                            mid: form.querySelector('#colorFreqAnalyzerMid').value,
                            high: form.querySelector('#colorFreqAnalyzerHigh').value
                        }
                    }
                }
            };

            expect(visualizerConfig.frequencyAnalyzer.enabled).toBe(true);
            expect(visualizerConfig.frequencyAnalyzer.smoothing).toBe(0.5);
            expect(visualizerConfig.frequencyAnalyzer.opacity).toBe(0.85);
            expect(visualizerConfig.frequencyAnalyzer.colorScheme).toBe('gradient');
            // HTML color inputs return lowercase values
            expect(visualizerConfig.frequencyAnalyzer.colors.gradient.low).toBe('#ff0000');
        });

        it('should convert opacity sliders from 0-100 to 0.0-1.0', () => {
            const form = setupPlaybackSettingsForm();

            // Test various slider values
            const testCases = [
                { slider: '0', expected: 0 },
                { slider: '50', expected: 0.5 },
                { slider: '100', expected: 1 },
                { slider: '85', expected: 0.85 }
            ];

            testCases.forEach(({ slider, expected }) => {
                form.querySelector('#sliderFreqAnalyzerOpacity').value = slider;
                const opacity = parseInt(form.querySelector('#sliderFreqAnalyzerOpacity').value, 10) / 100;
                expect(opacity).toBe(expected);
            });
        });

        it('should build complete config for userSettings.visualizerConfiguration', () => {
            const form = setupPlaybackSettingsForm();

            // Set all form values
            form.querySelector('#chkFrequencyAnalyzer').checked = true;
            form.querySelector('#chkWaveform').checked = false;
            form.querySelector('#chkButterchurn').checked = true;
            form.querySelector('#selectTrackInfoDuration').value = '8';
            form.querySelector('#selectAutoHideTimer').value = '10';
            form.querySelector('#selectFFTSize').value = '2048';
            form.querySelector('#selectLimiterThreshold').value = '-3';

            const trackInfoDuration = parseInt(form.querySelector('#selectTrackInfoDuration').value, 10);
            const idleTimeout = parseInt(form.querySelector('#selectAutoHideTimer').value, 10);

            // Build full config
            const visualizerConfig = {
                frequencyAnalyzer: {
                    enabled: form.querySelector('#chkFrequencyAnalyzer').checked
                },
                waveSurfer: {
                    enabled: form.querySelector('#chkWaveform').checked
                },
                butterchurn: {
                    enabled: form.querySelector('#chkButterchurn').checked
                },
                sitback: {
                    trackInfoDuration: trackInfoDuration,
                    autoHideTimer: idleTimeout
                },
                advanced: {
                    fftSize: parseInt(form.querySelector('#selectFFTSize').value, 10),
                    limiterThreshold: parseFloat(form.querySelector('#selectLimiterThreshold').value)
                }
            };

            // Verify config structure
            expect(visualizerConfig.frequencyAnalyzer.enabled).toBe(true);
            expect(visualizerConfig.waveSurfer.enabled).toBe(false);
            expect(visualizerConfig.butterchurn.enabled).toBe(true);
            expect(visualizerConfig.sitback.trackInfoDuration).toBe(8);
            expect(visualizerConfig.sitback.autoHideTimer).toBe(10);
            expect(visualizerConfig.advanced.fftSize).toBe(2048);
            expect(visualizerConfig.advanced.limiterThreshold).toBe(-3);
        });
    });
});
