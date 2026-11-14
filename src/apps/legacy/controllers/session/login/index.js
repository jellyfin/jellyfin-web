import createDOMPurify from 'dompurify';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import markdownIt from 'markdown-it';

import { getBrandingOptionsQuery } from '@/apps/dashboard/features/branding/api/useBrandingOptions';
import { AppFeature } from 'constants/appFeature';
import { getPublicUsersQuery } from '@/hooks/api/usePublicUsers';
import { getQuickConnectEnabledQuery } from '@/hooks/useQuickConnect';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { appHost } from 'components/apphost';
import appSettings from 'scripts/settings/appSettings';
import dom from 'utils/dom';
import loading from 'components/loading/loading';
import layoutManager from 'components/layoutManager';
import libraryMenu from 'scripts/libraryMenu';
import browser from 'scripts/browser';
import globalize from 'lib/globalize';
import 'components/cardbuilder/card.scss';
import 'elements/emby-checkbox/emby-checkbox';
import Dashboard from 'utils/dashboard';
import toast from 'components/toast/toast';
import dialogHelper from 'components/dialogHelper/dialogHelper';
import baseAlert from 'components/alert';
import { getDefaultBackgroundClass } from 'components/cardbuilder/utils/builder';
import { queryClient } from '@/utils/query/queryClient';

import './login.scss';

const domPurify = createDOMPurify();
domPurify.setConfig({
    // eslint-disable-next-line @typescript-eslint/naming-convention, sonarjs/regex-complexity -- DOMPurify config option; customizes its default regex
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel|callto|cid|xmpp|matrix|tg|whatsapp|signal|ircs?):|[^a-z]|[a-z+.-]+(?:[^-a-z+.:]|$))/i
});

const enableFocusTransform = !browser.slow && !browser.edge;

async function authenticateUserByName(page, serverId, url, username, password) {
    loading.show();
    try {
        const api = ServerConnections.getApi(serverId);
        const { data: result } = await getAuthenticationApi(api).authenticateUserByName({
            authenticateUserByName: {
                Username: username,
                Pw: password
            }
        });
        loading.hide();

        onLoginSuccessful(result, url);
    } catch (error) {
        page.querySelector('#txtManualPassword').value = '';
        loading.hide();

        const { response } = error;
        const UnauthorizedOrForbidden = [401, 403];
        if (response && UnauthorizedOrForbidden.includes(response.status)) {
            const messageKey = response.status === 401 ? 'MessageInvalidUser' : 'MessageUnauthorizedUser';
            toast(globalize.translate(messageKey));
        } else {
            Dashboard.alert({
                message: globalize.translate('MessageUnableToConnectToServer'),
                title: globalize.translate('HeaderConnectionFailure')
            });
        }
    }
}

/**
 * @param {string|undefined} serverId The server ID to authenticate against
 * @param {string} targetUrl The URL to redirect to after authentication
 */
async function authenticateQuickConnect(serverId, targetUrl) {
    const api = ServerConnections.getApi(serverId);
    const authenticationApi = getAuthenticationApi(api);

    try {
        const { data } = await authenticationApi.initiateQuickConnect();

        if (!data.Secret || !data.Code) {
            console.error('Malformed quick connect response', data);
            return;
        }

        const dialogClosed = baseAlert({
            dialogOptions: {
                id: 'quickConnectAlert'
            },
            title: globalize.translate('QuickConnect'),
            text: globalize.translate('QuickConnectAuthorizeCode', data.Code)
        }).catch(() => { /* dialog closed */ });

        const interval = setInterval(async () => {
            try {
                const { data: state } = await authenticationApi.getQuickConnectState({ secret: data.Secret });
                // If not authenticated, continue polling
                if (!state.Authenticated) return;

                // Authentication successful, clear interval and close dialog
                clearInterval(interval);
                const dlg = document.getElementById('quickConnectAlert');
                if (dlg) {
                    dialogHelper.close(dlg);
                    // NOTE: We need to wait for the dialog to close to avoid a race condition when navigating away
                    await dialogClosed;
                }

                // Retrieve authentication result and trigger callback
                const { data: result } = await authenticationApi.authenticateWithQuickConnect({
                    quickConnectDto: {
                        Secret: data.Secret
                    }
                });
                onLoginSuccessful(result, targetUrl);
            } catch (e) {
                // Authentication failed, clear interval and close dialog
                clearInterval(interval);
                const dlg = document.getElementById('quickConnectAlert');
                if (dlg) {
                    dialogHelper.close(dlg);
                    // NOTE: We need to wait for the dialog to close to avoid a race condition when navigating away
                    await dialogClosed;
                }

                Dashboard.alert({
                    message: globalize.translate('QuickConnectDeactivated'),
                    title: globalize.translate('HeaderError')
                });

                console.error('Unable to login with quick connect', e);
            }
        }, 5000);
    } catch (e) {
        console.error('Quick connect error: ', e);
        Dashboard.alert({
            message: globalize.translate('QuickConnectNotActive'),
            title: globalize.translate('HeaderError')
        });
    }
}

