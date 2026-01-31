
/**
 * Module for itemidentifier media item.
 * @module components/itemidentifier/itemidentifier
 */

import escapeHtml from 'escape-html';
import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import scrollHelper from '../../scripts/scrollHelper';
import layoutManager from '../layoutManager';
import focusManager from '../focusManager';
import browser from '../../scripts/browser';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import 'material-design-icons-iconfont';
import '../cardbuilder/card.scss';
import toast from '../toast/toast';
import template from './itemidentifier.template.html';
import datetime from '../../scripts/datetime';

const enableFocusTransform = !browser.slow && !browser.edge;

let currentItem;
let currentItemType;
let currentServerId;
let currentResolve;
let currentReject;
let hasChanges = false;
let currentSearchResult;
let currentView = 'search';

function getApiClient() {
    return ServerConnections.getApiClient(currentServerId);
}

function searchForIdentificationResults(page) {
    let lookupInfo = {
        ProviderIds: {}
    };

    let i;
    let length;
    const identifyField = page.querySelectorAll('.identifyField');
    let value;
    for (i = 0, length = identifyField.length; i < length; i++) {
        value = identifyField[i].value;

        if (value) {
            if (identifyField[i].type === 'number') {
                value = parseInt(value, 10);
            }

            lookupInfo[identifyField[i].getAttribute('data-lookup')] = value;
        }
    }

    let hasId = false;

    const txtLookupId = page.querySelectorAll('.txtLookupId');
    for (i = 0, length = txtLookupId.length; i < length; i++) {
        value = txtLookupId[i].value;

        if (value) {
            hasId = true;
        }
        lookupInfo.ProviderIds[txtLookupId[i].getAttribute('data-providerkey')] = value;
    }

    if (!hasId && !lookupInfo.Name) {
        toast(globalize.translate('PleaseEnterNameOrId'));
        return;
    }

    lookupInfo = {
        SearchInfo: lookupInfo
    };

    if (currentItem?.Id) {
        lookupInfo.ItemId = currentItem.Id;
    } else {
        lookupInfo.IncludeDisabledProviders = true;
    }

    loading.show();

    const apiClient = getApiClient();

    apiClient.ajax({
        type: 'POST',
        url: apiClient.getUrl(`Items/RemoteSearch/${currentItemType}`),
        data: JSON.stringify(lookupInfo),
        contentType: 'application/json',
        dataType: 'json'

    }).then(results => {
        loading.hide();
        showIdentificationSearchResults(page, results);
    });
}

function showIdentificationSearchResults(page, results) {
    const identificationSearchResults = page.querySelector('.identificationSearchResults');

    showResultsView(page);

    let html = '';
    let i;
    let length;
    for (i = 0, length = results.length; i < length; i++) {
        const result = results[i];
        html += getSearchResultHtml(result, i);
    }

    const elem = page.querySelector('.identificationSearchResultList');
    elem.innerHTML = html;

    function onSearchImageClick() {
        const index = parseInt(this.getAttribute('data-index'), 10);

        const currentResult = results[index];

        if (currentItem != null) {
            showIdentifyOptions(page, currentResult);
        } else {
            finishFindNewDialog(page, currentResult);
        }
    }

    const searchImages = elem.querySelectorAll('.card');
    for (i = 0, length = searchImages.length; i < length; i++) {
        searchImages[i].addEventListener('click', onSearchImageClick);
    }

    if (layoutManager.tv) {
        focusManager.autoFocus(identificationSearchResults);
    }
}

function finishFindNewDialog(dlg, identifyResult) {
    currentSearchResult = identifyResult;
    hasChanges = true;
    loading.hide();

    dialogHelper.close(dlg);
}

