import { AppFeature } from 'constants/appFeature';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { appHost } from '../apphost';
import appSettings from '../../scripts/settings/appSettings';
import focusManager from '../focusManager';
import layoutManager from '../layoutManager';
import loading from '../loading/loading';
import subtitleAppearanceHelper from './subtitleappearancehelper';
import settingsHelper from '../settingshelper';
import dom from '../../scripts/dom';
import Events from '../../utils/events.ts';

import '../listview/listview.scss';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-slider/emby-slider';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../styles/flexstyles.scss';
import './subtitlesettings.scss';
import toast from '../toast/toast';
import template from './subtitlesettings.template.html';

/**
 * Subtitle settings.
 * @module components/subtitleSettings/subtitleSettings
 */
function getSubtitleAppearanceObject(context) {
    return {
        subtitleStyling: context.querySelector('#selectSubtitleStyling').value,
        textSize: context.querySelector('#selectTextSize').value,
        textWeight: context.querySelector('#selectTextWeight').value,
        dropShadow: context.querySelector('#selectDropShadow').value,
        font: context.querySelector('#selectFont').value,
        textBackground: context.querySelector('#inputTextBackground').value,
        textColor: layoutManager.tv ? context.querySelector('#selectTextColor').value : context.querySelector('#inputTextColor').value,
        verticalPosition: context.querySelector('#sliderVerticalPosition').value
    };
}

function getCustomSecondarySubtitlesEnabled(context) {
    return context.querySelector('.chkSecondary').checked;
}

function getSecondarySubtitleAppearanceObject(context) {
    return {
        subtitleStyling: context.querySelector('#selectSecondarySubtitleStyling').value,
        textSize: context.querySelector('#selectSecondaryTextSize').value,
        textWeight: context.querySelector('#selectSecondaryTextWeight').value,
        dropShadow: context.querySelector('#selectSecondaryDropShadow').value,
        font: context.querySelector('#selectSecondaryFont').value,
        textBackground: context.querySelector('#inputSecondaryTextBackground').value,
        textColor: layoutManager.tv ? context.querySelector('#selectSecondaryTextColor').value : context.querySelector('#inputSecondaryTextColor').value,
        verticalPosition: context.querySelector('#sliderSecondaryVerticalPosition').value
    };
}

