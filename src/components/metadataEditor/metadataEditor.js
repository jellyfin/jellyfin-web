import escapeHtml from 'escape-html';
import dom from '../../scripts/dom';
import layoutManager from '../layoutManager';
import dialogHelper from '../dialogHelper/dialogHelper';
import datetime from '../../scripts/datetime';
import loading from '../loading/loading';
import focusManager from '../focusManager';
import globalize from '../../lib/globalize';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-select/emby-select';
import '../listview/listview.scss';
import '../../elements/emby-textarea/emby-textarea';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../formdialog.scss';
import '../../styles/clearbutton.scss';
import '../../styles/flexstyles.scss';
import './style.scss';
import ServerConnections from '../ServerConnections';
import toast from '../toast/toast';
import { appRouter } from '../router/appRouter';
import template from './metadataEditor.template.html';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { SeriesStatus } from '@jellyfin/sdk/lib/generated-client/models/series-status';

let currentContext;
let metadataEditorInfo;
let currentItem;

function isDialog() {
    return currentContext.classList.contains('dialog');
}

function closeDialog() {
    if (isDialog()) {
        dialogHelper.close(currentContext);
    }
}

function submitUpdatedItem(form, item) {
    function afterContentTypeUpdated() {
        toast(globalize.translate('MessageItemSaved'));

        loading.hide();
        closeDialog();
    }

    const apiClient = getApiClient();

    apiClient.updateItem(item).then(function () {
        const newContentType = form.querySelector('#selectContentType').value || '';

        if ((metadataEditorInfo.ContentType || '') !== newContentType) {
            apiClient.ajax({

                url: apiClient.getUrl('Items/' + item.Id + '/ContentType', {
                    ContentType: newContentType
                }),

                type: 'POST'

            }).then(function () {
                afterContentTypeUpdated();
            });
        } else {
            afterContentTypeUpdated();
        }
    });
}

function getSelectedAirDays(form) {
    const checkedItems = form.querySelectorAll('.chkAirDay:checked') || [];
    return Array.prototype.map.call(checkedItems, function (c) {
        return c.getAttribute('data-day');
    });
}

function getAlbumArtists(form) {
    return form.querySelector('#txtAlbumArtist').value.trim().split(';').filter(function (s) {
        return s.length > 0;
    }).map(function (a) {
        return {
            Name: a
        };
    });
}

function getArtists(form) {
    return form.querySelector('#txtArtist').value.trim().split(';').filter(function (s) {
        return s.length > 0;
    }).map(function (a) {
        return {
            Name: a
        };
    });
}

function getDateValue(form, element, property) {
    let val = form.querySelector(element).value;

    if (!val) {
        return null;
    }

    if (currentItem[property]) {
        const date = datetime.parseISO8601Date(currentItem[property], true);

        const parts = date.toISOString().split('T');

        // If the date is the same, preserve the time
        if (parts[0].startsWith(val)) {
            const iso = parts[1];

            val += 'T' + iso;
        }
    }

    return val;
}

