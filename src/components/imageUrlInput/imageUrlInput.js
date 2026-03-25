import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import layoutManager from '../layoutManager';
import scrollHelper from '../../scripts/scrollHelper';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import globalize from '../../lib/globalize';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-button/emby-button';
import '../formdialog.scss';
import template from './imageUrlInput.template.html';

let currentResolve;
let currentReject;
let currentDialog;

function downloadImageFromUrl(apiClient, itemId, imageUrl, imageType) {
    if (!imageUrl || imageUrl.trim() === '') {
        alert('Please enter a URL');
        return;
    }

    loading.show();

    const options = {
        itemId: itemId,
        type: imageType,
        imageUrl: imageUrl
    };

    console.log('Downloading image with options:', options);

    apiClient.downloadRemoteImage(options).then(function () {
        loading.hide();
        console.log('Image downloaded successfully');
        dialogHelper.close(currentDialog);
        if (currentResolve) {
            currentResolve();
        }
    }).catch(function (error) {
        loading.hide();
        console.error('Error downloading image:', error);
        alert('Error adding image. Check console for details.');
    });
}

function initEditor(dialog, apiClient, itemId, imageType) {
    const inputUrl = dialog.querySelector('#imageUrlInput');
    const btnDownload = dialog.querySelector('.btnDownloadImageUrl');

    if (!inputUrl) {
        console.error('Input element not found');
        return;
    }

    if (!btnDownload) {
        console.error('Download button not found');
        return;
    }

    console.log('Editor initialized');

    // Focus on input when dialog opens
    inputUrl.focus();

    // Handle Enter key
    inputUrl.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            btnDownload.click();
        }
    });

    btnDownload.addEventListener('click', function () {
        console.log('Download button clicked');
        downloadImageFromUrl(apiClient, itemId, inputUrl.value, imageType);
    });
}

function showEditor(itemId, serverId, imageType) {
    const apiClient = ServerConnections.getApiClient(serverId);

    const dialogOptions = {
        removeOnClose: true
    };

    if (layoutManager.tv) {
        dialogOptions.size = 'fullscreen';
    } else {
        dialogOptions.size = 'small';
    }

    const dlg = dialogHelper.createDialog(dialogOptions);
    currentDialog = dlg;

    dlg.classList.add('formDialog');
    dlg.innerHTML = globalize.translateHtml(template, 'core');

    if (layoutManager.tv) {
        scrollHelper.centerFocus.on(dlg, false);
    }

    dlg.addEventListener('close', function () {
        if (layoutManager.tv) {
            scrollHelper.centerFocus.off(dlg, false);
        }
    });

    dialogHelper.open(dlg);

    initEditor(dlg, apiClient, itemId, imageType);

    const btnCancel = dlg.querySelector('.btnCancel');
    if (btnCancel) {
        btnCancel.addEventListener('click', function () {
            dialogHelper.close(dlg);
        });
    }
}

export function show(itemId, serverId, imageType) {
    return new Promise(function (resolve, reject) {
        currentResolve = resolve;
        currentReject = reject;
        showEditor(itemId, serverId, imageType);
    });
}

export default {
    show
};
