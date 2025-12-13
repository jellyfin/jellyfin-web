
import escapeHtml from 'escape-html';

import { getUserViewsQuery } from '@/hooks/useUserViews';
import { ServerConnections } from '@/lib/jellyfin-apiclient';
import { toApi } from '@/utils/jellyfin-apiclient/compat';
import { queryClient } from '@/utils/query/queryClient';

import layoutManager from '@/components/layoutManager';
import focusManager from '@/components/focusManager';
import globalize from '@/lib/globalize';
import loading from '@/components/loading/loading';
import Events from '@/utils/events.ts';
import homeSections from '@/components/homesections/homesections';
import dom from '@/utils/dom';
import '@/components/listview/listview.scss';
import '@/elements/emby-select/emby-select';
import '@/elements/emby-checkbox/emby-checkbox';
import toast from '@/components/toast/toast';
import template from './homeScreenSettings.template.html';
import { LibraryTab } from '@/types/libraryTab.ts';

const numConfigurableSections = 10;

function renderViews(page, user, result) {
    let folderHtml = '';

    folderHtml += '<div class="checkboxList">';
    folderHtml += result.map(i => {
        let currentHtml = '';

        const id = `chkGroupFolder${i.Id}`;

        const isChecked = user.Configuration.GroupedFolders.includes(i.Id);

        const checkedHtml = isChecked ? ' checked="checked"' : '';

        currentHtml += '<label>';
        currentHtml += `<input type="checkbox" is="emby-checkbox" class="chkGroupFolder" data-folderid="${i.Id}" id="${id}"${checkedHtml}/>`;
        currentHtml += `<span>${escapeHtml(i.Name)}</span>`;
        currentHtml += '</label>';

        return currentHtml;
    }).join('');

    folderHtml += '</div>';

    page.querySelector('.folderGroupList').innerHTML = folderHtml;
}

function getLandingScreenOptions(type) {
    const list = [];

    if (type === 'movies') {
        list.push({
            name: globalize.translate('Movies'),
            value: LibraryTab.Movies,
            isDefault: true
        });
        list.push({
            name: globalize.translate('Suggestions'),
            value: LibraryTab.Suggestions
        });
        list.push({
            name: globalize.translate('Favorites'),
            value: LibraryTab.Favorites
        });
        list.push({
            name: globalize.translate('Collections'),
            value: LibraryTab.Collections
        });
        list.push({
            name: globalize.translate('Genres'),
            value: LibraryTab.Genres
        });
    } else if (type === 'tvshows') {
        list.push({
            name: globalize.translate('Shows'),
            value: LibraryTab.Series,
            isDefault: true
        });
        list.push({
            name: globalize.translate('Suggestions'),
            value: LibraryTab.Suggestions
        });
        list.push({
            name: globalize.translate('TabUpcoming'),
            value: LibraryTab.Upcoming
        });
        list.push({
            name: globalize.translate('Genres'),
            value: LibraryTab.Genres
        });
        list.push({
            name: globalize.translate('TabNetworks'),
            value: LibraryTab.Networks
        });
        list.push({
            name: globalize.translate('Episodes'),
            value: LibraryTab.Episodes
        });
    } else if (type === 'music') {
        list.push({
            name: globalize.translate('Albums'),
            value: LibraryTab.Albums,
            isDefault: true
        });
        list.push({
            name: globalize.translate('Suggestions'),
            value: LibraryTab.Suggestions
        });
        list.push({
            name: globalize.translate('HeaderAlbumArtists'),
            value: LibraryTab.AlbumArtists
        });
        list.push({
            name: globalize.translate('Artists'),
            value: LibraryTab.Artists
        });
        list.push({
            name: globalize.translate('Playlists'),
            value: LibraryTab.Playlists
        });
        list.push({
            name: globalize.translate('Songs'),
            value: LibraryTab.Songs
        });
        list.push({
            name: globalize.translate('Genres'),
            value: LibraryTab.Genres
        });
    } else if (type === 'livetv') {
        list.push({
            name: globalize.translate('Programs'),
            value: LibraryTab.Programs,
            isDefault: true
        });
        list.push({
            name: globalize.translate('Guide'),
            value: LibraryTab.Guide
        });
        list.push({
            name: globalize.translate('Channels'),
            value: LibraryTab.Channels
        });
        list.push({
            name: globalize.translate('Recordings'),
            value: LibraryTab.Recordings
        });
        list.push({
            name: globalize.translate('Schedule'),
            value: LibraryTab.Schedule
        });
        list.push({
            name: globalize.translate('Series'),
            value: LibraryTab.SeriesTimers
        });
    }

    return list;
}

