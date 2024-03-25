import appSettings from '../../scripts/settings/appSettings';
import { appHost } from '../apphost';
import focusManager from '../focusManager';
import qualityoptions from '../qualityOptions';
import globalize from '../../scripts/globalize';
import loading from '../loading/loading';
import Events from '../../utils/events.ts';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-checkbox/emby-checkbox';
import ServerConnections from '../ServerConnections';
import toast from '../toast/toast';
import template from './playbackSettings.template.html';
import escapeHTML from 'escape-html';

function fillSkipLengths(select) {
    const options = [5, 10, 15, 20, 25, 30];

    select.innerHTML = options.map(option => {
        return {
            name: globalize.translate('ValueSeconds', option),
            value: option * 1000
        };
    }).map(o => {
        return `<option value="${o.value}">${o.name}</option>`;
    }).join('');
}

function populateLanguages(select, languages) {
    let html = '';

    html += `<option value=''>${globalize.translate('AnyLanguage')}</option>`;

    for (let i = 0, length = languages.length; i < length; i++) {
        const culture = languages[i];

        html += `<option value='${culture.ThreeLetterISOLanguageName}'>${culture.DisplayName}</option>`;
    }

    select.innerHTML = html;
}

function fillQuality(select, isInNetwork, mediatype, maxVideoWidth) {
    const options = mediatype === 'Audio' ? qualityoptions.getAudioQualityOptions({

        currentMaxBitrate: appSettings.maxStreamingBitrate(isInNetwork, mediatype),
        isAutomaticBitrateEnabled: appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype),
        enableAuto: true

    }) : qualityoptions.getVideoQualityOptions({

        currentMaxBitrate: appSettings.maxStreamingBitrate(isInNetwork, mediatype),
        isAutomaticBitrateEnabled: appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype),
        enableAuto: true,
        maxVideoWidth

    });

    select.innerHTML = options.map(i => {
        // render empty string instead of 0 for the auto option
        return `<option value="${i.bitrate || ''}">${i.name}</option>`;
    }).join('');
}

function setMaxBitrateIntoField(select, isInNetwork, mediatype) {
    fillQuality(select, isInNetwork, mediatype);

    if (appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype)) {
        select.value = '';
    } else {
        select.value = appSettings.maxStreamingBitrate(isInNetwork, mediatype);
    }
}

function fillChromecastQuality(select, maxVideoWidth) {
    const options = qualityoptions.getVideoQualityOptions({

        currentMaxBitrate: appSettings.maxChromecastBitrate(),
        isAutomaticBitrateEnabled: !appSettings.maxChromecastBitrate(),
        enableAuto: true,
        maxVideoWidth
    });

    select.innerHTML = options.map(i => {
        // render empty string instead of 0 for the auto option
        return `<option value="${i.bitrate || ''}">${i.name}</option>`;
    }).join('');

    select.value = appSettings.maxChromecastBitrate() || '';
}

function setMaxBitrateFromField(select, isInNetwork, mediatype) {
    if (select.value) {
        appSettings.maxStreamingBitrate(isInNetwork, mediatype, select.value);
        appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype, false);
    } else {
        appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype, true);
    }
}

function showHideQualityFields(context, user, apiClient) {
    if (user.Policy.EnableVideoPlaybackTranscoding) {
        context.querySelector('.videoQualitySection').classList.remove('hide');
    } else {
        context.querySelector('.videoQualitySection').classList.add('hide');
    }

    if (appHost.supports('multiserver')) {
        context.querySelector('.fldVideoInNetworkQuality').classList.remove('hide');
        context.querySelector('.fldVideoInternetQuality').classList.remove('hide');

        if (user.Policy.EnableAudioPlaybackTranscoding) {
            context.querySelector('.musicQualitySection').classList.remove('hide');
        } else {
            context.querySelector('.musicQualitySection').classList.add('hide');
        }

        return;
    }

    apiClient.getEndpointInfo().then(endpointInfo => {
        if (endpointInfo.IsInNetwork) {
            context.querySelector('.fldVideoInNetworkQuality').classList.remove('hide');

            context.querySelector('.fldVideoInternetQuality').classList.add('hide');
            context.querySelector('.musicQualitySection').classList.add('hide');
        } else {
            context.querySelector('.fldVideoInNetworkQuality').classList.add('hide');

            context.querySelector('.fldVideoInternetQuality').classList.remove('hide');

            if (user.Policy.EnableAudioPlaybackTranscoding) {
                context.querySelector('.musicQualitySection').classList.remove('hide');
            } else {
                context.querySelector('.musicQualitySection').classList.add('hide');
            }
        }
    });
}

