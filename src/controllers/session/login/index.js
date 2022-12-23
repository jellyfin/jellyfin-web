import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { appHost } from '../../../components/apphost';
import appSettings from '../../../scripts/settings/appSettings';
import dom from '../../../scripts/dom';
import loading from '../../../components/loading/loading';
import layoutManager from '../../../components/layoutManager';
import libraryMenu from '../../../scripts/libraryMenu';
import browser from '../../../scripts/browser';
import globalize from '../../../scripts/globalize';
import '../../../components/cardbuilder/card.scss';
import '../../../elements/emby-checkbox/emby-checkbox';
import Dashboard from '../../../utils/dashboard';
import ServerConnections from '../../../components/ServerConnections';
import toast from '../../../components/toast/toast';
import dialogHelper from '../../../components/dialogHelper/dialogHelper';
import baseAlert from '../../../components/alert';
import cardBuilder from '../../../components/cardbuilder/cardBuilder';
import './login.scss';
import { ApiClient } from 'jellyfin-apiclient';

/* eslint-disable indent */

    const enableFocusTransform = !browser.slow && !browser.edge;

    function authenticateUserByName(page, apiClient, username, password) {
        loading.show();
        apiClient.authenticateUserByName(username, password).then(function (result) {
            const user = result.User;
            loading.hide();

            onLoginSuccessful(user, result.AccessToken, apiClient);
        }, function (response) {
            page.querySelector('#txtManualPassword').value = '';
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

    function authenticateQuickConnect(apiClient) {
        const url = apiClient.getUrl('/QuickConnect/Initiate');
        apiClient.getJSON(url).then(function (json) {
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
                    onLoginSuccessful(result.User, result.AccessToken, apiClient);
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

    function onLoginSuccessful(user, accessToken, apiClient) {
        Dashboard.onServerChanged(user.Id, accessToken, apiClient);

        if (hasWhiteSpace(user.Name)) {
            migrateUsername(user, apiClient);
            user.Name = user.Name.trim();
        } else {
            Dashboard.navigate('home.html');
        }
    }

    function migrateUsername(user, apiClient) {
        const dlgOptions = {
            removeOnClose: true,
            size: 'small',
            modal: true
        };

        if (layoutManager.tv) {
            dlgOptions.size = 'fullscreen';
        } else {
            dlgOptions.size = 'small';
        }

        const dlg = dialogHelper.createDialog(dlgOptions);
        dlg.classList.add('formDialog');

        let html = '';
        const status = apiClient.getJSON(apiClient.getUrl(`Users/AuthenticateByName?Username=${user.Name.trim()}`));

        let newName = '';
        if (status != null) {
            html += '<div class="formDialogHeader">';
            html += '<div class="focuscontainer dialog formDialog align-items-center justify-content-center dialog-fullscreen-lowres centeredDialog opened" data-history="true" modal="modal" data-autofocus="true" data-removeonclose="true" style="animation: 180ms ease-out 0s 1 normal both running scaleup;"><div class="formDialogHeader formDialogHeader-clear justify-content-center">';
            html += '<h1 class="formDialogHeaderTitle" style="margin-top: .5em;padding: 0 1em;">Username Migration</h1>';
            html += '</div>';
            html += '<div class="formDialogContent smoothScrollY no-grow" style="max-width: 350px;">';
            html += '<div class="dialogContentInner dialog-content-centered" style="padding-top:1em;padding-bottom: 1em; text-align: center;">';
            html += `<div class="text">"${user.Name.trim()}" is already taken, please enter a new username here.</div></div></div>`;
            html += '<input is="emby-input" type="text" id="txtNewName" required="required" label="${LabelUser}" autocomplete="username" autocapitalize="off" />';
            html += '<div class="formDialogFooter formDialogFooter-clear formDialogFooter-flex" style="margin:1em"><button is="emby-button" type="submit" class="btnOption raised formDialogFooterItem formDialogFooterItem-autosize button-submit emby-button" data-id="ok" autofocus="">Got It</button></div>';
            html += '</div>';
            html += '</div>';
            dlg.innerHTML = globalize.translateHtml(html, 'core');

            dialogHelper.open(dlg);
            document.querySelector('.btnOption').addEventListener('click', function () {
                newName = document.querySelector('#txtNewName').value;
                apiClient.ajax({
                    type: 'POST',
                    url: apiClient.getUrl(`Users/${user.Id}`),
                    dataType: 'json',
                    data: JSON.stringify({
                        Name: newName
                    }),
                    contentType: 'application/json'
                }).then(
                    document.querySelector('.btnOption').onclick = function() {
                    dialogHelper.close(dlg);
                });
            });
        } else {
            html += '<div class="formDialogHeader">';
            html += '<div class="focuscontainer dialog formDialog align-items-center justify-content-center dialog-fullscreen-lowres centeredDialog opened" data-history="true" modal="modal" data-autofocus="true" data-removeonclose="true" style="animation: 180ms ease-out 0s 1 normal both running scaleup;"><div class="formDialogHeader formDialogHeader-clear justify-content-center">';
            html += '<h1 class="formDialogHeaderTitle" style="margin-top: .5em;padding: 0 1em;">Username Migration</h1>';
            html += '</div>';
            html += '<div class="formDialogContent smoothScrollY no-grow" style="max-width: 350px;">';
            html += '<div class="dialogContentInner dialog-content-centered" style="padding-top:1em;padding-bottom: 1em; text-align: center;">';
            html += `<div class="text">Your current username is "${user.Name}", your new username will be "${user.Name.trim()}".</div></div></div>`;
            html += '<div class="formDialogFooter formDialogFooter-clear formDialogFooter-flex" style="margin:1em"><button is="emby-button" type="button" class="btnOption raised formDialogFooterItem formDialogFooterItem-autosize button-submit emby-button" data-id="ok" autofocus="">Got It</button></div>';
            html += '</div>';
            html += '</div>';
            dlg.innerHTML = globalize.translateHtml(html, 'core');
            newName = user.Name.trim();

            dialogHelper.open(dlg).then(function() {
                apiClient.ajax({
                    type: 'POST',
                    url: apiClient.getUrl(`Users/${user.Id}`),
                    dataType: 'json',
                    data: JSON.stringify({
                        Name: newName
                    }),
                    contentType: 'application/json'
                }).then(
                    document.querySelector('.btnOption').onclick = function() {
                    dialogHelper.close(dlg);
                });
            });
        }
    }

    function hasWhiteSpace(s) {
        return s.indexOf(' ') >= 0;
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

        for (let i = 0; i < users.length; i++) {
            const user = users[i];

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

                html += '<div class="cardImageContainer coveredImage" style="background-image:url(\'' + imgUrl + "');\"></div>";
            } else {
                html += `<div class="cardImage flex align-items-center justify-content-center ${cardBuilder.getDefaultBackgroundClass()}">`;
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

        function showVisualForm() {
            view.querySelector('.visualLoginForm').classList.remove('hide');
            view.querySelector('.manualLoginForm').classList.add('hide');
            view.querySelector('.btnManual').classList.remove('hide');

            import('../../../components/autoFocuser').then(({default: autoFocuser}) => {
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
                    authenticateUserByName(context, getApiClient(), name, '');
                } else {
                    context.querySelector('#txtManualName').value = name;
                    context.querySelector('#txtManualPassword').value = '';
                    showManualForm(context, true, true);
                }
            }
        });
        view.querySelector('.manualLoginForm').addEventListener('submit', function (e) {
            appSettings.enableAutoLogin(view.querySelector('.chkRememberLogin').checked);
            const apiClient = getApiClient();
            authenticateUserByName(view, apiClient, view.querySelector('#txtManualName').value.trim(), view.querySelector('#txtManualPassword').value);
            e.preventDefault();
            return false;
        });
        view.querySelector('.btnForgotPassword').addEventListener('click', function () {
            Dashboard.navigate('forgotpassword.html');
        });
        view.querySelector('.btnCancel').addEventListener('click', showVisualForm);
        view.querySelector('.btnQuick').addEventListener('click', function () {
            const apiClient = getApiClient();
            authenticateQuickConnect(apiClient);
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

            if (!appHost.supports('multiserver')) {
                view.querySelector('.btnSelectServer').classList.add('hide');
            }

            const apiClient = getApiClient();

            apiClient.getQuickConnect('Enabled')
                .then(enabled => {
                    if (enabled === true) {
                        view.querySelector('.btnQuick').classList.remove('hide');
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
                    view.querySelector('#txtManualName').value = '';
                    showManualForm(view, false, false);
                }
            }).catch().then(function () {
                loading.hide();
            });
            apiClient.getJSON(apiClient.getUrl('Branding/Configuration')).then(function (options) {
                const disclaimer = view.querySelector('.disclaimer');

                disclaimer.innerHTML = DOMPurify.sanitize(marked(options.LoginDisclaimer || ''));

                for (const elem of disclaimer.querySelectorAll('a')) {
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

/* eslint-enable indent */
