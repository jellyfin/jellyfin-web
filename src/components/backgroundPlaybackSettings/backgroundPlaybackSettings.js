import focusManager from '../focusManager';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client';
import globalize from '../../lib/globalize';
import loading from '../loading/loading';
import Events from '../../utils/events.ts';
import '../../elements/emby-select/emby-select';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-textarea/emby-textarea';
import ServerConnections from '../ServerConnections';
import toast from '../toast/toast';
import template from './backgroundPlaybackSettings.template.html';

const ascendingArrow = '.arrow_upward';
const descendingArrow = '.arrow_downward';

function loadForm(context, user, userSettings) {
    context.querySelector('#chkBackdrops').checked =
        userSettings.enableBackdrops();
    context.querySelector('#chkThemeSong').checked =
        userSettings.enableThemeSongs();
    context.querySelector('#chkThemeVideo').checked =
        userSettings.enableThemeVideos();

    context.querySelector('#selectThemeMediaSortBy').value =
        userSettings.themeMediaSortBy();
    const sortOrder = userSettings.themeMediaSortOrder();
    context.querySelector('#selectThemeMediaSortOrder').value = sortOrder;
    context
        .querySelector(ascendingArrow)
        .classList.toggle('hide', sortOrder != SortOrder.Ascending);
    context
        .querySelector(descendingArrow)
        .classList.toggle('hide', sortOrder != SortOrder.Descending);

    loading.hide();
}

function saveUser(context, user, userSettingsInstance, apiClient) {
    userSettingsInstance.enableBackdrops(
        context.querySelector('#chkBackdrops').checked
    );
    userSettingsInstance.enableThemeSongs(
        context.querySelector('#chkThemeSong').checked
    );
    userSettingsInstance.themeMediaSortBy(
        context.querySelector('#selectThemeMediaSortBy').value
    );
    userSettingsInstance.themeMediaSortOrder(
        context.querySelector('#selectThemeMediaSortOrder').value
    );
    userSettingsInstance.enableThemeVideos(
        context.querySelector('#chkThemeVideo').checked
    );

    return apiClient.updateUserConfiguration(user.Id, user.Configuration);
}

function save(
    instance,
    context,
    userId,
    userSettings,
    apiClient,
    enableSaveConfirmation
) {
    loading.show();

    apiClient.getUser(userId).then((user) => {
        saveUser(context, user, userSettings, apiClient).then(
            () => {
                loading.hide();
                if (enableSaveConfirmation) {
                    toast(globalize.translate('SettingsSaved'));
                }
                Events.trigger(instance, 'saved');
            },
            () => {
                loading.hide();
            }
        );
    });
}

function onSubmit(e) {
    const eventSubmitter = e.submitter;
    const context = this.options.element;
    if (eventSubmitter.id === 'saveButton') {
        const self = this;
        const apiClient = ServerConnections.getApiClient(self.options.serverId);
        const userId = self.options.userId;
        const userSettings = self.options.userSettings;

        userSettings.setUserInfo(userId, apiClient).then(() => {
            const enableSaveConfirmation = self.options.enableSaveConfirmation;
            save(
                self,
                context,
                userId,
                userSettings,
                apiClient,
                enableSaveConfirmation
            );
        });
    } else if (eventSubmitter.id === 'selectThemeMediaSortOrder') {
        switch (eventSubmitter.value) {
            case SortOrder.Ascending:
                eventSubmitter.value = SortOrder.Descending;
                break;
            case SortOrder.Descending:
                eventSubmitter.value = SortOrder.Ascending;
                break;
        }

        // Toggle the shown icon each time the selectThemeMediaSortOrder button is pressed
        const newSortOrder = eventSubmitter.value;
        context
            .querySelector(ascendingArrow)
            .classList.toggle('hide', newSortOrder != SortOrder.Ascending);
        context
            .querySelector(descendingArrow)
            .classList.toggle('hide', newSortOrder != SortOrder.Descending);
    }

    // Disable default form submission
    if (e) {
        e.preventDefault();
    }
    return false;
}

function embed(options, self) {
    options.element.innerHTML = globalize.translateHtml(template, 'core');
    options.element
        .querySelector('form')
        .addEventListener('submit', onSubmit.bind(self));

    if (options.enableSaveButton) {
        options.element.querySelector('.btnSave').classList.remove('hide');
    }
    self.loadData(options.autoFocus);
}

class BackgroundPlaybackSettings {
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

        return apiClient.getUser(userId).then((user) => {
            return userSettings.setUserInfo(userId, apiClient).then(() => {
                self.dataLoaded = true;
                loadForm(context, user, userSettings);
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

export default BackgroundPlaybackSettings;
