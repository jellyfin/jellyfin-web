import globalize from '../../scripts/globalize';
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
import '../../assets/css/flexstyles.scss';
import './subtitlesettings.scss';
import ServerConnections from '../ServerConnections';
import toast from '../toast/toast';
import template from './subtitlesettings.template.html';

/**
 * Subtitle settings.
 * @module components/subtitleSettings/subtitleSettings
 */

function getSubtitleAppearanceObject(context) {
    return {
        textSize: context.querySelector('#selectTextSize').value,
        textWeight: context.querySelector('#selectTextWeight').value,
        dropShadow: context.querySelector('#selectDropShadow').value,
        font: context.querySelector('#selectFont').value,
        textBackground: context.querySelector('#inputTextBackground').value,
        textColor: layoutManager.tv ? context.querySelector('input[name="subcolor"]:checked').value : context.querySelector('#inputTextColor').value,
        verticalPosition: context.querySelector('#sliderVerticalPosition').value
    };
}

function loadForm(context, user, userSettings, appearanceSettings, apiClient) {
    apiClient.getCultures().then(function (allCultures) {
        if (appHost.supports('subtitleburnsettings') && user.Policy.EnableVideoPlaybackTranscoding) {
            context.querySelector('.fldBurnIn').classList.remove('hide');
        }

        const selectSubtitleLanguage = context.querySelector('#selectSubtitleLanguage');

        settingsHelper.populateLanguages(selectSubtitleLanguage, allCultures);

        // 140 Web safe colors from https://www.w3schools.com/colors/colors_names.asp
        const colors = ['000000', '000080', '00008b', '0000cd', '0000ff', '006400', '008000', '008080', '008b8b', '00bfff', '00ced1',
            '00fa9a', '00ff00', '00ff7f', '00ffff', '191970', '1e90ff', '20b2aa', '228b22', '2e8b57', '2f4f4f', '32cd32', '3cb371',
            '40e0d0', '4169e1', '4682b4', '483d8b', '48d1cc', '4b0082', '556b2f', '5f9ea0', '6495ed', '663399', '66cdaa', '696969',
            '6a5acd', '6b8e23', '708090', '778899', '7b68ee', '7cfc00', '7fff00', '7fffd4', '800000', '800080', '808000', '808080',
            '87ceeb', '87cefa', '8a2be2', '8b0000', '8b008b', '8b4513', '8fbc8f', '90ee90', '9370db', '9400d3', '98fb98', '9932cc',
            '9acd32', 'a0522d', 'a52a2a', 'a9a9a9', 'add8e6', 'adff2f', 'afeeee', 'b0c4de', 'b0e0e6', 'b22222', 'b8860b', 'ba55d3',
            'bc8f8f', 'bdb76b', 'c0c0c0', 'c71585', 'cd5c5c', 'cd853f', 'd2691e', 'd2b48c', 'd3d3d3', 'd8bfd8', 'da70d6', 'daa520',
            'db7093', 'dc143c', 'dcdcdc', 'dda0dd', 'deb887', 'e0ffff', 'e6e6fa', 'e9967a', 'ee82ee', 'eee8aa', 'f08080', 'f0e68c',
            'f0f8ff', 'f0fff0', 'f0ffff', 'f4a460', 'f5deb3', 'f5f5dc', 'f5f5f5', 'f5fffa', 'f8f8ff', 'fa8072', 'faebd7', 'faf0e6',
            'fafad2', 'fdf5e6', 'ff0000', 'ff00ff', 'ff1493', 'ff4500', 'ff6347', 'ff69b4', 'ff7f50', 'ff8c00', 'ffa07a', 'ffa500',
            'ffb6c1', 'ffc0cb', 'ffd700', 'ffdab9', 'ffdead', 'ffe4b5', 'ffe4c4', 'ffe4e1', 'ffebcd', 'ffefd5', 'fff0f5', 'fff5ee',
            'fff8dc', 'fffacd', 'fffaf0', 'fffafa', 'ffff00', 'ffffe0', 'fffff0', 'ffffff'];
        let colorsHtml = '';
        colors.forEach(color => {
            colorsHtml += `<input type="radio" name="subcolor" id="subcolor_${color}" value="#${color}" />\n`
            + `<label class="sublabel" for="subcolor_${color}"><span style="background-color: #${color};"></span></label>\n`;
        });
        context.querySelector('#subtiteColorsContainer').innerHTML = colorsHtml;

        selectSubtitleLanguage.value = user.Configuration.SubtitleLanguagePreference || '';
        context.querySelector('#selectSubtitlePlaybackMode').value = user.Configuration.SubtitleMode || '';

        context.querySelector('#selectSubtitlePlaybackMode').dispatchEvent(new CustomEvent('change', {}));

        context.querySelector('#selectTextSize').value = appearanceSettings.textSize || '';
        context.querySelector('#selectTextWeight').value = appearanceSettings.textWeight || 'normal';
        context.querySelector('#selectDropShadow').value = appearanceSettings.dropShadow || '';
        context.querySelector('#inputTextBackground').value = appearanceSettings.textBackground || 'transparent';
        const colorName = appearanceSettings.textColor?.substring(1) || 'ffffff';
        const colorButton = context.querySelector('#subcolor_' + colorName) || context.querySelector('#subcolor_ffffff');
        colorButton.checked = true;
        context.querySelector('#inputTextColor').value = appearanceSettings.textColor || '#ffffff';
        context.querySelector('#selectFont').value = appearanceSettings.font || '';
        context.querySelector('#sliderVerticalPosition').value = appearanceSettings.verticalPosition;

        context.querySelector('#selectSubtitleBurnIn').value = appSettings.get('subtitleburnin') || '';

        onAppearanceFieldChange({
            target: context.querySelector('#selectTextSize')
        });

        loading.hide();
    });
}

