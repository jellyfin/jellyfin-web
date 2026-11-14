/** Display names for codecs, matching how the rest of the web client shows them. */
const CODEC_NAMES: Record<string, string> = {
    av1: 'AV1',
    h264: 'H.264',
    hevc: 'HEVC',
    mpeg2video: 'MPEG-2',
    vc1: 'VC-1',
    vp8: 'VP8',
    vp9: 'VP9'
};

export const codecName = (codec?: string) => (codec ? CODEC_NAMES[codec.toLowerCase()] ?? codec.toUpperCase() : '');
