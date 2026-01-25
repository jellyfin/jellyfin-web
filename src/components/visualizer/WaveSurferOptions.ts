import { WaveSurferOptions } from 'wavesurfer.js';

export interface WaveSurferColorScheme {
    left: string;
    right: string;
    cursor: string;
}

export const DEFAULT_WAVESURFER_COLORS: WaveSurferColorScheme = {
    left: 'rgb(0, 180, 180)',
    right: 'rgb(180, 0, 180)',
    cursor: 'rgb(25, 213, 11)'
};

export function createWaveSurferChannelStyle(colors: WaveSurferColorScheme) {
    const barStyles = {
        joinedColorNoOverlay: [
            {
                height: 'auto',
                waveColor: colors.left,
                progressColor: colors.left
            },
            {
                height: 'auto',
                waveColor: colors.right,
                progressColor: colors.right
            }
        ],
        splitColored: [
            {
                height: 'auto',
                waveColor: colors.left,
                progressColor: colors.left
            },
            {
                height: 'auto',
                waveColor: colors.right,
                progressColor: colors.right
            }
        ],
        splitColoredCentered: [
            {
                height: 'auto',
                waveColor: colors.left,
                progressColor: colors.left
            },
            {
                height: 'auto',
                waveColor: colors.right,
                progressColor: colors.right
            }
        ],
        coloredCenteredOverlay: [
            {
                height: 'auto',
                waveColor: colors.left,
                progressColor: colors.left
            },
            {
                height: 'auto',
                overlay: true,
                waveColor: colors.right,
                progressColor: colors.right
            }
        ]
    };

    return {
        showDoubleChannels: {
            cursorColor: colors.cursor,
            cursorWidth: 1,
            autoScroll: true,
            autoCenter: true,
            dragToSeek: false,
            interact: true,
            sampleRate: 6000,
            splitChannels: barStyles.splitColoredCentered
        } as Partial<WaveSurferOptions>,
        showSingleChannel: {
            cursorColor: colors.cursor,
            cursorWidth: 1,
            autoScroll: true,
            autoCenter: true,
            dragToSeek: false,
            interact: true,
            sampleRate: 6000,
            splitChannels: barStyles.splitColored
        } as Partial<WaveSurferOptions>,
        showWholeSong: {
            cursorColor: colors.cursor,
            cursorWidth: 1,
            autoScroll: true,
            autoCenter: true,
            sampleRate: 3000,
            interact: true,
            dragToSeek: false,
            splitChannels: barStyles.joinedColorNoOverlay
        } as Partial<WaveSurferOptions>,
        bar: {
            cursorColor: colors.cursor,
            cursorWidth: 18,
            autoScroll: false,
            autoCenter: false,
            sampleRate: 6000,
            minPxPerSec: 1,
            interact: true,
            dragToSeek: false,
            splitChannels: barStyles.coloredCenteredOverlay
        } as Partial<WaveSurferOptions>,
        map: {
            cursorColor: colors.cursor,
            cursorWidth: 1,
            autoScroll: false,
            autoCenter: false,
            sampleRate: 3000,
            minPxPerSec: 1,
            interact: true,
            dragToSeek: true,
            splitChannels: barStyles.coloredCenteredOverlay
        } as Partial<WaveSurferOptions>
    };
}

const surferOptions = {
    container: '#inputSurfer',
    dragToSeek: false,
    interact: true,
    normalize: false,
    autoplay: false,
    // backend: 'WebAudio',
    backend: 'MediaElement',
    hideScrollbar: true,
    autoScroll: false,
    autoCenter: false,
    sampleRate: 6000,
    minPxPerSec: 1,
    width: '100%'
} as WaveSurferOptions;

const waveSurferPluginOptions = {
    timelineOptions: {
        secondaryLabelOpacity: 0.37,
        height: 18,
        primaryLabelInterval: 30,
        secondaryLabelInterval: 5
    },
    zoomOptions: {
        scale: 0.25,
        maxZoom: 8000,
        deltaThreshold: 10,
        exponentialZooming: true
    }
};

export { surferOptions, waveSurferPluginOptions };
