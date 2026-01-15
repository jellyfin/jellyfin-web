export default function capabilities(host: any) {
    return Object.assign({
        PlayableMediaTypes: ['Audio', 'Video'],
        SupportedCommands: ['MoveUp', 'MoveDown', 'MoveLeft', 'MoveRight', 'PageUp', 'PageDown', 'PreviousLetter', 'NextLetter',
            'ToggleOsd', 'ToggleContextMenu', 'Select', 'Back', 'SendKey', 'SendString', 'GoHome', 'GoToSettings', 'VolumeUp',
            'VolumeDown', 'Mute', 'Unmute', 'ToggleMute', 'SetVolume', 'SetAudioStreamIndex', 'SetSubtitleStreamIndex',
            'DisplayContent', 'GoToSearch', 'DisplayMessage', 'SetRepeatMode', 'SetShuffleQueue', 'ChannelUp', 'ChannelDown',
            'PlayMediaSource', 'PlayTrailers'],
        SupportsPersistentIdentifier: (window as any).appMode === 'cordova' || (window as any).appMode === 'android',
        SupportsMediaControl: true
    }, host?.getPushTokenInfo ? host.getPushTokenInfo() : {});
}
