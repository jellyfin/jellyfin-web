/** App feature flags */
export enum AppFeature {
    /** The app supports changing the URL hash when the cast menu opens */
    CastMenuHashChange = 'castmenuhashchange',
    /** The app supports Chromecast */
    Chromecast = 'chromecast',
    /** The app supports showing client settings via a menu entry */
    ClientSettings = 'clientsettings',
    /** The app supports configuring the display language */
    DisplayLanguage = 'displaylanguage',
    /** The app supports configuring the display mode (TV, Desktop, etc.) */
    DisplayMode = 'displaymode',
    /** The app can exit via back navigation */
    Exit = 'exit',
    /** The app can be exited via a menu entry */
    ExitMenu = 'exitmenu',
    /** The app can open external URLs */
    ExternalLinks = 'externallinks',
    /** The app supports enabling external players */
    ExternalPlayerIntent = 'externalplayerintent',
    /** The app supports file downloads */
    FileDownload = 'filedownload',
    /** The app supports file input elements */
    FileInput = 'fileinput',
    /** The app supports enabling fullscreen media playback */
    Fullscreen = 'fullscreenchange',
    /** The app supports autoplay on the audio element */
    HtmlAudioAutoplay = 'htmlaudioautoplay',
    /** The app supports autoplay on the video element */
    HtmlVideoAutoplay = 'htmlvideoautoplay',
    /** The app supports switching servers */
    MultiServer = 'multiserver',
    /** The app supports playback of BluRay folders */
    NativeBluRayPlayback = 'nativeblurayplayback',
    /** The app supports playback of DVD folders */
    NativeDvdPlayback = 'nativedvdplayback',
    /** The app supports playback of ISO files */
    NativeIsoPlayback = 'nativeisoplayback',
    /** The app supports physical volume buttons */
    PhysicalVolumeControl = 'physicalvolumecontrol',
    /** The app supports playing remote audio */
    RemoteAudio = 'remoteaudio',
    /** The app supports the remote control (casting) feature */
    RemoteControl = 'remotecontrol',
    /** The app supports playing remote video */
    RemoteVideo = 'remotevideo',
    /** The app supports displaying a screensaver */
    Screensaver = 'screensaver',
    /** The app supports sharing content */
    Sharing = 'sharing',
    /** The app supports configuring subtitle appearance */
    SubtitleAppearance = 'subtitleappearancesettings',
    /** The app supports configuring subtitle burn-in */
    SubtitleBurnIn = 'subtitleburnsettings',
    /** The app can open URLs in a blank page. */
    TargetBlank = 'targetblank'
}
