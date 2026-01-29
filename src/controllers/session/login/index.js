import { AppFeature } from 'constants/appFeature';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { safeAppHost } from '../../../components/apphost';
import layoutManager from '../../../components/layoutManager';
import loading from '../../../components/loading/loading';
import globalize from '../../../lib/globalize';
import browser from '../../../scripts/browser';
import libraryMenu from '../../../scripts/libraryMenu';
import appSettings from '../../../scripts/settings/appSettings';
import dom from '../../../utils/dom';
import { escapeHtml } from '../../../utils/html';
import { logger } from '../../../utils/logger';
import '../../../components/cardbuilder/card.scss';
import '../../../elements/emby-checkbox/emby-checkbox';
import baseAlert from '../../../components/alert';
import { getDefaultBackgroundClass } from '../../../components/cardbuilder/cardBuilderUtils';
import dialogHelper from '../../../components/dialogHelper/dialogHelper';
import toast from '../../../components/toast/toast';
import Dashboard from '../../../utils/dashboard';

import './login.scss';

const enableFocusTransform = !browser.slow && !browser.edge;

function authenticateUserByName(page, apiClient, url, username, password) {
    loading.show();
    apiClient.authenticateUserByName(username, password).then(
        (result) => {
            const user = result.User;
            loading.hide();

            onLoginSuccessful(user.Id, result.AccessToken, apiClient, url);
        },
        (response) => {
            page.querySelector('#txtManualPassword').value = '';
            loading.hide();

            const UnauthorizedOrForbidden = [401, 403];
            if (UnauthorizedOrForbidden.includes(response.status)) {
                const messageKey =
                    response.status === 401 ? 'MessageInvalidUser' : 'MessageUnauthorizedUser';
                toast(globalize.translate(messageKey));
            } else {
                Dashboard.alert({
                    message: globalize.translate('MessageUnableToConnectToServer'),
                    title: globalize.translate('HeaderConnectionFailure')
                });
            }
        }
    );
}

function authenticateQuickConnect(apiClient, targetUrl) {
    const url = apiClient.getUrl('/QuickConnect/Initiate');
    apiClient
        .ajax({ type: 'POST', url }, true)
        .then((res) => res.json())
        .then(
            (json) => {
                if (!json.Secret || !json.Code) {
                    logger.error(
                        'Malformed quick connect response',
                        { component: 'LoginPage' },
                        json
                    );
                    return false;
                }

                baseAlert({
                    dialogOptions: {
                        id: 'quickConnectAlert'
                    },
                    title: globalize.translate('QuickConnect'),
                    text: globalize.translate('QuickConnectAuthorizeCode', json.Code)
                });

                const connectUrl = apiClient.getUrl('/QuickConnect/Connect?Secret=' + json.Secret);

                const interval = setInterval(
                    () => {
                        apiClient.getJSON(connectUrl).then(
                            async (data) => {
                                if (!data.Authenticated) {
                                    return;
                                }

                                clearInterval(interval);

                                // Close the QuickConnect dialog
                                const dlg = document.getElementById('quickConnectAlert');
                                if (dlg) {
                                    dialogHelper.close(dlg);
                                }

                                const result = await apiClient.quickConnect(data.Secret);
                                onLoginSuccessful(
                                    result.User.Id,
                                    result.AccessToken,
                                    apiClient,
                                    targetUrl
                                );
                            },
                            (e) => {
                                clearInterval(interval);

                                // Close the QuickConnect dialog
                                const dlg = document.getElementById('quickConnectAlert');
                                if (dlg) {
                                    dialogHelper.close(dlg);
                                }

                                Dashboard.alert({
                                    message: globalize.translate('QuickConnectDeactivated'),
                                    title: globalize.translate('HeaderError')
                                });

                                logger.error(
                                    'Unable to login with quick connect',
                                    { component: 'LoginPage' },
                                    e
                                );
                            }
                        );
                    },
                    5000,
                    connectUrl
                );

                return true;
            },
            (e) => {
                Dashboard.alert({
                    message: globalize.translate('QuickConnectNotActive'),
                    title: globalize.translate('HeaderError')
                });

                logger.error('Quick connect error', { component: 'LoginPage' }, e);
                return false;
            }
        );
}

function onLoginSuccessful(id, accessToken, apiClient, url) {
    Dashboard.onServerChanged(id, accessToken, apiClient);
    Dashboard.navigate(url || 'home');
}

function showManualForm(context, showCancel, focusPassword) {
    context.querySelector('.chkRememberLogin').checked = appSettings.enableAutoLogin();
    context.querySelector('.manualLoginForm').classList.remove('hide');
    context.querySelector('.visualLoginForm').classList.add('hide');
    context.querySelector('.btnManual').classList.add('hide');

    if (focusPassword) {
        context.querySelector('#txtManualPassword').focus();
    } else {
        context.querySelector('#txtManualName').focus();
    }

    if (showCancel) {
        context.querySelector('.btnCancel').classList.remove('hide');
    } else {
        context.querySelector('.btnCancel').classList.add('hide');
    }
}

