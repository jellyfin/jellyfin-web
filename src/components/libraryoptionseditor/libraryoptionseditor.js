
/**
 * Module for library options editor.
 * @module components/libraryoptionseditor/libraryoptionseditor
 */

import escapeHtml from 'escape-html';
import globalize from '../../scripts/globalize';
import dom from '../../scripts/dom';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-input/emby-input';
import './style.scss';
import template from './libraryoptionseditor.template.html';

function populateLanguages(parent) {
    return ApiClient.getCultures().then(languages => {
        populateLanguagesIntoSelect(parent.querySelector('#selectLanguage'), languages);
        populateLanguagesIntoList(parent.querySelector('.subtitleDownloadLanguages'), languages);
    });
}

function populateLanguagesIntoSelect(select, languages) {
    let html = '';
    html += "<option value=''></option>";
    for (const culture of languages) {
        html += `<option value='${culture.TwoLetterISOLanguageName}'>${culture.DisplayName}</option>`;
    }
    select.innerHTML = html;
}

function populateLanguagesIntoList(element, languages) {
    let html = '';
    for (const culture of languages) {
        html += `<label><input type="checkbox" is="emby-checkbox" class="chkSubtitleLanguage" data-lang="${culture.ThreeLetterISOLanguageName.toLowerCase()}" /><span>${culture.DisplayName}</span></label>`;
    }
    element.innerHTML = html;
}

function populateCountries(select) {
    return ApiClient.getCountries().then(allCountries => {
        let html = '';
        html += "<option value=''></option>";
        for (const culture of allCountries) {
            html += `<option value='${culture.TwoLetterISORegionName}'>${culture.DisplayName}</option>`;
        }
        select.innerHTML = html;
    });
}

function populateRefreshInterval(select) {
    let html = '';
    html += `<option value='0'>${globalize.translate('Never')}</option>`;
    html += [30, 60, 90].map(val => {
        return `<option value='${val}'>${globalize.translate('EveryNDays', val)}</option>`;
    }).join('');
    select.innerHTML = html;
}

function renderMetadataReaders(page, plugins) {
    let html = '';
    const elem = page.querySelector('.metadataReaders');

    if (plugins.length < 1) {
        elem.innerHTML = '';
        elem.classList.add('hide');
        return false;
    }

    html += `<h3 class="checkboxListLabel">${globalize.translate('LabelMetadataReaders')}</h3>`;
    html += '<div class="checkboxList paperList checkboxList-paperList">';
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        html += `<div class="listItem localReaderOption sortableOption" data-pluginname="${escapeHtml(plugin.Name)}">`;
        html += '<span class="listItemIcon material-icons live_tv" aria-hidden="true"></span>';
        html += '<div class="listItemBody">';
        html += '<h3 class="listItemBodyText">';
        html += escapeHtml(plugin.Name);
        html += '</h3>';
        html += '</div>';
        if (i > 0) {
            html += `<button type="button" is="paper-icon-button-light" title="${globalize.translate('Up')}" class="btnSortableMoveUp btnSortable" data-pluginindex="${i}"><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>`;
        } else if (plugins.length > 1) {
            html += `<button type="button" is="paper-icon-button-light" title="${globalize.translate('Down')}" class="btnSortableMoveDown btnSortable" data-pluginindex="${i}"><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>`;
        }
        html += '</div>';
    }
    html += '</div>';
    html += `<div class="fieldDescription">${globalize.translate('LabelMetadataReadersHelp')}</div>`;
    if (plugins.length < 2) {
        elem.classList.add('hide');
    } else {
        elem.classList.remove('hide');
    }
    elem.innerHTML = html;
    return true;
}