function loadForm(context, user, userSettings, appearanceSettings, customSecondarySubtitlesEnabled, secondaryAppearanceSettings, apiClient) {
    apiClient.getCultures().then(function (allCultures) {
        if (appHost.supports(AppFeature.SubtitleBurnIn) && user.Policy.EnableVideoPlaybackTranscoding) {
            context.querySelector('.fldBurnIn').classList.remove('hide');
        }

        const selectSubtitleLanguage = context.querySelector('#selectSubtitleLanguage');

        settingsHelper.populateLanguages(selectSubtitleLanguage, allCultures);

        selectSubtitleLanguage.value = user.Configuration.SubtitleLanguagePreference || '';
        context.querySelector('#selectSubtitlePlaybackMode').value = user.Configuration.SubtitleMode || '';

        context.querySelector('#selectSubtitlePlaybackMode').dispatchEvent(new CustomEvent('change', {}));
        context.querySelector('#selectSubtitleStyling').value = appearanceSettings.subtitleStyling || 'Auto';
        context.querySelector('#selectSubtitleStyling').dispatchEvent(new CustomEvent('change', {}));
        context.querySelector('#selectTextSize').value = appearanceSettings.textSize || '';
        context.querySelector('#selectTextWeight').value = appearanceSettings.textWeight || 'normal';
        context.querySelector('#selectDropShadow').value = appearanceSettings.dropShadow || '';
        context.querySelector('#inputTextBackground').value = appearanceSettings.textBackground || 'transparent';
        context.querySelector('#selectTextColor').value = appearanceSettings.textColor || '#ffffff';
        context.querySelector('#inputTextColor').value = appearanceSettings.textColor || '#ffffff';
        context.querySelector('#selectFont').value = appearanceSettings.font || '';
        context.querySelector('#sliderVerticalPosition').value = appearanceSettings.verticalPosition;

        context.querySelector('#selectSecondarySubtitleStyling').value = secondaryAppearanceSettings.subtitleStyling || 'Auto';
        context.querySelector('#selectSecondarySubtitleStyling').dispatchEvent(new CustomEvent('change', {}));
        context.querySelector('#selectSecondaryTextSize').value = secondaryAppearanceSettings.textSize || '';
        context.querySelector('#selectSecondaryTextWeight').value = secondaryAppearanceSettings.textWeight || 'normal';
        context.querySelector('#selectSecondaryDropShadow').value = secondaryAppearanceSettings.dropShadow || '';
        context.querySelector('#inputSecondaryTextBackground').value = secondaryAppearanceSettings.textBackground || 'transparent';
        context.querySelector('#selectSecondaryTextColor').value = secondaryAppearanceSettings.textColor || '#ffffff';
        context.querySelector('#inputSecondaryTextColor').value = secondaryAppearanceSettings.textColor || '#ffffff';
        context.querySelector('#selectSecondaryFont').value = secondaryAppearanceSettings.font || '';
        context.querySelector('#sliderSecondaryVerticalPosition').value = secondaryAppearanceSettings.verticalPosition;

        context.querySelector('#selectSubtitleBurnIn').value = appSettings.get('subtitleburnin') || '';
        context.querySelector('#chkSubtitleRenderPgs').checked = appSettings.get('subtitlerenderpgs') === 'true';

        context.querySelector('#selectSubtitleBurnIn').dispatchEvent(new CustomEvent('change', {}));
        context.querySelector('#chkAlwaysBurnInSubtitleWhenTranscoding').checked = appSettings.alwaysBurnInSubtitleWhenTranscoding();

        onAppearanceFieldChange({
            target: context.querySelector('#selectTextSize')
        });

        onSecondaryAppearanceFieldChange({
            target: context.querySelector('#selectSecondaryTextSize')
        });

        loading.hide();
    });
}

function saveUser(context, user, userSettingsInstance, appearanceKey, customSecondarySubtitles, appearanceSecondaryKey, apiClient) {
    let appearanceSettings = userSettingsInstance.getSubtitleAppearanceSettings(appearanceKey);
    appearanceSettings = Object.assign(appearanceSettings, getSubtitleAppearanceObject(context));

    userSettingsInstance.setSubtitleAppearanceSettings(appearanceSettings, appearanceKey);

    let secondaryAppearanceSettings = userSettingsInstance.getSecondarySubtitleAppearanceSettings(appearanceSecondaryKey);
    secondaryAppearanceSettings = Object.assign(secondaryAppearanceSettings, getSecondarySubtitleAppearanceObject(context));

    userSettingsInstance.setSecondarySubtitleAppearanceSettings(secondaryAppearanceSettings, appearanceSecondaryKey);

    userSettingsInstance.setCustomSecondarySubtitlesEnabled(getCustomSecondarySubtitlesEnabled(context), customSecondarySubtitles);

    user.Configuration.SubtitleLanguagePreference = context.querySelector('#selectSubtitleLanguage').value;
    user.Configuration.SubtitleMode = context.querySelector('#selectSubtitlePlaybackMode').value;

    return apiClient.updateUserConfiguration(user.Id, user.Configuration);
}

function save(instance, context, userId, userSettings, apiClient, enableSaveConfirmation) {
    loading.show();

    appSettings.set('subtitleburnin', context.querySelector('#selectSubtitleBurnIn').value);
    appSettings.set('subtitlerenderpgs', context.querySelector('#chkSubtitleRenderPgs').checked);
    appSettings.alwaysBurnInSubtitleWhenTranscoding(context.querySelector('#chkAlwaysBurnInSubtitleWhenTranscoding').checked);

    apiClient.getUser(userId).then(function (user) {
        saveUser(context, user, userSettings, instance.appearanceKey, instance.customSecondarySubtitles, instance.appearanceSecondaryKey, apiClient).then(function () {
            loading.hide();
            if (enableSaveConfirmation) {
                toast(globalize.translate('SettingsSaved'));
            }

            Events.trigger(instance, 'saved');
        }, function () {
            loading.hide();
        });
    });
}

