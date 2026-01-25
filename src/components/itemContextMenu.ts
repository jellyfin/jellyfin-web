import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

const BaseItemKind = {
    Playlist: 'Playlist',
    BoxSet: 'BoxSet',
    MusicAlbum: 'MusicAlbum',
    Season: 'Season',
    Series: 'Series',
    Episode: 'Episode'
} as const;
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { AppFeature } from '../constants/appFeature';
import { toApi } from '../utils/jellyfin-apiclient/compat';
import browser from '../scripts/browser';
import { copy } from '../scripts/clipboard';
import dom from '../utils/dom';
import globalize from '../lib/globalize';
import { ServerConnections } from '../lib/jellyfin-apiclient';
import actionsheet from './actionSheet/actionSheet';
import { safeAppHost } from './apphost';
import { appRouter } from './router/appRouter';
import itemHelper, { canEditPlaylist } from './itemHelper';
import { playbackManager } from './playback/playbackmanager';
import toast from './toast/toast';
import * as userSettings from '../scripts/settings/userSettings';

const DOWNLOAD_ALL_TYPES = [BaseItemKind.BoxSet, BaseItemKind.MusicAlbum, BaseItemKind.Season, BaseItemKind.Series];

export interface ContextMenuOptions {
    item: any;
    user: any;
    positionTo?: HTMLElement;
    play?: boolean;
    playAllFromHere?: boolean;
    queue?: boolean;
    shuffle?: boolean;
    instantMix?: boolean;
    playlist?: boolean;
    deleteItem?: boolean;
    edit?: boolean;
    editImages?: boolean;
    editSubtitles?: boolean;
    identify?: boolean;
    moremediainfo?: boolean;
    record?: boolean;
    share?: boolean;
    openAlbum?: boolean;
    openArtist?: boolean;
    collectionId?: string;
    playlistId?: string;
    canEditPlaylist?: boolean;
    isMobile?: boolean;
    stopPlayback?: boolean;
    clearQueue?: boolean;
    cancelTimer?: boolean;
}

function getDeleteLabel(type: (typeof BaseItemKind)[keyof typeof BaseItemKind]) {
    switch (type) {
        case BaseItemKind.Series:
            return globalize.translate('DeleteSeries');
        case BaseItemKind.Episode:
            return globalize.translate('DeleteEpisode');
        case BaseItemKind.Playlist:
        case BaseItemKind.BoxSet:
            return globalize.translate('Delete');
        default:
            return globalize.translate('DeleteMedia');
    }
}

