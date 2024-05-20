import { WaveSurferOptions } from 'wavesurfer.js';

const color = {
    progressLeft: 'rgb(20, 160, 160)',
    progressRight: 'rgb(160, 20, 160)',
    waveLeft: 'rgb(0, 180, 180)',
    waveRight: 'rgb(180, 0, 180)',
    cursor: 'rgb(25, 213, 11)',
    black: 'rgb(10, 10, 10)',
    transparentBlack: 'rgba(0, 0, 0, 0.7)',
    white: 'rgb(251, 251, 251)',
    transparentWhite: 'rgba(255, 255, 255, 0.7)'
};

const barStyles = {
    wholeSongWhite: [
        {
            height: 'auto',
            waveColor: color.transparentBlack,
            progressColor: color.black,
            barAlign: undefined
        },
        {
            overlay: true,
            height: 'auto',
            waveColor: color.transparentWhite,
            progressColor: color.white,
            barAlign: undefined
        }
    ],
    coloredCenteredOverlay: [
        {
            height: 'auto',
            waveColor: color.waveLeft,
            progressColor: color.progressLeft,
            barAlign: undefined
        },
        {
            height: 'auto',
            overlay: true,
            waveColor: color.waveRight,
            progressColor: color.progressRight,
            barAlign: undefined
        }
    ],
    coloredBottomOverlay: [
        {
            height: 'auto',
            waveColor: color.waveLeft,
            progressColor: color.progressLeft,
            barAlign: 'bottom'
        },
        {
            height: 'auto',
            overlay: true,
            waveColor: color.waveRight,
            progressColor: color.progressRight,
            barAlign: 'bottom'
        }
    ],
    joinedColorNoOverlay: [
        {
            height: 'auto',
            waveColor: color.waveLeft,
            progressColor: color.progressLeft,
            barAlign: 'bottom'
        },
        {
            height: 'auto',
            waveColor: color.waveRight,
            progressColor: color.progressRight,
            barAlign: 'top'
        }
    ],
    splitColored: [
        {
            height: 'auto',
            waveColor: color.waveLeft,
            progressColor: color.progressLeft,
            barAlign: 'bottom'
        },
        {
            height: 'auto',
            waveColor: color.waveRight,
            progressColor: color.progressRight,
            barAlign: 'top'
        }
    ],
    splitColoredCentered:
    [
        {
            height: 'auto',
            waveColor: color.waveLeft,
            progressColor: color.progressLeft,
            barAlign: undefined
        },
        {
            height: 'auto',
            waveColor: color.waveRight,
            progressColor: color.progressRight,
            barAlign: undefined
        }
    ]
};

const waveSurferChannelStyle = {
    showDoubleChannels: {
        barWidth: undefined,
        barGap: undefined,
        cursorColor: color.cursor,
        cursorWidth: 1,
        autoScroll: true,
        autoCenter: true,
        dragToSeek: false,
        interact: true,
        sampleRate: 6000,
        splitChannels: barStyles.splitColoredCentered
    } as Partial<WaveSurferOptions>,
    showSingleChannel: {
        barWidth: 2,
        barGap: 1,
        cursorColor: color.cursor,
        cursorWidth: 1,
        autoScroll: true,
        autoCenter: true,
        dragToSeek: false,
        interact: true,
        sampleRate: 6000,
        splitChannels: barStyles.splitColored } as Partial<WaveSurferOptions>,
    showWholeSong: {
        cursorColor: color.cursor,
        cursorWidth: 1,
        autoScroll: true,
        autoCenter: true,
        sampleRate: 3000,
        interact: true,
        dragToSeek: false,
        barWidth: undefined,
        barGap: undefined,
        splitChannels: barStyles.joinedColorNoOverlay } as Partial<WaveSurferOptions>,
    bar: {
        barWidth: 4,
        barGap: 2,
        cursorColor: color.cursor,
        cursorWidth: 18,
        autoScroll: false,
        autoCenter: false,
        sampleRate: 6000,
        minPxPerSec: 1,
        interact: true,
        dragToSeek: false,
        splitChannels: barStyles.coloredCenteredOverlay } as Partial<WaveSurferOptions>,
    map: {
        barWidth: 2,
        barGap: 1,
        cursorColor: color.cursor,
        cursorWidth: 1,
        autoScroll: false,
        autoCenter: false,
        sampleRate: 3000,
        minPxPerSec: 1,
        interact: true,
        dragToSeek: true,
        splitChannels: barStyles.coloredCenteredOverlay } as Partial<WaveSurferOptions>
};

const surferOptions = {
    container: '#inputSurfer',
    dragToSeek: false,
    interact: true,
    normalize: false,
    autoplay: true,
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
    zoomOptions:  {
        scale: 0.25,
        maxZoom: 8000,
        deltaThreshold: 10,
        exponentialZooming: true
    }
};

export { surferOptions, waveSurferChannelStyle, waveSurferPluginOptions };
