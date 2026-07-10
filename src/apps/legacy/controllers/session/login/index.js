import DOMPurify from 'dompurify';
import markdownIt from 'markdown-it';

import { AppFeature } from 'constants/appFeature';
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

import './login.scss';

/**
 * @typedef {import('jellyfin-apiclient').ApiClient} ApiClient
 * @typedef {import('@jellyfin/sdk/lib/generated-client').AuthenticationResult} AuthenticationResult
 * @typedef {import('@jellyfin/sdk/lib/generated-client').UserDto} UserDto
 * @typedef {import('@jellyfin/sdk/lib/generated-client').BrandingOptionsDto} BrandingOptionsDto
 */

const enableFocusTransform = !browser.slow && !browser.edge;

/**
* @param {HTMLElement} page
* @param {ApiClient} apiClient
* @param {string} url
* @param {string} username
* @param {string} password
*/
function authenticateUserByName(page, apiClient, url, username, password) {
    loading.show();
    apiClient.authenticateUserByName(username, password).then(function (result) {
        const user = /** @type {UserDto} */ (result.User);
        loading.hide();

        onLoginSuccessful(user.Id, result.AccessToken, apiClient, url);
    }, function (response) {
        /** @type {HTMLInputElement} */ (page.querySelector('#txtManualPassword')).value = '';
        loading.hide();

        const UnauthorizedOrForbidden = [401, 403];
        if (UnauthorizedOrForbidden.includes(response.status)) {
            const messageKey = response.status === 401 ? 'MessageInvalidUser' : 'MessageUnauthorizedUser';
            toast(globalize.translate(messageKey));
        } else {
            Dashboard.alert({
                message: globalize.translate('MessageUnableToConnectToServer'),
                title: globalize.translate('HeaderConnectionFailure')
            });
        }
    });
}

/**
 * @param {ApiClient} apiClient
 * @param {string} targetUrl
 */
function authenticateQuickConnect(apiClient, targetUrl) {
    const url = apiClient.getUrl('/QuickConnect/Initiate');
    // @ts-expect-error: The signature of ajax has just one argument. TODO: This should be investigated
    apiClient.ajax({ type: 'POST', url }, true).then(res => res.json()).then(function (json) {
        if (!json.Secret || !json.Code) {
            console.error('Malformed quick connect response', json);
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

        const interval = setInterval(function() {
            apiClient.getJSON(connectUrl).then(async function(data) {
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
                const user = /** @type {UserDto} */ (result.User);
                onLoginSuccessful(user.Id, result.AccessToken, apiClient, targetUrl);
            }, function (e) {
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

                console.error('Unable to login with quick connect', e);
            });
        }, 5000, connectUrl);

        return true;
    }, function(e) {
        Dashboard.alert({
            message: globalize.translate('QuickConnectNotActive'),
            title: globalize.translate('HeaderError')
        });

        console.error('Quick connect error: ', e);
        return false;
    });
}

/**
 * @param {string | null | undefined} id
 * @param {string | null | undefined} accessToken
 * @param {ApiClient} apiClient
 * @param {string} url
 */
function onLoginSuccessful(id, accessToken, apiClient, url) {
    Dashboard.onServerChanged(id, accessToken, apiClient);
    Dashboard.navigate(url || 'home');
}

/**
 * Hide the user cards (i.e., the '.visualLoginForm') and show the manual form
 * @param {HTMLElement} context
 * @param {boolean} showCancel
 * @param {boolean?} [focusPassword]
 */
function showManualForm(context, showCancel, focusPassword) {
    /** @type {HTMLInputElement}*/ (context.querySelector('.chkRememberLogin')).checked = appSettings.enableAutoLogin();
    /** @type {Element} */ (context.querySelector('.manualLoginForm')).classList.remove('hide');
    /** @type {Element} */ (context.querySelector('.visualLoginForm')).classList.add('hide');
    /** @type {Element} */ (context.querySelector('.btnManual')).classList.add('hide');

    if (focusPassword) {
        /** @type {HTMLInputElement}*/ (context.querySelector('#txtManualPassword')).focus();
    } else {
        /** @type {HTMLInputElement}*/ (context.querySelector('#txtManualName')).focus();
    }

    if (showCancel) {
        /** @type {Element} */ (context.querySelector('.btnCancel')).classList.remove('hide');
    } else {
        /** @type {Element} */ (context.querySelector('.btnCancel')).classList.add('hide');
    }
}

/**
 * Transform UserDto objects into html and inject them into the user div (#divUsers).
 * This creates the user icons for users that are not hidden on the login screen.
 *
 * @param {HTMLElement} context
 * @param {ApiClient} apiClient
 * @param {UserDto[]} users
 */
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
            imgUrl = apiClient.getUserImageUrl(/** @type {string} */ (user.Id), {
                width: 300,
                tag: user.PrimaryImageTag,
                type: 'Primary'
            });

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

    /** @type {Element} */ (context.querySelector('#divUsers')).innerHTML = html;
}

