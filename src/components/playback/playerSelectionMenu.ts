import { AppFeature } from 'constants/appFeature';
import Events from '../../utils/events';
import browser from '../../scripts/browser';
import loading from '../loading/loading';
import { playbackManager } from '../playback/playbackmanager';
import { pluginManager } from '../pluginManager';
import { appRouter } from '../router/appRouter';
import globalize from '../../lib/globalize';
import { safeAppHost } from '../apphost';
import { enable, isEnabled } from '../../scripts/autocast';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-button/emby-button';
import dialog from '../dialog/dialog';
import dialogHelper from '../dialogHelper/dialogHelper';

interface PlaybackTarget {
    id: string;
    name: string;
    appName?: string;
    deviceType?: string;
    isLocalPlayer?: boolean;
    user?: {
        Name: string;
    };
    playerName?: string;
    playableMediaTypes?: string[];
    supportedCommands?: string[];
}

interface PlayerInfo {
    id?: string;
    name?: string;
    deviceName?: string;
    isLocalPlayer?: boolean;
    supportedCommands?: string[];
}

interface MenuItem {
    name: string;
    id: string;
    selected?: boolean;
    secondaryText?: string | null;
    icon?: string;
}

interface DialogItem {
    name: string;
    id: string;
}

function getTargetSecondaryText(target: PlaybackTarget): string | null {
    if (target.user) {
        return target.user.Name;
    }

    return null;
}

