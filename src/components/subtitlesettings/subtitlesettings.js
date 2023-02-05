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
        const colors = ['000000', '000080', '00008B', '0000CD', '0000FF', '006400', '008000', '008080', '008B8B', '00BFFF', '00CED1',
            '00FA9A', '00FF00', '00FF7F', '00FFFF', '191970', '1E90FF', '20B2AA', '228B22', '2E8B57', '2F4F4F', '32CD32', '3CB371',
            '40E0D0', '4169E1', '4682B4', '483D8B', '48D1CC', '4B0082', '556B2F', '5F9EA0', '6495ED', '663399', '66CDAA', '696969',
            '6A5ACD', '6B8E23', '708090', '778899', '7B68EE', '7CFC00', '7FFF00', '7FFFD4', '800000', '800080', '808000', '808080',
            '87CEEB', '87CEFA', '8A2BE2', '8B0000', '8B008B', '8B4513', '8FBC8F', '90EE90', '9370DB', '9400D3', '98FB98', '9932CC',
            '9ACD32', 'A0522D', 'A52A2A', 'A9A9A9', 'ADD8E6', 'ADFF2F', 'AFEEEE', 'B0C4DE', 'B0E0E6', 'B22222', 'B8860B', 'BA55D3',
            'BC8F8F', 'BDB76B', 'C0C0C0', 'C71585', 'CD5C5C', 'CD853F', 'D2691E', 'D2B48C', 'D3D3D3', 'D8BFD8', 'DA70D6', 'DAA520',
            'DB7093', 'DC143C', 'DCDCDC', 'DDA0DD', 'DEB887', 'E0FFFF', 'E6E6FA', 'E9967A', 'EE82EE', 'EEE8AA', 'F08080', 'F0E68C',
            'F0F8FF', 'F0FFF0', 'F0FFFF', 'F4A460', 'F5DEB3', 'F5F5DC', 'F5F5F5', 'F5FFFA', 'F8F8FF', 'FA8072', 'FAEBD7', 'FAF0E6',
            'FAFAD2', 'FDF5E6', 'FF0000', 'FF00FF', 'FF1493', 'FF4500', 'FF6347', 'FF69B4', 'FF7F50', 'FF8C00', 'FFA07A', 'FFA500',
            'FFB6C1', 'FFC0CB', 'FFD700', 'FFDAB9', 'FFDEAD', 'FFE4B5', 'FFE4C4', 'FFE4E1', 'FFEBCD', 'FFEFD5', 'FFF0F5', 'FFF5EE',
            'FFF8DC', 'FFFACD', 'FFFAF0', 'FFFAFA', 'FFFF00', 'FFFFE0', 'FFFFF0', 'FFFFFF'];
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