function onSubtitleModeChange(e) {
    const view = dom.parentWithClass(e.target, 'subtitlesettings');

    const subtitlesHelp = view.querySelectorAll('.subtitlesHelp');
    for (let i = 0, length = subtitlesHelp.length; i < length; i++) {
        subtitlesHelp[i].classList.add('hide');
    }
    view.querySelector('.subtitles' + this.value + 'Help').classList.remove('hide');
}

function onSubtitleStyleChange(e) {
    const view = dom.parentWithClass(e.target, 'subtitlesettings');

    const subtitleStylingHelperElements = view.querySelectorAll('.subtitleStylingHelp');
    subtitleStylingHelperElements.forEach((elem)=>{
        elem.classList.add('hide');
    });
    view.querySelector(`.subtitleStyling${this.value}Help`).classList.remove('hide');
}

function onSubtitleBurnInChange(e) {
    const view = dom.parentWithClass(e.target, 'subtitlesettings');
    const fieldRenderPgs = view.querySelector('.fldRenderPgs');

    // Pgs option is only available if burn-in mode is set to 'auto' (empty string)
    fieldRenderPgs.classList.toggle('hide', !!this.value);
}

function onAppearanceFieldChange(e) {
    const view = dom.parentWithClass(e.target, 'subtitlesettings');

    const appearanceSettings = getSubtitleAppearanceObject(view);

    const elements = {
        window: view.querySelector('.subtitleappearance-preview-window'),
        text: view.querySelector('.subtitleappearance-preview-text'),
        preview: true
    };

    subtitleAppearanceHelper.applyStyles(elements, appearanceSettings);

    subtitleAppearanceHelper.applyStyles({
        window: view.querySelector('.subtitleappearance-fullpreview-window'),
        text: view.querySelector('.subtitleappearance-fullpreview-text')
    }, appearanceSettings);
}

function onSecondaryAppearanceFieldChange(e) {
    const view = dom.parentWithClass(e.target, 'subtitlesettings');

    const appearanceSettings = getSecondarySubtitleAppearanceObject(view);

    const elements = {
        window: view.querySelector('.secondarysubtitleappearance-preview-window'),
        text: view.querySelector('.secondarysubtitleappearance-preview-text'),
        preview: true
    };

    subtitleAppearanceHelper.applyStyles(elements, appearanceSettings);

    subtitleAppearanceHelper.applyStyles({
        window: view.querySelector('.secondarysubtitleappearance-fullpreview-window'),
        text: view.querySelector('.secondarysubtitleappearance-fullpreview-text')
    }, appearanceSettings);
}

const subtitlePreviewDelay = 1000;
let subtitlePreviewTimer;

function showSubtitlePreview(persistent) {
    clearTimeout(subtitlePreviewTimer);

    this._fullPreview.classList.remove('subtitleappearance-fullpreview-hide');

    if (persistent) {
        this._refFullPreview++;
    }

    if (this._refFullPreview === 0) {
        subtitlePreviewTimer = setTimeout(hideSubtitlePreview.bind(this), subtitlePreviewDelay);
    }
}

function hideSubtitlePreview(persistent) {
    clearTimeout(subtitlePreviewTimer);

    if (persistent) {
        this._refFullPreview--;
    }

    if (this._refFullPreview === 0) {
        this._fullPreview.classList.add('subtitleappearance-fullpreview-hide');
    }
}