function getLandingScreenOptionsHtml(type, userValue) {
    return getLandingScreenOptions(type).map(o => {
        const selected = userValue === o.value || (o.isDefault && !userValue);
        const selectedHtml = selected ? ' selected' : '';
        const optionValue = o.isDefault ? '' : o.value;

        return `<option value="${optionValue}"${selectedHtml}>${escapeHtml(o.name)}</option>`;
    }).join('');
}

function renderViewOrder(context, user, result) {
    let html = '';

    html += result.Items.map((view) => {
        let currentHtml = '';

        currentHtml += `<div class="listItem viewItem" data-viewid="${view.Id}">`;

        currentHtml += '<span class="material-icons listItemIcon folder_open" aria-hidden="true"></span>';

        currentHtml += '<div class="listItemBody">';

        currentHtml += '<div>';
        currentHtml += escapeHtml(view.Name);
        currentHtml += '</div>';

        currentHtml += '</div>';

        currentHtml += `<button type="button" is="paper-icon-button-light" class="btnViewItemUp btnViewItemMove autoSize" title="${globalize.translate('Up')}"><span class="material-icons keyboard_arrow_up" aria-hidden="true"></span></button>`;
        currentHtml += `<button type="button" is="paper-icon-button-light" class="btnViewItemDown btnViewItemMove autoSize" title="${globalize.translate('Down')}"><span class="material-icons keyboard_arrow_down" aria-hidden="true"></span></button>`;

        currentHtml += '</div>';

        return currentHtml;
    }).join('');

    context.querySelector('.viewOrderList').innerHTML = html;
}

function updateHomeSectionValues(context, userSettings) {
    for (let i = 1; i <= numConfigurableSections; i++) {
        const select = context.querySelector(`#selectHomeSection${i}`);
        const defaultValue = homeSections.getDefaultSection(i - 1);

        const option = select.querySelector(`option[value="${defaultValue}"]`) || select.querySelector('option[value=""]');

        const userValue = userSettings.get(`homesection${i - 1}`);

        if (option) option.value = '';

        if (userValue === defaultValue || !userValue) {
            select.value = '';
        } else {
            select.value = userValue;
        }
    }

    context.querySelector('.selectTVHomeScreen').value = userSettings.get('tvhome') || '';
}

function getPerLibrarySettingsHtml(item, user, userSettings) {
    let html = '';

    let isChecked;

    if (item.Type === 'Channel' || item.CollectionType === 'boxsets' || item.CollectionType === 'playlists') {
        isChecked = !(user.Configuration.MyMediaExcludes || []).includes(item.Id);
        html += '<div>';
        html += '<label>';
        html += `<input type="checkbox" is="emby-checkbox" class="chkIncludeInMyMedia" data-folderid="${item.Id}"${isChecked ? ' checked="checked"' : ''}/>`;
        html += `<span>${globalize.translate('DisplayInMyMedia')}</span>`;
        html += '</label>';
        html += '</div>';
    }

    const excludeFromLatest = ['playlists', 'livetv', 'boxsets', 'channels'];
    if (!excludeFromLatest.includes(item.CollectionType || '')) {
        isChecked = !user.Configuration.LatestItemsExcludes.includes(item.Id);
        html += '<label class="fldIncludeInLatest">';
        html += `<input type="checkbox" is="emby-checkbox" class="chkIncludeInLatest" data-folderid="${item.Id}"${isChecked ? ' checked="checked"' : ''}/>`;
        html += `<span>${globalize.translate('DisplayInOtherHomeScreenSections')}</span>`;
        html += '</label>';
    }

    if (html) {
        html = `<div class="checkboxListContainer">${html}</div>`;
    }

    if (item.CollectionType === 'movies' || item.CollectionType === 'tvshows' || item.CollectionType === 'music' || item.CollectionType === 'livetv') {
        const idForLanding = item.CollectionType === 'livetv' ? item.CollectionType : item.Id;
        html += '<div class="selectContainer">';
        html += `<select is="emby-select" class="selectLanding" data-folderid="${idForLanding}" label="${globalize.translate('LabelDefaultScreen')}">`;

        const userValue = userSettings.get(`landing-${idForLanding}`);

        html += getLandingScreenOptionsHtml(item.CollectionType, userValue);

        html += '</select>';
        html += '</div>';
    }

    if (html) {
        let prefix = '';
        prefix += '<div class="verticalSection">';

        prefix += '<h2 class="sectionTitle">';
        prefix += escapeHtml(item.Name);
        prefix += '</h2>';

        html = prefix + html;
        html += '</div>';
    }

    return html;
}

