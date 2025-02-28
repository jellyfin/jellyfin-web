import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';
import escapeHTML from 'escape-html';

import { MediaSegmentAction } from 'apps/stable/features/playback/constants/mediaSegmentAction';
import { getId, getMediaSegmentAction } from 'apps/stable/features/playback/utils/mediaSegmentSettings';

import appSettings from '../../scripts/settings/appSettings';
import { appHost } from '../apphost';
import browser from '../../scripts/browser';
import focusManager from '../focusManager';
import qualityoptions from '../qualityOptions';
import globalize from '../../lib/globalize';
import loading from '../loading/loading';
import Events from '../../utils/events.ts';
import ServerConnections from '../ServerConnections';
import toast from '../toast/toast';
import template from './playbackSettings.template.html';

import '../../elements/emby-select/emby-select';
import '../../elements/emby-checkbox/emby-checkbox';

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

function populateMediaSegments(container, userSettings) {
    const selectedValues = {};
    const actionOptions = Object.values(MediaSegmentAction)
        .map(action => {
            const actionLabel = globalize.translate(`MediaSegmentAction.${action}`);
            return `<option value='${action}'>${actionLabel}</option>`;
        })
        .join('');

    const segmentSettings = [
        // List the types in a logical order (and exclude "Unknown" type)
        MediaSegmentType.Intro,
        MediaSegmentType.Preview,
        MediaSegmentType.Recap,
        MediaSegmentType.Commercial,
        MediaSegmentType.Outro
    ].map(segmentType => {
        const segmentTypeLabel = globalize.translate('LabelMediaSegmentsType', globalize.translate(`MediaSegmentType.${segmentType}`));
        const id = getId(segmentType);
        selectedValues[id] = getMediaSegmentAction(userSettings, segmentType);
        return `<div class="selectContainer">
<select is="emby-select" id="${id}" class="segmentTypeAction" label="${segmentTypeLabel}">
    ${actionOptions}
</select>
</div>`;
    }).join('');

    container.innerHTML = segmentSettings;

    Object.entries(selectedValues)
        .forEach(([id, value]) => {
            const field = container.querySelector(`#${id}`);
            if (field) field.value = value;
        });
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

    if (browser.safari) {
        context.querySelector('.fldEnableHi10p').classList.remove('hide');
    }

    // Show hls segment length setting for webOS only, as the setting only aims to fix an issue on that platform.
    if (browser.web0s) {
        context.querySelector('.fldLimitSegmentLength').classList.remove('hide');
    }

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
    context.querySelector('.chkLimitSegmentLength').checked = userSettings.limitSegmentLength();
    context.querySelector('.chkEnableDts').checked = appSettings.enableDts();
    context.querySelector('.chkEnableTrueHd').checked = appSettings.enableTrueHd();
    context.querySelector('.chkEnableHi10p').checked = appSettings.enableHi10p();
    context.querySelector('.chkEnableCinemaMode').checked = userSettings.enableCinemaMode();
    context.querySelector('#selectAudioNormalization').value = userSettings.selectAudioNormalization();
    context.querySelector('.chkEnableNextVideoOverlay').checked = userSettings.enableNextVideoInfoOverlay();
    context.querySelector('.chkRememberAudioSelections').checked = user.Configuration.RememberAudioSelections || false;
    context.querySelector('.chkRememberSubtitleSelections').checked = user.Configuration.RememberSubtitleSelections || false;
    context.querySelector('.chkExternalVideoPlayer').checked = appSettings.enableSystemExternalPlayers();
    context.querySelector('.chkLimitSupportedVideoResolution').checked = appSettings.limitSupportedVideoResolution();
    context.querySelector('#selectPreferredTranscodeVideoCodec').value = appSettings.preferredTranscodeVideoCodec();
    context.querySelector('#selectPreferredTranscodeVideoAudioCodec').value = appSettings.preferredTranscodeVideoAudioCodec();
    context.querySelector('.chkDisableVbrAudioEncoding').checked = appSettings.disableVbrAudio();
    context.querySelector('.chkAlwaysRemuxFlac').checked = appSettings.alwaysRemuxFlac();
    context.querySelector('.chkAlwaysRemuxMp3').checked = appSettings.alwaysRemuxMp3();

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

    const mediaSegmentContainer = context.querySelector('.mediaSegmentActionContainer');
    populateMediaSegments(mediaSegmentContainer, userSettings);

    loading.hide();
}

