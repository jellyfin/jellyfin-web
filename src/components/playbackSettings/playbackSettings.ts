import escapeHTML from 'escape-html';

import { MediaSegmentAction } from 'apps/stable/features/playback/constants/mediaSegmentAction';
import { MediaSegmentType } from '@jellyfin/sdk/lib/generated-client/models/media-segment-type';
import { getId, getMediaSegmentAction } from 'apps/stable/features/playback/utils/mediaSegmentSettings';
import { AppFeature } from 'constants/appFeature';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import appSettings from '../../scripts/settings/appSettings';
import { safeAppHost } from '../apphost';
import browser from '../../scripts/browser';
import focusManager from '../focusManager';
import qualityoptions from '../qualityOptions';
import globalize from '../../lib/globalize';
import loading from '../loading/loading';
import Events from '../../utils/events';
import toast from '../toast/toast';
import template from './playbackSettings.template.html'; // HTML template
import { getVisualizerInputValues, setVisualizerSettings, visualizerSettings } from 'components/visualizer/visualizers.logic';

import '../../elements/emby-select/emby-select';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-slider/emby-slider';

interface PlaybackSettingsOptions {
    element: HTMLElement;
    userId: string;
    serverId: string;
    userSettings: any; // UserSettings instance
    enableSaveButton?: boolean;
    enableSaveConfirmation?: boolean;
    autoFocus?: boolean;
}

interface User {
    Id: string | undefined;
    Name: string | undefined;
    Policy: {
        EnableVideoPlaybackTranscoding: boolean;
        EnableAudioPlaybackTranscoding: boolean;
        EnablePlaybackRemuxing: boolean;
        EnableContentDeletion: boolean;
        EnableContentDownloading: boolean;
        EnableSyncTranscoding: boolean;
        EnableMediaConversion: boolean;
        EnablePublicSharing: boolean;
        EnableLiveTvManagement: boolean;
        EnableLiveTvAccess: boolean;
        BlockedTags: string[];
        EnableUserPreferenceAccess: boolean;
        AccessSchedules: any[];
        BlockUnratedItems: any[];
        EnableRemoteControlOfOtherUsers: boolean;
        EnableSharedDeviceControl: boolean;
        EnableRemoteAccess: boolean;
        [key: string]: any;
    };
    [key: string]: any;
}

interface SystemInfo {
    Version: string;
    ProductName: string;
    OperatingSystem: string;
    Id: string;
    StartupWizardCompleted: boolean;
    [key: string]: any;
}

interface ApiClient {
    getUser(userId: string): Promise<User>;
    getSystemInfo(): Promise<SystemInfo>;
    [key: string]: any;
}

function fillSkipLengths(select: HTMLSelectElement): void {
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

function populateLanguages(select: HTMLSelectElement, languages: any[]): void {
    let html = '';

    html += `<option value=''>${globalize.translate('AnyLanguage')}</option>`;

    for (let i = 0, length = languages.length; i < length; i++) {
        const culture = languages[i];

        html += `<option value='${culture.ThreeLetterISOLanguageName}'>${culture.DisplayName}</option>`;
    }

    select.innerHTML = html;
}

function populateMediaSegments(container: HTMLElement, userSettings: any): void {
    const selectedValues: Record<string, MediaSegmentAction> = {};
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
            const field = container.querySelector(`#${id}`) as HTMLSelectElement;
            if (field) field.value = value;
        });
}

function fillQuality(select: HTMLSelectElement, isInNetwork: boolean, mediatype: string, maxVideoWidth?: number): void {
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

    select.innerHTML = options.map((i: any) => {
        // render empty string instead of 0 for the auto option
        return `<option value="${i.bitrate || ''}">${i.name}</option>`;
    }).join('');
}

function setMaxBitrateIntoField(select: HTMLSelectElement, isInNetwork: boolean, mediatype: string): void {
    fillQuality(select, isInNetwork, mediatype);

    if (appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype)) {
        select.value = '';
    } else {
        select.value = appSettings.maxStreamingBitrate(isInNetwork, mediatype);
    }
}