/**
 * @param {import('@jellyfin/sdk/lib/generated-client/models/authentication-result').AuthenticationResult} result The authentication result of the logged in user.
 * @param {string} url The target URL to navigate to after login.
 */
async function onLoginSuccessful(result, url) {
    const serverId = result.ServerId;
    if (!serverId) throw new Error('serverId is required');
    // Update the state of the legacy ApiClient
    const apiClient = ServerConnections.getOrCreateApiClient(serverId);
    await apiClient.onAuthenticated(apiClient, result);
    ServerConnections.setLocalApiClient(apiClient);

    // Navigate to the target URL or the default home page
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

function loadUserList(context, serverId, users) {
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

        const api = ServerConnections.getApi(serverId);
        const dpr = window?.devicePixelRatio || 1;
        const imgUrl = api ?
            getImageApi(api).getUserImageUrl(user, { width: Math.round(300 * dpr) }) :
            undefined;
        if (imgUrl) {
            html += '<div class="cardImageContainer coveredImage" style="background-image:url(\'' + imgUrl + "');\"></div>";
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
    function getTargetUrl() {
        if (params.url) {
            try {
                return decodeURIComponent(params.url);
            } catch (err) {
                console.warn('[LoginPage] unable to decode url param', params.url, err);
            }
        }

        return '/home';
    }

    function showVisualForm() {
        view.querySelector('.visualLoginForm').classList.remove('hide');
        view.querySelector('.manualLoginForm').classList.add('hide');
        view.querySelector('.btnManual').classList.remove('hide');

        import('components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(view);
        });
    }

    view.querySelector('#divUsers').addEventListener('click', function (e) {
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
                authenticateUserByName(context, params.serverid, getTargetUrl(), name, '');
            } else {
                context.querySelector('#txtManualName').value = name;
                context.querySelector('#txtManualPassword').value = '';
                showManualForm(context, true, true);
            }
        }
    });
    view.querySelector('.manualLoginForm').addEventListener('submit', function (e) {
        appSettings.enableAutoLogin(view.querySelector('.chkRememberLogin').checked);
        authenticateUserByName(view, params.serverid, getTargetUrl(), view.querySelector('#txtManualName').value, view.querySelector('#txtManualPassword').value);
        e.preventDefault();
        return false;
    });
    view.querySelector('.btnForgotPassword').addEventListener('click', function () {
        Dashboard.navigate('forgotpassword');
    });
    view.querySelector('.btnCancel').addEventListener('click', showVisualForm);
    view.querySelector('.btnQuick').addEventListener('click', function () {
        authenticateQuickConnect(params.serverid, getTargetUrl());
        return false;
    });
    view.querySelector('.btnManual').addEventListener('click', function () {
        view.querySelector('#txtManualName').value = '';
        showManualForm(view, true);
    });
    view.querySelector('.btnSelectServer').addEventListener('click', function () {
        Dashboard.selectServer();
    });

    view.addEventListener('viewshow', function () {
        loading.show();
        libraryMenu.setTransparentMenu(true);

        if (!appHost.supports(AppFeature.MultiServer)) {
            view.querySelector('.btnSelectServer').classList.add('hide');
        }

        const api = ServerConnections.getApi(params.serverid);

        queryClient.query(getQuickConnectEnabledQuery(api))
            .then(enabled => {
                if (enabled === true) {
                    view.querySelector('.btnQuick').classList.remove('hide');
                }
            })
            .catch(() => {
                console.debug('Failed to get QuickConnect status');
            });

        queryClient.query(getPublicUsersQuery(api)).then(users => {
            if (users.length) {
                showVisualForm();
                loadUserList(view, params.serverid, users);
            } else {
                view.querySelector('#txtManualName').value = '';
                showManualForm(view, false, false);
            }
        }).finally(() => {
            loading.hide();
        });

        queryClient.query(getBrandingOptionsQuery(api)).then(options => {
            const loginDisclaimer = view.querySelector('.loginDisclaimer');

            // eslint-disable-next-line sonarjs/disabled-auto-escaping
            loginDisclaimer.innerHTML = domPurify.sanitize(markdownIt({ html: true }).render(options.LoginDisclaimer || ''));

            for (const elem of loginDisclaimer.querySelectorAll('a')) {
                if (new URL(elem.href).origin !== window.location.origin) {
                    elem.rel = 'noopener noreferrer';
                    elem.target = '_blank';
                }
                elem.classList.add('button-link');
                elem.setAttribute('is', 'emby-linkbutton');

                if (layoutManager.tv) {
                    // Disable links navigation on TV
                    elem.tabIndex = -1;
                }
            }
        });
    });
    view.addEventListener('viewhide', function () {
        libraryMenu.setTransparentMenu(false);
    });
}