function loadForm(context, user, userSettings, systemInfo, apiClient) {
    const loggedInUserId = apiClient.getCurrentUserId();
    const userId = user.Id;

    showHideQualityFields(context, user, apiClient);

    context.querySelector('#selectAllowedAudioChannels').value = userSettings.allowedAudioChannels();

    apiClient.getCultures().then(allCultures => {
        populateLanguages(context.querySelector('#selectAudioLanguage'), allCultures);

        context.querySelector('#selectAudioLanguage', context).value = user.Configuration.AudioLanguagePreference || '';
        context.querySelector('.chkEpisodeAutoPlay').checked = user.Configuration.EnableNextEpisodeAutoPlay || false;
    });

    if (appHost.supports('externalplayerintent') && userId === loggedInUserId) {
        context.querySelector('.fldExternalPlayer').classList.remove('hide');
    } else {
        context.querySelector('.fldExternalPlayer').classList.add('hide');
    }

    if (userId === loggedInUserId && (user.Policy.EnableVideoPlaybackTranscoding || user.Policy.EnableAudioPlaybackTranscoding)) {
        context.querySelector('.qualitySections').classList.remove('hide');

        if (appHost.supports('chromecast') && user.Policy.EnableVideoPlaybackTranscoding) {
            context.querySelector('.fldChromecastQuality').classList.remove('hide');
        } else {
            context.querySelector('.fldChromecastQuality').classList.add('hide');
        }
    } else {
        context.querySelector('.qualitySections').classList.add('hide');
        context.querySelector('.fldChromecastQuality').classList.add('hide');
    }

    context.querySelector('.chkPlayDefaultAudioTrack').checked = user.Configuration.PlayDefaultAudioTrack || false;
    context.querySelector('.chkPreferFmp4HlsContainer').checked = userSettings.preferFmp4HlsContainer();
    context.querySelector('.chkEnableCinemaMode').checked = userSettings.enableCinemaMode();
    context.querySelector('#selectAudioNormalization').value = userSettings.selectAudioNormalization();
    context.querySelector('.chkEnableNextVideoOverlay').checked = userSettings.enableNextVideoInfoOverlay();
    context.querySelector('.chkRememberAudioSelections').checked = user.Configuration.RememberAudioSelections || false;
    context.querySelector('.chkRememberSubtitleSelections').checked = user.Configuration.RememberSubtitleSelections || false;
    context.querySelector('.chkExternalVideoPlayer').checked = appSettings.enableSystemExternalPlayers();
    context.querySelector('.chkLimitSupportedVideoResolution').checked = appSettings.limitSupportedVideoResolution();

    setMaxBitrateIntoField(context.querySelector('.selectVideoInNetworkQuality'), true, 'Video');
    setMaxBitrateIntoField(context.querySelector('.selectVideoInternetQuality'), false, 'Video');
    setMaxBitrateIntoField(context.querySelector('.selectMusicInternetQuality'), false, 'Audio');

    fillChromecastQuality(context.querySelector('.selectChromecastVideoQuality'));

    const selectChromecastVersion = context.querySelector('.selectChromecastVersion');
    let ccAppsHtml = '';
    for (const app of systemInfo.CastReceiverApplications) {
        ccAppsHtml += `<option value='${escapeHTML(app.Id)}'>${escapeHTML(app.Name)}</option>`;
    }
    selectChromecastVersion.innerHTML = ccAppsHtml;
    selectChromecastVersion.value = user.Configuration.CastReceiverId;

    const selectMaxVideoWidth = context.querySelector('.selectMaxVideoWidth');
    selectMaxVideoWidth.value = appSettings.maxVideoWidth();

    const selectSkipForwardLength = context.querySelector('.selectSkipForwardLength');
    fillSkipLengths(selectSkipForwardLength);
    selectSkipForwardLength.value = userSettings.skipForwardLength();

    const selectSkipBackLength = context.querySelector('.selectSkipBackLength');
    fillSkipLengths(selectSkipBackLength);
    selectSkipBackLength.value = userSettings.skipBackLength();

    loading.hide();
}