function renderMetadataSavers(page, metadataSavers) {
    let html = '';
    const elem = page.querySelector('.metadataSavers');
    if (!metadataSavers.length) {
        elem.innerHTML = '';
        elem.classList.add('hide');
        return false;
    }
    html += `<h3 class="checkboxListLabel">${globalize.translate('LabelMetadataSavers')}</h3>`;
    html += '<div class="checkboxList paperList checkboxList-paperList">';
    for (const plugin of metadataSavers) {
        html += `<label><input type="checkbox" data-defaultenabled="${plugin.DefaultEnabled}" is="emby-checkbox" class="chkMetadataSaver" data-pluginname="${escapeHtml(plugin.Name)}" ${false}><span>${escapeHtml(plugin.Name)}</span></label>`;
    }
    html += '</div>';
    html += `<div class="fieldDescription" style="margin-top:.25em;">${globalize.translate('LabelMetadataSaversHelp')}</div>`;
    elem.innerHTML = html;
    elem.classList.remove('hide');
    return true;
}

function getMetadataFetchersForTypeHtml(availableTypeOptions, libraryOptionsForType) {
    let html = '';
    let plugins = availableTypeOptions.MetadataFetchers;

    plugins = getOrderedPlugins(plugins, libraryOptionsForType.MetadataFetcherOrder || []);
    if (!plugins.length) return html;

    html += '<div class="metadataFetcher" data-type="' + availableTypeOptions.Type + '">';
    html += '<h3 class="checkboxListLabel">' + globalize.translate('LabelTypeMetadataDownloaders', globalize.translate('TypeOptionPlural' + availableTypeOptions.Type)) + '</h3>';
    html += '<div class="checkboxList paperList checkboxList-paperList">';

    plugins.forEach((plugin, index) => {
        html += '<div class="listItem metadataFetcherItem sortableOption" data-pluginname="' + escapeHtml(plugin.Name) + '">';
        const isChecked = libraryOptionsForType.MetadataFetchers ? libraryOptionsForType.MetadataFetchers.includes(plugin.Name) : plugin.DefaultEnabled;
        const checkedHtml = isChecked ? ' checked="checked"' : '';
        html += '<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkMetadataFetcher" data-pluginname="' + escapeHtml(plugin.Name) + '" ' + checkedHtml + '><span></span></label>';
        html += '<div class="listItemBody">';
        html += '<h3 class="listItemBodyText">';
        html += escapeHtml(plugin.Name);
        html += '</h3>';
        html += '</div>';
        if (index > 0) {
            html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate('Up') + '" class="btnSortableMoveUp btnSortable" data-pluginindex="' + index + '"><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>';
        } else if (plugins.length > 1) {
            html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate('Down') + '" class="btnSortableMoveDown btnSortable" data-pluginindex="' + index + '"><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>';
        }
        html += '</div>';
    });

    html += '</div>';
    html += '<div class="fieldDescription">' + globalize.translate('LabelMetadataDownloadersHelp') + '</div>';
    html += '</div>';
    return html;
}

function getTypeOptions(allOptions, type) {
    const allTypeOptions = allOptions.TypeOptions || [];
    for (const typeOptions of allTypeOptions) {
        if (typeOptions.Type === type) return typeOptions;
    }
    return null;
}

function renderMetadataFetchers(page, availableOptions, libraryOptions) {
    let html = '';
    const elem = page.querySelector('.metadataFetchers');
    for (const availableTypeOptions of availableOptions.TypeOptions) {
        html += getMetadataFetchersForTypeHtml(availableTypeOptions, getTypeOptions(libraryOptions, availableTypeOptions.Type) || {});
    }
    elem.innerHTML = html;
    if (html) {
        elem.classList.remove('hide');
        page.querySelector('.fldAutoRefreshInterval').classList.remove('hide');
        page.querySelector('.fldMetadataLanguage').classList.remove('hide');
        page.querySelector('.fldMetadataCountry').classList.remove('hide');
    } else {
        elem.classList.add('hide');
        page.querySelector('.fldAutoRefreshInterval').classList.add('hide');
        page.querySelector('.fldMetadataLanguage').classList.add('hide');
        page.querySelector('.fldMetadataCountry').classList.add('hide');
    }
    return true;
}

