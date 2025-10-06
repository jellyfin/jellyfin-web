import escapeHtml from 'escape-html';

import { getLyricsApi } from '@jellyfin/sdk/lib/utils/api/lyrics-api';
import { toApi } from 'utils/jellyfin-apiclient/compat';
import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import loading from '../loading/loading';
import focusManager from '../focusManager';
import dom from '../../utils/dom';
import '../../elements/emby-select/emby-select';
import '../listview/listview.scss';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import 'material-design-icons-iconfont';
import './lyricseditor.scss';
import '../../elements/emby-button/emby-button';
import '../../styles/flexstyles.scss';
import toast from '../toast/toast';
import template from './lyricseditor.template.html';
import templatePreview from './lyricspreview.template.html';
import { deleteLyrics } from '../../scripts/deleteHelper';

let currentItem;
let hasChanges;

function downloadRemoteLyrics(context, id) {
    const api = toApi(ServerConnections.getApiClient(currentItem.ServerId));
    const lyricsApi = getLyricsApi(api);
    lyricsApi.downloadRemoteLyrics({
        itemId: currentItem.Id,
        lyricId: id
    }).then(function () {
        hasChanges = true;

        toast(globalize.translate('MessageDownloadQueued'));

        focusManager.autoFocus(context);
    });
}

function getLyricsText(lyricsObject) {
    return lyricsObject.reduce((htmlAccumulator, lyric) => {
        if (lyric.Start || lyric.Start === 0) {
            const minutes = Math.floor(lyric.Start / 600000000);
            const seconds = Math.floor((lyric.Start % 600000000) / 10000000);
            const hundredths = Math.floor((lyric.Start % 10000000) / 100000);
            htmlAccumulator += '[' + String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0') + '.' + String(hundredths).padStart(2, '0') + '] ';
        }
        htmlAccumulator += escapeHtml(lyric.Text) + '<br/>';
        return htmlAccumulator;
    }, '');
}

function renderSearchResults(context, results) {
    let lastProvider = '';
    let html = '';

    if (!results.length) {
        context.querySelector('.noSearchResults').classList.remove('hide');
        context.querySelector('.lyricsResults').innerHTML = '';
        loading.hide();
        return;
    }

    context.querySelector('.noSearchResults').classList.add('hide');

    for (let i = 0, length = results.length; i < length; i++) {
        const result = results[i];

        const provider = result.ProviderName;
        const metadata = result.Lyrics.Metadata;
        const lyrics = getLyricsText(result.Lyrics.Lyrics);
        if (provider !== lastProvider) {
            if (i > 0) {
                html += '</div>';
            }
            html += '<h2>' + provider + '</h2>';
            html += '<div>';
            lastProvider = provider;
        }

        const tagName = layoutManager.tv ? 'button' : 'div';
        let className = layoutManager.tv ? 'listItem listItem-border btnOptions' : 'listItem listItem-border';
        if (layoutManager.tv) {
            className += ' listItem-focusscale listItem-button';
        }

        html += '<' + tagName + ' class="' + className + '" data-lyricsid="' + result.Id + '">';

        html += '<span class="listItemIcon material-icons lyrics" aria-hidden="true"></span>';

        html += '<div class="listItemBody three-line">';

        html += '<div>' + escapeHtml(metadata.Artist + ' - ' + metadata.Album + ' - ' + metadata.Title) + '</div>';

        const minutes = Math.floor(metadata.Length / 600000000);
        const seconds = Math.floor((metadata.Length % 600000000) / 10000000);

        html += '<div class="secondary listItemBodyText" style="white-space:pre-line;">' + globalize.translate('LabelDuration') + ': ' + minutes + ':' + String(seconds).padStart(2, '0') + '</div>';

        html += '<div class="secondary listItemBodyText" style="white-space:pre-line;">' + globalize.translate('LabelIsSynced') + ': ' + escapeHtml(metadata.IsSynced ? 'True' : 'False') + '</div>';

        html += '</div>';

        if (!layoutManager.tv) {
            html += '<button type="button" is="paper-icon-button-light" data-lyricsid="' + result.Id + '" class="btnPreview listItemButton"><span class="material-icons preview" aria-hidden="true"></span></button>';
            html += '<button type="button" is="paper-icon-button-light" data-lyricsid="' + result.Id + '" class="btnDownload listItemButton"><span class="material-icons file_download" aria-hidden="true"></span></button>';
        }
        html += '<div class="hide hiddenLyrics">';
        html += '<h2>' + globalize.translate('Lyrics') + '</h2>';
        html += '<div>' + lyrics + '</div>';
        html += '</div>';
        html += '</' + tagName + '>';
    }

    if (results.length) {
        html += '</div>';
    }

    const elem = context.querySelector('.lyricsResults');
    elem.innerHTML = html;

    loading.hide();
}

function searchForLyrics(context) {
    loading.show();

    const api = toApi(ServerConnections.getApiClient(currentItem.ServerId));
    const lyricsApi = getLyricsApi(api);
    lyricsApi.searchRemoteLyrics({
        itemId: currentItem.Id
    }).then(function (results) {
        renderSearchResults(context, results.data);
    });
}

function reload(context, apiClient, itemId) {
    context.querySelector('.noSearchResults').classList.add('hide');

    function onGetItem(item) {
        currentItem = item;

        fillCurrentLyrics(context, apiClient, item);
        let file = item.Path || '';
        const index = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
        if (index > -1) {
            file = file.substring(index + 1);
        }

        if (file) {
            context.querySelector('.pathValue').innerText = file;
            context.querySelector('.originalFile').classList.remove('hide');
        } else {
            context.querySelector('.pathValue').innerHTML = '';
            context.querySelector('.originalFile').classList.add('hide');
        }

        loading.hide();
    }

    if (typeof itemId === 'string') {
        apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(onGetItem);
    } else {
        onGetItem(itemId);
    }
}