function showIdentifyOptions(page, identifyResult) {
    const identifyOptionsForm = page.querySelector('.identifyOptionsForm');

    page.querySelector('.popupIdentifyForm').classList.add('hide');
    page.querySelector('.identificationSearchResults').classList.add('hide');
    identifyOptionsForm.classList.remove('hide');
    page.querySelector('#chkIdentifyReplaceImages').checked = true;
    page.querySelector('.dialogContentInner').classList.add('dialog-content-centered');
    currentView = 'options';

    currentSearchResult = identifyResult;

    const lines = [];
    lines.push(escapeHtml(identifyResult.Name));

    if (identifyResult.ProductionYear) {
        lines.push(datetime.toLocaleString(identifyResult.ProductionYear, { useGrouping: false }));
    }

    let resultHtml = lines.join('<br/>');

    if (identifyResult.ImageUrl) {
        resultHtml = `<div style="display:flex;align-items:center;"><img src="${identifyResult.ImageUrl}" style="max-height:240px;" /><div style="margin-left:1em;">${resultHtml}</div>`;
    }

    page.querySelector('.selectedSearchResult').innerHTML = resultHtml;

    focusManager.focus(identifyOptionsForm.querySelector('.btnSubmit'));
}

function showSearchView(page) {
    page.querySelector('.popupIdentifyForm').classList.remove('hide');
    page.querySelector('.identificationSearchResults').classList.add('hide');
    page.querySelector('.identifyOptionsForm').classList.add('hide');
    page.querySelector('.dialogContentInner').classList.add('dialog-content-centered');
    currentView = 'search';
}

function showResultsView(page) {
    page.querySelector('.popupIdentifyForm').classList.add('hide');
    page.querySelector('.identificationSearchResults').classList.remove('hide');
    page.querySelector('.identifyOptionsForm').classList.add('hide');
    page.querySelector('.dialogContentInner').classList.remove('dialog-content-centered');
    currentView = 'results';
}

function getSearchResultHtml(result, index) {
    // TODO move card creation code to Card component

    let html = '';
    let cssClass = 'card scalableCard';
    let cardBoxCssClass = 'cardBox';
    let padderClass;

    if (currentItemType === 'Episode') {
        cssClass += ' backdropCard backdropCard-scalable';
        padderClass = 'cardPadder-backdrop';
    } else if (currentItemType === 'MusicAlbum' || currentItemType === 'MusicArtist') {
        cssClass += ' squareCard squareCard-scalable';
        padderClass = 'cardPadder-square';
    } else {
        cssClass += ' portraitCard portraitCard-scalable';
        padderClass = 'cardPadder-portrait';
    }

    if (layoutManager.tv) {
        cssClass += ' show-focus';

        if (enableFocusTransform) {
            cssClass += ' show-animation';
        }
    }

    cardBoxCssClass += ' cardBox-bottompadded';

    let numLines = 3;
    if (currentItemType === 'MusicAlbum') {
        numLines++;
    }

    const lines = [result.Name];

    lines.push(result.SearchProviderName);

    if (result.AlbumArtist) {
        lines.push(result.AlbumArtist.Name);
    }
    if (result.ProductionYear) {
        lines.push(result.ProductionYear);
    }

    const tooltipText = lines
        .filter(Boolean)
        .map(line => String(line))
        .join(' - ');

    const buttonTitle = tooltipText ? ` title="${escapeHtml(tooltipText)}"` : '';

    html += `<button type="button" class="${cssClass}" data-index="${index}"${buttonTitle}>`;
    html += `<div class="${cardBoxCssClass}">`;
    html += '<div class="cardScalable">';
    html += `<div class="${padderClass}"></div>`;

    html += '<div class="cardContent searchImage">';

    if (result.ImageUrl) {
        html += `<div class="cardImageContainer coveredImage" style="background-image:url('${result.ImageUrl}');"></div>`;
    } else {
        html += `<div class="cardImageContainer coveredImage defaultCardBackground defaultCardBackground1"><div class="cardText cardCenteredText">${escapeHtml(result.Name)}</div></div>`;
    }
    html += '</div>';
    html += '</div>';

    for (let i = 0; i < numLines; i++) {
        if (i === 0) {
            html += '<div class="cardText cardText-first cardTextCentered">';
        } else {
            html += '<div class="cardText cardText-secondary cardTextCentered">';
        }
        html += escapeHtml(lines[i] || '') || '&nbsp;';
        html += '</div>';
    }

    html += '</div>';
    html += '</button>';
    return html;
}

function submitIdentficationResult(page) {
    loading.show();

    const options = {
        ReplaceAllImages: page.querySelector('#chkIdentifyReplaceImages').checked
    };

    const apiClient = getApiClient();

    apiClient.ajax({
        type: 'POST',
        url: apiClient.getUrl(`Items/RemoteSearch/Apply/${currentItem.Id}`, options),
        data: JSON.stringify(currentSearchResult),
        contentType: 'application/json'

    }).then(() => {
        hasChanges = true;
        loading.hide();

        dialogHelper.close(page);
    }, () => {
        loading.hide();

        dialogHelper.close(page);
    });
}