function showSecondarySubtitlePreview(persistent) {
    clearTimeout(subtitlePreviewTimer);

    this._fullSecondaryPreview.classList.remove('secondarysubtitleappearance-fullpreview-hide');

    if (persistent) {
        this._refFullSecondaryPreview++;
    }

    if (this._refFullSecondaryPreview === 0) {
        subtitlePreviewTimer = setTimeout(hideSecondarySubtitlePreview.bind(this), subtitlePreviewDelay);
    }
}

function hideSecondarySubtitlePreview(persistent) {
    clearTimeout(subtitlePreviewTimer);

    if (persistent) {
        this._refFullSecondaryPreview--;
    }

    if (this._refFullSecondaryPreview === 0) {
        this._fullSecondaryPreview.classList.add('secondarysubtitleappearance-fullpreview-hide');
    }
}

function embed(options, self) {
    options.element.classList.add('subtitlesettings');
    options.element.innerHTML = globalize.translateHtml(template, 'core');

    options.element.querySelector('form').addEventListener('submit', self.onSubmit.bind(self));

    options.element.querySelector('#selectSubtitlePlaybackMode').addEventListener('change', onSubtitleModeChange);
    options.element.querySelector('#selectSubtitleStyling').addEventListener('change', onSubtitleStyleChange);
    options.element.querySelector('#selectSubtitleBurnIn').addEventListener('change', onSubtitleBurnInChange);

    options.element.querySelector('#selectTextSize').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#selectTextWeight').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#selectDropShadow').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#selectFont').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#selectTextColor').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#inputTextColor').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#inputTextBackground').addEventListener('change', onAppearanceFieldChange);

    options.element.querySelector('#selectSecondaryTextSize').addEventListener('change', onSecondaryAppearanceFieldChange);
    options.element.querySelector('#selectSecondaryTextWeight').addEventListener('change', onSecondaryAppearanceFieldChange);
    options.element.querySelector('#selectSecondaryDropShadow').addEventListener('change', onSecondaryAppearanceFieldChange);
    options.element.querySelector('#selectSecondaryFont').addEventListener('change', onSecondaryAppearanceFieldChange);
    options.element.querySelector('#selectSecondaryTextColor').addEventListener('change', onSecondaryAppearanceFieldChange);
    options.element.querySelector('#inputSecondaryTextColor').addEventListener('change', onSecondaryAppearanceFieldChange);
    options.element.querySelector('#inputSecondaryTextBackground').addEventListener('change', onSecondaryAppearanceFieldChange);

    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }

    if (appHost.supports(AppFeature.SubtitleAppearance)) {
        options.element.querySelector('.subtitleAppearanceSection').classList.remove('hide');

        self._fullPreview = options.element.querySelector('.subtitleappearance-fullpreview');
        self._refFullPreview = 0;

        self._fullSecondaryPreview = options.element.querySelector('.secondarysubtitleappearance-fullpreview');
        self._refFullSecondaryPreview = 0;

        const sliderVerticalPosition = options.element.querySelector('#sliderVerticalPosition');
        sliderVerticalPosition.addEventListener('input', onAppearanceFieldChange);
        sliderVerticalPosition.addEventListener('input', () => showSubtitlePreview.call(self));

        const sliderSecondaryVerticalPosition = options.element.querySelector('#sliderSecondaryVerticalPosition');
        sliderSecondaryVerticalPosition.addEventListener('input', onSecondaryAppearanceFieldChange);
        sliderSecondaryVerticalPosition.addEventListener('input', () => showSecondarySubtitlePreview.call(self));

        const eventPrefix = window.PointerEvent ? 'pointer' : 'mouse';
        sliderVerticalPosition.addEventListener(`${eventPrefix}enter`, () => showSubtitlePreview.call(self, true));
        sliderVerticalPosition.addEventListener(`${eventPrefix}leave`, () => hideSubtitlePreview.call(self, true));

        sliderSecondaryVerticalPosition.addEventListener(`${eventPrefix}enter`, () => showSecondarySubtitlePreview.call(self, true));
        sliderSecondaryVerticalPosition.addEventListener(`${eventPrefix}leave`, () => hideSecondarySubtitlePreview.call(self, true));

        if (layoutManager.tv) {
            sliderVerticalPosition.addEventListener('focus', () => showSubtitlePreview.call(self, true));
            sliderVerticalPosition.addEventListener('blur', () => hideSubtitlePreview.call(self, true));

            sliderSecondaryVerticalPosition.addEventListener('focus', () => showSecondarySubtitlePreview.call(self, true));
            sliderSecondaryVerticalPosition.addEventListener('blur', () => hideSecondarySubtitlePreview.call(self, true));

            // Give CustomElements time to attach
            setTimeout(() => {
                sliderVerticalPosition.classList.add('focusable');
                sliderVerticalPosition.enableKeyboardDragging();

                sliderSecondaryVerticalPosition.classList.add('focusable');
                sliderSecondaryVerticalPosition.enableKeyboardDragging();
            }, 0);

            // Replace color picker
            dom.parentWithTag(options.element.querySelector('#inputTextColor'), 'DIV').classList.add('hide');
            dom.parentWithTag(options.element.querySelector('#selectTextColor'), 'DIV').classList.remove('hide');
            dom.parentWithTag(options.element.querySelector('#inputSecondaryTextColor'), 'DIV').classList.add('hide');
            dom.parentWithTag(options.element.querySelector('#selectSecondaryTextColor'), 'DIV').classList.remove('hide');
        }

        options.element.querySelector('.chkPreview').addEventListener('change', (e) => {
            if (e.target.checked) {
                showSubtitlePreview.call(self, true);
                showSecondarySubtitlePreview.call(self, true);
            } else {
                hideSubtitlePreview.call(self, true);
                hideSecondarySubtitlePreview.call(self, true);
            }
        });

        options.element.querySelector('.chkSecondary').addEventListener('change', (e) => {
            if (e.target.checked) {
                dom.parentWithTag(options.element.querySelector('#secondarySubtitleSection'), 'DIV').classList.remove('hide');
            } else {
                dom.parentWithTag(options.element.querySelector('#secondarySubtitleSection'), 'DIV').classList.add('hide');
            }
        });

        if (options.userSettings.getCustomSecondarySubtitlesEnabled(options.customSecondarySubtitles)) {
            options.element.querySelector('.chkSecondary').checked = true;
            dom.parentWithTag(options.element.querySelector('#secondarySubtitleSection'), 'DIV').classList.remove('hide');
        }
    }

    self.loadData();

    if (options.autoFocus) {
        focusManager.autoFocus(options.element);
    }
}

