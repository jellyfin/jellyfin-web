import dialogHelper from 'dialogHelper';
import layoutManager from 'layoutManager';
import globalize from 'globalize';
import * as userSettings from 'userSettings';
import loading from 'loading';
import focusManager from 'focusManager';
import dom from 'dom';
import 'emby-select';
import 'listViewStyle';
import 'paper-icon-button-light';
import 'css!./../formdialog';
import 'material-icons';
import 'css!./subtitleeditor';
import 'emby-button';
import 'flexStyles';

let currentItem;
let hasChanges;

function downloadRemoteSubtitles(context, id) {
    const url = 'Items/' + currentItem.Id + '/RemoteSearch/Subtitles/' + id;

    const apiClient = window.connectionManager.getApiClient(currentItem.ServerId);
    apiClient.ajax({

        type: 'POST',
        url: apiClient.getUrl(url)

    }).then(function () {
        hasChanges = true;

        import('toast').then(({default: toast}) => {
            toast(globalize.translate('MessageDownloadQueued'));
        });

        focusManager.autoFocus(context);
    });
}

function deleteLocalSubtitle(context, index) {
    const msg = globalize.translate('MessageAreYouSureDeleteSubtitles');

    import('confirm').then(({default: confirm}) => {
        confirm({

            title: globalize.translate('ConfirmDeletion'),
            text: msg,
            confirmText: globalize.translate('Delete'),
            primary: 'delete'

        }).then(function () {
            loading.show();

            const itemId = currentItem.Id;
            const url = 'Videos/' + itemId + '/Subtitles/' + index;

            const apiClient = window.connectionManager.getApiClient(currentItem.ServerId);

            apiClient.ajax({

                type: 'DELETE',
                url: apiClient.getUrl(url)

            }).then(function () {
                hasChanges = true;
                reload(context, apiClient, itemId);
            });
        });
    });
}

function fillSubtitleList(context, item) {
    const streams = item.MediaStreams || [];

    const subs = streams.filter(function (s) {
        return s.Type === 'Subtitle';
    });

    let html = '';

    if (subs.length) {
        html += '<h2>' + globalize.translate('MySubtitles') + '</h2>';

        html += '<div>';

        html += subs.map(function (s) {
            let itemHtml = '';

            const tagName = layoutManager.tv ? 'button' : 'div';
            let className = layoutManager.tv && s.Path ? 'listItem listItem-border btnDelete' : 'listItem listItem-border';

            if (layoutManager.tv) {
                className += ' listItem-focusscale listItem-button';
            }

            className += ' listItem-noborder';

            itemHtml += '<' + tagName + ' class="' + className + '" data-index="' + s.Index + '">';

            itemHtml += '<span class="listItemIcon material-icons closed_caption"></span>';

            itemHtml += '<div class="listItemBody two-line">';

            itemHtml += '<div>';
            itemHtml += s.DisplayTitle || '';
            itemHtml += '</div>';

            if (s.Path) {
                itemHtml += '<div class="secondary listItemBodyText">' + (s.Path) + '</div>';
            }

            itemHtml += '</a>';
            itemHtml += '</div>';

            if (!layoutManager.tv) {
                if (s.Path) {
                    itemHtml += '<button is="paper-icon-button-light" data-index="' + s.Index + '" title="' + globalize.translate('Delete') + '" class="btnDelete listItemButton"><span class="material-icons delete"></span></button>';
                }
            }

            itemHtml += '</' + tagName + '>';

            return itemHtml;
        }).join('');

        html += '</div>';
    }

    const elem = context.querySelector('.subtitleList');

    if (subs.length) {
        elem.classList.remove('hide');
    } else {
        elem.classList.add('hide');
    }
    elem.innerHTML = html;
}

function fillLanguages(context, apiClient, languages) {
    const selectLanguage = context.querySelector('#selectLanguage');

    selectLanguage.innerHTML = languages.map(function (l) {
        return '<option value="' + l.ThreeLetterISOLanguageName + '">' + l.DisplayName + '</option>';
    });

    const lastLanguage = userSettings.get('subtitleeditor-language');
    if (lastLanguage) {
        selectLanguage.value = lastLanguage;
    } else {
        apiClient.getCurrentUser().then(function (user) {
            const lang = user.Configuration.SubtitleLanguagePreference;

            if (lang) {
                selectLanguage.value = lang;
            }
        });
    }
}

