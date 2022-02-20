import { BaseItemDto, TimerInfoDto, UserItemDataDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import classNames from 'classnames';
import { ApiClient, Event as EventObject, Events } from 'jellyfin-apiclient';
import React, { Component, ReactNode } from 'react';
import cardBuilder from '../../components/cardbuilder/cardBuilder';
import ItemCard, { ItemCardProps } from '../../components/cardbuilder/ItemCard';
import layoutManager from '../../components/layoutManager';
import { playbackManager } from '../../components/playback/playbackmanager';
import serverNotifications from '../../scripts/serverNotifications';
import itemShortcuts from '../../components/shortcuts';
import dom from '../../scripts/dom';
import inputManager from '../../scripts/inputManager';
import CardsContainer from './CardsContainer';

// TODO: Cleanup from CardsContainer
// TODO: Implement multi-select
// TODO: Implement Drag&Drop

interface IProps {
    afterRefresh?: (items: BaseItemDto[]) => void;
    cardOptions?: ItemCardProps;
    className?: string;
    enableContextMenu?: boolean;
    eventsToMonitor?: string[];
    fetchData?: () => Promise<BaseItemDto[]>;
    items?: BaseItemDto[];
    parentId?: string;
    renderItems?: (items: BaseItemDto[]) => ReactNode;
    refreshInterval?: number;
}

interface IState {
    items?: BaseItemDto[];
}

/**
 * Timeout for refreshing by event.
 */
const REFRESH_BY_EVENT_TIMEOUT = 10000;

// FIXME: Move to some utility file?
function disableEvent(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    return false;
}

function getShortcutOptions() {
    return {
        click: false
    };
}

class ItemsContainer extends Component<IProps, IState> {
    ref = React.createRef<HTMLDivElement>();
    refreshTimer: any;
    paused = true;
    needsRefresh = true;
    refreshPromise?: Promise<void>|null;
    refreshPromiseResolve?: () => void;

    constructor(props: IProps) {
        super(props);

        this.state = {};

        this.refresh = this.refresh.bind(this);
        //this.onClick = this.onClick.bind(this);
        this.onContextMenu = this.onContextMenu.bind(this);
        this.onUserDataChanged = this.onUserDataChanged.bind(this);
        this.onTimerCreated = this.onTimerCreated.bind(this);
        this.onTimerCancelled = this.onTimerCancelled.bind(this);
        this.onSeriesTimerCreated = this.onSeriesTimerCreated.bind(this);
        this.onSeriesTimerCancelled = this.onSeriesTimerCancelled.bind(this);
        this.onLibraryChanged = this.onLibraryChanged.bind(this);
        this.onPlaybackStopped = this.onPlaybackStopped.bind(this);
    }

    resume(options: any = {}) {
        this.paused = false;

        if (options.refresh) {
            return this.refresh();
        }

        if (!this.refreshTimer) {
            this.scheduleRefresh(REFRESH_BY_EVENT_TIMEOUT);
        }

        return Promise.resolve();
    }

    pause() {
        this.paused = true;
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
    }

    refresh() {
        if (this.props.items || !this.props.fetchData) {
            return Promise.resolve();
        }

        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        if (this.paused) {
            this.needsRefresh = true;
            // FIXME: Could return PromiseDelay (jellyfin-apiclient-javascript PR)
            return Promise.resolve();
        }

        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;

        this.needsRefresh = false;

        this.refreshPromise = this.props.fetchData().then((items) => {
            this.refreshPromise = null;

            this.setState({
                items
            });

            const refreshInterval = this.props.refreshInterval || 0;

            if (!this.paused && refreshInterval > 0) {
                this.scheduleRefresh(refreshInterval);
            }

            this.props.afterRefresh?.(items);
        });

        return this.refreshPromise;
    }

    scheduleRefresh(timeout: number) {
        this.needsRefresh = true;

        if (this.paused) {
            return;
        }

        clearTimeout(this.refreshTimer);

        this.refreshTimer = setTimeout(() => {
            this.refresh();
        }, timeout);
    }

    /*onClick(e: React.MouseEvent<HTMLElement>) {
        // FIXME: need multiSelect
        const itemsContainer = this.ref.current as any;
        const multiSelect = itemsContainer.multiSelect;

        if (multiSelect && multiSelect.onContainerClick.call(itemsContainer, e) === false) {
            return;
        }

        itemShortcuts.onClick.call(itemsContainer, e);
    }*/

    onContextMenu(e: MouseEvent) {
        const target = e.target as HTMLElement;
        const card = dom.parentWithAttribute(target, 'data-id');

        // check for serverId, it won't be present on selectserver
        if (card && card.getAttribute('data-serverid')) {
            inputManager.handleCommand('menu', {
                sourceElement: card
            });

            return disableEvent(e);
        }
    }

    onUserDataChanged(_e: EventObject, _apiClient: ApiClient, _userData: UserItemDataDto) {
        // TODO: cardBuilder.onUserDataChanged

        const eventsToMonitor = this.props.eventsToMonitor || [];

        // TODO: Check user data change reason?
        if (eventsToMonitor.includes('markfavorite') ||
            eventsToMonitor.includes('markplayed')) {
            this.scheduleRefresh(REFRESH_BY_EVENT_TIMEOUT);
        }
    }

    onTimerCreated(_e: EventObject, _apiClient: ApiClient, _data: TimerInfoDto) {
        if (this.props.eventsToMonitor?.includes('timers')) {
            this.scheduleRefresh(REFRESH_BY_EVENT_TIMEOUT);
            return;
        }

        // TODO: cardBuilder.onTimerCreated
    }

    onTimerCancelled(_e: EventObject, _apiClient: ApiClient, _data: any) {
        if (this.props.eventsToMonitor?.includes('timers')) {
            this.scheduleRefresh(REFRESH_BY_EVENT_TIMEOUT);
            return;
        }

        // TODO: cardBuilder.onTimerCancelled
    }

    onSeriesTimerCreated() {
        if (this.props.eventsToMonitor?.includes('timers')) {
            this.scheduleRefresh(REFRESH_BY_EVENT_TIMEOUT);
        }
    }

    onSeriesTimerCancelled(_e: EventObject, _apiClient: ApiClient, _data: any) {
        if (this.props.eventsToMonitor?.includes('seriestimers')) {
            // yes this is an assumption
            return;
        }

        // TODO: cardBuilder.onSeriesTimerCancelled
    }

    onLibraryChanged(_e: EventObject, _apiClient: ApiClient, data: any) {
        const eventsToMonitor = this.props.eventsToMonitor || [];

        if (eventsToMonitor.includes('seriestimers') || eventsToMonitor.includes('timers')) {
            // yes this is an assumption
            return;
        }

        const itemsAdded = data.ItemsAdded || [];
        const itemsRemoved = data.ItemsRemoved || [];

        if (!itemsAdded.length && !itemsRemoved.length) {
            return;
        }

        const parentId = this.props.parentId;

        if (parentId) {
            const foldersAddedTo = data.FoldersAddedTo || [];
            const foldersRemovedFrom = data.FoldersRemovedFrom || [];
            const collectionFolders = data.CollectionFolders || [];

            if (!foldersAddedTo.includes(parentId) &&
                !foldersRemovedFrom.includes(parentId) &&
                collectionFolders.includes(parentId)) {
                return;
            }
        }

        this.scheduleRefresh(REFRESH_BY_EVENT_TIMEOUT);
    }

    onPlaybackStopped(_e: EventObject, stopInfo: any) {
        const state = stopInfo.state;

        if (state.NowPlayingItem) {
            const eventsToMonitor = this.props.eventsToMonitor || [];

            if (state.NowPlayingItem.MediaType === 'Video' && eventsToMonitor.includes('videoplayback') ||
                state.NowPlayingItem.MediaType === 'Audio' && eventsToMonitor.includes('audioplayback')) {
                this.refresh();
            }
        }
    }

    componentDidMount() {
        const container = this.ref.current as HTMLDivElement;

        // Add methods for backward compatibility
        (container as any).resume = (options: any) => this.resume(options);
        (container as any).pause = () => this.pause();

        //if (browser.touch) {
        //    container.addEventListener('contextmenu', disableEvent);
        //} else {
        //    if (this.props.enableContextMenu !== false) {
        //        container.addEventListener('contextmenu', this.onContextMenu);
        //    }
        //}

        // TODO
        //if (layoutManager.desktop || layoutManager.mobile) {
        //    if (this.getAttribute('data-multiselect') !== 'false') {
        //        this.enableMultiSelect(true);
        //    }
        //}

        itemShortcuts.on(container, getShortcutOptions());

        Events.on(serverNotifications, 'UserDataChanged', this.onUserDataChanged);
        Events.on(serverNotifications, 'TimerCreated', this.onTimerCreated);
        Events.on(serverNotifications, 'TimerCancelled', this.onTimerCancelled);
        Events.on(serverNotifications, 'SeriesTimerCreated', this.onSeriesTimerCreated);
        Events.on(serverNotifications, 'SeriesTimerCancelled', this.onSeriesTimerCancelled);
        Events.on(serverNotifications, 'LibraryChanged', this.onLibraryChanged);
        Events.on(playbackManager, 'playbackstop', this.onPlaybackStopped);

        // TODO
        //if (this.getAttribute('data-dragreorder') === 'true') {
        //    this.enableDragReordering(true);
        //}
    }

    //componentDidUpdate(prevProps: IProps) {
    //}

    componentWillUnmount() {
        const container = this.ref.current as HTMLDivElement;

        this.pause();

        // TODO
        //this.enableMultiSelect(false);
        //this.enableDragReordering(false);

        //container.removeEventListener('contextmenu', this.onContextMenu);
        //container.removeEventListener('contextmenu', disableEvent);

        itemShortcuts.off(container, getShortcutOptions());

        Events.off(serverNotifications, 'UserDataChanged', this.onUserDataChanged);
        Events.off(serverNotifications, 'TimerCreated', this.onTimerCreated);
        Events.off(serverNotifications, 'TimerCancelled', this.onTimerCancelled);
        Events.off(serverNotifications, 'SeriesTimerCreated', this.onSeriesTimerCreated);
        Events.off(serverNotifications, 'SeriesTimerCancelled', this.onSeriesTimerCancelled);
        Events.off(serverNotifications, 'LibraryChanged', this.onLibraryChanged);
        Events.off(playbackManager, 'playbackstop', this.onPlaybackStopped);
    }

    render() {
        const items = this.state.items || this.props.items || [];

        const cardOptions = this.props.cardOptions || {};
        cardBuilder.setCardData(items, cardOptions);

        let className = classNames('itemsContainer', this.props.className);

        if (layoutManager.tv) {
            className += 'itemsContainer-tv';
        }

        /*const getCards = () => {
            return items.map((item, index) => {
                return (
                    <ItemCard
                        key={index}
                        index={index}
                        item={item}
                        {...cardOptions}
                    />
                )
            })
        };*/

        return (
            <CardsContainer ref={this.ref}
                className={className}
                //onClick={this.onClick}
                onContextMenu={this.onContextMenu}
                //getCards={getCards}
            >
                {items.map((item, index) => {
                    return (
                        <ItemCard
                            key={index}
                            index={index}
                            item={item}
                            {...cardOptions}
                        />
                    );
                })}
            </CardsContainer>
        );
    }
}

export default ItemsContainer;