function renderSubtitleFetchers(page, availableOptions, libraryOptions) {
    let html = '';
    const elem = page.querySelector('.subtitleFetchers');

    let plugins = availableOptions.SubtitleFetchers;
    plugins = getOrderedPlugins(plugins, libraryOptions.SubtitleFetcherOrder || []);
    if (!plugins.length) return html;

    html += `<h3 class="checkboxListLabel">${globalize.translate('LabelSubtitleDownloaders')}</h3>`;
    html += '<div class="checkboxList paperList checkboxList-paperList">';
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        html += `<div class="listItem subtitleFetcherItem sortableOption" data-pluginname="${escapeHtml(plugin.Name)}">`;
        const isChecked = libraryOptions.DisabledSubtitleFetchers ? !libraryOptions.DisabledSubtitleFetchers.includes(plugin.Name) : plugin.DefaultEnabled;
        const checkedHtml = isChecked ? ' checked="checked"' : '';
        html += `<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkSubtitleFetcher" data-pluginname="${escapeHtml(plugin.Name)}" ${checkedHtml}><span></span></label>`;
        html += '<div class="listItemBody">';
        html += '<h3 class="listItemBodyText">';
        html += escapeHtml(plugin.Name);
        html += '</h3>';
        html += '</div>';
        if (i > 0) {
            html += `<button type="button" is="paper-icon-button-light" title="${globalize.translate('Up')}" class="btnSortableMoveUp btnSortable" data-pluginindex="${i}"><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>`;
        } else if (plugins.length > 1) {
            html += `<button type="button" is="paper-icon-button-light" title="${globalize.translate('Down')}" class="btnSortableMoveDown btnSortable" data-pluginindex="${i}"><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>`;
        }
        html += '</div>';
    }
    html += '</div>';
    html += `<div class="fieldDescription">${globalize.translate('SubtitleDownloadersHelp')}</div>`;
    elem.innerHTML = html;
}

function getImageFetchersForTypeHtml(availableTypeOptions, libraryOptionsForType) {
    let html = '';
    let plugins = availableTypeOptions.ImageFetchers;

    plugins = getOrderedPlugins(plugins, libraryOptionsForType.ImageFetcherOrder || []);
    if (!plugins.length) return html;

    html += '<div class="imageFetcher" data-type="' + availableTypeOptions.Type + '">';
    html += '<div class="flex align-items-center" style="margin:1.5em 0 .5em;">';
    html += '<h3 class="checkboxListLabel" style="margin:0;">' + globalize.translate('HeaderTypeImageFetchers', globalize.translate('TypeOptionPlural' + availableTypeOptions.Type)) + '</h3>';
    const supportedImageTypes = availableTypeOptions.SupportedImageTypes || [];
    if (supportedImageTypes.length > 1 || supportedImageTypes.length === 1 && supportedImageTypes[0] !== 'Primary') {
        html += '<button is="emby-button" class="raised btnImageOptionsForType" type="button" style="font-size:90%;"><span>' + globalize.translate('HeaderFetcherSettings') + '</span></button>';
    }
    html += '</div>';
    html += '<div class="checkboxList paperList checkboxList-paperList">';
    for (let i = 0; i < plugins.length; i++) {
        const plugin = plugins[i];
        html += '<div class="listItem imageFetcherItem sortableOption" data-pluginname="' + escapeHtml(plugin.Name) + '">';
        const isChecked = libraryOptionsForType.ImageFetchers ? libraryOptionsForType.ImageFetchers.includes(plugin.Name) : plugin.DefaultEnabled;
        const checkedHtml = isChecked ? ' checked="checked"' : '';
        html += '<label class="listItemCheckboxContainer"><input type="checkbox" is="emby-checkbox" class="chkImageFetcher" data-pluginname="' + escapeHtml(plugin.Name) + '" ' + checkedHtml + '><span></span></label>';
        html += '<div class="listItemBody">';
        html += '<h3 class="listItemBodyText">';
        html += escapeHtml(plugin.Name);
        html += '</h3>';
        html += '</div>';
        if (i > 0) {
            html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate('Up') + '" class="btnSortableMoveUp btnSortable" data-pluginindex="' + i + '"><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>';
        } else if (plugins.length > 1) {
            html += '<button type="button" is="paper-icon-button-light" title="' + globalize.translate('Down') + '" class="btnSortableMoveDown btnSortable" data-pluginindex="' + i + '"><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>';
        }
        html += '</div>';
    }
    html += '</div>';
    html += '<div class="fieldDescription">' + globalize.translate('LabelImageFetchersHelp') + '</div>';
    html += '</div>';
    return html;
}