function onSubmit(e) {
    loading.show();

    const form = this;

    const item = {
        Id: currentItem.Id,
        Name: form.querySelector('#txtName').value,
        OriginalTitle: form.querySelector('#txtOriginalName').value,
        ForcedSortName: form.querySelector('#txtSortName').value,
        CommunityRating: form.querySelector('#txtCommunityRating').value,
        CriticRating: form.querySelector('#txtCriticRating').value,
        IndexNumber: form.querySelector('#txtIndexNumber').value || null,
        AirsBeforeSeasonNumber: form.querySelector('#txtAirsBeforeSeason').value,
        AirsAfterSeasonNumber: form.querySelector('#txtAirsAfterSeason').value,
        AirsBeforeEpisodeNumber: form.querySelector('#txtAirsBeforeEpisode').value,
        ParentIndexNumber: form.querySelector('#txtParentIndexNumber').value || null,
        DisplayOrder: form.querySelector('#selectDisplayOrder').value,
        Album: form.querySelector('#txtAlbum').value,
        AlbumArtists: getAlbumArtists(form),
        ArtistItems: getArtists(form),
        Overview: form.querySelector('#txtOverview').value,
        Status: form.querySelector('#selectStatus').value,
        AirDays: getSelectedAirDays(form),
        AirTime: form.querySelector('#txtAirTime').value,
        Genres: getListValues(form.querySelector('#listGenres')),
        Tags: getListValues(form.querySelector('#listTags')),
        Studios: getListValues(form.querySelector('#listStudios')).map(function (element) {
            return { Name: element };
        }),

        PremiereDate: getDateValue(form, '#txtPremiereDate', 'PremiereDate'),
        DateCreated: getDateValue(form, '#txtDateAdded', 'DateCreated'),
        EndDate: getDateValue(form, '#txtEndDate', 'EndDate'),
        ProductionYear: form.querySelector('#txtProductionYear').value,
        Height: form.querySelector('#selectHeight').value,
        AspectRatio: form.querySelector('#txtOriginalAspectRatio').value,
        Video3DFormat: form.querySelector('#select3dFormat').value,

        OfficialRating: form.querySelector('#selectOfficialRating').value,
        CustomRating: form.querySelector('#selectCustomRating').value,
        People: currentItem.People,
        LockData: form.querySelector('#chkLockData').checked,
        LockedFields: Array.prototype.filter.call(form.querySelectorAll('.selectLockedField'), function (c) {
            return !c.checked;
        }).map(function (c) {
            return c.getAttribute('data-value');
        })
    };

    item.ProviderIds = Object.assign({}, currentItem.ProviderIds);

    const idElements = form.querySelectorAll('.txtExternalId');
    Array.prototype.map.call(idElements, function (idElem) {
        const providerKey = idElem.getAttribute('data-providerkey');
        item.ProviderIds[providerKey] = idElem.value;
    });

    item.PreferredMetadataLanguage = form.querySelector('#selectLanguage').value;
    item.PreferredMetadataCountryCode = form.querySelector('#selectCountry').value;

    if (currentItem.Type === 'Person') {
        const placeOfBirth = form.querySelector('#txtPlaceOfBirth').value;

        item.ProductionLocations = placeOfBirth ? [placeOfBirth] : [];
    }

    if (currentItem.Type === 'Series') {
        // 600000000
        const seriesRuntime = form.querySelector('#txtSeriesRuntime').value;
        item.RunTimeTicks = seriesRuntime ? (seriesRuntime * 600000000) : null;
    }

    const tagline = form.querySelector('#txtTagline').value;
    item.Taglines = tagline ? [tagline] : [];

    submitUpdatedItem(form, item);

    e.preventDefault();
    e.stopPropagation();

    // Disable default form submission
    return false;
}

function getListValues(list) {
    return Array.prototype.map.call(list.querySelectorAll('.textValue'), function (el) {
        return el.textContent;
    });
}

function addElementToList(source, sortCallback) {
    import('../prompt/prompt').then(({ default: prompt }) => {
        prompt({
            label: 'Value:'
        }).then(function (text) {
            const list = dom.parentWithClass(source, 'editableListviewContainer').querySelector('.paperList');
            const items = getListValues(list);
            items.push(text);
            populateListView(list, items, sortCallback);
        });
    });
}

function removeElementFromList(source) {
    const el = dom.parentWithClass(source, 'listItem');
    el.parentNode.removeChild(el);
}

function editPerson(context, person, index) {
    import('./personEditor').then(({ default: personEditor }) => {
        personEditor.show(person).then(function (updatedPerson) {
            const isNew = index === -1;

            if (isNew) {
                currentItem.People.push(updatedPerson);
            }

            populatePeople(context, currentItem.People);
        });
    });
}

function afterDeleted(context, item) {
    const parentId = item.ParentId || item.SeasonId || item.SeriesId;

    if (parentId) {
        reload(context, parentId, item.ServerId);
    } else {
        appRouter.goHome();
    }
}

function showMoreMenu(context, button, user) {
    import('../itemContextMenu').then(({ default: itemContextMenu }) => {
        const item = currentItem;

        itemContextMenu.show({
            item: item,
            positionTo: button,
            edit: false,
            editImages: true,
            editSubtitles: true,
            share: false,
            play: false,
            queue: false,
            user: user
        }).then(function (result) {
            if (result.deleted) {
                afterDeleted(context, item);
            } else if (result.updated) {
                reload(context, item.Id, item.ServerId);
            }
        }).catch(() => { /* no-op */ });
    });
}

function onEditorClick(e) {
    const btnRemoveFromEditorList = dom.parentWithClass(e.target, 'btnRemoveFromEditorList');
    if (btnRemoveFromEditorList) {
        removeElementFromList(btnRemoveFromEditorList);
        return;
    }

    const btnAddTextItem = dom.parentWithClass(e.target, 'btnAddTextItem');
    if (btnAddTextItem) {
        addElementToList(btnAddTextItem);
    }
}

function getApiClient() {
    return ServerConnections.getApiClient(currentItem.ServerId);
}

function bindAll(elems, eventName, fn) {
    for (let i = 0, length = elems.length; i < length; i++) {
        elems[i].addEventListener(eventName, fn);
    }
}