function renderSearchResults(context, results) {
    let lastProvider = '';
    let html = '';

    if (!results.length) {
        context.querySelector('.noSearchResults').classList.remove('hide');
        context.querySelector('.subtitleResults').innerHTML = '';
        loading.hide();
        return;
    }

    context.querySelector('.noSearchResults').classList.add('hide');

    for (let i = 0, length = results.length; i < length; i++) {
        const result = results[i];

        const provider = result.ProviderName;

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

        html += '<' + tagName + ' class="' + className + '" data-subid="' + result.Id + '">';

        html += '<span class="listItemIcon material-icons closed_caption"></span>';

        const bodyClass = result.Comment || result.IsHashMatch ? 'three-line' : 'two-line';

        html += '<div class="listItemBody ' + bodyClass + '">';

        html += '<div>' + (result.Name) + '</div>';
        html += '<div class="secondary listItemBodyText">';

        if (result.Format) {
            html += '<span style="margin-right:1em;">' + globalize.translate('FormatValue', result.Format) + '</span>';
        }

        if (result.DownloadCount != null) {
            html += '<span>' + globalize.translate('DownloadsValue', result.DownloadCount) + '</span>';
        }
        html += '</div>';

        if (result.Comment) {
            html += '<div class="secondary listItemBodyText">' + (result.Comment) + '</div>';
        }

        if (result.IsHashMatch) {
            html += '<div class="secondary listItemBodyText"><div class="inline-flex align-items-center justify-content-center" style="background:#3388cc;color:#fff;padding: .3em 1em;border-radius:1000em;">' + globalize.translate('PerfectMatch') + '</div></div>';
        }

        html += '</div>';

        if (!layoutManager.tv) {
            html += '<button type="button" is="paper-icon-button-light" data-subid="' + result.Id + '" class="btnDownload listItemButton"><span class="material-icons file_download"></span></button>';
        }

        html += '</' + tagName + '>';
    }

    if (results.length) {
        html += '</div>';
    }

    const elem = context.querySelector('.subtitleResults');
    elem.innerHTML = html;

    loading.hide();
}

function searchForSubtitles(context, language) {
    userSettings.set('subtitleeditor-language', language);

    loading.show();

    const apiClient = window.connectionManager.getApiClient(currentItem.ServerId);
    const url = apiClient.getUrl('Items/' + currentItem.Id + '/RemoteSearch/Subtitles/' + language);

    apiClient.getJSON(url).then(function (results) {
        renderSearchResults(context, results);
    });
}

function reload(context, apiClient, itemId) {
    context.querySelector('.noSearchResults').classList.add('hide');

    function onGetItem(item) {
        currentItem = item;

        fillSubtitleList(context, item);
        let file = item.Path || '';
        const index = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
        if (index > -1) {
            file = file.substring(index + 1);
        }

        if (file) {
            context.querySelector('.pathValue').innerHTML = file;
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

    const lang = form.querySelector('#selectLanguage', form).value;

    searchForSubtitles(dom.parentWithClass(form, 'formDialogContent'), lang);

    e.preventDefault();
    return false;
}

function onSubtitleListClick(e) {
    const btnDelete = dom.parentWithClass(e.target, 'btnDelete');
    if (btnDelete) {
        const index = btnDelete.getAttribute('data-index');
        const context = dom.parentWithClass(btnDelete, 'subtitleEditorDialog');
        deleteLocalSubtitle(context, index);
    }
}

function onSubtitleResultsClick(e) {
    let subtitleId;
    let context;

    const btnOptions = dom.parentWithClass(e.target, 'btnOptions');
    if (btnOptions) {
        subtitleId = btnOptions.getAttribute('data-subid');
        context = dom.parentWithClass(btnOptions, 'subtitleEditorDialog');
        showDownloadOptions(btnOptions, context, subtitleId);
    }

    const btnDownload = dom.parentWithClass(e.target, 'btnDownload');
    if (btnDownload) {
        subtitleId = btnDownload.getAttribute('data-subid');
        context = dom.parentWithClass(btnDownload, 'subtitleEditorDialog');
        downloadRemoteSubtitles(context, subtitleId);
    }
}

function showDownloadOptions(button, context, subtitleId) {
    const items = [];

    items.push({
        name: globalize.translate('Download'),
        id: 'download'
    });

    import('actionsheet').then(({default: actionsheet}) => {
        actionsheet.show({
            items: items,
            positionTo: button

        }).then(function (id) {
            switch (id) {
                case 'download':
                    downloadRemoteSubtitles(context, subtitleId);
                    break;
                default:
                    break;
            }
        });
    });
}

function centerFocus(elem, horiz, on) {
    import('scrollHelper').then(({default: scrollHelper}) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function showEditorInternal(itemId, serverId, template) {
    hasChanges = false;

    const apiClient = window.connectionManager.getApiClient(serverId);
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
        dlg.classList.add('subtitleEditorDialog');

        dlg.innerHTML = globalize.translateHtml(template, 'core');

        dlg.querySelector('.originalSubtitleFileLabel').innerHTML = globalize.translate('File');

        dlg.querySelector('.subtitleSearchForm').addEventListener('submit', onSearchSubmit);

        const btnSubmit = dlg.querySelector('.btnSubmit');

        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, true);
            dlg.querySelector('.btnSearchSubtitles').classList.add('hide');
        } else {
            btnSubmit.classList.add('hide');
        }

        const editorContent = dlg.querySelector('.formDialogContent');

        dlg.querySelector('.subtitleList').addEventListener('click', onSubtitleListClick);
        dlg.querySelector('.subtitleResults').addEventListener('click', onSubtitleResultsClick);

        apiClient.getCultures().then(function (languages) {
            fillLanguages(editorContent, apiClient, languages);
        });

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

    return new Promise(function (resolve, reject) {
        import('text!./subtitleeditor.template.html').then(({default: template}) => {
            showEditorInternal(itemId, serverId, template).then(resolve, reject);
        });
    });
}

export default {
    show: showEditor
};