function renderPerLibrarySettings(context, user, userViews, userSettings) {
    const elem = context.querySelector('.perLibrarySettings');
    let html = '';

    for (let i = 0, length = userViews.length; i < length; i++) {
        html += getPerLibrarySettingsHtml(userViews[i], user, userSettings);
    }

    elem.innerHTML = html;
}

function loadForm(context, user, userSettings, apiClient) {
    context.querySelector('.chkHidePlayedFromLatest').checked = user.Configuration.HidePlayedInLatest || false;

    updateHomeSectionValues(context, userSettings);

    const promise1 = queryClient
        .fetchQuery(getUserViewsQuery(
            toApi(apiClient),
            user.Id,
            { includeHidden: true }
        ));
    const promise2 = apiClient.getJSON(apiClient.getUrl(`Users/${user.Id}/GroupingOptions`));

    Promise.all([promise1, promise2]).then(responses => {
        renderViewOrder(context, user, responses[0]);

        renderPerLibrarySettings(context, user, responses[0].Items, userSettings);

        renderViews(context, user, responses[1]);

        loading.hide();
    });
}

function onSectionOrderListClick(e) {
    const target = dom.parentWithClass(e.target, 'btnViewItemMove');

    if (target) {
        const viewItem = dom.parentWithClass(target, 'viewItem');

        if (viewItem) {
            if (target.classList.contains('btnViewItemDown')) {
                const next = viewItem.nextSibling;

                if (next) {
                    viewItem.parentNode.removeChild(viewItem);
                    next.parentNode.insertBefore(viewItem, next.nextSibling);
                    focusManager.focus(e.target);
                }
            } else {
                const prev = viewItem.previousSibling;

                if (prev) {
                    viewItem.parentNode.removeChild(viewItem);
                    prev.parentNode.insertBefore(viewItem, prev);
                    focusManager.focus(e.target);
                }
            }
        }
    }
}

function getCheckboxItems(selector, context, isChecked) {
    const inputs = context.querySelectorAll(selector);
    const list = [];

    for (let i = 0, length = inputs.length; i < length; i++) {
        if (inputs[i].checked === isChecked) {
            list.push(inputs[i]);
        }
    }

    return list;
}

function saveUser(context, user, userSettingsInstance, apiClient) {
    user.Configuration.HidePlayedInLatest = context.querySelector('.chkHidePlayedFromLatest').checked;

    user.Configuration.LatestItemsExcludes = getCheckboxItems('.chkIncludeInLatest', context, false).map(i => {
        return i.getAttribute('data-folderid');
    });

    user.Configuration.MyMediaExcludes = getCheckboxItems('.chkIncludeInMyMedia', context, false).map(i => {
        return i.getAttribute('data-folderid');
    });

    user.Configuration.GroupedFolders = getCheckboxItems('.chkGroupFolder', context, true).map(i => {
        return i.getAttribute('data-folderid');
    });

    const viewItems = context.querySelectorAll('.viewItem');
    const orderedViews = [];
    let i;
    let length;
    for (i = 0, length = viewItems.length; i < length; i++) {
        orderedViews.push(viewItems[i].getAttribute('data-viewid'));
    }

    user.Configuration.OrderedViews = orderedViews;

    userSettingsInstance.set('tvhome', context.querySelector('.selectTVHomeScreen').value);

    userSettingsInstance.set('homesection0', context.querySelector('#selectHomeSection1').value);
    userSettingsInstance.set('homesection1', context.querySelector('#selectHomeSection2').value);
    userSettingsInstance.set('homesection2', context.querySelector('#selectHomeSection3').value);
    userSettingsInstance.set('homesection3', context.querySelector('#selectHomeSection4').value);
    userSettingsInstance.set('homesection4', context.querySelector('#selectHomeSection5').value);
    userSettingsInstance.set('homesection5', context.querySelector('#selectHomeSection6').value);
    userSettingsInstance.set('homesection6', context.querySelector('#selectHomeSection7').value);
    userSettingsInstance.set('homesection7', context.querySelector('#selectHomeSection8').value);
    userSettingsInstance.set('homesection8', context.querySelector('#selectHomeSection9').value);
    userSettingsInstance.set('homesection9', context.querySelector('#selectHomeSection10').value);

    const selectLandings = context.querySelectorAll('.selectLanding');
    for (i = 0, length = selectLandings.length; i < length; i++) {
        const selectLanding = selectLandings[i];
        userSettingsInstance.set(`landing-${selectLanding.getAttribute('data-folderid')}`, selectLanding.value);
    }

    return apiClient.updateUserConfiguration(user.Id, user.Configuration);
}