function onResetClick() {
    const resetElementId = ['#txtName', '#txtOriginalName', '#txtSortName', '#txtCommunityRating', '#txtCriticRating', '#txtIndexNumber',
        '#txtAirsBeforeSeason', '#txtAirsAfterSeason', '#txtAirsBeforeEpisode', '#txtParentIndexNumber', '#txtAlbum',
        '#txtAlbumArtist', '#txtArtist', '#txtOverview', '#selectStatus', '#txtAirTime', '#txtPremiereDate', '#txtDateAdded', '#txtEndDate',
        '#txtProductionYear', '#selectHeight', '#txtOriginalAspectRatio', '#select3dFormat', '#selectOfficialRating', '#selectCustomRating',
        '#txtSeriesRuntime', '#txtTagline'];
    const form = currentContext?.querySelector('form');
    resetElementId.forEach(function (id) {
        form.querySelector(id).value = null;
    });
    form.querySelector('#selectDisplayOrder').value = '';
    form.querySelector('#selectLanguage').value = '';
    form.querySelector('#selectCountry').value = '';
    form.querySelector('#listGenres').innerHTML = '';
    form.querySelector('#listTags').innerHTML = '';
    form.querySelector('#listStudios').innerHTML = '';
    form.querySelector('#peopleList').innerHTML = '';
    currentItem.People = [];

    const checkedItems = form.querySelectorAll('.chkAirDay:checked') || [];
    checkedItems.forEach(function (checkbox) {
        checkbox.checked = false;
    });

    const idElements = form.querySelectorAll('.txtExternalId');
    idElements.forEach(function (idElem) {
        idElem.value = null;
    });

    form.querySelector('#chkLockData').checked = false;
    showElement('.providerSettingsContainer');

    const lockedFields = form.querySelectorAll('.selectLockedField');
    lockedFields.forEach(function (checkbox) {
        checkbox.checked = true;
    });
}

function init(context) {
    if (!layoutManager.desktop) {
        context.querySelector('.btnBack').classList.remove('hide');
        context.querySelector('.btnClose').classList.add('hide');
    }

    bindAll(context.querySelectorAll('.btnCancel'), 'click', function (event) {
        event.preventDefault();
        closeDialog();
    });

    context.querySelector('.btnMore').addEventListener('click', function (e) {
        getApiClient().getCurrentUser().then(function (user) {
            showMoreMenu(context, e.target, user);
        });
    });

    context.querySelector('.btnHeaderSave').addEventListener('click', function () {
        context.querySelector('.btnSave').click();
    });

    context.querySelector('#chkLockData').addEventListener('click', function (e) {
        if (!e.target.checked) {
            showElement('.providerSettingsContainer');
        } else {
            hideElement('.providerSettingsContainer');
        }
    });

    context.removeEventListener('click', onEditorClick);
    context.addEventListener('click', onEditorClick);

    const form = context.querySelector('form');
    form.removeEventListener('submit', onSubmit);
    form.addEventListener('submit', onSubmit);

    context.querySelector('.btnReset').addEventListener('click', onResetClick);

    context.querySelector('#btnAddPerson').addEventListener('click', function () {
        editPerson(context, {}, -1);
    });

    context.querySelector('#peopleList').addEventListener('click', function (e) {
        let index;
        const btnDeletePerson = dom.parentWithClass(e.target, 'btnDeletePerson');
        if (btnDeletePerson) {
            index = parseInt(btnDeletePerson.getAttribute('data-index'), 10);
            currentItem.People.splice(index, 1);
            populatePeople(context, currentItem.People);
        }

        const btnEditPerson = dom.parentWithClass(e.target, 'btnEditPerson');
        if (btnEditPerson) {
            index = parseInt(btnEditPerson.getAttribute('data-index'), 10);
            editPerson(context, currentItem.People[index], index);
        }
    });
}

function getItem(itemId, serverId) {
    const apiClient = ServerConnections.getApiClient(serverId);

    if (itemId) {
        return apiClient.getItem(apiClient.getCurrentUserId(), itemId);
    }

    return apiClient.getRootFolder(apiClient.getCurrentUserId());
}

function getEditorConfig(itemId, serverId) {
    const apiClient = ServerConnections.getApiClient(serverId);

    if (itemId) {
        return apiClient.getJSON(apiClient.getUrl('Items/' + itemId + '/MetadataEditor'));
    }

    return Promise.resolve({});
}

function populateCountries(select, allCountries) {
    let html = '';

    html += "<option value=''></option>";

    for (let i = 0, length = allCountries.length; i < length; i++) {
        const culture = allCountries[i];

        html += "<option value='" + culture.TwoLetterISORegionName + "'>" + culture.DisplayName + '</option>';
    }

    select.innerHTML = html;
}

function populateLanguages(select, languages) {
    let html = '';

    html += "<option value=''></option>";

    for (let i = 0, length = languages.length; i < length; i++) {
        const culture = languages[i];

        html += "<option value='" + culture.TwoLetterISOLanguageName + "'>" + culture.DisplayName + '</option>';
    }

    select.innerHTML = html;
}