function renderImageFetchers(page, availableOptions, libraryOptions) {
    let html = '';
    const elem = page.querySelector('.imageFetchers');
    for (const availableTypeOptions of availableOptions.TypeOptions) {
        html += getImageFetchersForTypeHtml(availableTypeOptions, getTypeOptions(libraryOptions, availableTypeOptions.Type) || {});
    }
    elem.innerHTML = html;
    if (html) {
        elem.classList.remove('hide');
        page.querySelector('.chkSaveLocalContainer').classList.remove('hide');
    } else {
        elem.classList.add('hide');
        page.querySelector('.chkSaveLocalContainer').classList.add('hide');
    }
    return true;
}

function populateMetadataSettings(parent, contentType) {
    const isNewLibrary = parent.classList.contains('newlibrary');
    return ApiClient.getJSON(ApiClient.getUrl('Libraries/AvailableOptions', {
        LibraryContentType: contentType,
        IsNewLibrary: isNewLibrary
    })).then(availableOptions => {
        currentAvailableOptions = availableOptions;
        parent.availableOptions = availableOptions;
        renderMetadataSavers(parent, availableOptions.MetadataSavers);
        renderMetadataReaders(parent, availableOptions.MetadataReaders);
        renderMetadataFetchers(parent, availableOptions, {});
        renderSubtitleFetchers(parent, availableOptions, {});
        renderImageFetchers(parent, availableOptions, {});
        availableOptions.SubtitleFetchers.length ? parent.querySelector('.subtitleDownloadSettings').classList.remove('hide') : parent.querySelector('.subtitleDownloadSettings').classList.add('hide');
    }).catch(() => {
        return Promise.resolve();
    });
}

function adjustSortableListElement(elem) {
    const btnSortable = elem.querySelector('.btnSortable');
    const inner = btnSortable.querySelector('.material-icons');
    if (elem.previousSibling) {
        btnSortable.title = globalize.translate('Up');
        btnSortable.classList.add('btnSortableMoveUp');
        btnSortable.classList.remove('btnSortableMoveDown');
        inner.classList.remove('keyboard_arrow_down');
        inner.classList.add('keyboard_arrow_up');
    } else {
        btnSortable.title = globalize.translate('Down');
        btnSortable.classList.remove('btnSortableMoveUp');
        btnSortable.classList.add('btnSortableMoveDown');
        inner.classList.remove('keyboard_arrow_up');
        inner.classList.add('keyboard_arrow_down');
    }
}

function showImageOptionsForType(type) {
    import('../imageOptionsEditor/imageOptionsEditor').then(({ default: ImageOptionsEditor }) => {
        let typeOptions = getTypeOptions(currentLibraryOptions, type);
        if (!typeOptions) {
            typeOptions = {
                Type: type
            };
            currentLibraryOptions.TypeOptions.push(typeOptions);
        }
        const availableOptions = getTypeOptions(currentAvailableOptions || {}, type);
        const imageOptionsEditor = new ImageOptionsEditor();
        imageOptionsEditor.show(type, typeOptions, availableOptions);
    });
}

function onImageFetchersContainerClick(e) {
    const btnImageOptionsForType = dom.parentWithClass(e.target, 'btnImageOptionsForType');
    if (btnImageOptionsForType) {
        showImageOptionsForType(dom.parentWithClass(btnImageOptionsForType, 'imageFetcher').getAttribute('data-type'));
        return;
    }
    onSortableContainerClick.call(this, e);
}

