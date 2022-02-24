import browser from '../../scripts/browser';
import { appHost } from '../apphost';
import loading from '../loading/loading';
import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import ServerConnections from '../ServerConnections';
import alert from '../alert';
import playlistEditor from '../playlisteditor/playlisteditor';
import confirm from '../confirm/confirm';
import itemHelper from '../itemHelper';

import './multiSelect.scss';

function deleteItems(apiClient, itemIds) {
    return new Promise((resolve, reject) => {
        let msg = globalize.translate('ConfirmDeleteItem');
        let title = globalize.translate('HeaderDeleteItem');

        if (itemIds.length > 1) {
            msg = globalize.translate('ConfirmDeleteItems');
            title = globalize.translate('HeaderDeleteItems');
        }

        confirm(msg, title).then(() => {
            const promises = itemIds.map(itemId => apiClient.deleteItem(itemId));

            Promise.all(promises).then(resolve, () => {
                alert(globalize.translate('ErrorDeletingItem')).finally(reject);
            });
        }, reject);
    });
}

const getTouches = e => e.changedTouches || e.targetTouches || e.touches;

class MultiSelect {
    selectedItems = [];
    selectedElements = [];
    currentSelectionCommandsPanel;

    touchTarget;
    touchStartTimeout;
    touchStartX;
    touchStartY;

    constructor({ container }) {
        this.container = container;

        this.initEventListeners();

        document.addEventListener('viewbeforehide', this.hideSelections.bind(this));
    }

    initEventListeners() {
        // mobile safari doesn't allow contextmenu override
        if (browser.touch && !browser.safari) {
            this.container.addEventListener('contextmenu', this.onTapHold.bind(this));
        } else {
            dom.addEventListener(
                this.container,
                'touchstart',
                this.onTouchStart.bind(this),
                { passive: true }
            );
            dom.addEventListener(
                this.container,
                'touchmove',
                this.onTouchMove.bind(this),
                { passive: true }
            );
            dom.addEventListener(
                this.container,
                'touchend',
                this.onTouchEnd.bind(this),
                { passive: true }
            );
            dom.addEventListener(
                this.container,
                'touchcancel',
                this.onTouchEnd.bind(this),
                { passive: true }
            );
            dom.addEventListener(
                this.container,
                'mousedown',
                this.onMouseDown.bind(this),
                { passive: true }
            );
            dom.addEventListener(
                this.container,
                'mouseleave',
                this.onMouseOut.bind(this),
                { passive: true }
            );
            dom.addEventListener(
                this.container,
                'mouseup',
                this.onMouseOut.bind(this),
                { passive: true }
            );
        }
    }

    destroy() {
        this.container.removeEventListener('contextmenu', this.onTapHold.bind(this));

        dom.removeEventListener(
            this.container,
            'touchstart',
            this.onTouchStart.bind(this),
            { passive: true }
        );
        dom.removeEventListener(
            this.container,
            'touchmove',
            this.onTouchMove.bind(this),
            { passive: true }
        );
        dom.removeEventListener(
            this.container,
            'touchend',
            this.onTouchEnd.bind(this),
            { passive: true }
        );
        dom.removeEventListener(
            this.container,
            'mousedown',
            this.onMouseDown.bind(this),
            { passive: true }
        );
        dom.removeEventListener(
            this.container,
            'mouseleave',
            this.onMouseOut.bind(this),
            { passive: true }
        );
        dom.removeEventListener(
            this.container,
            'mouseup',
            this.onMouseOut.bind(this),
            { passive: true }
        );
    }

    showSelections(initialCard) {
        import('../../elements/emby-checkbox/emby-checkbox').then(() => {
            Array.from(this.container.querySelectorAll('.card'))
                .forEach(card => {
                    this.showSelection(card, initialCard === card);
                });

            this.showSelectionCommands();
            this.updateItemSelection(initialCard, true);
        });
    }

    showSelection(item, isChecked) {
        let itemSelectionPanel = item.querySelector('.itemSelectionPanel');

        if (!itemSelectionPanel) {
            itemSelectionPanel = document.createElement('div');
            itemSelectionPanel.classList.add('itemSelectionPanel');

            const parent = item.querySelector('.cardBox') || item.querySelector('.cardContent');
            parent.classList.add('withMultiSelect');
            parent.appendChild(itemSelectionPanel);

            let cssClass = 'chkItemSelect';
            if (isChecked && !browser.firefox) {
                // In firefox, the initial tap hold doesnt' get treated as a click
                // In other browsers it does, so we need to make sure that initial click is ignored
                cssClass += ' checkedInitial';
            }

            const checkedAttribute = isChecked ? ' checked' : '';
            itemSelectionPanel.innerHTML = `<label class="checkboxContainer"><input type="checkbox" is="emby-checkbox" data-outlineclass="multiSelectCheckboxOutline" class="${cssClass}"${checkedAttribute}/><span></span></label>`;

            const chkItemSelect = itemSelectionPanel.querySelector('.chkItemSelect');
            chkItemSelect.addEventListener('change', () => {
                this.updateItemSelection(chkItemSelect, chkItemSelect.checked);
            });
        }
    }