function renderContentTypeOptions(context, metadataInfo) {
    if (!metadataInfo.ContentTypeOptions.length) {
        hideElement('#fldContentType', context);
    } else {
        showElement('#fldContentType', context);
    }

    const html = metadataInfo.ContentTypeOptions.map(function (i) {
        return '<option value="' + i.Value + '">' + i.Name + '</option>';
    }).join('');

    const selectEl = context.querySelector('#selectContentType');
    selectEl.innerHTML = html;
    selectEl.value = metadataInfo.ContentType || '';
}

function loadExternalIds(context, item, externalIds) {
    let html = '';

    const providerIds = item.ProviderIds || {};

    for (let i = 0, length = externalIds.length; i < length; i++) {
        const idInfo = externalIds[i];

        const id = 'txt1' + idInfo.Key;

        let fullName = idInfo.Name;
        if (idInfo.Type) {
            fullName = idInfo.Name + ' ' + globalize.translate(idInfo.Type);
        }

        const labelText = globalize.translate('LabelDynamicExternalId', escapeHtml(fullName));

        html += '<div class="inputContainer">';
        html += '<div class="flex align-items-center">';

        const value = escapeHtml(providerIds[idInfo.Key] || '');

        html += '<div class="flex-grow">';
        html += '<input is="emby-input" class="txtExternalId" value="' + value + '" data-providerkey="' + idInfo.Key + '" id="' + id + '" label="' + labelText + '"/>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
    }

    const elem = context.querySelector('.externalIds', context);
    elem.innerHTML = html;

    if (externalIds.length) {
        context.querySelector('.externalIdsSection').classList.remove('hide');
    } else {
        context.querySelector('.externalIdsSection').classList.add('hide');
    }
}

// Function to hide the element by selector or raw element
// Selector can be an element or a selector string
// Context is optional and restricts the querySelector to the context
function hideElement(selector, context, multiple) {
    context = context || document;
    if (typeof selector === 'string') {
        const elements = multiple ? context.querySelectorAll(selector) : [context.querySelector(selector)];

        Array.prototype.forEach.call(elements, function (el) {
            if (el) {
                el.classList.add('hide');
            }
        });
    } else {
        selector.classList.add('hide');
    }
}

// Function to show the element by selector or raw element
// Selector can be an element or a selector string
// Context is optional and restricts the querySelector to the context
function showElement(selector, context, multiple) {
    context = context || document;
    if (typeof selector === 'string') {
        const elements = multiple ? context.querySelectorAll(selector) : [context.querySelector(selector)];

        Array.prototype.forEach.call(elements, function (el) {
            if (el) {
                el.classList.remove('hide');
            }
        });
    } else {
        selector.classList.remove('hide');
    }
}