function fillChromecastQuality(select: HTMLSelectElement, maxVideoWidth?: number): void {
    const options = qualityoptions.getVideoQualityOptions({

        currentMaxBitrate: appSettings.maxChromecastBitrate(),
        isAutomaticBitrateEnabled: !appSettings.maxChromecastBitrate(),
        enableAuto: true,
        maxVideoWidth
    });

    select.innerHTML = options.map((i: any) => {
        // render empty string instead of 0 for the auto option
        return `<option value="${i.bitrate || ''}">${i.name}</option>`;
    }).join('');

    select.value = appSettings.maxChromecastBitrate() || '';
}

function setMaxBitrateFromField(select: HTMLSelectElement, isInNetwork: boolean, mediatype: string): void {
    if (select.value) {
        appSettings.maxStreamingBitrate(isInNetwork, mediatype, select.value);
        appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype, false);
    } else {
        appSettings.enableAutomaticBitrateDetection(isInNetwork, mediatype, true);
    }
}

function showHideQualityFields(context: HTMLElement, user: User, apiClient: ApiClient): void {
    if (user.Policy.EnableVideoPlaybackTranscoding) {
        context.querySelector('.videoQualitySection')?.classList.remove('hide');
    } else {
        context.querySelector('.videoQualitySection')?.classList.add('hide');
    }

    if (safeAppHost.supports(AppFeature.MultiServer)) {
        context.querySelector('.fldVideoInNetworkQuality')?.classList.remove('hide');
        context.querySelector('.fldVideoInternetQuality')?.classList.remove('hide');

        if (user.Policy.EnableAudioPlaybackTranscoding) {
            context.querySelector('.musicQualitySection')?.classList.remove('hide');
        } else {
            context.querySelector('.musicQualitySection')?.classList.add('hide');
        }

        return;
    }

    apiClient.getEndpointInfo().then(endpointInfo => {
        if (endpointInfo.IsInNetwork) {
            context.querySelector('.fldVideoInNetworkQuality')?.classList.remove('hide');

            context.querySelector('.fldVideoInternetQuality')?.classList.add('hide');
            context.querySelector('.musicQualitySection')?.classList.add('hide');
        } else {
            context.querySelector('.fldVideoInNetworkQuality')?.classList.add('hide');

            context.querySelector('.fldVideoInternetQuality')?.classList.remove('hide');

            if (user.Policy.EnableAudioPlaybackTranscoding) {
                context.querySelector('.musicQualitySection')?.classList.remove('hide');
            } else {
                context.querySelector('.musicQualitySection')?.classList.add('hide');
            }
        }
    });
}