function saveUser(context, user, userSettingsInstance, apiClient) {
    appSettings.enableSystemExternalPlayers(context.querySelector('.chkExternalVideoPlayer').checked);

    appSettings.maxChromecastBitrate(context.querySelector('.selectChromecastVideoQuality').value);
    appSettings.maxVideoWidth(context.querySelector('.selectMaxVideoWidth').value);
    appSettings.limitSupportedVideoResolution(context.querySelector('.chkLimitSupportedVideoResolution').checked);
    appSettings.preferredTranscodeVideoCodec(context.querySelector('#selectPreferredTranscodeVideoCodec').value);
    appSettings.preferredTranscodeVideoAudioCodec(context.querySelector('#selectPreferredTranscodeVideoAudioCodec').value);

    appSettings.enableDts(context.querySelector('.chkEnableDts').checked);
    appSettings.enableTrueHd(context.querySelector('.chkEnableTrueHd').checked);

    appSettings.enableHi10p(context.querySelector('.chkEnableHi10p').checked);
    appSettings.disableVbrAudio(context.querySelector('.chkDisableVbrAudioEncoding').checked);
    appSettings.alwaysRemuxFlac(context.querySelector('.chkAlwaysRemuxFlac').checked);
    appSettings.alwaysRemuxMp3(context.querySelector('.chkAlwaysRemuxMp3').checked);

    setMaxBitrateFromField(context.querySelector('.selectVideoInNetworkQuality'), true, 'Video');
    setMaxBitrateFromField(context.querySelector('.selectVideoInternetQuality'), false, 'Video');
    setMaxBitrateFromField(context.querySelector('.selectMusicInternetQuality'), false, 'Audio');

    userSettingsInstance.allowedAudioChannels(context.querySelector('#selectAllowedAudioChannels').value);
    user.Configuration.AudioLanguagePreference = context.querySelector('#selectAudioLanguage').value;
    user.Configuration.PlayDefaultAudioTrack = context.querySelector('.chkPlayDefaultAudioTrack').checked;
    user.Configuration.EnableNextEpisodeAutoPlay = context.querySelector('.chkEpisodeAutoPlay').checked;
    userSettingsInstance.preferFmp4HlsContainer(context.querySelector('.chkPreferFmp4HlsContainer').checked);
    userSettingsInstance.limitSegmentLength(context.querySelector('.chkLimitSegmentLength').checked);
    userSettingsInstance.enableCinemaMode(context.querySelector('.chkEnableCinemaMode').checked);
    userSettingsInstance.selectAudioNormalization(context.querySelector('#selectAudioNormalization').value);
    userSettingsInstance.enableNextVideoInfoOverlay(context.querySelector('.chkEnableNextVideoOverlay').checked);
    user.Configuration.RememberAudioSelections = context.querySelector('.chkRememberAudioSelections').checked;
    user.Configuration.RememberSubtitleSelections = context.querySelector('.chkRememberSubtitleSelections').checked;
    user.Configuration.CastReceiverId = context.querySelector('.selectChromecastVersion').value;
    userSettingsInstance.skipForwardLength(context.querySelector('.selectSkipForwardLength').value);
    userSettingsInstance.skipBackLength(context.querySelector('.selectSkipBackLength').value);

    const segmentTypeActions = context.querySelectorAll('.segmentTypeAction') || [];
    Array.prototype.forEach.call(segmentTypeActions, actionEl => {
        userSettingsInstance.set(actionEl.id, actionEl.value, false);
    });

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

function embed(options, self) {
    options.element.innerHTML = globalize.translateHtml(template, 'core');

    options.element.querySelector('form').addEventListener('submit', onSubmit.bind(self));

    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }

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