/**
 * @param {HTMLElement} view
 * @param {Object.<string, string>} params
 */
export default function (view, params) {
    /** @returns {ApiClient} */
    function getApiClient() {
        const serverId = params.serverid;

        if (serverId) {
            return ServerConnections.getOrCreateApiClient(serverId);
        }

        // TODO: This should be investigated
        // @ts-expect-error: It appears we're returning a type definition here instead of an instance of the object, but this code works, so it's not as it seems
        return ApiClient;
    }

    /** @returns {string} */
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
        /** @type {Element} */ (view.querySelector('.visualLoginForm')).classList.remove('hide');
        /** @type {Element} */ (view.querySelector('.manualLoginForm')).classList.add('hide');
        /** @type {Element} */ (view.querySelector('.btnManual')).classList.remove('hide');

        import('components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(view);
        });
    }

    // On user selected one of the user cards
    /** @type {Element} */ (view.querySelector('#divUsers')).addEventListener('click', function (e) {
        const card = dom.parentWithClass(/** @type {HTMLElement} */ (e.target), 'card');
        const cardContent = card ? card.querySelector('.cardContent') : null;

        if (cardContent) {
            const context = view;
            const id = cardContent.getAttribute('data-userid');
            const name = /** @type {string} */ (cardContent.getAttribute('data-username'));
            const haspw = cardContent.getAttribute('data-haspw');

            if (id === 'manual') {
                /** @type {HTMLInputElement} */ (context.querySelector('#txtManualName')).value = '';
                showManualForm(context, true);
            } else if (haspw == 'false') {
                authenticateUserByName(context, getApiClient(), getTargetUrl(), name, '');
            } else {
                /** @type {HTMLInputElement} */ (context.querySelector('#txtManualName')).value = name;
                /** @type {HTMLInputElement} */ (context.querySelector('#txtManualPassword')).value = '';
                showManualForm(context, true, true);
            }
        }
    });
    /** @type {Element} */ (view.querySelector('.manualLoginForm')).addEventListener('submit', function (e) {
        appSettings.enableAutoLogin(/** @type {HTMLInputElement} */ (view.querySelector('.chkRememberLogin')).checked);
        authenticateUserByName(
            view,
            getApiClient(),
            getTargetUrl(),
            /** @type {HTMLInputElement} */ (view.querySelector('#txtManualName')).value,
            /** @type {HTMLInputElement} */ (view.querySelector('#txtManualPassword')).value
        );
        e.preventDefault();
        return false;
    });
    /** @type {Element} */ (view.querySelector('.btnForgotPassword')).addEventListener('click', function () {
        Dashboard.navigate('forgotpassword');
    });
    /** @type {Element} */ (view.querySelector('.btnCancel')).addEventListener('click', showVisualForm);
    /** @type {Element} */ (view.querySelector('.btnQuick')).addEventListener('click', function () {
        authenticateQuickConnect(getApiClient(), getTargetUrl());
        return false;
    });
    /** @type {Element} */ (view.querySelector('.btnManual')).addEventListener('click', function () {
        /** @type {HTMLInputElement} */ (view.querySelector('#txtManualName')).value = '';
        showManualForm(view, true);
    });
    /** @type {Element} */ (view.querySelector('.btnSelectServer')).addEventListener('click', function () {
        Dashboard.selectServer();
    });

    view.addEventListener('viewshow', function () {
        loading.show();
        libraryMenu.setTransparentMenu(true);

        if (!appHost.supports(AppFeature.MultiServer)) {
            /** @type {Element} */ (view.querySelector('.btnSelectServer')).classList.add('hide');
        }

        const apiClient = getApiClient();

        apiClient.getQuickConnect('Enabled')
            .then(enabled => {
                if (enabled === true) {
                    /** @type {Element} */ (view.querySelector('.btnQuick')).classList.remove('hide');
                }
            })
            .catch(() => {
                console.debug('Failed to get QuickConnect status');
            });

        apiClient.getPublicUsers().then(function (users) {
            if (users.length) {
                showVisualForm();
                loadUserList(view, apiClient, users);
            } else {
                /** @type {HTMLInputElement} */ (view.querySelector('#txtManualName')).value = '';
                showManualForm(view, false, false);
            }
        }).catch().then(function () {
            loading.hide();
        });
        apiClient.getJSON(apiClient.getUrl('Branding/Configuration')).then(/** @param {BrandingOptionsDto} options */ function (options) {
            const loginDisclaimer = /** @type {Element} */ (view.querySelector('.loginDisclaimer'));

            // eslint-disable-next-line sonarjs/disabled-auto-escaping
            loginDisclaimer.innerHTML = DOMPurify.sanitize(markdownIt({ html: true }).render(options.LoginDisclaimer || ''));

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
    view.addEventListener('viewhide', function () {
        libraryMenu.setTransparentMenu(false);
    });
}