function saveUser(context, user, userSettingsInstance, apiClient) {
    appSettings.enableSystemExternalPlayers(context.querySelector('.chkExternalVideoPlayer').checked);

    appSettings.maxChromecastBitrate(context.querySelector('.selectChromecastVideoQuality').value);
    appSettings.maxVideoWidth(context.querySelector('.selectMaxVideoWidth').value);
    appSettings.limitSupportedVideoResolution(context.querySelector('.chkLimitSupportedVideoResolution').checked);

    setMaxBitrateFromField(context.querySelector('.selectVideoInNetworkQuality'), true, 'Video');
    setMaxBitrateFromField(context.querySelector('.selectVideoInternetQuality'), false, 'Video');
    setMaxBitrateFromField(context.querySelector('.selectMusicInternetQuality'), false, 'Audio');

    userSettingsInstance.allowedAudioChannels(context.querySelector('#selectAllowedAudioChannels').value);
    user.Configuration.AudioLanguagePreference = context.querySelector('#selectAudioLanguage').value;
    user.Configuration.PlayDefaultAudioTrack = context.querySelector('.chkPlayDefaultAudioTrack').checked;
    user.Configuration.EnableNextEpisodeAutoPlay = context.querySelector('.chkEpisodeAutoPlay').checked;
    userSettingsInstance.preferFmp4HlsContainer(context.querySelector('.chkPreferFmp4HlsContainer').checked);
    userSettingsInstance.enableCinemaMode(context.querySelector('.chkEnableCinemaMode').checked);
    userSettingsInstance.selectAudioNormalization(context.querySelector('#selectAudioNormalization').value);
    userSettingsInstance.enableNextVideoInfoOverlay(context.querySelector('.chkEnableNextVideoOverlay').checked);
    user.Configuration.RememberAudioSelections = context.querySelector('.chkRememberAudioSelections').checked;
    user.Configuration.RememberSubtitleSelections = context.querySelector('.chkRememberSubtitleSelections').checked;
    user.Configuration.CastReceiverId = context.querySelector('.selectChromecastVersion').value;
    userSettingsInstance.skipForwardLength(context.querySelector('.selectSkipForwardLength').value);
    userSettingsInstance.skipBackLength(context.querySelector('.selectSkipBackLength').value);

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

function setSelectValue(select, value, defaultValue) {
    select.value = value;

    if (select.selectedIndex < 0) {
        select.value = defaultValue;
    }
}

function onMaxVideoWidthChange(e) {
    const context = this.options.element;

    const selectVideoInNetworkQuality = context.querySelector('.selectVideoInNetworkQuality');
    const selectVideoInternetQuality = context.querySelector('.selectVideoInternetQuality');
    const selectChromecastVideoQuality = context.querySelector('.selectChromecastVideoQuality');

    const selectVideoInNetworkQualityValue = selectVideoInNetworkQuality.value;
    const selectVideoInternetQualityValue = selectVideoInternetQuality.value;
    const selectChromecastVideoQualityValue = selectChromecastVideoQuality.value;

    const maxVideoWidth = parseInt(e.target.value || '0', 10) || 0;

    fillQuality(selectVideoInNetworkQuality, true, 'Video', maxVideoWidth);
    fillQuality(selectVideoInternetQuality, false, 'Video', maxVideoWidth);
    fillChromecastQuality(selectChromecastVideoQuality, maxVideoWidth);

    setSelectValue(selectVideoInNetworkQuality, selectVideoInNetworkQualityValue, '');
    setSelectValue(selectVideoInternetQuality, selectVideoInternetQualityValue, '');
    setSelectValue(selectChromecastVideoQuality, selectChromecastVideoQualityValue, '');
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

function embed(options, self) {
    options.element.innerHTML = globalize.translateHtml(template, 'core');

    options.element.querySelector('form').addEventListener('submit', onSubmit.bind(self));

    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }

    options.element.querySelector('.selectMaxVideoWidth').addEventListener('change', onMaxVideoWidthChange.bind(self));

    self.loadData();

    if (options.autoFocus) {
        focusManager.autoFocus(options.element);
    }
}

class PlaybackSettings {
    constructor(options) {
        this.options = options;
        embed(options, this);
    }

    loadData() {
        const self = this;
        const context = self.options.element;

        loading.show();

        const userId = self.options.userId;
        const apiClient = ServerConnections.getApiClient(self.options.serverId);
        const userSettings = self.options.userSettings;

        apiClient.getUser(userId).then(user => {
            apiClient.getSystemInfo().then(systemInfo => {
                userSettings.setUserInfo(userId, apiClient).then(() => {
                    self.dataLoaded = true;

                    loadForm(context, user, userSettings, systemInfo, apiClient);
                });
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

export default PlaybackSettings;