function loadUserList(context, apiClient, users) {
    let html = '';

    for (const user of users) {
        // TODO move card creation code to Card component
        let cssClass = 'card squareCard scalableCard squareCard-scalable';

        if (layoutManager.tv) {
            cssClass += ' show-focus';

            if (enableFocusTransform) {
                cssClass += ' show-animation';
            }
        }

        const cardBoxCssClass = 'cardBox cardBox-bottompadded';
        html += '<button type="button" class="' + cssClass + '">';
        html += '<div class="' + cardBoxCssClass + '">';
        html += '<div class="cardScalable">';
        html += '<div class="cardPadder cardPadder-square"></div>';
        html += `<div class="cardContent" data-haspw="${user.HasPassword}" data-username="${user.Name}" data-userid="${user.Id}">`;
        let imgUrl;

        if (user.PrimaryImageTag) {
            imgUrl = apiClient.getUserImageUrl(user.Id, {
                width: 300,
                tag: user.PrimaryImageTag,
                type: 'Primary'
            });

            html +=
                '<div class="cardImageContainer coveredImage" style="background-image:url(\'' +
                imgUrl +
                '\');"></div>';
        } else {
            html += `<div class="cardImage flex align-items-center justify-content-center ${getDefaultBackgroundClass()}">`;
            html += '<span class="material-icons cardImageIcon person" aria-hidden="true"></span>';
            html += '</div>';
        }

        html += '</div>';
        html += '</div>';
        html += '<div class="cardFooter visualCardBox-cardFooter">';
        html += '<div class="cardText singleCardText cardTextCentered">' + user.Name + '</div>';
        html += '</div>';
        html += '</div>';
        html += '</button>';
    }

    context.querySelector('#divUsers').innerHTML = html;
}

export default function (view, params) {
    function getApiClient() {
        const serverId = params.serverid;

        if (serverId) {
            return ServerConnections.getOrCreateApiClient(serverId);
        }

        return ApiClient;
    }

    function getTargetUrl() {
        if (params.url) {
            try {
                return decodeURIComponent(params.url);
            } catch (err) {
                logger.warn(
                    'Unable to decode url param',
                    { component: 'LoginPage', url: params.url },
                    err
                );
            }
        }

        return '/home';
    }

    function showVisualForm() {
        view.querySelector('.visualLoginForm').classList.remove('hide');
        view.querySelector('.manualLoginForm').classList.add('hide');
        view.querySelector('.btnManual').classList.remove('hide');

        import('../../../components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(view);
        });
    }

    view.querySelector('#divUsers').addEventListener('click', (e) => {
        const card = dom.parentWithClass(e.target, 'card');
        const cardContent = card ? card.querySelector('.cardContent') : null;

        if (cardContent) {
            const context = view;
            const id = cardContent.getAttribute('data-userid');
            const name = cardContent.getAttribute('data-username');
            const haspw = cardContent.getAttribute('data-haspw');

            if (id === 'manual') {
                context.querySelector('#txtManualName').value = '';
                showManualForm(context, true);
            } else if (haspw == 'false') {
                authenticateUserByName(context, getApiClient(), getTargetUrl(), name, '');
            } else {
                context.querySelector('#txtManualName').value = name;
                context.querySelector('#txtManualPassword').value = '';
                showManualForm(context, true, true);
            }
        }
    });
    view.querySelector('.manualLoginForm').addEventListener('submit', (e) => {
        appSettings.enableAutoLogin(view.querySelector('.chkRememberLogin').checked);
        authenticateUserByName(
            view,
            getApiClient(),
            getTargetUrl(),
            view.querySelector('#txtManualName').value,
            view.querySelector('#txtManualPassword').value
        );
        e.preventDefault();
        return false;
    });
    view.querySelector('.btnForgotPassword').addEventListener('click', () => {
        Dashboard.navigate('forgotpassword');
    });
    view.querySelector('.btnCancel').addEventListener('click', showVisualForm);
    view.querySelector('.btnQuick').addEventListener('click', () => {
        authenticateQuickConnect(getApiClient(), getTargetUrl());
        return false;
    });
    view.querySelector('.btnManual').addEventListener('click', () => {
        view.querySelector('#txtManualName').value = '';
        showManualForm(view, true);
    });
    view.querySelector('.btnSelectServer').addEventListener('click', () => {
        Dashboard.selectServer();
    });

    view.addEventListener('viewshow', () => {
        loading.show();
        libraryMenu.setTransparentMenu(true);

        if (!safeAppHost.supports(AppFeature.MultiServer)) {
            view.querySelector('.btnSelectServer').classList.add('hide');
        }

        const apiClient = getApiClient();

        apiClient
            .getQuickConnect('Enabled')
            .then((enabled) => {
                if (enabled === true) {
                    view.querySelector('.btnQuick').classList.remove('hide');
                }
            })
            .catch(() => {
                logger.debug('Failed to get QuickConnect status', { component: 'LoginPage' });
            });

        apiClient
            .getPublicUsers()
            .then((users) => {
                if (users.length) {
                    showVisualForm();
                    loadUserList(view, apiClient, users);
                } else {
                    view.querySelector('#txtManualName').value = '';
                    showManualForm(view, false, false);
                }
            })
            .catch()
            .then(() => {
                loading.hide();
            });
        apiClient.getJSON(apiClient.getUrl('Branding/Configuration')).then((options) => {
            const loginDisclaimer = view.querySelector('.loginDisclaimer');
            const disclaimerText = options.LoginDisclaimer || '';

            // For now, use escaped HTML until we convert this to React
            // TODO: Convert to React component using ReactMarkdownBox
            loginDisclaimer.innerHTML = disclaimerText.replace(/\n/g, '<br>');

            for (const elem of loginDisclaimer.querySelectorAll('a')) {
                elem.rel = 'noopener noreferrer';
                elem.target = '_blank';
                elem.classList.add('button-link');
                elem.setAttribute('is', 'emby-linkbutton');

                if (layoutManager.tv) {
                    // Disable links navigation on TV
                    elem.tabIndex = -1;
                }
            }
        });
    });
    view.addEventListener('viewhide', () => {
        libraryMenu.setTransparentMenu(false);
    });
}