function getIcon(target: PlaybackTarget): string {
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

export function show(button: HTMLElement): void {
    const currentPlayerInfo = playbackManager.getPlayerInfo();

    if (currentPlayerInfo && !currentPlayerInfo.isLocalPlayer) {
        showActivePlayerMenu(currentPlayerInfo);
        return;
    }

    const currentPlayerId = currentPlayerInfo ? currentPlayerInfo.id : null;

    loading.show();

    playbackManager.getTargets().then(function (targets: PlaybackTarget[]) {
        const menuItems: MenuItem[] = targets.map(function (t: PlaybackTarget) {
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

        import('../actionSheet/actionSheet').then((actionsheet) => {
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
            if (!(!browser.chrome && !browser.edgeChromium || safeAppHost.supports(AppFeature.CastMenuHashChange))) {
                (menuOptions as any).enableHistory = false;
            }

            // Add message when Google Cast is not supported
            const isChromecastPluginLoaded = !!pluginManager.plugins.find((plugin: any) => plugin.id === 'chromecast');
            // TODO: Add other checks for support (Android app, secure context, etc)
            if (!isChromecastPluginLoaded) {
                (menuOptions as any).text = `(${globalize.translate('GoogleCastUnsupported')})`;
            }

            (actionsheet as any).show(menuOptions).then(function (id: string) {
                const target = targets.filter(function (t: PlaybackTarget) {
                    return t.id === id;
                })[0];

                playbackManager.trySetActivePlayer(target.playerName!, target);
            }).catch(() => {
                // action sheet closed
            });
        }).catch((err: any) => {
            console.error('[playerSelectionMenu] failed to import action sheet', err);
        });
    }).catch((err: any) => {
        console.error('[playerSelectionMenu] failed to get playback targets', err);
    });
}

function showActivePlayerMenu(playerInfo: PlayerInfo): void {
    showActivePlayerMenuInternal(playerInfo);
}

function disconnectFromPlayer(currentDeviceName: string): void {
    if (playbackManager.getSupportedCommands().indexOf('EndSession') !== -1) {
        const menuItems: DialogItem[] = [];

        menuItems.push({
            name: globalize.translate('Yes'),
            id: 'yes'
        });
        menuItems.push({
            name: globalize.translate('No'),
            id: 'no'
        });

        dialog.show({
            buttons: menuItems,
            text: globalize.translate('ConfirmEndPlayerSession', currentDeviceName)

        }).then(function (id: string) {
            switch (id) {
                case 'yes':
                    (playbackManager.getCurrentPlayer() as any).endSession();
                    (playbackManager as any).setDefaultPlayerActive();
                    break;
                case 'no':
                    (playbackManager as any).setDefaultPlayerActive();
                    break;
                default:
                    break;
            }
        }).catch(() => {
            // dialog closed
        });
    } else {
        (playbackManager as any).setDefaultPlayerActive();
    }
}

function showActivePlayerMenuInternal(playerInfo: PlayerInfo): void {
    let html = '';

    const dialogOptions = {
        removeOnClose: true
    };

    (dialogOptions as any).modal = false;
    (dialogOptions as any).entryAnimationDuration = 160;
    (dialogOptions as any).exitAnimationDuration = 160;
    (dialogOptions as any).autoFocus = false;

    const dlg = dialogHelper.createDialog(dialogOptions);

    dlg.classList.add('promptDialog');

    const currentDeviceName = (playerInfo.deviceName || playerInfo.name);

    html += '<div class="promptDialogContent" style="padding:1.5em;">';
    html += '<h2 style="margin-top:.5em;">';
    html += currentDeviceName;
    html += '</h2>';

    html += '<div>';

    if (playerInfo.supportedCommands && playerInfo.supportedCommands.indexOf('DisplayContent') !== -1) {
        html += '<label class="checkboxContainer">';
        const checkedHtml = (playbackManager as any).enableDisplayMirroring() ? ' checked' : '';
        html += '<input type="checkbox" is="emby-checkbox" class="chkMirror"' + checkedHtml + '/>';
        html += '<span>' + globalize.translate('EnableDisplayMirroring') + '</span>';
        html += '</label>';
    }

    html += '</div>';

    html += '<div><label class="checkboxContainer">';
    const checkedHtmlAC = isEnabled() ? ' checked' : '';
    html += '<input type="checkbox" is="emby-checkbox" class="chkAutoCast"' + checkedHtmlAC + '/>';
    html += '<span>' + globalize.translate('EnableAutoCast') + '</span>';
    html += '</label></div>';

    html += '<div style="margin-top:1em;display:flex;justify-content: flex-end;">';

    html += '<button is="emby-button" type="button" class="button-flat btnRemoteControl promptDialogButton">' + globalize.translate('HeaderRemoteControl') + '</button>';
    html += '<button is="emby-button" type="button" class="button-flat btnDisconnect promptDialogButton ">' + globalize.translate('Disconnect') + '</button>';
    html += '<button is="emby-button" type="button" class="button-flat btnCancel promptDialogButton">' + globalize.translate('ButtonCancel') + '</button>';
    html += '</div>';

    html += '</div>';
    dlg.innerHTML = html;

    const chkMirror = dlg.querySelector('.chkMirror') as HTMLInputElement | null;

    if (chkMirror) {
        chkMirror.addEventListener('change', onMirrorChange);
    }

    const chkAutoCast = dlg.querySelector('.chkAutoCast') as HTMLInputElement | null;

    if (chkAutoCast) {
        chkAutoCast.addEventListener('change', onAutoCastChange);
    }

    let destination = '';

    const btnRemoteControl = dlg.querySelector('.btnRemoteControl') as HTMLButtonElement | null;
    if (btnRemoteControl) {
        btnRemoteControl.addEventListener('click', function () {
            destination = 'nowplaying';
            dialogHelper.close(dlg);
        });
    }

    dlg.querySelector('.btnDisconnect')!.addEventListener('click', function () {
        destination = 'disconnectFromPlayer';
        dialogHelper.close(dlg);
    });

    dlg.querySelector('.btnCancel')!.addEventListener('click', function () {
        dialogHelper.close(dlg);
    });

    dialogHelper.open(dlg).then(function () {
        if (destination === 'nowplaying') {
            return appRouter.showNowPlaying();
        } else if (destination === 'disconnectFromPlayer') {
            disconnectFromPlayer(currentDeviceName!);
        }
    }).catch(() => {
        // dialog closed
    });
}

function onMirrorChange(this: HTMLInputElement): void {
    (playbackManager as any).enableDisplayMirroring(this.checked);
}

function onAutoCastChange(this: HTMLInputElement): void {
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