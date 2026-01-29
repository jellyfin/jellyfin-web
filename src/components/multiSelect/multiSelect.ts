/**
 * @deprecated This module is deprecated in favor of React + Zustand.
 *
 * Migration:
     - Multi-select state → Zustand store
     - Selection UI → React components with ui-primitives
     - DOM manipulation → React state + refs
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import { AppFeature } from 'constants/appFeature';
import type { ApiClient } from 'jellyfin-apiclient';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from '../../lib/globalize';
import browser from '../../scripts/browser';
import dom from '../../utils/dom';
import alert from '../alert';
import { safeAppHost } from '../apphost';
import confirm from '../confirm/confirm';
import itemHelper, { type User } from '../itemHelper';
import loading from '../loading/loading';
import './multiSelect.scss';

interface MultiSelectOptions {
    container: HTMLElement;
    bindOnClick?: boolean;
}

interface MenuItem {
    name: string;
    id: string;
    icon: string;
}

let selectedItems: string[] = [];
let selectedElements: HTMLInputElement[] = [];
let currentSelectionCommandsPanel: HTMLElement | null = null;

function hideSelections(): void {
    const selectionCommandsPanel = currentSelectionCommandsPanel;
    if (selectionCommandsPanel) {
        selectionCommandsPanel.parentNode?.removeChild(selectionCommandsPanel);
        currentSelectionCommandsPanel = null;

        selectedItems = [];
        selectedElements = [];
        const elems = document.querySelectorAll('.itemSelectionPanel');
        for (let i = 0, length = elems.length; i < length; i++) {
            const parent = elems[i].parentNode as HTMLElement | null;
            parent?.removeChild(elems[i]);
            parent?.classList.remove('withMultiSelect');
        }
    }
}

function onItemSelectionPanelClick(e: MouseEvent, itemSelectionPanel: Element): boolean | void {
    if (!dom.parentWithClass(e.target as HTMLElement, 'chkItemSelect')) {
        const chkItemSelect = itemSelectionPanel.querySelector(
            '.chkItemSelect'
        ) as HTMLInputElement;

        if (chkItemSelect) {
            if (chkItemSelect.classList.contains('checkedInitial')) {
                chkItemSelect.classList.remove('checkedInitial');
            } else {
                const newValue = !chkItemSelect.checked;
                chkItemSelect.checked = newValue;
                updateItemSelection(chkItemSelect, newValue);
            }
        }
    }

    e.preventDefault();
    e.stopPropagation();
    return false;
}

function updateItemSelection(chkItemSelect: HTMLInputElement, selected: boolean): void {
    const parentWithDataId = dom.parentWithAttribute(chkItemSelect, 'data-id');
    const id = parentWithDataId?.getAttribute('data-id');

    if (!id) return;

    if (selected) {
        const current = selectedItems.filter((i) => {
            return i === id;
        });

        if (!current.length) {
            selectedItems.push(id);
            selectedElements.push(chkItemSelect);
        }
    } else {
        selectedItems = selectedItems.filter((i) => {
            return i !== id;
        });
        selectedElements = selectedElements.filter((i) => {
            return i !== chkItemSelect;
        });
    }

    if (selectedItems.length) {
        const itemSelectionCount = document.querySelector('.itemSelectionCount');
        if (itemSelectionCount) {
            itemSelectionCount.innerHTML = String(selectedItems.length);
        }
    } else {
        hideSelections();
    }
}

function onSelectionChange(this: HTMLInputElement): void {
    updateItemSelection(this, this.checked);
}

function showSelection(item: Element, isChecked: boolean, addInitialCheck: boolean): void {
    let itemSelectionPanel = item.querySelector('.itemSelectionPanel');

    if (!itemSelectionPanel) {
        itemSelectionPanel = document.createElement('div');
        itemSelectionPanel.classList.add('itemSelectionPanel');

        const parent = item.querySelector('.cardBox') || item.querySelector('.cardContent');
        if (parent) {
            parent.classList.add('withMultiSelect');
            parent.appendChild(itemSelectionPanel);
        }

        let cssClass = 'chkItemSelect';
        if (isChecked && addInitialCheck) {
            cssClass += ' checkedInitial';
        }
        const checkedAttribute = isChecked ? ' checked' : '';
        itemSelectionPanel.innerHTML = `<label class="checkboxContainer"><input type="checkbox" is="emby-checkbox" data-outlineclass="multiSelectCheckboxOutline" class="${cssClass}"${checkedAttribute}/><span></span></label>`;
        const chkItemSelect = itemSelectionPanel.querySelector(
            '.chkItemSelect'
        ) as HTMLInputElement;
        chkItemSelect.addEventListener('change', onSelectionChange);
    }
}

function showSelectionCommands(): void {
    let selectionCommandsPanel = currentSelectionCommandsPanel;

    if (!selectionCommandsPanel) {
        selectionCommandsPanel = document.createElement('div');
        selectionCommandsPanel.classList.add('selectionCommandsPanel');

        document.body.appendChild(selectionCommandsPanel);
        currentSelectionCommandsPanel = selectionCommandsPanel;

        let html = '';

        html +=
            '<button is="paper-icon-button-light" class="btnCloseSelectionPanel autoSize"><span class="material-icons close" aria-hidden="true"></span></button>';
        html += '<h1 class="itemSelectionCount"></h1>';

        const moreIcon = 'more_vert';
        html += `<button is="paper-icon-button-light" class="btnSelectionPanelOptions autoSize"><span class="material-icons ${moreIcon}" aria-hidden="true"></span></button>`;

        selectionCommandsPanel.innerHTML = html;

        const btnClose = selectionCommandsPanel.querySelector('.btnCloseSelectionPanel');
        btnClose?.addEventListener('click', hideSelections);

        const btnSelectionPanelOptions = selectionCommandsPanel.querySelector(
            '.btnSelectionPanelOptions'
        ) as HTMLElement;

        dom.addEventListener(
            btnSelectionPanelOptions,
            'click',
            showMenuForSelectedItems as EventListener,
            { passive: true } as AddEventListenerOptions
        );
    }
}

interface AlertOptions {
    title?: string;
    text?: string;
    button?: string;
}

function alertText(options: AlertOptions): Promise<void> {
    return new Promise((resolve) => {
        alert(options).then(
            () => resolve(),
            () => resolve()
        );
    });
}

function deleteItems(apiClient: ApiClient, itemIds: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        let msg = globalize.translate('ConfirmDeleteItem');
        let title = globalize.translate('HeaderDeleteItem');

        if (itemIds.length > 1) {
            msg = globalize.translate('ConfirmDeleteItems');
            title = globalize.translate('HeaderDeleteItems');
        }

        confirm(msg, title).then(() => {
            const promises = itemIds.map((itemId) => apiClient.deleteItem(itemId));

            Promise.all(promises).then(
                () => resolve(),
                () => {
                    alertText({ text: globalize.translate('ErrorDeletingItem') }).then(
                        () => reject(),
                        () => reject()
                    );
                }
            );
        }, reject);
    });
}

function showMenuForSelectedItems(e: MouseEvent): void {
    const apiClient = ServerConnections.currentApiClient();

    if (!apiClient) return;

    apiClient.getCurrentUser().then((user) => {
        if (!selectedItems[0]) return;

        apiClient.getItem(apiClient.getCurrentUserId(), selectedItems[0]).then((firstItem) => {
            const menuItems: MenuItem[] = [];

            menuItems.push({
                name: globalize.translate('SelectAll'),
                id: 'selectall',
                icon: 'select_all'
            });

            menuItems.push({
                name: globalize.translate('AddToCollection'),
                id: 'addtocollection',
                icon: 'add'
            });

            menuItems.push({
                name: globalize.translate('AddToPlaylist'),
                id: 'playlist',
                icon: 'playlist_add'
            });

            if ((user as User).Policy?.EnableContentDeletion) {
                menuItems.push({
                    name: globalize.translate('Delete'),
                    id: 'delete',
                    icon: 'delete'
                });
            }

            if (
                (user as User).Policy?.EnableContentDownloading &&
                safeAppHost.supports(AppFeature.FileDownload)
            ) {
            }

            if ((user as User).Policy?.IsAdministrator) {
                menuItems.push({
                    name: globalize.translate('GroupVersions'),
                    id: 'groupvideos',
                    icon: 'call_merge'
                });
            }

            menuItems.push({
                name: globalize.translate('MarkPlayed'),
                id: 'markplayed',
                icon: 'check_box'
            });

            menuItems.push({
                name: globalize.translate('MarkUnplayed'),
                id: 'markunplayed',
                icon: 'check_box_outline_blank'
            });

            if (itemHelper.canRefreshMetadata(firstItem as any, user)) {
                menuItems.push({
                    name: globalize.translate('RefreshMetadata'),
                    id: 'refresh',
                    icon: 'refresh'
                });
            }

            import('../actionSheet/actionSheet').then((actionsheet) => {
                actionsheet.show({
                    items: menuItems,
                    positionTo: e.target as Element | null | undefined,
                    callback: function (id: string) {
                        const items = selectedItems.slice(0);
                        const serverId = (apiClient as any).serverInfo().Id;

                        switch (id) {
                            case 'selectall':
                                {
                                    const elems = document.querySelectorAll('.itemSelectionPanel');
                                    for (let i = 0, length = elems.length; i < length; i++) {
                                        const chkItemSelect = elems[i].querySelector(
                                            '.chkItemSelect'
                                        ) as HTMLInputElement;

                                        if (
                                            chkItemSelect &&
                                            !chkItemSelect.classList.contains('checkedInitial') &&
                                            !chkItemSelect.checked &&
                                            chkItemSelect.getBoundingClientRect().width !== 0
                                        ) {
                                            chkItemSelect.checked = true;
                                            updateItemSelection(chkItemSelect, true);
                                        }
                                    }
                                }
                                break;
                            case 'addtocollection':
                                import('../collectionEditor/collectionEditor').then(
                                    ({ default: CollectionEditor }) => {
                                        const collectionEditor = new CollectionEditor();
                                        collectionEditor.show({
                                            items: items,
                                            serverId: serverId
                                        });
                                    }
                                );
                                hideSelections();
                                dispatchNeedsRefresh();
                                break;
                            case 'playlist':
                                import('../playlisteditor/playlisteditor')
                                    .then(({ default: PlaylistEditor }) => {
                                        const playlistEditor = new PlaylistEditor();
                                        playlistEditor
                                            .show({
                                                items: items,
                                                serverId: serverId
                                            })
                                            .catch(() => {});
                                    })
                                    .catch((err) => {
                                        console.error(
                                            '[AddToPlaylist] failed to load playlist editor',
                                            err
                                        );
                                    });
                                hideSelections();
                                dispatchNeedsRefresh();
                                break;
                            case 'delete':
                                deleteItems(apiClient, items).then(dispatchNeedsRefresh);
                                hideSelections();
                                dispatchNeedsRefresh();
                                break;
                            case 'groupvideos':
                                combineVersions(apiClient, items);
                                break;
                            case 'markplayed':
                                items.forEach((itemId) => {
                                    apiClient.markPlayed(
                                        apiClient.getCurrentUserId(),
                                        itemId,
                                        new Date()
                                    );
                                });
                                hideSelections();
                                dispatchNeedsRefresh();
                                break;
                            case 'markunplayed':
                                items.forEach((itemId) => {
                                    apiClient.markUnplayed(
                                        apiClient.getCurrentUserId(),
                                        itemId,
                                        new Date()
                                    );
                                });
                                hideSelections();
                                dispatchNeedsRefresh();
                                break;
                            case 'refresh':
                                import('../refreshdialog/refreshdialog').then(
                                    ({ default: RefreshDialog }) => {
                                        new RefreshDialog({
                                            itemIds: items,
                                            serverId: serverId
                                        }).show();
                                    }
                                );
                                hideSelections();
                                dispatchNeedsRefresh();
                                break;
                            default:
                                break;
                        }
                    }
                });
            });
        });
    });
}

function dispatchNeedsRefresh(): void {
    const elems: Element[] = [];

    [].forEach.call(selectedElements, (i) => {
        const container = dom.parentWithAttribute(i as HTMLElement, 'is', 'emby-itemscontainer');

        if (container && !elems.includes(container)) {
            elems.push(container);
        }
    });

    for (let i = 0, length = elems.length; i < length; i++) {
        (elems[i] as any).notifyRefreshNeeded(true);
    }
}

function combineVersions(apiClient: ApiClient, selection: string[]): void {
    if (selection.length < 2) {
        alert({
            text: globalize.translate('PleaseSelectTwoItems')
        });

        return;
    }

    loading.show();

    apiClient
        .ajax({
            type: 'POST',
            url: apiClient.getUrl('Videos/MergeVersions', { Ids: selection.join(',') })
        })
        .then(() => {
            loading.hide();
            hideSelections();
            dispatchNeedsRefresh();
        });
}

function showSelections(initialCard: Element, addInitialCheck: boolean): void {
    import('../../elements/emby-checkbox/emby-checkbox').then(() => {
        const cards = document.querySelectorAll('.card');
        for (let i = 0, length = cards.length; i < length; i++) {
            showSelection(cards[i], initialCard === cards[i], addInitialCheck);
        }

        showSelectionCommands();
        updateItemSelection(initialCard as unknown as HTMLInputElement, true);
    });
}

function onContainerClick(e: MouseEvent): boolean | void {
    const target = e.target as Element;

    if (selectedItems.length) {
        const card = dom.parentWithClass(target as HTMLElement, 'card');
        if (card) {
            const itemSelectionPanel = card.querySelector('.itemSelectionPanel');
            if (itemSelectionPanel) {
                return onItemSelectionPanelClick(e, itemSelectionPanel);
            }
        }

        e.preventDefault();
        e.stopPropagation();
        return false;
    }
}

document.addEventListener('viewbeforehide', hideSelections);

interface MultiSelectInstance {
    onContainerClick: (e: MouseEvent) => boolean | void;
    destroy: () => void;
}

export default function multiSelect(options: MultiSelectOptions): MultiSelectInstance {
    const container = options.container;

    function onTapHold(e: Event): boolean | void {
        const card = dom.parentWithClass(e.target as HTMLElement, 'card');

        if (card) {
            showSelections(card, true);
        }

        e.preventDefault();
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        return false;
    }

    function getTouches(e: Event): TouchList | null {
        const event = e as TouchEvent;
        return event.changedTouches || event.targetTouches || null;
    }

    let touchTarget: HTMLElement | null = null;
    let touchStartTimeout: ReturnType<typeof setTimeout> | null = null;
    let touchStartX = 0;
    let touchStartY = 0;

    function onTouchStart(e: Event): void {
        const touches = getTouches(e);
        const touch = touches?.[0];
        touchTarget = null;
        touchStartX = 0;
        touchStartY = 0;

        if (touch) {
            touchStartX = touch.clientX;
            touchStartY = touch.clientY;
            const element = touch.target as HTMLElement;

            if (element) {
                const card = dom.parentWithClass(element, 'card');

                if (card) {
                    if (touchStartTimeout) {
                        clearTimeout(touchStartTimeout);
                        touchStartTimeout = null;
                    }

                    touchTarget = card;
                    touchStartTimeout = setTimeout(onTouchStartTimerFired, 550);
                }
            }
        }
    }

    function onTouchMove(e: Event): void {
        if (touchTarget) {
            const touches = getTouches(e);
            const touch = touches?.[0];
            let deltaX = 0;
            let deltaY = 0;

            if (touch) {
                const touchEndX = touch.clientX || 0;
                const touchEndY = touch.clientY || 0;
                deltaX = Math.abs(touchEndX - (touchStartX || 0));
                deltaY = Math.abs(touchEndY - (touchStartY || 0));
            } else {
                deltaX = 100;
                deltaY = 100;
            }
            if (deltaX >= 5 || deltaY >= 5) {
                onMouseOut();
            }
        }
    }

    function onTouchEnd(): void {
        onMouseOut();
    }

    function onMouseDown(e: MouseEvent): void {
        if (touchStartTimeout) {
            clearTimeout(touchStartTimeout);
            touchStartTimeout = null;
        }

        touchTarget = e.target as HTMLElement;
        touchStartTimeout = setTimeout(onTouchStartTimerFired, 550);
    }

    function onMouseOut(): void {
        if (touchStartTimeout) {
            clearTimeout(touchStartTimeout);
            touchStartTimeout = null;
        }
        touchTarget = null;
    }

    function onTouchStartTimerFired(): void {
        if (!touchTarget) {
            return;
        }

        const card = dom.parentWithClass(touchTarget, 'card');
        touchTarget = null;

        if (card) {
            showSelections(card, true);
        }
    }

    function initTapHold(element: HTMLElement): void {
        if (browser.touch && !browser.safari) {
            element.addEventListener('contextmenu', onTapHold);
        } else {
            dom.addEventListener(element, 'touchstart', onTouchStart, {
                passive: true
            } as AddEventListenerOptions);
            dom.addEventListener(element, 'touchmove', onTouchMove, {
                passive: true
            } as AddEventListenerOptions);
            dom.addEventListener(element, 'touchend', onTouchEnd, {
                passive: true
            } as AddEventListenerOptions);
            dom.addEventListener(element, 'touchcancel', onTouchEnd, {
                passive: true
            } as AddEventListenerOptions);
            dom.addEventListener(
                element,
                'mousedown',
                onMouseDown as EventListener,
                { passive: true } as AddEventListenerOptions
            );
            dom.addEventListener(
                element,
                'mouseleave',
                onMouseOut as EventListener,
                { passive: true } as AddEventListenerOptions
            );
            dom.addEventListener(
                element,
                'mouseup',
                onMouseOut as EventListener,
                { passive: true } as AddEventListenerOptions
            );
        }
    }

    initTapHold(container);

    if (options.bindOnClick !== false) {
        container.addEventListener('click', onContainerClick);
    }

    const self: MultiSelectInstance = {
        onContainerClick: onContainerClick,
        destroy: () => {
            container.removeEventListener('click', onContainerClick);
            container.removeEventListener('contextmenu', onTapHold);

            const element = container;

            dom.removeEventListener(
                element,
                'touchstart',
                onTouchStart as EventListener,
                { passive: true } as EventListenerOptions
            );
            dom.removeEventListener(
                element,
                'touchmove',
                onTouchMove as EventListener,
                { passive: true } as EventListenerOptions
            );
            dom.removeEventListener(
                element,
                'touchend',
                onTouchEnd as EventListener,
                { passive: true } as EventListenerOptions
            );
            dom.removeEventListener(
                element,
                'mousedown',
                onMouseDown as EventListener,
                { passive: true } as EventListenerOptions
            );
            dom.removeEventListener(
                element,
                'mouseleave',
                onMouseOut as EventListener,
                { passive: true } as EventListenerOptions
            );
            dom.removeEventListener(
                element,
                'mouseup',
                onMouseOut as EventListener,
                { passive: true } as EventListenerOptions
            );
        }
    };

    return self;
}

export const startMultiSelect = (card: Element): void => {
    showSelections(card, false);
};

export const stopMultiSelect = (): void => {
    hideSelections();
};