function onSortableContainerClick(e) {
    const btnSortable = dom.parentWithClass(e.target, 'btnSortable');
    if (btnSortable) {
        const li = dom.parentWithClass(btnSortable, 'sortableOption');
        const list = dom.parentWithClass(li, 'paperList');
        if (btnSortable.classList.contains('btnSortableMoveDown')) {
            const next = li.nextSibling;
            if (next) {
                li.parentNode.removeChild(li);
                next.parentNode.insertBefore(li, next.nextSibling);
            }
        } else {
            const prev = li.previousSibling;
            if (prev) {
                li.parentNode.removeChild(li);
                prev.parentNode.insertBefore(li, prev);
            }
        }
        Array.prototype.forEach.call(list.querySelectorAll('.sortableOption'), adjustSortableListElement);
    }
}

function bindEvents(parent) {
    parent.querySelector('.metadataReaders').addEventListener('click', onSortableContainerClick);
    parent.querySelector('.subtitleFetchers').addEventListener('click', onSortableContainerClick);
    parent.querySelector('.metadataFetchers').addEventListener('click', onSortableContainerClick);
    parent.querySelector('.imageFetchers').addEventListener('click', onImageFetchersContainerClick);

    parent.querySelector('#chkEnableEmbeddedTitles').addEventListener('change', (e) => {
        parent.querySelector('.chkEnableEmbeddedExtrasTitlesContainer').classList.toggle('hide', !e.currentTarget.checked);
    });
}

export async function embed(parent, contentType, libraryOptions) {
    currentLibraryOptions = {
        TypeOptions: []
    };
    currentAvailableOptions = null;
    const isNewLibrary = libraryOptions === null;
    isNewLibrary && parent.classList.add('newlibrary');

    parent.innerHTML = globalize.translateHtml(template);
    populateRefreshInterval(parent.querySelector('#selectAutoRefreshInterval'));
    const promises = [populateLanguages(parent), populateCountries(parent.querySelector('#selectCountry'))];
    Promise.all(promises).then(function() {
        return setContentType(parent, contentType).then(function() {
            libraryOptions && setLibraryOptions(parent, libraryOptions);
            bindEvents(parent);
        });
    });
}

export function setContentType(parent, contentType) {
    if (contentType === 'homevideos' || contentType === 'photos') {
        parent.querySelector('.chkEnablePhotosContainer').classList.remove('hide');
    } else {
        parent.querySelector('.chkEnablePhotosContainer').classList.add('hide');
    }

    if (contentType !== 'tvshows' && contentType !== 'movies' && contentType !== 'homevideos' && contentType !== 'musicvideos' && contentType !== 'mixed') {
        parent.querySelector('.trickplaySettingsSection').classList.add('hide');
        parent.querySelector('.chapterSettingsSection').classList.add('hide');
    } else {
        parent.querySelector('.trickplaySettingsSection').classList.remove('hide');
        parent.querySelector('.chapterSettingsSection').classList.remove('hide');
    }

    if (contentType === 'tvshows') {
        parent.querySelector('.chkAutomaticallyGroupSeriesContainer').classList.remove('hide');
        parent.querySelector('.fldSeasonZeroDisplayName').classList.remove('hide');
        parent.querySelector('#txtSeasonZeroName').setAttribute('required', 'required');
    } else {
        parent.querySelector('.chkAutomaticallyGroupSeriesContainer').classList.add('hide');
        parent.querySelector('.fldSeasonZeroDisplayName').classList.add('hide');
        parent.querySelector('#txtSeasonZeroName').removeAttribute('required');
    }

    if (contentType === 'books' || contentType === 'boxsets' || contentType === 'playlists' || contentType === 'music') {
        parent.querySelector('.chkEnableEmbeddedTitlesContainer').classList.add('hide');
        parent.querySelector('.chkEnableEmbeddedExtrasTitlesContainer').classList.add('hide');
    } else {
        parent.querySelector('.chkEnableEmbeddedTitlesContainer').classList.remove('hide');
        if (parent.querySelector('#chkEnableEmbeddedTitles').checked) {
            parent.querySelector('.chkEnableEmbeddedExtrasTitlesContainer').classList.remove('hide');
        }
    }

    parent.querySelector('.chkEnableLUFSScanContainer').classList.toggle('hide', contentType !== 'music');

    if (contentType === 'tvshows') {
        parent.querySelector('.chkEnableEmbeddedEpisodeInfosContainer').classList.remove('hide');
    } else {
        parent.querySelector('.chkEnableEmbeddedEpisodeInfosContainer').classList.add('hide');
    }

    if (contentType === 'tvshows' || contentType === 'movies' || contentType === 'musicvideos' || contentType === 'mixed') {
        parent.querySelector('.fldAllowEmbeddedSubtitlesContainer').classList.remove('hide');
    } else {
        parent.querySelector('.fldAllowEmbeddedSubtitlesContainer').classList.add('hide');
    }

    parent.querySelector('.chkAutomaticallyAddToCollectionContainer').classList.toggle('hide', contentType !== 'movies' && contentType !== 'mixed');

    return populateMetadataSettings(parent, contentType);
}

