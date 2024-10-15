/**
 * Events triggered by PlaybackManager.
 */
export enum PlaybackManagerEvent {
    Pairing = 'pairing',
    Paired = 'paired',
    PairError = 'pairerror',
    PlaybackCancelled = 'playbackcancelled',
    PlaybackError = 'playbackerror',
    PlaybackStart = 'playbackstart',
    PlaybackStop = 'playbackstop',
    PlayerChange = 'playerchange',
    ReportPlayback = 'reportplayback'
}
