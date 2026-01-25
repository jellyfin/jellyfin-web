/** Actions that can be performed on a BaseItem. */
export enum ItemAction {
    /** Add the Item to a playlist. */
    AddToPlaylist = 'addtoplaylist',
    /** Trigger a custom action via an Event. */
    Custom = 'custom',
    /** Open an editor for the Item. */
    Edit = 'edit',
    /** Create an instant mix based on the Item. */
    InstantMix = 'instantmix',
    /** Open the details view for the Item. */
    Link = 'link',
    /** Open the context menu for the Item. */
    Menu = 'menu',
    /** Perform no action. Used to prevent a parent element's action being triggered. */
    None = 'none',
    /** Play the Item. */
    Play = 'play',
    /** Queue the Item and all subsequent Items and start playback. */
    PlayAllFromHere = 'playallfromhere',
    /** Open the play menu for the Item. */
    PlayMenu = 'playmenu',
    /** Play the trailer for the Item. */
    PlayTrailer = 'playtrailer',
    /** Open the program dialog for the Item. */
    ProgramDialog = 'programdialog',
    /** Queue the Item. */
    Queue = 'queue',
    /** Queue the Item and all subsequent Items. */
    QueueAllFromHere = 'queueallfromhere',
    /** Record the Item. */
    Record = 'record',
    /** Resume playback of the Item. */
    Resume = 'resume',
    /** Set this Item as the Item to be currently played from a playlist. */
    SetPlaylistIndex = 'setplaylistindex'
}