function setSubtitleFetchersIntoOptions(parent, options) {
    options.DisabledSubtitleFetchers = Array.prototype.map.call(Array.prototype.filter.call(parent.querySelectorAll('.chkSubtitleFetcher'), elem => {
        return !elem.checked;
    }), elem => {
        return elem.getAttribute('data-pluginname');
    });

    options.SubtitleFetcherOrder = Array.prototype.map.call(parent.querySelectorAll('.subtitleFetcherItem'), elem => {
        return elem.getAttribute('data-pluginname');
    });
}

function setMetadataFetchersIntoOptions(parent, options) {
    const sections = parent.querySelectorAll('.metadataFetcher');
    for (const section of sections) {
        const type = section.getAttribute('data-type');
        let typeOptions = getTypeOptions(options, type);
        if (!typeOptions) {
            typeOptions = {
                Type: type
            };
            options.TypeOptions.push(typeOptions);
        }
        typeOptions.MetadataFetchers = Array.prototype.map.call(Array.prototype.filter.call(section.querySelectorAll('.chkMetadataFetcher'), elem => {
            return elem.checked;
        }), elem => {
            return elem.getAttribute('data-pluginname');
        });

        typeOptions.MetadataFetcherOrder = Array.prototype.map.call(section.querySelectorAll('.metadataFetcherItem'), elem => {
            return elem.getAttribute('data-pluginname');
        });
    }
}

function setImageFetchersIntoOptions(parent, options) {
    const sections = parent.querySelectorAll('.imageFetcher');
    for (const section of sections) {
        const type = section.getAttribute('data-type');
        let typeOptions = getTypeOptions(options, type);
        if (!typeOptions) {
            typeOptions = {
                Type: type
            };
            options.TypeOptions.push(typeOptions);
        }

        typeOptions.ImageFetchers = Array.prototype.map.call(Array.prototype.filter.call(section.querySelectorAll('.chkImageFetcher'), elem => {
            return elem.checked;
        }), elem => {
            return elem.getAttribute('data-pluginname');
        });

        typeOptions.ImageFetcherOrder = Array.prototype.map.call(section.querySelectorAll('.imageFetcherItem'), elem => {
            return elem.getAttribute('data-pluginname');
        });
    }
}

function setImageOptionsIntoOptions(options) {
    const originalTypeOptions = currentLibraryOptions?.TypeOptions || [];
    for (const originalTypeOption of originalTypeOptions) {
        let typeOptions = getTypeOptions(options, originalTypeOption.Type);

        if (!typeOptions) {
            typeOptions = {
                Type: originalTypeOption.Type
            };
            options.TypeOptions.push(typeOptions);
        }
        originalTypeOption.ImageOptions && (typeOptions.ImageOptions = originalTypeOption.ImageOptions);
    }
}

