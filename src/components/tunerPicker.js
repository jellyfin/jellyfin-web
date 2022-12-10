import dialogHelper from './dialogHelper/dialogHelper';
import dom from '../scripts/dom';
import layoutManager from './layoutManager';
import globalize from '../scripts/globalize';
import loading from './loading/loading';
import browser from '../scripts/browser';
import focusManager from './focusManager';
import scrollHelper from '../scripts/scrollHelper';
import 'material-design-icons-iconfont';
import './formdialog.scss';
import '../elements/emby-button/emby-button';
import '../elements/emby-itemscontainer/emby-itemscontainer';
import './cardbuilder/card.scss';

const enableFocusTransform = !browser.slow && !browser.edge;

function getEditorHtml() {
    let html = '';
    html += '<div class="formDialogContent scrollY">';
    html += '<div class="dialogContentInner dialog-content-centered">';
    html += '<div class="loadingContent hide">';
    html += '<h1>' + globalize.translate('DetectingDevices') + '...</h1>';
    html += '<p>' + globalize.translate('MessagePleaseWait') + '</p>';
    html += '</div>';
    html += '<h1 style="margin-bottom:.25em;" class="devicesHeader hide">' + globalize.translate('HeaderNewDevices') + '</h1>';
    html += '<div is="emby-itemscontainer" class="results vertical-wrap">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    return html;
}

function getDeviceHtml(device) {
    let html = '';
    let cssClass = 'card scalableCard backdropCard backdropCard-scalable';
    const cardBoxCssClass = 'cardBox visualCardBox';
    const padderClass = 'cardPadder-backdrop';

    // TODO move card creation code to Card component

    if (layoutManager.tv) {
        cssClass += ' show-focus';

        if (enableFocusTransform) {
            cssClass += ' show-animation';
        }
    }

    html += '<button type="button" class="' + cssClass + '" data-id="' + device.DeviceId + '" style="min-width:33.3333%;">';
    html += '<div class="' + cardBoxCssClass + '">';
    html += '<div class="cardScalable visualCardBox-cardScalable">';
    html += '<div class="' + padderClass + '"></div>';
    html += '<div class="cardContent searchImage">';
    html += '<div class="cardImageContainer coveredImage"><span class="cardImageIcon material-icons dvr" aria-hidden="true"></span></div>';
    html += '</div>';
    html += '</div>';
    html += '<div class="cardFooter visualCardBox-cardFooter">';
    html += '<div class="cardText cardTextCentered">' + getTunerName(device.Type) + '</div>';
    html += '<div class="cardText cardTextCentered cardText-secondary">' + device.FriendlyName + '</div>';
    html += '<div class="cardText cardText-secondary cardTextCentered">';
    html += device.Url || '&nbsp;';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</button>';
    return html;
}

function getTunerName(providerId) {
    switch (providerId.toLowerCase()) {
        case 'm3u':
            return 'M3U';

        case 'hdhomerun':
            return 'HDHomerun';

        case 'hauppauge':
            return 'Hauppauge';

        case 'satip':
            return 'DVB';

        default:
            return 'Unknown';
    }
}

function renderDevices(view, devices) {
    let html = '';

    for (let i = 0, length = devices.length; i < length; i++) {
        html += getDeviceHtml(devices[i]);
    }

    if (devices.length) {
        view.querySelector('.devicesHeader').classList.remove('hide');
    } else {
        html = '<p><br/>' + globalize.translate('NoNewDevicesFound') + '</p>';
        view.querySelector('.devicesHeader').classList.add('hide');
    }

    const elem = view.querySelector('.results');
    elem.innerHTML = html;

    if (layoutManager.tv) {
        focusManager.autoFocus(elem);
    }
}

function discoverDevices(view) {
    loading.show();
    view.querySelector('.loadingContent').classList.remove('hide');
    return ApiClient.getJSON(ApiClient.getUrl('LiveTv/Tuners/Discover', {
        NewDevicesOnly: true
    })).then(function (devices) {
        currentDevices = devices;
        renderDevices(view, devices);
        view.querySelector('.loadingContent').classList.add('hide');
        loading.hide();
    });
}

function tunerPicker() {
    this.show = function () {
        const dialogOptions = {
            removeOnClose: true,
            scrollY: false
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        } else {
            dialogOptions.size = 'small';
        }

        const dlg = dialogHelper.createDialog(dialogOptions);
        dlg.classList.add('formDialog');
        let html = '';
        html += '<div class="formDialogHeader">';
        html += `<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
        html += '<h3 class="formDialogHeaderTitle">';
        html += globalize.translate('HeaderLiveTvTunerSetup');
        html += '</h3>';
        html += '</div>';
        html += getEditorHtml();
        dlg.innerHTML = html;
        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });
        let deviceResult;
        dlg.querySelector('.results').addEventListener('click', function (e) {
            const tunerCard = dom.parentWithClass(e.target, 'card');

            if (tunerCard) {
                const deviceId = tunerCard.getAttribute('data-id');
                deviceResult = currentDevices.filter(function (d) {
                    return d.DeviceId === deviceId;
                })[0];
                dialogHelper.close(dlg);
            }
        });

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
        }

        discoverDevices(dlg);

        if (layoutManager.tv) {
            scrollHelper.centerFocus.off(dlg.querySelector('.formDialogContent'), false);
        }

        return dialogHelper.open(dlg).then(function () {
            if (deviceResult) {
                return Promise.resolve(deviceResult);
            }

            return Promise.reject();
        });
    };
}

let currentDevices = [];

export default tunerPicker;
