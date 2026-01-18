import escapeHtml from 'escape-html';
import loading from '../../../components/loading/loading';
import { appRouter } from '../../../components/router/appRouter';
import layoutManager from '../../../components/layoutManager';
import libraryMenu from '../../../scripts/libraryMenu';
import appSettings from '../../../scripts/settings/appSettings';
import focusManager from '../../../components/focusManager';
import globalize from '../../../lib/globalize';
import actionSheet from '../../../components/actionSheet/actionSheet';
import confirm from '../../../components/confirm/confirm';
import dom from '../../../utils/dom';
import browser from '../../../scripts/browser';
import 'material-design-icons-iconfont';
import '../../../styles/flexstyles.scss';
import '../../../elements/emby-scroller/emby-scroller';
import '../../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../../components/cardbuilder/card.scss';
import '../../../elements/emby-button/emby-button';
import Dashboard from '../../../utils/dashboard';
import alert from '../../../components/alert';
import { getDefaultBackgroundClass } from '../../../components/cardbuilder/cardBuilderUtils';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';

const enableFocusTransform = !browser.slow && !browser.edge;

function renderSelectServerItems(view, servers) {
    const items = servers.map((server) => {
        return {
            name: server.Name,
            icon: 'storage',
            cardType: '',
            id: server.Id,
            server: server
        };
    });
    let html = items.map((item) => {
        // TODO move card creation code to Card component
        const cardImageContainer = '<span class="cardImageIcon material-icons ' + item.icon + '" aria-hidden="true"></span>';
        let cssClass = 'card overflowSquareCard loginSquareCard scalableCard overflowSquareCard-scalable';

        if (layoutManager.tv) {
            cssClass += ' show-focus';

            if (enableFocusTransform) {
                cssClass += ' show-animation';
            }
        }

        const cardBoxCssClass = 'cardBox';

        const innerOpening = '<div class="' + cardBoxCssClass + '">';
        let cardContainer = '';
        cardContainer += '<button raised class="' + cssClass + '" style="display:inline-block;" data-id="' + item.id + '" data-url="' + (item.url || '') + '" data-cardtype="' + item.cardType + '">';
        cardContainer += innerOpening;
        cardContainer += '<div class="cardScalable">';
        cardContainer += '<div class="cardPadder cardPadder-square">';
        cardContainer += '</div>';
        cardContainer += '<div class="cardContent">';
        cardContainer += `<div class="cardImageContainer coveredImage ${getDefaultBackgroundClass()}">`;
        cardContainer += cardImageContainer;
        cardContainer += '</div>';
        cardContainer += '</div>';
        cardContainer += '</div>';
        cardContainer += '<div class="cardFooter">';
        cardContainer += '<div class="cardText cardTextCentered">' + escapeHtml(item.name) + '</div>';
        cardContainer += '</div></div></button>';
        return cardContainer;
    }).join('');
    const itemsContainer = view.querySelector('.servers');

    if (!items.length) {
        html = '<p>' + globalize.translate('MessageNoServersAvailable') + '</p>';
    }

    itemsContainer.innerHTML = html;
    loading.hide();
}

function updatePageStyle(view, params) {
    if (params.showuser == '1') {
        view.classList.add('libraryPage');
        view.classList.remove('standalonePage');
        view.classList.add('noSecondaryNavPage');
    } else {
        view.classList.add('standalonePage');
        view.classList.remove('libraryPage');
        view.classList.remove('noSecondaryNavPage');
    }
}

function alertText(text) {
    alertTextWithOptions({
        text: text
    });
}

function alertTextWithOptions(options) {
    alert(options);
}

function showServerConnectionFailure() {
    alertText(globalize.translate('MessageUnableToConnectToServer'));
}

export default function (view, params) {
    function connectToServer(server) {
        loading.show();
        ServerConnections.connectToServer(server, {
            enableAutoLogin: appSettings.enableAutoLogin()
        }).then((result) => {
            loading.hide();
            const apiClient = result.ApiClient;

            switch (result.State) {
                case ConnectionState.SignedIn:
                    Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient);
                    Dashboard.navigate('home');
                    break;

                case ConnectionState.ServerSignIn:
                    Dashboard.onServerChanged(null, null, apiClient);
                    Dashboard.navigate('login?serverid=' + result.Servers[0].Id);
                    break;

                case ConnectionState.ServerUpdateNeeded:
                    alertTextWithOptions({
                        text: globalize.translate('core#ServerUpdateNeeded', 'https://github.com/jellyfin/jellyfin'),
                        html: globalize.translate('core#ServerUpdateNeeded', '<a href="https://github.com/jellyfin/jellyfin">https://github.com/jellyfin/jellyfin</a>')
                    });
                    break;

                default:
                    showServerConnectionFailure();
            }
        });
    }

    function deleteServer(server) {
        confirm({
            title: globalize.translate('DeleteName', server.Name),
            text: globalize.translate('DeleteServerConfirmation'),
            confirmText: globalize.translate('Delete'),
            primary: 'delete'
        }).then(() => {
            loading.show();
            ServerConnections.deleteServer(server.Id).then(() => {
                loading.hide();
                loadServers();
            }).catch(err => {
                console.error('[selectServer] failed to delete server', err);
            });
        }).catch(() => {
            // confirm dialog closed
        });
    }

    function onServerClick(server) {
        const menuItems = [];
        menuItems.push({
            name: globalize.translate('Connect'),
            id: 'connect'
        });
        menuItems.push({
            name: globalize.translate('Delete'),
            id: 'delete'
        });
        actionSheet.show({
            items: menuItems,
            title: server.Name
        }).then((id) => {
            switch (id) {
                case 'connect':
                    connectToServer(server);
                    break;

                case 'delete':
                    deleteServer(server);
                    break;
            }
        }).catch(() => { /* no-op */ });
    }

    function onServersRetrieved(result) {
        servers = result;
        renderSelectServerItems(view, result);

        if (layoutManager.tv) {
            focusManager.autoFocus(view);
        }
    }

    function loadServers() {
        loading.show();
        ServerConnections.getAvailableServers().then(onServersRetrieved);
    }

    let servers;
    updatePageStyle(view, params);
    view.addEventListener('viewshow', (e) => {
        const isRestored = e.detail.isRestored;
        libraryMenu.setTitle(null);
        libraryMenu.setTransparentMenu(true);

        if (!isRestored) {
            loadServers();
        }
    });
    view.querySelector('.servers').addEventListener('click', (e) => {
        const card = dom.parentWithClass(e.target, 'card');

        if (card) {
            const url = card.getAttribute('data-url');

            if (url) {
                appRouter.show(url);
            } else {
                const id = card.getAttribute('data-id');
                onServerClick(servers.filter((s) => {
                    return s.Id === id;
                })[0]);
            }
        }
    });
}