export function getLibraryOptions(parent) {
    const options = {
        Enabled: parent.querySelector('.chkEnabled').checked,
        EnableArchiveMediaFiles: false,
        EnablePhotos: parent.querySelector('.chkEnablePhotos').checked,
        EnableRealtimeMonitor: parent.querySelector('.chkEnableRealtimeMonitor').checked,
        EnableLUFSScan: parent.querySelector('.chkEnableLUFSScan').checked,
        ExtractTrickplayImagesDuringLibraryScan: parent.querySelector('.chkExtractTrickplayDuringLibraryScan').checked,
        EnableTrickplayImageExtraction: parent.querySelector('.chkExtractTrickplayImages').checked,
        ExtractChapterImagesDuringLibraryScan: parent.querySelector('.chkExtractChaptersDuringLibraryScan').checked,
        EnableChapterImageExtraction: parent.querySelector('.chkExtractChapterImages').checked,
        EnableInternetProviders: true,
        SaveLocalMetadata: parent.querySelector('#chkSaveLocal').checked,
        EnableAutomaticSeriesGrouping: parent.querySelector('.chkAutomaticallyGroupSeries').checked,
        PreferredMetadataLanguage: parent.querySelector('#selectLanguage').value,
        MetadataCountryCode: parent.querySelector('#selectCountry').value,
        SeasonZeroDisplayName: parent.querySelector('#txtSeasonZeroName').value,
        AutomaticRefreshIntervalDays: parseInt(parent.querySelector('#selectAutoRefreshInterval').value, 10),
        EnableEmbeddedTitles: parent.querySelector('#chkEnableEmbeddedTitles').checked,
        EnableEmbeddedExtrasTitles: parent.querySelector('#chkEnableEmbeddedExtrasTitles').checked,
        EnableEmbeddedEpisodeInfos: parent.querySelector('#chkEnableEmbeddedEpisodeInfos').checked,
        AllowEmbeddedSubtitles: parent.querySelector('#selectAllowEmbeddedSubtitles').value,
        SkipSubtitlesIfEmbeddedSubtitlesPresent: parent.querySelector('#chkSkipIfGraphicalSubsPresent').checked,
        SkipSubtitlesIfAudioTrackMatches: parent.querySelector('#chkSkipIfAudioTrackPresent').checked,
        SaveSubtitlesWithMedia: parent.querySelector('#chkSaveSubtitlesLocally').checked,
        RequirePerfectSubtitleMatch: parent.querySelector('#chkRequirePerfectMatch').checked,
        AutomaticallyAddToCollection: parent.querySelector('#chkAutomaticallyAddToCollection').checked,
        MetadataSavers: Array.prototype.map.call(Array.prototype.filter.call(parent.querySelectorAll('.chkMetadataSaver'), elem => {
            return elem.checked;
        }), elem => {
            return elem.getAttribute('data-pluginname');
        }),
        TypeOptions: []
    };

    options.LocalMetadataReaderOrder = Array.prototype.map.call(parent.querySelectorAll('.localReaderOption'), elem => {
        return elem.getAttribute('data-pluginname');
    });
    options.SubtitleDownloadLanguages = Array.prototype.map.call(Array.prototype.filter.call(parent.querySelectorAll('.chkSubtitleLanguage'), elem => {
        return elem.checked;
    }), elem => {
        return elem.getAttribute('data-lang');
    });
    setSubtitleFetchersIntoOptions(parent, options);
    setMetadataFetchersIntoOptions(parent, options);
    setImageFetchersIntoOptions(parent, options);
    setImageOptionsIntoOptions(options);

    return options;
}

function getOrderedPlugins(plugins, configuredOrder) {
    plugins = plugins.slice(0);
    plugins.sort((a, b) => {
        a = configuredOrder.indexOf(a.Name);
        b = configuredOrder.indexOf(b.Name);
        return a - b;
    });
    return plugins;
}