function loadForm(context: HTMLElement, user: User, userSettings: any, systemInfo: SystemInfo, apiClient: ApiClient): void {
    const loggedInUserId = apiClient.getCurrentUserId();
    const userId = user.Id;

    showHideQualityFields(context, user, apiClient);

    if (browser.safari) {
        context.querySelector('.fldEnableHi10p')?.classList.remove('hide');
    }

    // Show hls segment length setting for webOS only, as the setting only aims to fix an issue on that platform.
    if (browser.web0s) {
        context.querySelector('.fldLimitSegmentLength')?.classList.remove('hide');
    }

    (context.querySelector('#selectAllowedAudioChannels') as HTMLSelectElement).value = userSettings.allowedAudioChannels();

    apiClient.getCultures().then(allCultures => {
        populateLanguages(context.querySelector('#selectAudioLanguage') as HTMLSelectElement, allCultures);

        (context.querySelector('#selectAudioLanguage') as HTMLSelectElement).value = user.Configuration.AudioLanguagePreference || '';
        (context.querySelector('.chkEpisodeAutoPlay') as HTMLInputElement).checked = user.Configuration.EnableNextEpisodeAutoPlay || false;
    });

    if (safeAppHost.supports(AppFeature.ExternalPlayerIntent) && userId === loggedInUserId) {
        context.querySelector('.fldExternalPlayer')?.classList.remove('hide');
    } else {
        context.querySelector('.fldExternalPlayer')?.classList.add('hide');
    }

    if (userId === loggedInUserId && (user.Policy.EnableVideoPlaybackTranscoding || user.Policy.EnableAudioPlaybackTranscoding)) {
        context.querySelector('.qualitySections')?.classList.remove('hide');

        if (safeAppHost.supports(AppFeature.Chromecast) && user.Policy.EnableVideoPlaybackTranscoding) {
            context.querySelector('.fldChromecastQuality')?.classList.remove('hide');
        } else {
            context.querySelector('.fldChromecastQuality')?.classList.add('hide');
        }
    } else {
        context.querySelector('.qualitySections')?.classList.add('hide');
        context.querySelector('.fldChromecastQuality')?.classList.add('hide');
    }

    (context.querySelector('.chkPlayDefaultAudioTrack') as HTMLInputElement).checked = user.Configuration.PlayDefaultAudioTrack || false;
    (context.querySelector('.chkPreferFmp4HlsContainer') as HTMLInputElement).checked = userSettings.preferFmp4HlsContainer();
    (context.querySelector('.chkLimitSegmentLength') as HTMLInputElement).checked = userSettings.limitSegmentLength();
    (context.querySelector('.chkEnableDts') as HTMLInputElement).checked = appSettings.enableDts();
    (context.querySelector('.chkEnableTrueHd') as HTMLInputElement).checked = appSettings.enableTrueHd();
    (context.querySelector('.chkEnableHi10p') as HTMLInputElement).checked = appSettings.enableHi10p();
    (context.querySelector('.chkEnableCinemaMode') as HTMLInputElement).checked = userSettings.enableCinemaMode();
    (context.querySelector('#selectAudioNormalization') as HTMLSelectElement).value = userSettings.selectAudioNormalization();
    (context.querySelector('.chkEnableNextVideoOverlay') as HTMLInputElement).checked = userSettings.enableNextVideoInfoOverlay();
    (context.querySelector('.chkRememberAudioSelections') as HTMLInputElement).checked = user.Configuration.RememberAudioSelections || false;
    (context.querySelector('.chkRememberSubtitleSelections') as HTMLInputElement).checked = user.Configuration.RememberSubtitleSelections || false;
    (context.querySelector('.chkExternalVideoPlayer') as HTMLInputElement).checked = appSettings.enableSystemExternalPlayers();
    (context.querySelector('.chkLimitSupportedVideoResolution') as HTMLInputElement).checked = appSettings.limitSupportedVideoResolution();
    (context.querySelector('#selectPreferredTranscodeVideoCodec') as HTMLSelectElement).value = appSettings.preferredTranscodeVideoCodec();
    (context.querySelector('#selectPreferredTranscodeVideoAudioCodec') as HTMLSelectElement).value = appSettings.preferredTranscodeVideoAudioCodec();
    (context.querySelector('.chkDisableVbrAudioEncoding') as HTMLInputElement).checked = appSettings.disableVbrAudio();
    (context.querySelector('.chkAlwaysRemuxFlac') as HTMLInputElement).checked = appSettings.alwaysRemuxFlac();
    (context.querySelector('.chkAlwaysRemuxMp3') as HTMLInputElement).checked = appSettings.alwaysRemuxMp3();

    setMaxBitrateIntoField(context.querySelector('.selectVideoInNetworkQuality') as HTMLSelectElement, true, 'Video');
    setMaxBitrateIntoField(context.querySelector('.selectVideoInternetQuality') as HTMLSelectElement, false, 'Video');
    setMaxBitrateIntoField(context.querySelector('.selectMusicInternetQuality') as HTMLSelectElement, false, 'Audio');

    fillChromecastQuality(context.querySelector('.selectChromecastVideoQuality') as HTMLSelectElement);

    const selectChromecastVersion = context.querySelector('.selectChromecastVersion') as HTMLSelectElement;
    let ccAppsHtml = '';
    for (const app of systemInfo.CastReceiverApplications || []) {
        ccAppsHtml += `<option value='${escapeHTML(app.Id)}'>${escapeHTML(app.Name)}</option>`;
    }
    selectChromecastVersion.innerHTML = ccAppsHtml;
    selectChromecastVersion.value = user.Configuration.CastReceiverId || '';

    const selectMaxVideoWidth = context.querySelector('.selectMaxVideoWidth') as HTMLSelectElement;
    selectMaxVideoWidth.value = String(appSettings.maxVideoWidth());

    const selectSkipForwardLength = context.querySelector('.selectSkipForwardLength') as HTMLSelectElement;
    fillSkipLengths(selectSkipForwardLength);
    selectSkipForwardLength.value = String(userSettings.skipForwardLength());

    const selectSkipBackLength = context.querySelector('.selectSkipBackLength') as HTMLSelectElement;
    fillSkipLengths(selectSkipBackLength);
    selectSkipBackLength.value = String(userSettings.skipBackLength());

    const mediaSegmentContainer = context.querySelector('.mediaSegmentActionContainer') as HTMLElement;
    populateMediaSegments(mediaSegmentContainer, userSettings);

    // Load visualizer and crossfade settings
    const crossfadeDuration = userSettings.crossfadeDuration();
    (context.querySelector('#sliderCrossfadeDuration') as HTMLInputElement).value = Number.isFinite(crossfadeDuration) ?
        String(crossfadeDuration) :
        '3';

    let visualizerConfig: any;
    try {
        visualizerConfig = userSettings.visualizerConfiguration();
        if (typeof visualizerConfig === 'string') {
            visualizerConfig = JSON.parse(visualizerConfig);
        }
    } catch (err) {
        console.warn('Failed to load visualizer configuration', err);
        visualizerConfig = {};
    }

    setVisualizerSettings(visualizerConfig);

    (context.querySelector('.chkEnableButterchurn') as HTMLInputElement).checked = !!visualizerSettings?.butterchurn?.enabled;
    (context.querySelector('#sliderButterchurnPresetInterval') as HTMLInputElement).value = String(visualizerSettings?.butterchurn?.presetInterval || 60);
    (context.querySelector('.chkEnableFrequencyAnalyzer') as HTMLInputElement).checked = !!visualizerSettings?.frequencyAnalyzer?.enabled;
    (context.querySelector('.chkEnableWavesurfer') as HTMLInputElement).checked = !!visualizerSettings?.waveSurfer?.enabled;

    loading.hide();
}