function showIdentificationForm(page, item) {
    const apiClient = getApiClient();

    apiClient.getJSON(apiClient.getUrl(`Items/${item.Id}/ExternalIdInfos`)).then(idList => {
        let html = '';

        for (let i = 0, length = idList.length; i < length; i++) {
            const idInfo = idList[i];

            const id = `txtLookup${idInfo.Key}`;

            html += '<div class="inputContainer">';

            let fullName = idInfo.Name;
            if (idInfo.Type) {
                fullName = `${idInfo.Name} ${globalize.translate(idInfo.Type)}`;
            }

            const idLabel = globalize.translate('LabelDynamicExternalId', escapeHtml(fullName));

            html += `<input is="emby-input" class="txtLookupId" data-providerkey="${idInfo.Key}" id="${id}" label="${idLabel}"/>`;

            html += '</div>';
        }

        page.querySelector('#txtLookupName').value = '';

        if (item.Type === 'Person' || item.Type === 'BoxSet') {
            page.querySelector('.fldLookupYear').classList.add('hide');
            page.querySelector('#txtLookupYear').value = '';
        } else {
            page.querySelector('.fldLookupYear').classList.remove('hide');
            page.querySelector('#txtLookupYear').value = '';
        }

        page.querySelector('.identifyProviderIds').innerHTML = html;

        page.querySelector('.formDialogHeaderTitle').innerHTML = globalize.translate('Identify');

        currentSearchResult = null;
        showSearchView(page);
    });
}

function showEditor(itemId) {
    loading.show();

    const apiClient = getApiClient();

    apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(item => {
        currentItem = item;
        currentItemType = currentItem.Type;
        currentSearchResult = null;
        currentView = 'search';

        const dialogOptions = {
            size: 'small',
            removeOnClose: true,
            scrollY: false
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        }

        const dlg = dialogHelper.createDialog(dialogOptions);

        dlg.classList.add('formDialog');
        dlg.classList.add('recordingDialog');

        let html = '';
        html += globalize.translateHtml(template, 'core');

        dlg.innerHTML = html;

        // Has to be assigned a z-index after the call to .open()
        dlg.addEventListener('close', onDialogClosed);

        if (layoutManager.tv) {
            scrollHelper.centerFocus.on(dlg.querySelector('.formDialogContent'), false);
        }

        if (item.Path) {
            dlg.querySelector('.fldPath').classList.remove('hide');
        } else {
            dlg.querySelector('.fldPath').classList.add('hide');
        }

        dlg.querySelector('.txtPath').innerText = item.Path || '';

        dialogHelper.open(dlg);

        dlg.querySelector('.popupIdentifyForm').addEventListener('submit', e => {
            e.preventDefault();
            searchForIdentificationResults(dlg);
            return false;
        });

        dlg.querySelector('.identifyOptionsForm').addEventListener('submit', e => {
            e.preventDefault();
            submitIdentficationResult(dlg);
            return false;
        });

        dlg.querySelector('.btnCancel').addEventListener('click', () => {
            if (currentView === 'options') {
                showResultsView(dlg);
                if (layoutManager.tv) {
                    focusManager.autoFocus(dlg.querySelector('.identificationSearchResults'));
                }
                return;
            }

            if (currentView === 'results') {
                showSearchView(dlg);
                const lookupInput = dlg.querySelector('#txtLookupName');
                if (lookupInput) {
                    focusManager.focus(lookupInput);
                }
                return;
            }

            dialogHelper.close(dlg);
        });

        dlg.classList.add('identifyDialog');

        showIdentificationForm(dlg, item);
        loading.hide();
    });
}

function onDialogClosed() {
    loading.hide();
    if (hasChanges) {
        currentResolve();
    } else {
        currentReject();
    }
}

export function show(itemId, serverId) {
    return new Promise((resolve, reject) => {
        currentResolve = resolve;
        currentReject = reject;
        currentServerId = serverId;
        hasChanges = false;

        showEditor(itemId);
    });
}

export default {
    show: show
};