export async function getCommands(options: ContextMenuOptions): Promise<any[]> {
    const { item, user } = options;
    const canPlay = (playbackManager as any).canPlay(item);
    const commands: any[] = [];

    if (canPlay && item.MediaType !== 'Photo') {
        if (options.play !== false)
            commands.push({ name: globalize.translate('Play'), id: 'resume', icon: 'play_arrow' });
        if (options.playAllFromHere && item.Type !== 'Program' && item.Type !== 'TvChannel') {
            commands.push({ name: globalize.translate('PlayAllFromHere'), id: 'playallfromhere', icon: 'play_arrow' });
        }
    }

    if (playbackManager.getCurrentPlayer()) {
        if (options.stopPlayback)
            commands.push({ name: globalize.translate('StopPlayback'), id: 'stopPlayback', icon: 'stop' });
        if (options.clearQueue)
            commands.push({ name: globalize.translate('ClearQueue'), id: 'clearQueue', icon: 'clear_all' });
    }

    if ((playbackManager as any).canQueue(item)) {
        if (options.queue !== false) {
            commands.push({ name: globalize.translate('AddToPlayQueue'), id: 'queue', icon: 'playlist_add' });
            commands.push({ name: globalize.translate('PlayNext'), id: 'queuenext', icon: 'playlist_add' });
        }
    }

    if (
        (item.IsFolder || item.Type === 'MusicArtist' || item.Type === 'MusicGenre') &&
        item.CollectionType !== 'livetv' &&
        options.shuffle !== false
    ) {
        commands.push({ name: globalize.translate('Shuffle'), id: 'shuffle', icon: 'shuffle' });
    }

    if (
        (item.MediaType === 'Audio' ||
            item.Type === 'MusicAlbum' ||
            item.Type === 'MusicArtist' ||
            item.Type === 'MusicGenre') &&
        options.instantMix !== false &&
        !itemHelper.isLocalItem(item)
    ) {
        commands.push({ name: globalize.translate('InstantMix'), id: 'instantmix', icon: 'explore' });
    }

    if (commands.length) commands.push({ divider: true });

    if (!browser.tv) {
        if (options.positionTo && dom.parentWithClass(options.positionTo, 'card')) {
            commands.push({ name: globalize.translate('Select'), id: 'multiSelect', icon: 'library_add_check' });
        }
        if (
            itemHelper.supportsAddingToCollection(item) &&
            (user.Policy.IsAdministrator || user.Policy.EnableCollectionManagement)
        ) {
            commands.push({
                name: globalize.translate('AddToCollection'),
                id: 'addtocollection',
                icon: 'playlist_add'
            });
        }
        if (itemHelper.supportsAddingToPlaylist(item) && options.playlist !== false) {
            commands.push({ name: globalize.translate('AddToPlaylist'), id: 'addtoplaylist', icon: 'playlist_add' });
        }
    }

    if (user.Policy.EnableLiveTvManagement && options.cancelTimer !== false) {
        if (item.Type === 'Timer' || (item.Type === 'Recording' && item.Status === 'InProgress')) {
            commands.push({ name: globalize.translate('CancelRecording'), id: 'canceltimer', icon: 'cancel' });
        }
        if (item.Type === 'SeriesTimer') {
            commands.push({ name: globalize.translate('CancelSeries'), id: 'cancelseriestimer', icon: 'cancel' });
        }
    }

    if (safeAppHost.supports(AppFeature.FileDownload)) {
        if (user.Policy.EnableContentDownloading && DOWNLOAD_ALL_TYPES.includes(item.Type)) {
            commands.push({ name: globalize.translate('DownloadAll'), id: 'downloadall', icon: 'file_download' });
        }
        if (item.CanDownload && item.Type !== 'Book') {
            commands.push({ name: globalize.translate('Download'), id: 'download', icon: 'file_download' });
            commands.push({ name: globalize.translate('CopyStreamURL'), id: 'copy-stream', icon: 'content_copy' });
        }
    }

    if (item.CanDelete && options.deleteItem !== false) {
        commands.push({ name: getDeleteLabel(item.Type), id: 'delete', icon: 'delete' });
    }

    if (commands.length) commands.push({ divider: true });

    if (item.Type === BaseItemKind.Playlist && (await canEditPlaylist(user, item))) {
        commands.push({ name: globalize.translate('Edit'), id: 'editplaylist', icon: 'edit' });
    }

    const canEdit = (itemHelper as any).canEdit(user, item);
    if (canEdit && options.edit !== false && item.Type !== 'SeriesTimer') {
        commands.push({ name: globalize.translate('EditMetadata'), id: 'edit', icon: 'edit' });
    }

    if ((itemHelper as any).canEditImages(user, item) && options.editImages !== false) {
        commands.push({ name: globalize.translate('EditImages'), id: 'editimages', icon: 'image' });
    }

    if ((itemHelper as any).canEditSubtitles(user, item) && options.editSubtitles !== false) {
        commands.push({ name: globalize.translate('EditSubtitles'), id: 'editsubtitles', icon: 'closed_caption' });
    }

    return commands;
}

export async function executeCommand(item: any, id: string, options: ContextMenuOptions): Promise<any> {
    const apiClient = ServerConnections.getApiClient(item.ServerId);
    const api = toApi(apiClient);

    switch (id) {
        case 'resume':
            (playbackManager as any).play({
                items: [item],
                startPositionTicks: item.UserData?.PlaybackPositionTicks || 0
            });
            break;
        case 'queue':
            (playbackManager as any).queue({ items: [item] });
            break;
        case 'delete': {
            const { default: deleteHelper } = await import('../scripts/deleteHelper');
            await deleteHelper.deleteItem({ item, navigate: false });
            return { updated: true, deleted: true };
        }
        case 'edit': {
            const { show } = await import('./metadataEditor/MetadataEditorWrapper');
            // Assuming we have a way to show the editor, likely via a dialog or router
            // TODO: Fix navigation - appRouter.navigate doesn't exist
            // appRouter.navigate(`metadata?id=${item.Id}`);
            break;
        }
    }
    return { command: id };
}

export async function show(options: ContextMenuOptions): Promise<any> {
    const commands = await getCommands(options);
    if (!commands.length) throw new Error('No item commands present');

    const id = await actionsheet.show({
        items: commands,
        positionTo: options.positionTo,
        resolveOnClick: ['share' as string]
    });

    return executeCommand(options.item, id as string, options);
}

const itemContextMenu = { getCommands, executeCommand, show };
export default itemContextMenu;
