import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';

export interface PlayOptions {
    /** The aspect ratio of the player */
    aspectRatio?: string
    /** The index of the audio stream to play */
    audioStreamIndex?: number
    /** Whether to play in fullscreen mode */
    fullscreen?: boolean
    /** The IDs of the items to play, used when items are not passed directly */
    ids?: string[]
    /** Whether this is the first item in the play queue */
    isFirstItem?: boolean
    /** The list of items in the play queue */
    items?: BaseItemDto[] | null
    /** The media source ID to play for the current item */
    mediaSourceId?: string
    /** Additional legacy-shaped item query parameters, see toItemsRequest */
    queryOptions?: Record<string, unknown>
    /** The ID of the server the items belong to */
    serverId?: string
    /** Whether to shuffle the play queue */
    shuffle?: boolean
    /** The index of the item to start playing from */
    startIndex?: number
    /** The position to start playing from */
    startPositionTicks?: number
    /** The index of the subtitle stream to play */
    subtitleStreamIndex?: number
}