function saveUser(context, user, userSettingsInstance, appearanceKey, apiClient) {
    let appearanceSettings = userSettingsInstance.getSubtitleAppearanceSettings(appearanceKey);
    appearanceSettings = Object.assign(appearanceSettings, getSubtitleAppearanceObject(context));

    userSettingsInstance.setSubtitleAppearanceSettings(appearanceSettings, appearanceKey);

    user.Configuration.SubtitleLanguagePreference = context.querySelector('#selectSubtitleLanguage').value;
    user.Configuration.SubtitleMode = context.querySelector('#selectSubtitlePlaybackMode').value;

    return apiClient.updateUserConfiguration(user.Id, user.Configuration);
}

function save(instance, context, userId, userSettings, apiClient, enableSaveConfirmation) {
    loading.show();

    appSettings.set('subtitleburnin', context.querySelector('#selectSubtitleBurnIn').value);

    apiClient.getUser(userId).then(function (user) {
        saveUser(context, user, userSettings, instance.appearanceKey, apiClient).then(function () {
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

function embed(options, self) {
    options.element.classList.add('subtitlesettings');
    options.element.innerHTML = globalize.translateHtml(template, 'core');

    options.element.querySelector('form').addEventListener('submit', self.onSubmit.bind(self));

    options.element.querySelector('#selectSubtitlePlaybackMode').addEventListener('change', onSubtitleModeChange);
    options.element.querySelector('#selectTextSize').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#selectTextWeight').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#selectDropShadow').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#selectFont').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#subtiteColorsContainer').addEventListener('click', onAppearanceFieldChange);
    options.element.querySelector('#inputTextColor').addEventListener('change', onAppearanceFieldChange);
    options.element.querySelector('#inputTextBackground').addEventListener('change', onAppearanceFieldChange);

    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }

    if (appHost.supports('subtitleappearancesettings')) {
        options.element.querySelector('.subtitleAppearanceSection').classList.remove('hide');

        self._fullPreview = options.element.querySelector('.subtitleappearance-fullpreview');
        self._refFullPreview = 0;

        const sliderVerticalPosition = options.element.querySelector('#sliderVerticalPosition');
        sliderVerticalPosition.addEventListener('input', onAppearanceFieldChange);
        sliderVerticalPosition.addEventListener('input', () => showSubtitlePreview.call(self));

        const eventPrefix = window.PointerEvent ? 'pointer' : 'mouse';
        sliderVerticalPosition.addEventListener(`${eventPrefix}enter`, () => showSubtitlePreview.call(self, true));
        sliderVerticalPosition.addEventListener(`${eventPrefix}leave`, () => hideSubtitlePreview.call(self, true));

        if (layoutManager.tv) {
            sliderVerticalPosition.addEventListener('focus', () => showSubtitlePreview.call(self, true));
            sliderVerticalPosition.addEventListener('blur', () => hideSubtitlePreview.call(self, true));

            // Give CustomElements time to attach
            setTimeout(() => {
                sliderVerticalPosition.classList.add('focusable');
                sliderVerticalPosition.enableKeyboardDragging();
            }, 0);

            // Replace color picker
            dom.parentWithTag(options.element.querySelector('#inputTextColor'), 'DIV').classList.add('hide');
            dom.parentWithTag(options.element.querySelector('#tvSubtiteColorsContainer'), 'DIV').classList.remove('hide');
        }

        options.element.querySelector('.chkPreview').addEventListener('change', (e) => {
            if (e.target.checked) {
                showSubtitlePreview.call(self, true);
            } else {
                hideSubtitlePreview.call(self, true);
            }
        });
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

                loadForm(context, user, userSettings, appearanceSettings, apiClient);
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