function setFieldVisibilities(context, item) {
    if (item.Path && item.EnableMediaSourceDisplay !== false) {
        showElement('#fldPath', context);
    } else {
        hideElement('#fldPath', context);
    }

    if ([BaseItemKind.Series, BaseItemKind.Season, BaseItemKind.Episode, BaseItemKind.Movie, BaseItemKind.Trailer, BaseItemKind.Person].includes(item.Type)) {
        showElement('#fldOriginalName', context);
    } else {
        hideElement('#fldOriginalName', context);
    }

    if (item.Type === 'Series') {
        showElement('#fldSeriesRuntime', context);
    } else {
        hideElement('#fldSeriesRuntime', context);
    }

    if (item.Type === 'Series' || item.Type === 'Person') {
        showElement('#fldEndDate', context);
    } else {
        hideElement('#fldEndDate', context);
    }

    if (item.Type === 'MusicAlbum') {
        showElement('#albumAssociationMessage', context);
    } else {
        hideElement('#albumAssociationMessage', context);
    }

    if (item.Type === 'Movie' || item.Type === 'Trailer') {
        showElement('#fldCriticRating', context);
    } else {
        hideElement('#fldCriticRating', context);
    }

    if (item.Type === 'Series') {
        showElement('#fldStatus', context);
        showElement('#fldAirDays', context);
        showElement('#fldAirTime', context);
    } else {
        hideElement('#fldStatus', context);
        hideElement('#fldAirDays', context);
        hideElement('#fldAirTime', context);
    }

    if (item.MediaType === 'Video' && item.Type !== 'TvChannel') {
        showElement('#fld3dFormat', context);
    } else {
        hideElement('#fld3dFormat', context);
    }

    if (item.Type === 'Audio') {
        showElement('#fldAlbumArtist', context);
    } else {
        hideElement('#fldAlbumArtist', context);
    }

    if (item.Type === 'Audio' || item.Type === 'MusicVideo') {
        showElement('#fldArtist', context);
        showElement('#fldAlbum', context);
    } else {
        hideElement('#fldArtist', context);
        hideElement('#fldAlbum', context);
    }

    if (item.Type === 'Episode' && item.ParentIndexNumber === 0) {
        showElement('#collapsibleSpecialEpisodeInfo', context);
    } else {
        hideElement('#collapsibleSpecialEpisodeInfo', context);
    }

    if (item.Type === 'Person'
            || item.Type === 'Genre'
            || item.Type === 'Studio'
            || item.Type === 'MusicGenre'
            || item.Type === 'TvChannel') {
        hideElement('#peopleCollapsible', context);
    } else {
        showElement('#peopleCollapsible', context);
    }

    if (item.Type === 'Person' || item.Type === 'Genre' || item.Type === 'Studio' || item.Type === 'MusicGenre' || item.Type === 'TvChannel') {
        hideElement('#fldCommunityRating', context);
        hideElement('#genresCollapsible', context);
        hideElement('#studiosCollapsible', context);

        if (item.Type === 'TvChannel') {
            showElement('#fldOfficialRating', context);
        } else {
            hideElement('#fldOfficialRating', context);
        }
        hideElement('#fldCustomRating', context);
    } else {
        showElement('#fldCommunityRating', context);
        showElement('#genresCollapsible', context);
        showElement('#studiosCollapsible', context);
        showElement('#fldOfficialRating', context);
        showElement('#fldCustomRating', context);
    }

    showElement('#tagsCollapsible', context);

    if (item.Type === 'TvChannel') {
        hideElement('#metadataSettingsCollapsible', context);
        hideElement('#fldPremiereDate', context);
        hideElement('#fldDateAdded', context);
        hideElement('#fldYear', context);
    } else {
        showElement('#metadataSettingsCollapsible', context);
        showElement('#fldPremiereDate', context);
        showElement('#fldDateAdded', context);
        showElement('#fldYear', context);
    }

    if (item.Type === 'TvChannel') {
        hideElement('.overviewContainer', context);
    } else {
        showElement('.overviewContainer', context);
    }

    if (item.Type === 'Person') {
        context.querySelector('#txtName').label(globalize.translate('LabelName'));
        context.querySelector('#txtSortName').label(globalize.translate('LabelSortName'));
        context.querySelector('#txtOriginalName').label(globalize.translate('LabelOriginalName'));
        context.querySelector('#txtProductionYear').label(globalize.translate('LabelBirthYear'));
        context.querySelector('#txtPremiereDate').label(globalize.translate('LabelBirthDate'));
        context.querySelector('#txtEndDate').label(globalize.translate('LabelDeathDate'));
        showElement('#fldPlaceOfBirth');
    } else {
        context.querySelector('#txtProductionYear').label(globalize.translate('LabelYear'));
        context.querySelector('#txtPremiereDate').label(globalize.translate('LabelReleaseDate'));
        context.querySelector('#txtEndDate').label(globalize.translate('LabelEndDate'));
        hideElement('#fldPlaceOfBirth');
    }

    if (item.MediaType === 'Video' && item.Type === 'TvChannel') {
        showElement('#fldHeight');
    } else {
        hideElement('#fldHeight');
    }

    if (item.MediaType === 'Video' && item.Type !== 'TvChannel') {
        showElement('#fldOriginalAspectRatio');
    } else {
        hideElement('#fldOriginalAspectRatio');
    }

    if (item.Type === 'Audio' || item.Type === 'Episode' || item.Type === 'Season') {
        showElement('#fldIndexNumber');

        if (item.Type === 'Episode') {
            context.querySelector('#txtIndexNumber').label(globalize.translate('LabelEpisodeNumber'));
        } else if (item.Type === 'Season') {
            context.querySelector('#txtIndexNumber').label(globalize.translate('LabelSeasonNumber'));
        } else if (item.Type === 'Audio') {
            context.querySelector('#txtIndexNumber').label(globalize.translate('LabelTrackNumber'));
        } else {
            context.querySelector('#txtIndexNumber').label(globalize.translate('LabelNumber'));
        }
    } else {
        hideElement('#fldIndexNumber');
    }

    if (item.Type === 'Audio' || item.Type === 'Episode') {
        showElement('#fldParentIndexNumber');

        if (item.Type === 'Episode') {
            context.querySelector('#txtParentIndexNumber').label(globalize.translate('LabelSeasonNumber'));
        } else if (item.Type === 'Audio') {
            context.querySelector('#txtParentIndexNumber').label(globalize.translate('LabelDiscNumber'));
        } else {
            context.querySelector('#txtParentIndexNumber').label(globalize.translate('LabelParentNumber'));
        }
    } else {
        hideElement('#fldParentIndexNumber', context);
    }

    if (item.Type === 'BoxSet') {
        showElement('#fldDisplayOrder', context);
        hideElement('.seriesDisplayOrderDescription', context);

        context.querySelector('#selectDisplayOrder').innerHTML = '<option value="Default">' + globalize.translate('DateModified') + '<option value="SortName">' + globalize.translate('SortName') + '</option><option value="PremiereDate">' + globalize.translate('ReleaseDate') + '</option>';
    } else if (item.Type === 'Series') {
        showElement('#fldDisplayOrder', context);
        showElement('.seriesDisplayOrderDescription', context);

        let html = '';
        html += '<option value="">' + globalize.translate('Aired') + '</option>';
        html += '<option value="originalAirDate">' + globalize.translate('OriginalAirDate') + '</option>';
        html += '<option value="absolute">' + globalize.translate('Absolute') + '</option>';
        html += '<option value="dvd">DVD</option></option>';
        html += '<option value="digital">' + globalize.translate('Digital') + '</option>';
        html += '<option value="storyArc">' + globalize.translate('StoryArc') + '</option>';
        html += '<option value="production">' + globalize.translate('Production') + '</option>';
        html += '<option value="tv">TV</option>';
        html += '<option value="alternate">' + globalize.translate('Alternate') + '</option>';
        html += '<option value="regional">' + globalize.translate('Regional') + '</option>';
        html += '<option value="altdvd">' + globalize.translate('AlternateDVD') + '</option>';

        context.querySelector('#selectDisplayOrder').innerHTML = html;
    } else {
        context.querySelector('#selectDisplayOrder').innerHTML = '';
        hideElement('#fldDisplayOrder', context);
    }
}

