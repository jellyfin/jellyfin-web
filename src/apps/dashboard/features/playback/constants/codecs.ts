/** List of codecs and their supported hardware acceleration types */
export const CODECS = [
    {
        name: 'H264',
        codec: 'h264',
        types: [
            'amf',
            'nvenc',
            'qsv',
            'vaapi',
            'rkmpp',
            'videotoolbox',
            'v4l2m2m',
            'nvmpi'
        ]
    },
    {
        name: 'HEVC',
        codec: 'hevc',
        types: [
            'amf',
            'nvenc',
            'qsv',
            'vaapi',
            'rkmpp',
            'videotoolbox',
            'nvmpi'
        ]
    },
    {
        name: 'MPEG1',
        codec: 'mpeg1video',
        types: [ 'rkmpp' ]
    },
    {
        name: 'MPEG2',
        codec: 'mpeg2video',
        types: [
            'amf',
            'nvenc',
            'qsv',
            'vaapi',
            'rkmpp',
            'nvmpi'
        ]
    },
    {
        name: 'MPEG4',
        codec: 'mpeg4',
        types: [
            'nvenc',
            'rkmpp',
            'nvmpi'
        ]
    },
    {
        name: 'VC1',
        codec: 'vc1',
        types: [
            'amf',
            'nvenc',
            'qsv',
            'vaapi'
        ]
    },
    {
        name: 'VP8',
        codec: 'vp8',
        types: [
            'nvenc',
            'qsv',
            'vaapi',
            'rkmpp',
            'videotoolbox',
            'nvmpi'
        ]
    },
    {
        name: 'VP9',
        codec: 'vp9',
        types: [
            'amf',
            'nvenc',
            'qsv',
            'vaapi',
            'rkmpp',
            'videotoolbox',
            'nvmpi'
        ]
    },
    {
        name: 'AV1',
        codec: 'av1',
        types: [
            'amf',
            'nvenc',
            'qsv',
            'vaapi',
            'rkmpp',
            'videotoolbox'
        ]
    }
];

/** Hardware decoders which support 10-bit HEVC & VP9 */
export const HEVC_VP9_HW_DECODING_TYPES = [
    'amf',
    'nvenc',
    'qsv',
    'vaapi',
    'rkmpp'
];

/** Hardware decoders which support HEVC RExt */
export const HEVC_REXT_DECODING_TYPES = [
    'nvenc',
    'qsv',
    'vaapi'
];