function saveUser(context: HTMLElement, user: User, userSettingsInstance: any, apiClient: ApiClient): Promise<any> {
    appSettings.enableSystemExternalPlayers((context.querySelector('.chkExternalVideoPlayer') as HTMLInputElement).checked);

    appSettings.maxChromecastBitrate((context.querySelector('.selectChromecastVideoQuality') as HTMLSelectElement).value);
    appSettings.maxVideoWidth((context.querySelector('.selectMaxVideoWidth') as HTMLSelectElement).value);
    appSettings.limitSupportedVideoResolution((context.querySelector('.chkLimitSupportedVideoResolution') as HTMLInputElement).checked);
    appSettings.preferredTranscodeVideoCodec((context.querySelector('#selectPreferredTranscodeVideoCodec') as HTMLSelectElement).value);
    appSettings.preferredTranscodeVideoAudioCodec((context.querySelector('#selectPreferredTranscodeVideoAudioCodec') as HTMLSelectElement).value);

    appSettings.enableDts((context.querySelector('.chkEnableDts') as HTMLInputElement).checked);
    appSettings.enableTrueHd((context.querySelector('.chkEnableTrueHd') as HTMLInputElement).checked);

    appSettings.enableHi10p((context.querySelector('.chkEnableHi10p') as HTMLInputElement).checked);
    appSettings.disableVbrAudio((context.querySelector('.chkDisableVbrAudioEncoding') as HTMLInputElement).checked);
    appSettings.alwaysRemuxFlac((context.querySelector('.chkAlwaysRemuxFlac') as HTMLInputElement).checked);
    appSettings.alwaysRemuxMp3((context.querySelector('.chkAlwaysRemuxMp3') as HTMLInputElement).checked);

    setMaxBitrateFromField(context.querySelector('.selectVideoInNetworkQuality') as HTMLSelectElement, true, 'Video');
    setMaxBitrateFromField(context.querySelector('.selectVideoInternetQuality') as HTMLSelectElement, false, 'Video');
    setMaxBitrateFromField(context.querySelector('.selectMusicInternetQuality') as HTMLSelectElement, false, 'Audio');

    userSettingsInstance.allowedAudioChannels((context.querySelector('#selectAllowedAudioChannels') as HTMLSelectElement).value);
    user.Configuration.AudioLanguagePreference = (context.querySelector('#selectAudioLanguage') as HTMLSelectElement).value;
    user.Configuration.PlayDefaultAudioTrack = (context.querySelector('.chkPlayDefaultAudioTrack') as HTMLInputElement).checked;
    user.Configuration.EnableNextEpisodeAutoPlay = (context.querySelector('.chkEpisodeAutoPlay') as HTMLInputElement).checked;
    userSettingsInstance.preferFmp4HlsContainer((context.querySelector('.chkPreferFmp4HlsContainer') as HTMLInputElement).checked);
    userSettingsInstance.limitSegmentLength((context.querySelector('.chkLimitSegmentLength') as HTMLInputElement).checked);
    userSettingsInstance.enableCinemaMode((context.querySelector('.chkEnableCinemaMode') as HTMLInputElement).checked);
    userSettingsInstance.selectAudioNormalization((context.querySelector('#selectAudioNormalization') as HTMLSelectElement).value);
    userSettingsInstance.enableNextVideoInfoOverlay((context.querySelector('.chkEnableNextVideoOverlay') as HTMLInputElement).checked);
    user.Configuration.RememberAudioSelections = (context.querySelector('.chkRememberAudioSelections') as HTMLInputElement).checked;
    user.Configuration.RememberSubtitleSelections = (context.querySelector('.chkRememberSubtitleSelections') as HTMLInputElement).checked;
    user.Configuration.CastReceiverId = (context.querySelector('.selectChromecastVersion') as HTMLSelectElement).value;
    userSettingsInstance.skipForwardLength(Number((context.querySelector('.selectSkipForwardLength') as HTMLSelectElement).value));
    userSettingsInstance.skipBackLength(Number((context.querySelector('.selectSkipBackLength') as HTMLSelectElement).value));

    const segmentTypeActions = context.querySelectorAll('.segmentTypeAction');
    segmentTypeActions.forEach(actionEl => {
        userSettingsInstance.set((actionEl as HTMLSelectElement).id, (actionEl as HTMLSelectElement).value, false);
    });

    // Save crossfade duration
    const crossfadeDuration = parseFloat((context.querySelector('#sliderCrossfadeDuration') as HTMLInputElement).value);
    userSettingsInstance.crossfadeDuration(crossfadeDuration);

    userSettingsInstance.visualizerConfiguration(getVisualizerInputValues(context));

    return apiClient.updateUserConfiguration(user.Id, user.Configuration);
}

function onSubmit(): Promise<any> {
    const self = this as PlaybackSettings;
    const context = self.options.element;
    const userId = self.options.userId;
    const apiClient = ServerConnections.getApiClient(self.options.serverId);
    const userSettingsInstance = self.options.userSettings;

    loading.show();

    return apiClient.getUser(userId).then(user => {
        return saveUser(context, user, userSettingsInstance, apiClient);
    }).then(() => {
        loading.hide();
        toast(globalize.translate('SettingsSaved'));
    }, () => {
        loading.hide();
        toast(globalize.translate('ErrorDefault'));
    });
}

class PlaybackSettings {
    options: PlaybackSettingsOptions;
    dataLoaded: boolean = false;

    constructor(options: PlaybackSettingsOptions) {
        this.options = options;
        // Assuming embed is defined elsewhere
        (globalThis as any).embed(options, this);
    }

    loadData(): void {
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

    submit(): Promise<any> {
        return onSubmit.call(this);
    }

    destroy(): void {
        this.options = null as any;
    }
}

export default PlaybackSettings;