function onSearchSubmit(e) {
    const form = this;

    searchForLyrics(dom.parentWithClass(form, 'formDialogContent'));

    e.preventDefault();
    return false;
}

function onLyricsResultsClick(e) {
    let lyricsId;
    let context;
    let lyrics;

    const btnOptions = dom.parentWithClass(e.target, 'btnOptions');
    if (btnOptions) {
        lyricsId = btnOptions.dataset.lyricsid;
        lyrics = btnOptions.querySelector('.hiddenLyrics');
        context = dom.parentWithClass(btnOptions, 'lyricsEditorDialog');
        showOptions(btnOptions, context, lyricsId, lyrics.innerHTML);
    }

    const btnPreview = dom.parentWithClass(e.target, 'btnPreview');
    if (btnPreview) {
        lyrics = btnPreview.parentNode.querySelector('.hiddenLyrics');
        showLyricsPreview(lyrics.innerHTML);
    }

    const btnDownload = dom.parentWithClass(e.target, 'btnDownload');
    if (btnDownload) {
        lyricsId = btnDownload.dataset.lyricsid;
        context = dom.parentWithClass(btnDownload, 'lyricsEditorDialog');
        downloadRemoteLyrics(context, lyricsId);
    }
}

function showLyricsPreview(lyrics) {
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
    dlg.classList.add('lyricsEditorDialog');

    dlg.innerHTML = globalize.translateHtml(templatePreview, 'core');

    dlg.querySelector('.lyricsPreview').innerHTML = lyrics;

    dlg.querySelector('.btnCancel').addEventListener('click', function () {
        dialogHelper.close(dlg);
    });

    dialogHelper.open(dlg);
}

function showOptions(button, context, lyricsId, lyrics) {
    const items = [];

    items.push({
        name: globalize.translate('PreviewLyrics'),
        id: 'preview'
    }
    , {
        name: globalize.translate('Download'),
        id: 'download'
    });

    import('../actionSheet/actionSheet').then((actionsheet) => {
        actionsheet.show({
            items: items,
            positionTo: button

        }).then(function (id) {
            if (id === 'download') {
                downloadRemoteLyrics(context, lyricsId);
            }
            if (id === 'preview') {
                showLyricsPreview(lyrics);
            }
        });
    });
}

function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then(({ default: scrollHelper }) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function onOpenUploadMenu(e) {
    const dialog = dom.parentWithClass(e.target, 'lyricsEditorDialog');
    const apiClient = ServerConnections.getApiClient(currentItem.ServerId);

    import('../lyricsuploader/lyricsuploader').then(({ default: lyricsUploader }) => {
        lyricsUploader.show({
            itemId: currentItem.Id,
            serverId: currentItem.ServerId
        }).then(function (hasChanged) {
            if (hasChanged) {
                hasChanges = true;
                reload(dialog, apiClient, currentItem.Id);
            }
        });
    });
}

function onDeleteLyrics(e) {
    deleteLyrics(currentItem).then(() => {
        hasChanges = true;
        const context = dom.parentWithClass(e.target, 'formDialogContent');
        const apiClient = ServerConnections.getApiClient(currentItem.ServerId);
        reload(context, apiClient, currentItem.Id);
    }).catch(() => {
        // delete dialog closed
    });
}

function fillCurrentLyrics(context, apiClient, item) {
    const api = toApi(apiClient);
    const lyricsApi = getLyricsApi(api);
    lyricsApi.getLyrics({
        itemId: item.Id
    }).then((response) => {
        if (!response.data.Lyrics) {
            context.querySelector('.currentLyrics').innerHTML = '';
        } else {
            let html = '';
            html += '<h2>' + globalize.translate('Lyrics') + '</h2>';
            html += '<div>';
            html += getLyricsText(response.data.Lyrics);
            html += '</div>';
            context.querySelector('.currentLyrics').innerHTML = html;
        }
    }).catch(() =>{
        context.querySelector('.currentLyrics').innerHTML = '';
    });
}

function showEditorInternal(itemId, serverId) {
    hasChanges = false;
    const apiClient = ServerConnections.getApiClient(serverId);
    return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(function (item) {
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
        dlg.classList.add('lyricsEditorDialog');

        dlg.innerHTML = globalize.translateHtml(template, 'core');

        dlg.querySelector('.originalLyricsFileLabel').innerHTML = globalize.translate('File');

        dlg.querySelector('.lyricsSearchForm').addEventListener('submit', onSearchSubmit);

        dlg.querySelector('.btnOpenUploadMenu').addEventListener('click', onOpenUploadMenu);

        dlg.querySelector('.btnDeleteLyrics').addEventListener('click', onDeleteLyrics);

        const btnSubmit = dlg.querySelector('.btnSubmit');

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            dlg.querySelector('.btnSearchLyrics').classList.add('hide');
        } else {
            btnSubmit.classList.add('hide');
        }
        const editorContent = dlg.querySelector('.formDialogContent');

        dlg.querySelector('.lyricsResults').addEventListener('click', onLyricsResultsClick);

        dlg.querySelector('.btnCancel').addEventListener('click', function () {
            dialogHelper.close(dlg);
        });

        return new Promise(function (resolve, reject) {
            dlg.addEventListener('close', function () {
                if (layoutManager.tv) {
                    centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                }

                if (hasChanges) {
                    resolve();
                } else {
                    reject();
                }
            });

            dialogHelper.open(dlg);

            reload(editorContent, apiClient, item);
        });
    });
}

function showEditor(itemId, serverId) {
    loading.show();

    return showEditorInternal(itemId, serverId);
}

export default {
    show: showEditor
};