function fillItemInfo(context, item, parentalRatingOptions) {
    let select = context.querySelector('#selectOfficialRating');

    populateRatings(parentalRatingOptions, select, item.OfficialRating);

    select.value = item.OfficialRating || '';

    select = context.querySelector('#selectCustomRating');

    populateRatings(parentalRatingOptions, select, item.CustomRating);

    select.value = item.CustomRating || '';

    const selectStatus = context.querySelector('#selectStatus');
    populateStatus(selectStatus);
    selectStatus.value = item.Status || '';

    context.querySelector('#select3dFormat', context).value = item.Video3DFormat || '';

    Array.prototype.forEach.call(context.querySelectorAll('.chkAirDay', context), function (el) {
        el.checked = (item.AirDays || []).indexOf(el.getAttribute('data-day')) !== -1;
    });

    populateListView(context.querySelector('#listGenres'), item.Genres);
    populatePeople(context, item.People || []);

    populateListView(context.querySelector('#listStudios'), (item.Studios || []).map(function (element) {
        return element.Name || '';
    }));

    populateListView(context.querySelector('#listTags'), item.Tags);

    const lockData = (item.LockData || false);
    const chkLockData = context.querySelector('#chkLockData');
    chkLockData.checked = lockData;
    if (chkLockData.checked) {
        hideElement('.providerSettingsContainer', context);
    } else {
        showElement('.providerSettingsContainer', context);
    }
    fillMetadataSettings(context, item, item.LockedFields);

    context.querySelector('#txtPath').value = item.Path || '';
    context.querySelector('#txtName').value = item.Name || '';
    context.querySelector('#txtOriginalName').value = item.OriginalTitle || '';
    context.querySelector('#txtOverview').value = item.Overview || '';
    context.querySelector('#txtTagline').value = (item.Taglines?.length ? item.Taglines[0] : '');
    context.querySelector('#txtSortName').value = item.ForcedSortName || '';
    context.querySelector('#txtCommunityRating').value = item.CommunityRating || '';

    context.querySelector('#txtCriticRating').value = item.CriticRating || '';

    context.querySelector('#txtIndexNumber').value = item.IndexNumber == null ? '' : item.IndexNumber;
    context.querySelector('#txtParentIndexNumber').value = item.ParentIndexNumber == null ? '' : item.ParentIndexNumber;

    context.querySelector('#txtAirsBeforeSeason').value = ('AirsBeforeSeasonNumber' in item) ? item.AirsBeforeSeasonNumber : '';
    context.querySelector('#txtAirsAfterSeason').value = ('AirsAfterSeasonNumber' in item) ? item.AirsAfterSeasonNumber : '';
    context.querySelector('#txtAirsBeforeEpisode').value = ('AirsBeforeEpisodeNumber' in item) ? item.AirsBeforeEpisodeNumber : '';

    context.querySelector('#txtAlbum').value = item.Album || '';

    context.querySelector('#txtAlbumArtist').value = (item.AlbumArtists || []).map(function (a) {
        return a.Name;
    }).join(';');

    context.querySelector('#selectDisplayOrder').value = item.DisplayOrder || '';

    context.querySelector('#txtArtist').value = (item.ArtistItems || []).map(function (a) {
        return a.Name;
    }).join(';');

    let date;

    if (item.DateCreated) {
        try {
            date = datetime.parseISO8601Date(item.DateCreated, true);

            context.querySelector('#txtDateAdded').value = date.toISOString().slice(0, 10);
        } catch {
            context.querySelector('#txtDateAdded').value = '';
        }
    } else {
        context.querySelector('#txtDateAdded').value = '';
    }

    if (item.PremiereDate) {
        try {
            date = datetime.parseISO8601Date(item.PremiereDate, true);

            context.querySelector('#txtPremiereDate').value = date.toISOString().slice(0, 10);
        } catch {
            context.querySelector('#txtPremiereDate').value = '';
        }
    } else {
        context.querySelector('#txtPremiereDate').value = '';
    }

    if (item.EndDate) {
        try {
            date = datetime.parseISO8601Date(item.EndDate, true);

            context.querySelector('#txtEndDate').value = date.toISOString().slice(0, 10);
        } catch {
            context.querySelector('#txtEndDate').value = '';
        }
    } else {
        context.querySelector('#txtEndDate').value = '';
    }

    context.querySelector('#txtProductionYear').value = item.ProductionYear || '';

    context.querySelector('#txtAirTime').value = item.AirTime || '';

    const placeofBirth = item.ProductionLocations?.length ? item.ProductionLocations[0] : '';
    context.querySelector('#txtPlaceOfBirth').value = placeofBirth;

    context.querySelector('#selectHeight').value = item.Height || '';

    context.querySelector('#txtOriginalAspectRatio').value = item.AspectRatio || '';

    context.querySelector('#selectLanguage').value = item.PreferredMetadataLanguage || '';
    context.querySelector('#selectCountry').value = item.PreferredMetadataCountryCode || '';

    if (item.RunTimeTicks) {
        const minutes = item.RunTimeTicks / 600000000;

        context.querySelector('#txtSeriesRuntime').value = Math.round(minutes);
    } else {
        context.querySelector('#txtSeriesRuntime', context).value = '';
    }
}