export class SubtitleSettings {
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

        apiClient.getUser(userId).then(function (user) {
            userSettings.setUserInfo(userId, apiClient).then(function () {
                self.dataLoaded = true;

                const appearanceSettings = userSettings.getSubtitleAppearanceSettings(self.options.appearanceKey);
                const customSecondarySubtitlesEnabled = userSettings.getCustomSecondarySubtitlesEnabled(self.options.customSecondarySubtitles);
                const secondaryAppearanceSettings = userSettings.getSecondarySubtitleAppearanceSettings(self.options.appearanceSecondaryKey);

                loadForm(context, user, userSettings, appearanceSettings, customSecondarySubtitlesEnabled, secondaryAppearanceSettings, apiClient);
            });
        });
    }

    submit() {
        this.onSubmit(null);
    }

    destroy() {
        this.options = null;
    }

    onSubmit(e) {
        const self = this;
        const apiClient = ServerConnections.getApiClient(self.options.serverId);
        const userId = self.options.userId;
        const userSettings = self.options.userSettings;

        userSettings.setUserInfo(userId, apiClient).then(function () {
            const enableSaveConfirmation = self.options.enableSaveConfirmation;
            save(self, self.options.element, userId, userSettings, apiClient, enableSaveConfirmation);
        });

        // Disable default form submission
        if (e) {
            e.preventDefault();
        }
        return false;
    }
}

export default SubtitleSettings;