    showSelectionCommands() {
        if (!this.currentSelectionCommandsPanel) {
            const selectionCommandsPanel = document.createElement('div');
            selectionCommandsPanel.classList.add('selectionCommandsPanel');

            document.body.appendChild(selectionCommandsPanel);
            this.currentSelectionCommandsPanel = selectionCommandsPanel;

            let html = '';
            html += '<button is="paper-icon-button-light" class="btnCloseSelectionPanel autoSize"><span class="material-icons close" aria-hidden="true"></span></button>';
            html += '<h1 class="itemSelectionCount"></h1>';
            html += '<button is="paper-icon-button-light" class="btnSelectionPanelOptions autoSize" style="margin-left:auto;"><span class="material-icons more_vert" aria-hidden="true"></span></button>';

            selectionCommandsPanel.innerHTML = html;

            selectionCommandsPanel.querySelector('.btnCloseSelectionPanel').addEventListener('click', this.hideSelections.bind(this));

            dom.addEventListener(
                selectionCommandsPanel.querySelector('.btnSelectionPanelOptions'),
                'click',
                this.showMenuForSelectedItems.bind(this),
                { passive: true }
            );
        }
    }

    showMenuForSelectedItems(e) {
        const apiClient = ServerConnections.currentApiClient();

        apiClient.getCurrentUser().then(user => {
            // get first selected item to perform metadata refresh permission check
            apiClient.getItem(apiClient.getCurrentUserId(), this.selectedItems[0]).then(firstItem => {
                const menuItems = [];

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

                // TODO: Be more dynamic based on what is selected
                if (user.Policy.EnableContentDeletion) {
                    menuItems.push({
                        name: globalize.translate('Delete'),
                        id: 'delete',
                        icon: 'delete'
                    });
                }

                if (user.Policy.EnableContentDownloading && appHost.supports('filedownload')) {
                    // Disabled because there is no callback for this item
                    /*
                    menuItems.push({
                        name: globalize.translate('Download'),
                        id: 'download',
                        icon: 'file_download'
                    });
                    */
                }

                if (user.Policy.IsAdministrator) {
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

                // this assues that if the user can refresh metadata for the first item
                // they can refresh metadata for all items
                if (itemHelper.canRefreshMetadata(firstItem, user)) {
                    menuItems.push({
                        name: globalize.translate('RefreshMetadata'),
                        id: 'refresh',
                        icon: 'refresh'
                    });
                }

                import('../actionSheet/actionSheet').then(actionsheet => {
                    actionsheet.show({
                        items: menuItems,
                        positionTo: e.target,
                        callback: id => {
                            const items = this.selectedItems.slice(0);
                            const serverId = apiClient.serverInfo().Id;

                            switch (id) {
                                case 'selectall':
                                    Array.from(this.container.querySelectorAll('.itemSelectionPanel'))
                                        .forEach(element => {
                                            const chkItemSelect = element.querySelector('.chkItemSelect');

                                            if (chkItemSelect && !chkItemSelect.classList.contains('checkedInitial') && !chkItemSelect.checked) {
                                                chkItemSelect.checked = true;
                                                this.updateItemSelection(chkItemSelect, true);
                                            }
                                        });
                                    break;
                                case 'addtocollection':
                                    import('../collectionEditor/collectionEditor').then(({default: collectionEditor}) => {
                                        new collectionEditor({
                                            items: items,
                                            serverId: serverId
                                        });
                                    });
                                    this.hideSelections();
                                    this.dispatchNeedsRefresh();
                                    break;
                                case 'playlist':
                                    new playlistEditor({
                                        items: items,
                                        serverId: serverId
                                    });
                                    this.hideSelections();
                                    this.dispatchNeedsRefresh();
                                    break;
                                case 'delete':
                                    deleteItems(apiClient, items).then(() => this.dispatchNeedsRefresh());
                                    this.hideSelections();
                                    this.dispatchNeedsRefresh();
                                    break;
                                case 'groupvideos':
                                    this.combineVersions(apiClient, items);
                                    break;
                                case 'markplayed':
                                    items.forEach(itemId => {
                                        apiClient.markPlayed(apiClient.getCurrentUserId(), itemId);
                                    });
                                    this.hideSelections();
                                    this.dispatchNeedsRefresh();
                                    break;
                                case 'markunplayed':
                                    items.forEach(itemId => {
                                        apiClient.markUnplayed(apiClient.getCurrentUserId(), itemId);
                                    });
                                    this.hideSelections();
                                    this.dispatchNeedsRefresh();
                                    break;
                                case 'refresh':
                                    import('../refreshdialog/refreshdialog').then(({default: refreshDialog}) => {
                                        new refreshDialog({
                                            itemIds: items,
                                            serverId: serverId
                                        }).show();
                                    });
                                    this.hideSelections();
                                    this.dispatchNeedsRefresh();
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

    hideSelections() {
        const selectionCommandsPanel = this.currentSelectionCommandsPanel;
        if (selectionCommandsPanel) {
            selectionCommandsPanel.parentNode.removeChild(selectionCommandsPanel);

            this.currentSelectionCommandsPanel = null;
            this.selectedItems = [];
            this.selectedElements = [];

            Array.from(document.querySelectorAll('.itemSelectionPanel'))
                .forEach(panel => {
                    const parent = panel.parentNode;
                    parent.removeChild(panel);
                    parent.classList.remove('withMultiSelect');
                });
        }
    }

    combineVersions(apiClient, selection) {
        if (selection.length < 2) {
            alert({
                text: globalize.translate('PleaseSelectTwoItems')
            });

            return;
        }

        loading.show();

        apiClient.ajax({
            type: 'POST',
            url: apiClient.getUrl('Videos/MergeVersions', { Ids: selection.join(',') })
        }).then(() => {
            loading.hide();
            this.hideSelections();
            this.dispatchNeedsRefresh();
        });
    }

    dispatchNeedsRefresh() {
        const elements = [];

        Array.from(this.selectedElements).forEach(i => {
            const container = dom.parentWithAttribute(i, 'is', 'emby-itemscontainer');

            if (container && !elements.includes(container)) {
                elements.push(container);
            }
        });

        elements.forEach(elem => elem.notifyRefreshNeeded(true));
    }

    updateItemSelection(chkItemSelect, selected) {
        const id = dom.parentWithAttribute(chkItemSelect, 'data-id').getAttribute('data-id');

        if (selected) {
            const current = this.selectedItems.filter(i => i === id);

            if (!current.length) {
                this.selectedItems.push(id);
                this.selectedElements.push(chkItemSelect);
            }
        } else {
            this.selectedItems = this.selectedItems.filter(i => i !== id);
            this.selectedElements = this.selectedElements.filter(e => e !== chkItemSelect);
        }

        if (this.selectedItems.length) {
            const itemSelectionCount = document.querySelector('.itemSelectionCount');
            if (itemSelectionCount) {
                itemSelectionCount.innerHTML = this.selectedItems.length;
            }
        } else {
            this.hideSelections();
        }
    }

    onTapHold(e) {
        const card = dom.parentWithClass(e.target, 'card');

        if (card) {
            this.showSelections(card);
        }

        e.preventDefault();
        // It won't have this if it's a hammer event
        if (e.stopPropagation) {
            e.stopPropagation();
        }
        return false;
    }

    onTouchStart(e) {
        const touch = getTouches(e)[0];
        this.touchTarget = null;
        this.touchStartX = 0;
        this.touchStartY = 0;

        if (touch) {
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
            const element = touch.target;

            if (element) {
                const card = dom.parentWithClass(element, 'card');

                if (card) {
                    if (this.touchStartTimeout) {
                        clearTimeout(this.touchStartTimeout);
                        this.touchStartTimeout = null;
                    }

                    this.touchTarget = card;
                    this.touchStartTimeout = setTimeout(this.onTouchStartTimerFired.bind(this), 550);
                }
            }
        }
    }

    onTouchMove(e) {
        if (this.touchTarget) {
            const touch = getTouches(e)[0];
            let deltaX;
            let deltaY;

            if (touch) {
                const touchEndX = touch.clientX || 0;
                const touchEndY = touch.clientY || 0;
                deltaX = Math.abs(touchEndX - (this.touchStartX || 0));
                deltaY = Math.abs(touchEndY - (this.touchStartY || 0));
            } else {
                deltaX = 100;
                deltaY = 100;
            }
            if (deltaX >= 5 || deltaY >= 5) {
                this.onMouseOut();
            }
        }
    }

    onTouchEnd() {
        this.onMouseOut();
    }

    onMouseDown(e) {
        if (this.touchStartTimeout) {
            clearTimeout(this.touchStartTimeout);
            this.touchStartTimeout = null;
        }

        this.touchTarget = e.target;
        this.touchStartTimeout = setTimeout(this.onTouchStartTimerFired.bind(this), 550);
    }

    onMouseOut() {
        if (this.touchStartTimeout) {
            clearTimeout(this.touchStartTimeout);
            this.touchStartTimeout = null;
        }
        this.touchTarget = null;
    }

    onTouchStartTimerFired() {
        if (!this.touchTarget) {
            return;
        }

        const card = dom.parentWithClass(this.touchTarget, 'card');
        this.touchTarget = null;

        if (card) {
            this.showSelections(card);
        }
    }
}

export default MultiSelect;