function populateRatings(allParentalRatings, select, currentValue) {
    let html = '';

    html += "<option value=''></option>";

    const ratings = [];
    let rating;

    let currentValueFound = false;

    for (let i = 0, length = allParentalRatings.length; i < length; i++) {
        rating = allParentalRatings[i];

        ratings.push({ Name: rating.Name, Value: rating.Name });

        if (rating.Name === currentValue) {
            currentValueFound = true;
        }
    }

    if (currentValue && !currentValueFound) {
        ratings.push({ Name: currentValue, Value: currentValue });
    }

    for (let i = 0, length = ratings.length; i < length; i++) {
        rating = ratings[i];

        html += "<option value='" + escapeHtml(rating.Value) + "'>" + escapeHtml(rating.Name) + '</option>';
    }

    select.innerHTML = html;
}

function populateStatus(select) {
    let html = '';
    html += '<option value=""></option>';
    html += `<option value="${SeriesStatus.Continuing}">${escapeHtml(globalize.translate('Continuing'))}</option>`;
    html += `<option value="${SeriesStatus.Ended}">${escapeHtml(globalize.translate('Ended'))}</option>`;
    html += `<option value="${SeriesStatus.Unreleased}">${escapeHtml(globalize.translate('Unreleased'))}</option>`;
    select.innerHTML = html;
}

function populateListView(list, items, sortCallback) {
    items = items || [];
    if (typeof (sortCallback) === 'undefined') {
        items.sort(function (a, b) {
            return a.toLowerCase().localeCompare(b.toLowerCase());
        });
    } else {
        items = sortCallback(items);
    }
    let html = '';
    for (let i = 0; i < items.length; i++) {
        html += '<div class="listItem">';

        html += '<span class="material-icons listItemIcon live_tv" aria-hidden="true" style="background-color:#333;"></span>';

        html += '<div class="listItemBody">';

        html += '<div class="textValue">';
        html += escapeHtml(items[i]);
        html += '</div>';

        html += '</div>';

        html += '<button type="button" is="paper-icon-button-light" data-index="' + i + '" class="btnRemoveFromEditorList autoSize"><span class="material-icons delete" aria-hidden="true"></span></button>';

        html += '</div>';
    }

    list.innerHTML = html;
}

function populatePeople(context, people) {
    const lastType = '';
    let html = '';

    const elem = context.querySelector('#peopleList');

    for (let i = 0, length = people.length; i < length; i++) {
        const person = people[i];

        html += '<div class="listItem">';

        html += '<span class="material-icons listItemIcon person" style="background-color:#333;"></span>';

        html += '<div class="listItemBody">';
        html += '<button style="text-align:left;" type="button" class="btnEditPerson clearButton" data-index="' + i + '">';

        html += '<div class="textValue">';
        html += escapeHtml(person.Name || '');
        html += '</div>';

        if (person.Role && person.Role !== lastType) {
            html += '<div class="secondary">' + person.Role + '</div>';
        } else {
            html += '<div class="secondary">' + globalize.translate(person.Type) + '</div>';
        }

        html += '</button>';
        html += '</div>';

        html += '<button type="button" is="paper-icon-button-light" data-index="' + i + '" class="btnDeletePerson autoSize"><span class="material-icons delete" aria-hidden="true"></span></button>';

        html += '</div>';
    }

    elem.innerHTML = html;
}

