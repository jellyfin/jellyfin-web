import { AppFeature } from 'constants/appFeature';
import Events from '../../utils/events.ts';
import browser from '../../scripts/browser';
import loading from '../loading/loading';
import { playbackManager } from '../playback/playbackmanager';
import { pluginManager } from '../pluginManager';
import { appRouter } from '../router/appRouter';
import globalize from '../../lib/globalize';
import { appHost } from '../apphost';
import { enable, isEnabled } from '../../scripts/autocast';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-button/emby-button';
import dialog from '../dialog/dialog';
import dialogHelper from '../dialogHelper/dialogHelper';

function getTargetSecondaryText(target) {
    if (target.user) {
        return target.user.Name;
    }

    return null;
}

function getIcon(target) {
    let deviceType = target.deviceType;

    if (!deviceType && target.isLocalPlayer) {
        if (browser.tv) {
            deviceType = 'tv';
        } else if (browser.mobile) {
            deviceType = 'smartphone';
        } else {
            deviceType = 'desktop';
        }
    }

    if (!deviceType) {
        deviceType = 'tv';
    }

    switch (deviceType) {
        case 'smartphone':
            return 'smartphone';
        case 'tablet':
            return 'tablet';
        case 'tv':
            return 'tv';
        case 'cast':
            return 'cast';
        case 'desktop':
            return 'computer';
        default:
            return 'tv';
    }
}

export function show(button) {
    const currentPlayerInfo = playbackManager.getPlayerInfo();

    if (currentPlayerInfo && !currentPlayerInfo.isLocalPlayer) {
        showActivePlayerMenu(currentPlayerInfo);
        return;
    }

    const currentPlayerId = currentPlayerInfo ? currentPlayerInfo.id : null;

    loading.show();

    playbackManager
        .getTargets()
        .then(function (targets) {
            const menuItems = targets.map(function (t) {
                let name = t.name;

                if (t.appName && t.appName !== t.name) {
                    name += ' - ' + t.appName;
                }

                return {
                    name: name,
                    id: t.id,
                    selected: currentPlayerId === t.id,
                    secondaryText: getTargetSecondaryText(t),
                    icon: getIcon(t)
                };
            });

            import('../actionSheet/actionSheet')
                .then((actionsheet) => {
                    loading.hide();

                    const menuOptions = {
                        title: globalize.translate('HeaderPlayOn'),
                        items: menuItems,
                        positionTo: button,

                        resolveOnClick: true,
                        border: true
                    };

                    // Unfortunately we can't allow the url to change or chromecast will throw a security error
                    // Might be able to solve this in the future by moving the dialogs to hashbangs
                    if (
                        !(
                            (!browser.chrome && !browser.edgeChromium) ||
                            appHost.supports(AppFeature.CastMenuHashChange)
                        )
                    ) {
                        menuOptions.enableHistory = false;
                    }

                    // Add message when Google Cast is not supported
                    const isChromecastPluginLoaded =
                        !!pluginManager.plugins.find(
                            (plugin) => plugin.id === 'chromecast'
                        );
                    // TODO: Add other checks for support (Android app, secure context, etc)
                    if (!isChromecastPluginLoaded) {
                        menuOptions.text = `(${globalize.translate('GoogleCastUnsupported')})`;
                    }

                    actionsheet
                        .show(menuOptions)
                        .then(function (id) {
                            const target = targets.filter(function (t) {
                                return t.id === id;
                            })[0];

                            playbackManager.trySetActivePlayer(
                                target.playerName,
                                target
                            );
                        })
                        .catch(() => {
                            // action sheet closed
                        });
                })
                .catch((err) => {
                    console.error(
                        '[playerSelectionMenu] failed to import action sheet',
                        err
                    );
                });
        })
        .catch((err) => {
            console.error(
                '[playerSelectionMenu] failed to get playback targets',
                err
            );
        });
}

function showActivePlayerMenu(playerInfo) {
    showActivePlayerMenuInternal(playerInfo);
}

