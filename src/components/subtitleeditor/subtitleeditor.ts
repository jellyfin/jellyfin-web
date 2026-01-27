/**
 * @deprecated This module is deprecated in favor of React components.
 *
 * Migration:
     - Subtitle editor → React with TanStack Forms + Zod
     - Template-based → React rendering
     - List view → ui-primitives/List or DataTable
 *
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import { escapeHtml } from 'utils/html';

import { AppFeature } from 'constants/appFeature';
import { safeAppHost } from '../apphost';
import dialogHelper from '../dialogHelper/dialogHelper';
import layoutManager from '../layoutManager';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import * as userSettings from '../../scripts/settings/userSettings';
import loading from '../loading/loading';
import focusManager from '../focusManager';
import dom from '../../utils/dom';
import { MediaStream } from '../../plugins/htmlVideoPlayer/types';

import '../../elements/emby-select/emby-select';
import '../listview/listview.scss';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import './subtitleeditor.scss';
import '../../elements/emby-button/emby-button';
import toast from '../toast/toast';
import confirm from '../confirm/confirm';
import template from './subtitleeditor.template.html?raw';
import subtitleUploader from '../subtitleuploader/SubtitleUploader';

// ============================================================================
// Type Definitions
// ============================================================================

export interface SubtitleStream extends MediaStream {
    Type: 'Subtitle';
    Index: number;
    DisplayTitle?: string;
    Path?: string;
}

export interface MediaItem {
    Id: string;
    ServerId: string;
    Path?: string;
    MediaStreams?: MediaStream[];
}

export interface RemoteSubtitleSearchResult {
    ProviderName: string;
    Name: string;
    Format?: string;
    DownloadCount?: number;
    FrameRate?: number;
    Comment?: string;
    Id: string;
    IsHashMatch?: boolean;
    AiTranslated?: boolean;
    MachineTranslated?: boolean;
    Forced?: boolean;
    HearingImpaired?: boolean;
}

export interface SubtitleDownloadOption {
    name: string;
    id: string;
}

// ============================================================================
// State
// ============================================================================

let currentItem: MediaItem | null = null;
let hasChanges = false;

// ============================================================================
// Helper Functions
// ============================================================================

function downloadRemoteSubtitles(context: HTMLElement, id: string): void {
    if (!currentItem?.Id) return;

    const url = 'Items/' + currentItem.Id + '/RemoteSearch/Subtitles/' + id;
    const apiClient = ServerConnections.getApiClient(currentItem.ServerId);

    apiClient
        .ajax({
            type: 'POST',
            url: apiClient.getUrl(url)
        })
        .then(() => {
            hasChanges = true;
            toast(globalize.translate('MessageDownloadQueued'));
            focusManager.autoFocus(context);
        });
}

function deleteLocalSubtitle(context: HTMLElement, index: string): void {
    const msg = globalize.translate('MessageAreYouSureDeleteSubtitles');

    confirm({
        title: globalize.translate('ConfirmDeletion'),
        text: msg,
        confirmText: globalize.translate('Delete'),
        primary: 'delete'
    }).then(() => {
        if (!currentItem?.Id) return;

        loading.show();

        const itemId = currentItem.Id;
        const url = 'Videos/' + itemId + '/Subtitles/' + index;
        const apiClient = ServerConnections.getApiClient(currentItem.ServerId);

        apiClient
            .ajax({
                type: 'DELETE',
                url: apiClient.getUrl(url)
            })
            .then(() => {
                hasChanges = true;
                reload(context, apiClient, itemId);
            });
    });
}

function fillSubtitleList(context: HTMLElement, item: MediaItem): void {
    const streams = item.MediaStreams || [];
    const subs: SubtitleStream[] = streams.filter((s): s is SubtitleStream => {
        return s.Type === 'Subtitle';
    });

    let html = '';

    if (subs.length) {
        html += '<h2>' + globalize.translate('MySubtitles') + '</h2>';
        html += '<div>';

        html += subs
            .map(s => {
                let itemHtml = '';

                const tagName = layoutManager.tv ? 'button' : 'div';
                let className =
                    layoutManager.tv && s.Path ? 'listItem listItem-border btnDelete' : 'listItem listItem-border';

                if (layoutManager.tv) {
                    className += ' listItem-focusscale listItem-button';
                }

                className += ' listItem-noborder';

                itemHtml += '<' + tagName + ' class="' + className + '" data-index="' + s.Index + '">';
                itemHtml += '<span class="listItemIcon material-icons closed_caption" aria-hidden="true"></span>';
                itemHtml += '<div class="listItemBody two-line">';
                itemHtml += '<div>';
                itemHtml += escapeHtml(s.DisplayTitle || '');
                itemHtml += '</div>';

                if (s.Path) {
                    itemHtml += '<div class="secondary listItemBodyText">' + escapeHtml(s.Path) + '</div>';
                }

                itemHtml += '</div>';

                if (!layoutManager.tv && s.Path) {
                    itemHtml +=
                        '<button is="paper-icon-button-light" data-index="' +
                        s.Index +
                        '" title="' +
                        globalize.translate('Delete') +
                        '" class="btnDelete listItemButton"><span class="material-icons delete" aria-hidden="true"></span></button>';
                }

                itemHtml += '</' + tagName + '>';

                return itemHtml;
            })
            .join('');

        html += '</div>';
    }

    const elem = context.querySelector('.subtitleList') as HTMLElement;

    if (subs.length) {
        elem.classList.remove('hide');
    } else {
        elem.classList.add('hide');
    }
    elem.innerHTML = html;
}

function fillLanguages(
    context: HTMLElement,
    languages: { ThreeLetterISOLanguageName?: string | null; DisplayName?: string | null }[]
): void {
    const selectLanguage = context.querySelector('#selectLanguage') as HTMLSelectElement;

    selectLanguage.innerHTML = languages
        .map(l => {
            return (
                '<option value="' +
                (l.ThreeLetterISOLanguageName || '') +
                '">' +
                escapeHtml(l.DisplayName || '') +
                '</option>'
            );
        })
        .join('');

    const lastLanguage = userSettings.get('subtitleeditor-language');
    if (lastLanguage) {
        selectLanguage.value = lastLanguage;
    } else {
        const apiClient = currentItem ? ServerConnections.getApiClient(currentItem.ServerId) : null;
        if (apiClient) {
            apiClient.getCurrentUser().then(user => {
                const lang = (user as { Configuration?: { SubtitleLanguagePreference?: string } })?.Configuration
                    ?.SubtitleLanguagePreference;

                if (lang) {
                    selectLanguage.value = lang;
                }
            });
        }
    }
}

function renderSearchResults(context: HTMLElement, results: RemoteSubtitleSearchResult[]): void {
    let lastProvider = '';
    let html = '';

    if (!results.length) {
        context.querySelector('.noSearchResults')?.classList.remove('hide');
        const resultsElem = context.querySelector('.subtitleResults');
        if (resultsElem) resultsElem.innerHTML = '';
        loading.hide();
        return;
    }

    context.querySelector('.noSearchResults')?.classList.add('hide');

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
        html += '<span class="listItemIcon material-icons closed_caption" aria-hidden="true"></span>';

        const hasAnyFlags =
            result.IsHashMatch ||
            result.AiTranslated ||
            result.MachineTranslated ||
            result.Forced ||
            result.HearingImpaired;
        const bodyClass = result.Comment || hasAnyFlags ? 'three-line' : 'two-line';

        html += '<div class="listItemBody ' + bodyClass + '">';
        html += '<div>' + escapeHtml(result.Name) + '</div>';
        html += '<div class="secondary listItemBodyText">';

        if (result.Format) {
            html += '<span style="margin-right:1em;">' + globalize.translate('FormatValue', result.Format) + '</span>';
        }

        if (result.DownloadCount != null) {
            html +=
                '<span style="margin-right:1em;">' +
                globalize.translate('DownloadsValue', result.DownloadCount) +
                '</span>';
        }

        if (result.FrameRate) {
            html += '<span>' + globalize.translate('Framerate') + ': ' + result.FrameRate + '</span>';
        }

        html += '</div>';

        if (result.Comment) {
            html +=
                '<div class="secondary listItemBodyText" style="white-space:pre-line;">' +
                escapeHtml(result.Comment) +
                '</div>';
        }

        if (hasAnyFlags) {
            html += '<div class="secondary listItemBodyText">';
            const spanOpen =
                '<span class="inline-flex align-items-center justify-content-center subtitleFeaturePillow">';

            if (result.IsHashMatch) {
                html += spanOpen + globalize.translate('PerfectMatch') + '</span>';
            }
            if (result.AiTranslated) {
                html += spanOpen + globalize.translate('AiTranslated') + '</span>';
            }
            if (result.MachineTranslated) {
                html += spanOpen + globalize.translate('MachineTranslated') + '</span>';
            }
            if (result.Forced) {
                html += spanOpen + globalize.translate('ForeignPartsOnly') + '</span>';
            }
            if (result.HearingImpaired) {
                html += spanOpen + globalize.translate('HearingImpairedShort') + '</span>';
            }

            html += '</div>';
        }

        html += '</div>';

        if (!layoutManager.tv) {
            html +=
                '<button type="button" is="paper-icon-button-light" data-subid="' +
                result.Id +
                '" class="btnDownload listItemButton"><span class="material-icons file_download" aria-hidden="true"></span></button>';
        }

        html += '</' + tagName + '>';
    }

    if (results.length) {
        html += '</div>';
    }

    const elem = context.querySelector('.subtitleResults');
    if (elem) elem.innerHTML = html;

    loading.hide();
}

function searchForSubtitles(context: HTMLElement, language: string): void {
    userSettings.set('subtitleeditor-language', language);
    loading.show();

    if (!currentItem?.Id) return;

    const apiClient = ServerConnections.getApiClient(currentItem.ServerId);
    if (!apiClient) return;
    const url = apiClient.getUrl('Items/' + currentItem.Id + '/RemoteSearch/Subtitles/' + language);

    (apiClient as any).getJSON(url).then((results: RemoteSubtitleSearchResult[]) => {
        renderSearchResults(context, results);
    });
}

function reload(
    context: HTMLElement,
    apiClient: any,
    itemId: string | MediaItem
): void {
    const noSearchResults = context.querySelector('.noSearchResults');
    if (noSearchResults) noSearchResults.classList.add('hide');

    function onGetItem(item: MediaItem): void {
        currentItem = item;
        fillSubtitleList(context, item);

        let file = item.Path || '';
        const index = Math.max(file.lastIndexOf('/'), file.lastIndexOf('\\'));
        if (index > -1) {
            file = file.substring(index + 1);
        }

        if (file) {
            const pathValue = context.querySelector('.pathValue');
            if (pathValue) (pathValue as HTMLElement).innerText = file;
            const originalFile = context.querySelector('.originalFile');
            if (originalFile) originalFile.classList.remove('hide');
        } else {
            const pathValue = context.querySelector('.pathValue');
            if (pathValue) pathValue.innerHTML = '';
            const originalFile = context.querySelector('.originalFile');
            if (originalFile) originalFile.classList.add('hide');
        }

        loading.hide();
    }

    if (typeof itemId === 'string') {
        const userId = apiClient.getCurrentUserId();
        if (userId) {
            apiClient.getItem(userId, itemId).then(onGetItem);
        }
    } else {
        onGetItem(itemId);
    }
}

function onSearchSubmit(e: Event): boolean | undefined {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const lang = (form.querySelector('#selectLanguage') as HTMLSelectElement).value;
    const parentContent = dom.parentWithClass(form, 'formDialogContent');
    if (parentContent) {
        searchForSubtitles(parentContent, lang);
    }
    return false;
}

function onSubtitleListClick(e: Event): void {
    const target = e.target as HTMLElement;
    const btnDelete = dom.parentWithClass(target, 'btnDelete');
    if (btnDelete) {
        const index = btnDelete.getAttribute('data-index');
        const context = dom.parentWithClass(btnDelete, 'subtitleEditorDialog');
        if (index && context) {
            deleteLocalSubtitle(context, index);
        }
    }
}

function onSubtitleResultsClick(e: Event): void {
    const target = e.target as HTMLElement;
    let subtitleId: string | null = null;
    let context: HTMLElement | null = null;

    const btnOptions = dom.parentWithClass(target, 'btnOptions');
    if (btnOptions) {
        subtitleId = btnOptions.getAttribute('data-subid');
        context = dom.parentWithClass(btnOptions, 'subtitleEditorDialog');
        if (subtitleId && context) {
            showDownloadOptions(btnOptions, context, subtitleId);
        }
    }

    const btnDownload = dom.parentWithClass(target, 'btnDownload');
    if (btnDownload) {
        subtitleId = btnDownload.getAttribute('data-subid');
        context = dom.parentWithClass(btnDownload, 'subtitleEditorDialog');
        if (subtitleId && context) {
            downloadRemoteSubtitles(context, subtitleId);
        }
    }
}

function showDownloadOptions(button: HTMLElement, context: HTMLElement, subtitleId: string): void {
    const items: SubtitleDownloadOption[] = [
        {
            name: globalize.translate('Download'),
            id: 'download'
        }
    ];

    import('../actionSheet/actionSheet').then((actionsheet: any) => {
        actionsheet
            .show({
                items,
                positionTo: button
            })
            .then((id: string) => {
                if (id === 'download') {
                    downloadRemoteSubtitles(context, subtitleId);
                }
            });
    });
}

function centerFocus(elem: HTMLElement, horiz: boolean, on: boolean): void {
    import('../../scripts/scrollHelper').then(({ default: scrollHelper }: any) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function onOpenUploadMenu(e: Event): void {
    const target = e.target as HTMLElement;
    const dialog = dom.parentWithClass(target, 'subtitleEditorDialog');
    if (!dialog || !currentItem) return;

    const selectLanguage = dialog.querySelector('#selectLanguage') as HTMLSelectElement;
    const apiClient = ServerConnections.getApiClient(currentItem.ServerId);
    if (!apiClient) return;

    (subtitleUploader as any)
        .show({
            languages: {
                list: selectLanguage.innerHTML,
                value: selectLanguage.value
            },
            itemId: currentItem!.Id,
            serverId: currentItem!.ServerId
        })
        .then((hasChanged: boolean) => {
            if (hasChanged) {
                hasChanges = true;
                reload(dialog, apiClient, currentItem!.Id);
            }
        });
}

// ============================================================================
// Main Editor Functions
// ============================================================================

interface DialogOptions {
    removeOnClose: boolean;
    scrollY: boolean;
    size?: string;
}

function showEditorInternal(itemId: string, serverId: string): Promise<void> {
    hasChanges = false;

    const apiClient = ServerConnections.getApiClient(serverId);
    if (!apiClient) {
        loading.hide();
        return Promise.reject('No ApiClient');
    }
    return apiClient.getItem(apiClient.getCurrentUserId(), itemId).then(item => {
        const dialogOptions: DialogOptions = {
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

        const originalSubtitleFileLabel = dlg.querySelector('.originalSubtitleFileLabel');
        if (originalSubtitleFileLabel) originalSubtitleFileLabel.innerHTML = globalize.translate('File');

        const searchForm = dlg.querySelector('.subtitleSearchForm');
        if (searchForm) searchForm.addEventListener('submit', onSearchSubmit);

        const btnOpenUploadMenu = dlg.querySelector('.btnOpenUploadMenu');
        if (btnOpenUploadMenu) btnOpenUploadMenu.addEventListener('click', onOpenUploadMenu);

        const btnSubmit = dlg.querySelector('.btnSubmit');

        if (layoutManager.tv) {
            const content = dlg.querySelector('.formDialogContent') as HTMLElement;
            if (content) centerFocus(content, false, true);
            const btnSearch = dlg.querySelector('.btnSearchSubtitles');
            if (btnSearch) btnSearch.classList.add('hide');
        } else {
            if (btnSubmit) btnSubmit.classList.add('hide');
        }

        if (layoutManager.tv || !safeAppHost.supports(AppFeature.ExternalLinks)) {
            const btnHelp = dlg.querySelector('.btnHelp');
            if (btnHelp) btnHelp.remove();
        }

        const editorContent = dlg.querySelector('.formDialogContent') as HTMLElement;

        const subtitleList = dlg.querySelector('.subtitleList');
        if (subtitleList) subtitleList.addEventListener('click', onSubtitleListClick);

        const subtitleResults = dlg.querySelector('.subtitleResults');
        if (subtitleResults) subtitleResults.addEventListener('click', onSubtitleResultsClick);

        apiClient.getCultures().then(languages => {
            fillLanguages(editorContent, languages);
        });

        const btnCancel = dlg.querySelector('.btnCancel');
        if (btnCancel) {
            btnCancel.addEventListener('click', () => {
                dialogHelper.close(dlg);
            });
        }

        return new Promise<void>((resolve, reject) => {
            dlg.addEventListener('close', () => {
                if (layoutManager.tv) {
                    const content = dlg.querySelector('.formDialogContent') as HTMLElement;
                    if (content) centerFocus(content, false, false);
                }

                if (hasChanges) {
                    resolve();
                } else {
                    reject();
                }
            });

            dialogHelper.open(dlg);

            reload(editorContent, apiClient, item as any);
        });
    });
}

function showEditor(itemId: string, serverId: string): Promise<void> {
    loading.show();
    return showEditorInternal(itemId, serverId);
}

// ============================================================================
// Exports
// ============================================================================

export default {
    show: showEditor
};