function getLockedFieldsHtml(fields, currentFields) {
    let html = '';
    for (const field of fields) {
        const name = field.name;
        const value = field.value || field.name;
        const checkedHtml = currentFields.indexOf(value) === -1 ? ' checked' : '';
        html += '<label>';
        html += '<input type="checkbox" is="emby-checkbox" class="selectLockedField" data-value="' + value + '"' + checkedHtml + '/>';
        html += '<span>' + name + '</span>';
        html += '</label>';
    }
    return html;
}

function fillMetadataSettings(context, item, lockedFields) {
    const container = context.querySelector('.providerSettingsContainer');
    lockedFields = lockedFields || [];

    const lockedFieldsList = [
        { name: globalize.translate('Name'), value: 'Name' },
        { name: globalize.translate('Overview'), value: 'Overview' },
        { name: globalize.translate('Genres'), value: 'Genres' },
        { name: globalize.translate('ParentalRating'), value: 'OfficialRating' },
        { name: globalize.translate('People'), value: 'Cast' }
    ];

    if (item.Type === 'Person') {
        lockedFieldsList.push({ name: globalize.translate('BirthLocation'), value: 'ProductionLocations' });
    } else {
        lockedFieldsList.push({ name: globalize.translate('ProductionLocations'), value: 'ProductionLocations' });
    }

    if (item.Type === 'Series') {
        lockedFieldsList.push({ name: globalize.translate('Runtime'), value: 'Runtime' });
    }

    lockedFieldsList.push({ name: globalize.translate('Studios'), value: 'Studios' });
    lockedFieldsList.push({ name: globalize.translate('Tags'), value: 'Tags' });

    let html = '';

    html += '<h2>' + globalize.translate('HeaderEnabledFields') + '</h2>';
    html += '<p>' + globalize.translate('HeaderEnabledFieldsHelp') + '</p>';
    html += getLockedFieldsHtml(lockedFieldsList, lockedFields);
    container.innerHTML = html;
}

function reload(context, itemId, serverId) {
    loading.show();

    Promise.all([getItem(itemId, serverId), getEditorConfig(itemId, serverId)]).then(function (responses) {
        const item = responses[0];
        metadataEditorInfo = responses[1];

        currentItem = item;

        const languages = metadataEditorInfo.Cultures;
        const countries = metadataEditorInfo.Countries;

        renderContentTypeOptions(context, metadataEditorInfo);

        loadExternalIds(context, item, metadataEditorInfo.ExternalIdInfos);

        populateLanguages(context.querySelector('#selectLanguage'), languages);
        populateCountries(context.querySelector('#selectCountry'), countries);

        setFieldVisibilities(context, item);
        fillItemInfo(context, item, metadataEditorInfo.ParentalRatingOptions);

        if (item.MediaType === 'Video' && item.Type !== 'Episode' && item.Type !== 'TvChannel') {
            showElement('#fldTagline', context);
        } else {
            hideElement('#fldTagline', context);
        }

        loading.hide();
    });
}

function centerFocus(elem, horiz, on) {
    import('../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function show(itemId, serverId, resolve) {
    loading.show();

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

    html += globalize.translateHtml(template, 'core');

    dlg.innerHTML = html;

    if (layoutManager.tv) {
        centerFocus(dlg.querySelector('.formDialogContent'), false, true);
    }

    dialogHelper.open(dlg);

    dlg.addEventListener('close', function () {
        if (layoutManager.tv) {
            centerFocus(dlg.querySelector('.formDialogContent'), false, false);
        }

        resolve();
    });

    currentContext = dlg;

    init(dlg);

    reload(dlg, itemId, serverId);
}

export default {
    show: function (itemId, serverId) {
        return new Promise(resolve => show(itemId, serverId, resolve));
    },

    embed: function (elem, itemId, serverId) {
        return new Promise(function () {
            loading.show();

            elem.innerHTML = globalize.translateHtml(template, 'core');

            elem.querySelector('.formDialogFooter').classList.remove('formDialogFooter');
            elem.querySelector('.btnClose').classList.add('hide');
            elem.querySelector('.btnHeaderSave').classList.remove('hide');
            elem.querySelector('.btnCancel').classList.add('hide');

            currentContext = elem;

            init(elem);
            reload(elem, itemId, serverId);

            focusManager.autoFocus(elem);
        });
    }
};

