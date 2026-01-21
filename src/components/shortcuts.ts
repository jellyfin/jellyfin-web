import { getPlaylistsApi } from '@jellyfin/sdk/lib/utils/api/playlists-api';
import { ItemAction } from '../constants/itemAction';
import { ServerConnections } from '../lib/jellyfin-apiclient';
import { toApi } from '../utils/jellyfin-apiclient/compat';
import { playbackManager } from './playback/playbackmanager';
import inputManager from '../scripts/inputManager';
import { appRouter } from './router/appRouter';
import dom from '../utils/dom';
import * as userSettings from '../scripts/settings/userSettings';
import { logger } from '../utils/logger';

export function onClick(e: MouseEvent): boolean | void {
    const card = dom.parentWithClass(e.target as HTMLElement, 'itemAction');
    if (card) {
        let actionElement: HTMLElement | null = card;
        let action = actionElement.getAttribute('data-action');
        if (!action) {
            actionElement = dom.parentWithAttribute(actionElement, 'data-action');
            if (actionElement) action = actionElement.getAttribute('data-action');
        }
        if (action && action !== ItemAction.None) {
            executeAction(card, actionElement, action as ItemAction);
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }
}

function getItemInfoFromCard(card: HTMLElement) {
    return {
        Type: card.getAttribute('data-type'),
        Id: card.getAttribute('data-id'),
        TimerId: card.getAttribute('data-timerid'),
        CollectionType: card.getAttribute('data-collectiontype'),
        ChannelId: card.getAttribute('data-channelid'),
        SeriesId: card.getAttribute('data-seriesid'),
        ServerId: card.getAttribute('data-serverid'),
        MediaType: card.getAttribute('data-mediatype'),
        Path: card.getAttribute('data-path'),
        IsFolder: card.getAttribute('data-isfolder') === 'true',
        StartDate: card.getAttribute('data-startdate'),
        EndDate: card.getAttribute('data-enddate'),
        UserData: {
            PlaybackPositionTicks: parseInt(card.getAttribute('data-positionticks') || '0', 10)
        }
    };
}

function executeAction(card: HTMLElement, target: HTMLElement | null, action: ItemAction): void {
    const resolvedTarget = target || card;
    const item = getItemInfoFromCard(card);
    const serverId = item.ServerId || (window as any).ApiClient.serverId();
    const playableItemId = item.Type === 'Program' ? item.ChannelId : item.Id;

    switch (action) {
        case ItemAction.Link:
            appRouter.showItem(item as any, { context: card.getAttribute('data-context'), parentId: card.getAttribute('data-parentid') });
            break;
        case ItemAction.Play:
        case ItemAction.Resume:
            const pos = item.UserData.PlaybackPositionTicks;
            if ((playbackManager as any).canPlay(item)) {
                (playbackManager as any).play({ ids: [playableItemId], startPositionTicks: pos, serverId });
            }
            break;
        case ItemAction.Menu:
            import('./itemContextMenu').then(m => m.default.show({ item, user: {}, positionTo: resolvedTarget! }));
            break;
    }
}

export function on(context: HTMLElement, options: any = {}): void {
    if (options.click !== false) context.addEventListener('click', onClick as any);
    if (options.command !== false) inputManager.on(context, ((e: any) => {
        const cmd = e.detail.command;
        if (['play', 'resume', 'record', 'menu', 'info'].includes(cmd)) {
            const card = dom.parentWithClass(e.target, 'itemAction') || dom.parentWithAttribute(e.target, 'data-id');
            if (card) { e.preventDefault(); e.stopPropagation(); executeAction(card, card, cmd); }
        }
    }) as any);
}

export function off(context: HTMLElement, options: any = {}): void {
    context.removeEventListener('click', onClick as any);
    if (options.command !== false) inputManager.off(context, (() => {}) as any);
}

const shortcuts = { on, off, onClick, getShortcutAttributesHtml: (item: any, serverId?: string) => `data-id="${item.Id}" data-serverid="${serverId || item.ServerId}" data-type="${item.Type}" data-mediatype="${item.MediaType}"` };
export default shortcuts;
