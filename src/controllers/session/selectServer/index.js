import loading from 'loading';
import appRouter from 'appRouter';
import layoutManager from 'layoutManager';
import libraryMenu from 'libraryMenu';
import appSettings from 'appSettings';
import focusManager from 'focusManager';
import globalize from 'globalize';
import actionSheet from 'actionsheet';
import dom from 'dom';
import browser from 'browser';
import 'material-icons';
import 'flexStyles';
import 'emby-scroller';
import 'emby-itemscontainer';
import 'cardStyle';
import 'emby-button';

/* eslint-disable indent */

    const enableFocusTransform = !browser.slow && !browser.edge;

    function renderSelectServerItems(view, servers) {
        const items = servers.map(function (server) {
            return {
                name: server.Name,
                showIcon: true,
                icon: 'cast',
                cardType: '',
                id: server.Id,
                server: server
            };
        });
        let html = items.map(function (item) {
            let cardImageContainer;

            if (item.showIcon) {
                cardImageContainer = '<span class="cardImageIcon material-icons ' + item.icon + '"></span>';
            } else {
                cardImageContainer = '<div class="cardImage" style="' + item.cardImageStyle + '"></div>';
            }

            // TODO move card creation code to Card component

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
            cardContainer += '<div class="cardImageContainer coveredImage" style="background:#0288D1;border-radius:.15em;">';
            cardContainer += cardImageContainer;
            cardContainer += '</div>';
            cardContainer += '</div>';
            cardContainer += '</div>';
            cardContainer += '<div class="cardFooter">';
            cardContainer += '<div class="cardText cardTextCentered">' + item.name + '</div>';
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
        import('alert').then(({default: alert}) => {
            alert(options);
        });
    }

    function showServerConnectionFailure() {
        alertText(globalize.translate('MessageUnableToConnectToServer'));
    }

    export default function (view, params) {
        function connectToServer(server) {
            loading.show();
            window.connectionManager.connectToServer(server, {
                enableAutoLogin: appSettings.enableAutoLogin()
            }).then(function (result) {
                loading.hide();
                const apiClient = result.ApiClient;

                switch (result.State) {
                    case 'SignedIn':
                        Dashboard.onServerChanged(apiClient.getCurrentUserId(), apiClient.accessToken(), apiClient);
                        Dashboard.navigate('home.html');
                        break;

                    case 'ServerSignIn':
                        Dashboard.onServerChanged(null, null, apiClient);
                        Dashboard.navigate('login.html?serverid=' + result.Servers[0].Id);
                        break;

                    case 'ServerUpdateNeeded':
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
            loading.show();
            window.connectionManager.deleteServer(server.Id).then(function () {
                loading.hide();
                loadServers();
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
            }).then(function (id) {
                switch (id) {
                    case 'connect':
                        connectToServer(server);
                        break;

                    case 'delete':
                        deleteServer(server);
                }
            });
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
            window.connectionManager.getAvailableServers().then(onServersRetrieved);
        }

        let servers;
        updatePageStyle(view, params);
        view.addEventListener('viewshow', function (e) {
            const isRestored = e.detail.isRestored;
            appRouter.setTitle(null);
            libraryMenu.setTransparentMenu(true);

            if (!isRestored) {
                loadServers();
            }
        });
        view.querySelector('.servers').addEventListener('click', function (e) {
            const card = dom.parentWithClass(e.target, 'card');

            if (card) {
                const url = card.getAttribute('data-url');

                if (url) {
                    appRouter.show(url);
                } else {
                    const id = card.getAttribute('data-id');
                    onServerClick(servers.filter(function (s) {
                        return s.Id === id;
                    })[0]);
                }
            }
        });
    }

/* eslint-enable indent */
