/**
 * Events triggered by media player plugins.
 * TODO: This list is incomplete
 */
export enum PlayerEvent {
    Error = 'error',
    FullscreenChange = 'fullscreenchange',
    ItemStarted = 'itemstarted',
    ItemStopped = 'itemstopped',
    MediaStreamsChange = 'mediastreamschange',
    Pause = 'pause',
    PlaybackStart = 'playbackstart',
    PlaybackStop = 'playbackstop',
    PlaylistItemAdd = 'playlistitemadd',
    PlaylistItemMove = 'playlistitemmove',
    PlaylistItemRemove = 'playlistitemremove',
    RepeatModeChange = 'repeatmodechange',
    ShuffleModeChange = 'shufflequeuemodechange',
    Stopped = 'stopped',
    TimeUpdate = 'timeupdate',
    Unpause = 'unpause',
    VolumeChange = 'volumechange'
}