function disconnectFromPlayer(currentDeviceName) {
    if (playbackManager.getSupportedCommands().indexOf('EndSession') !== -1) {
        const menuItems = [];

        menuItems.push({
            name: globalize.translate('Yes'),
            id: 'yes'
        });
        menuItems.push({
            name: globalize.translate('No'),
            id: 'no'
        });

        dialog
            .show({
                buttons: menuItems,
                text: globalize.translate(
                    'ConfirmEndPlayerSession',
                    currentDeviceName
                )
            })
            .then(function (id) {
                switch (id) {
                    case 'yes':
                        playbackManager.getCurrentPlayer().endSession();
                        playbackManager.setDefaultPlayerActive();
                        break;
                    case 'no':
                        playbackManager.setDefaultPlayerActive();
                        break;
                    default:
                        break;
                }
            })
            .catch(() => {
                // dialog closed
            });
    } else {
        playbackManager.setDefaultPlayerActive();
    }
}

function showActivePlayerMenuInternal(playerInfo) {
    let html = '';

    const dialogOptions = {
        removeOnClose: true
    };

    dialogOptions.modal = false;
    dialogOptions.entryAnimationDuration = 160;
    dialogOptions.exitAnimationDuration = 160;
    dialogOptions.autoFocus = false;

    const dlg = dialogHelper.createDialog(dialogOptions);

    dlg.classList.add('promptDialog');

    const currentDeviceName = playerInfo.deviceName || playerInfo.name;

    html += '<div class="promptDialogContent" style="padding:1.5em;">';
    html += '<h2 style="margin-top:.5em;">';
    html += currentDeviceName;
    html += '</h2>';

    html += '<div>';

    if (playerInfo.supportedCommands.indexOf('DisplayContent') !== -1) {
        html += '<label class="checkboxContainer">';
        const checkedHtml = playbackManager.enableDisplayMirroring()
            ? ' checked'
            : '';
        html +=
            '<input type="checkbox" is="emby-checkbox" class="chkMirror"' +
            checkedHtml +
            '/>';
        html +=
            '<span>' +
            globalize.translate('EnableDisplayMirroring') +
            '</span>';
        html += '</label>';
    }

    html += '</div>';

    html += '<div><label class="checkboxContainer">';
    const checkedHtmlAC = isEnabled() ? ' checked' : '';
    html +=
        '<input type="checkbox" is="emby-checkbox" class="chkAutoCast"' +
        checkedHtmlAC +
        '/>';
    html += '<span>' + globalize.translate('EnableAutoCast') + '</span>';
    html += '</label></div>';

    html +=
        '<div style="margin-top:1em;display:flex;justify-content: flex-end;">';

    html +=
        '<button is="emby-button" type="button" class="button-flat btnRemoteControl promptDialogButton">' +
        globalize.translate('HeaderRemoteControl') +
        '</button>';
    html +=
        '<button is="emby-button" type="button" class="button-flat btnDisconnect promptDialogButton ">' +
        globalize.translate('Disconnect') +
        '</button>';
    html +=
        '<button is="emby-button" type="button" class="button-flat btnCancel promptDialogButton">' +
        globalize.translate('ButtonCancel') +
        '</button>';
    html += '</div>';

    html += '</div>';
    dlg.innerHTML = html;

    const chkMirror = dlg.querySelector('.chkMirror');

    if (chkMirror) {
        chkMirror.addEventListener('change', onMirrorChange);
    }

    const chkAutoCast = dlg.querySelector('.chkAutoCast');

    if (chkAutoCast) {
        chkAutoCast.addEventListener('change', onAutoCastChange);
    }

    let destination = '';

    const btnRemoteControl = dlg.querySelector('.btnRemoteControl');
    if (btnRemoteControl) {
        btnRemoteControl.addEventListener('click', function () {
            destination = 'nowplaying';
            dialogHelper.close(dlg);
        });
    }

    dlg.querySelector('.btnDisconnect').addEventListener('click', function () {
        destination = 'disconnectFromPlayer';
        dialogHelper.close(dlg);
    });

    dlg.querySelector('.btnCancel').addEventListener('click', function () {
        dialogHelper.close(dlg);
    });

    dialogHelper
        .open(dlg)
        .then(function () {
            if (destination === 'nowplaying') {
                return appRouter.showNowPlaying();
            } else if (destination === 'disconnectFromPlayer') {
                disconnectFromPlayer(currentDeviceName);
            }
        })
        .catch(() => {
            // dialog closed
        });
}

function onMirrorChange() {
    playbackManager.enableDisplayMirroring(this.checked);
}

function onAutoCastChange() {
    enable(this.checked);
}

Events.on(playbackManager, 'pairing', function () {
    loading.show();
});

Events.on(playbackManager, 'paired', function () {
    loading.hide();
});

Events.on(playbackManager, 'pairerror', function () {
    loading.hide();
});

export default {
    show: show
};