export function setLibraryOptions(parent, options) {
    currentLibraryOptions = options;
    currentAvailableOptions = parent.availableOptions;
    parent.querySelector('#selectLanguage').value = options.PreferredMetadataLanguage || '';
    parent.querySelector('#selectCountry').value = options.MetadataCountryCode || '';
    parent.querySelector('#selectAutoRefreshInterval').value = options.AutomaticRefreshIntervalDays || '0';
    parent.querySelector('#txtSeasonZeroName').value = options.SeasonZeroDisplayName || 'Specials';
    parent.querySelector('.chkEnabled').checked = options.Enabled;
    parent.querySelector('.chkEnablePhotos').checked = options.EnablePhotos;
    parent.querySelector('.chkEnableRealtimeMonitor').checked = options.EnableRealtimeMonitor;
    parent.querySelector('.chkEnableLUFSScan').checked = options.EnableLUFSScan;
    parent.querySelector('.chkExtractTrickplayDuringLibraryScan').checked = options.ExtractTrickplayImagesDuringLibraryScan;
    parent.querySelector('.chkExtractTrickplayImages').checked = options.EnableTrickplayImageExtraction;
    parent.querySelector('.chkExtractChaptersDuringLibraryScan').checked = options.ExtractChapterImagesDuringLibraryScan;
    parent.querySelector('.chkExtractChapterImages').checked = options.EnableChapterImageExtraction;
    parent.querySelector('#chkSaveLocal').checked = options.SaveLocalMetadata;
    parent.querySelector('.chkAutomaticallyGroupSeries').checked = options.EnableAutomaticSeriesGrouping;
    parent.querySelector('#chkEnableEmbeddedTitles').checked = options.EnableEmbeddedTitles;
    parent.querySelector('.chkEnableEmbeddedExtrasTitlesContainer').classList.toggle('hide', !options.EnableEmbeddedTitles);
    parent.querySelector('#chkEnableEmbeddedExtrasTitles').checked = options.EnableEmbeddedExtrasTitles;
    parent.querySelector('#chkEnableEmbeddedEpisodeInfos').value = options.EnableEmbeddedEpisodeInfos;
    parent.querySelector('#selectAllowEmbeddedSubtitles').value = options.AllowEmbeddedSubtitles;
    parent.querySelector('#chkSkipIfGraphicalSubsPresent').checked = options.SkipSubtitlesIfEmbeddedSubtitlesPresent;
    parent.querySelector('#chkSaveSubtitlesLocally').checked = options.SaveSubtitlesWithMedia;
    parent.querySelector('#chkSkipIfAudioTrackPresent').checked = options.SkipSubtitlesIfAudioTrackMatches;
    parent.querySelector('#chkRequirePerfectMatch').checked = options.RequirePerfectSubtitleMatch;
    parent.querySelector('#chkAutomaticallyAddToCollection').checked = options.AutomaticallyAddToCollection;
    Array.prototype.forEach.call(parent.querySelectorAll('.chkMetadataSaver'), elem => {
        elem.checked = options.MetadataSavers ? options.MetadataSavers.includes(elem.getAttribute('data-pluginname')) : elem.getAttribute('data-defaultenabled') === 'true';
    });
    Array.prototype.forEach.call(parent.querySelectorAll('.chkSubtitleLanguage'), elem => {
        elem.checked = !!options.SubtitleDownloadLanguages && options.SubtitleDownloadLanguages.includes(elem.getAttribute('data-lang'));
    });
    renderMetadataReaders(parent, getOrderedPlugins(parent.availableOptions.MetadataReaders, options.LocalMetadataReaderOrder || []));
    renderMetadataFetchers(parent, parent.availableOptions, options);
    renderImageFetchers(parent, parent.availableOptions, options);
    renderSubtitleFetchers(parent, parent.availableOptions, options);
}

let currentLibraryOptions;
let currentAvailableOptions;

export default {
    embed: embed,
    setContentType: setContentType,
    getLibraryOptions: getLibraryOptions,
    setLibraryOptions: setLibraryOptions
};