function save(instance, context, userId, userSettings, apiClient, enableSaveConfirmation) {
    loading.show();

    apiClient.getUser(userId).then(user => {
        saveUser(context, user, userSettings, apiClient).then(() => {
            loading.hide();
            if (enableSaveConfirmation) {
                toast(globalize.translate('SettingsSaved'));
            }

            Events.trigger(instance, 'saved');
        }, () => {
            loading.hide();
        });
    });
}

function onSubmit(e) {
    const self = this;
    const apiClient = ServerConnections.getApiClient(self.options.serverId);
    const userId = self.options.userId;
    const userSettings = self.options.userSettings;

    userSettings.setUserInfo(userId, apiClient).then(() => {
        const enableSaveConfirmation = self.options.enableSaveConfirmation;
        save(self, self.options.element, userId, userSettings, apiClient, enableSaveConfirmation);
    });

    // Disable default form submission
    if (e) {
        e.preventDefault();
    }
    return false;
}

function onChange(e) {
    const chkIncludeInMyMedia = dom.parentWithClass(e.target, 'chkIncludeInMyMedia');
    if (!chkIncludeInMyMedia) {
        return;
    }

    const section = dom.parentWithClass(chkIncludeInMyMedia, 'verticalSection');
    const fldIncludeInLatest = section.querySelector('.fldIncludeInLatest');
    if (fldIncludeInLatest) {
        if (chkIncludeInMyMedia.checked) {
            fldIncludeInLatest.classList.remove('hide');
        } else {
            fldIncludeInLatest.classList.add('hide');
        }
    }
}

function embed(options, self) {
    let workingTemplate = template;
    for (let i = 1; i <= numConfigurableSections; i++) {
        workingTemplate = workingTemplate.replace(`{section${i}label}`, globalize.translate('LabelHomeScreenSectionValue', i));
    }

    options.element.innerHTML = globalize.translateHtml(workingTemplate, 'core');

    options.element.querySelector('.viewOrderList').addEventListener('click', onSectionOrderListClick);
    options.element.querySelector('form').addEventListener('submit', onSubmit.bind(self));
    options.element.addEventListener('change', onChange);

    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }

    if (layoutManager.tv) {
        options.element.querySelector('.selectTVHomeScreenContainer').classList.remove('hide');
    } else {
        options.element.querySelector('.selectTVHomeScreenContainer').classList.add('hide');
    }

    self.loadData(options.autoFocus);
}

class HomeScreenSettings {
    constructor(options) {
        this.options = options;
        embed(options, this);
    }

    loadData(autoFocus) {
        const self = this;
        const context = self.options.element;

        loading.show();

        const userId = self.options.userId;
        const apiClient = ServerConnections.getApiClient(self.options.serverId);
        const userSettings = self.options.userSettings;

        apiClient.getUser(userId).then(user => {
            userSettings.setUserInfo(userId, apiClient).then(() => {
                self.dataLoaded = true;

                loadForm(context, user, userSettings, apiClient);

                if (autoFocus) {
                    focusManager.autoFocus(context);
                }
            });
        });
    }

    submit() {
        onSubmit.call(this);
    }

    destroy() {
        this.options = null;
    }
}

export default HomeScreenSettings;
