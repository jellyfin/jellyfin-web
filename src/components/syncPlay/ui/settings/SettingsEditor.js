/**
 * Module that displays an editor for changing SyncPlay settings.
 * @module components/syncPlay/settings/SettingsEditor
 */

import { Events } from 'jellyfin-apiclient';
import SyncPlay from '../../core';
import dialogHelper from '../../../dialogHelper/dialogHelper';
import layoutManager from '../../../layoutManager';
import loading from '../../../loading/loading';
import toast from '../../../toast/toast';
import globalize from '../../../../scripts/globalize';
import 'material-design-icons-iconfont';
import '../../../../elements/emby-input/emby-input';
import '../../../../elements/emby-select/emby-select';
import '../../../../elements/emby-button/emby-button';
import '../../../../elements/emby-button/paper-icon-button-light';
import '../../../../elements/emby-checkbox/emby-checkbox';
import '../../../listview/listview.scss';
import '../../../formdialog.scss';

function centerFocus(elem, horiz, on) {
    import('../../../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

/**
 * Class that displays an editor for changing SyncPlay settings.
 */
class SettingsEditor {
    constructor(apiClient, timeSyncCore, options = {}) {
        this.apiClient = apiClient;
        this.timeSyncCore = timeSyncCore;
        this.options = options;

        this.tabNames = [];
        this.tabs = {};
    }

    insertBefore(newNode, existingNode) {
        existingNode.parentNode.insertBefore(newNode, existingNode);
    }

    addTab(name, tab) {
        this.tabNames.push(name);
        this.tabs[name] = tab;
    }

    showTab(tabName) {
        this.tabNames.forEach(id => {
            this.tabs[id].style.display = 'none';
            this.context.querySelector('#show-' + id).classList.remove('ui-btn-active');
        });

        const tab = this.tabs[tabName];
        if (tab) {
            tab.style.display = 'block';
            this.context.querySelector('#show-' + tabName).classList.add('ui-btn-active');
        }
    }

    async embed() {
        const dialogOptions = {
            removeOnClose: true,
            scrollY: true
        };

        if (layoutManager.tv) {
            dialogOptions.size = 'fullscreen';
        } else {
            dialogOptions.size = 'small';
        }

        this.context = dialogHelper.createDialog(dialogOptions);
        this.context.classList.add('formDialog');

        const { default: editorTemplate } = await import('./editor.html');
        this.context.innerHTML = globalize.translateHtml(editorTemplate, 'core');
        const footer = this.context.querySelector('#footer');

        // Create tabs
        const { default: localTabTemplate } = await import('./localTab.html');
        const localTab = this.translateTemplate(localTabTemplate);

        const { default: advancedTabTemplate } = await import('./advancedTab.html');
        const advancedTab = this.translateTemplate(advancedTabTemplate);

        this.insertBefore(localTab, footer);
        this.insertBefore(advancedTab, footer);

        // Switch tabs using nav
        this.addTab('localTab', localTab);
        this.addTab('advancedTab', advancedTab);

        this.showTab('localTab');

        const tabButtons = this.context.querySelectorAll('.controlGroupButton');
        tabButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const tabName = event.target.getAttribute('data-showTab');
                if (tabName) {
                    this.showTab(tabName);
                }
            });
        });

        // Set callbacks for form submission
        this.context.querySelector('form').addEventListener('submit', (event) => {
            // Disable default form submission
            if (event) {
                event.preventDefault();
            }
            return false;
        });

        this.context.querySelector('.btnSave').addEventListener('click', () => {
            this.onSubmit();
        });

        this.context.querySelector('.btnCancel').addEventListener('click', () => {
            dialogHelper.close(this.context);
        });

        await this.initEditor();

        if (layoutManager.tv) {
            centerFocus(this.context.querySelector('.formDialogContent'), false, true);
        }

        return dialogHelper.open(this.context).then(() => {
            if (layoutManager.tv) {
                centerFocus(this.context.querySelector('.formDialogContent'), false, false);
            }

            if (this.context.submitted) {
                return Promise.resolve();
            }

            return Promise.reject();
        });
    }

    async initEditor() {
        const { context } = this;

        context.querySelector('#txtExtraTimeOffset').value = SyncPlay.Settings.getFloat('extraTimeOffset', 0.0);
        context.querySelector('#chkSyncCorrection').checked = SyncPlay.Settings.getBool('enableSyncCorrection', true);
        context.querySelector('#txtMinDelaySpeedToSync').value = SyncPlay.Settings.getFloat('minDelaySpeedToSync', 60.0);
        context.querySelector('#txtMaxDelaySpeedToSync').value = SyncPlay.Settings.getFloat('maxDelaySpeedToSync', 3000.0);
        context.querySelector('#txtSpeedToSyncDuration').value = SyncPlay.Settings.getFloat('speedToSyncDuration', 1000.0);
        context.querySelector('#txtMinDelaySkipToSync').value = SyncPlay.Settings.getFloat('minDelaySkipToSync', 400.0);
        context.querySelector('#chkSpeedToSync').checked = SyncPlay.Settings.getBool('useSpeedToSync', true);
        context.querySelector('#chkSkipToSync').checked = SyncPlay.Settings.getBool('useSkipToSync', true);
    }

    /**
     * @param {string} html HTML string representing a single element.
     * @return {Element} The element.
     */
    htmlToElement(html) {
        const template = document.createElement('template');
        html = html.trim(); // Avoid returning a text node of whitespace.
        template.innerHTML = html;
        return template.content.firstChild;
    }

    translateTemplate(template) {
        const translatedTemplate = globalize.translateHtml(template, 'core');
        return this.htmlToElement(translatedTemplate);
    }

    onSubmit() {
        this.save();
        dialogHelper.close(this.context);
    }

    async save() {
        loading.show();
        await this.saveToAppSettings();
        loading.hide();
        toast(globalize.translate('SettingsSaved'));
        Events.trigger(this, 'saved');
    }

    async saveToAppSettings() {
        const { context } = this;

        const extraTimeOffset = context.querySelector('#txtExtraTimeOffset').value;
        const syncCorrection = context.querySelector('#chkSyncCorrection').checked;
        const minDelaySpeedToSync = context.querySelector('#txtMinDelaySpeedToSync').value;
        const maxDelaySpeedToSync = context.querySelector('#txtMaxDelaySpeedToSync').value;
        const speedToSyncDuration = context.querySelector('#txtSpeedToSyncDuration').value;
        const minDelaySkipToSync = context.querySelector('#txtMinDelaySkipToSync').value;
        const useSpeedToSync = context.querySelector('#chkSpeedToSync').checked;
        const useSkipToSync = context.querySelector('#chkSkipToSync').checked;

        SyncPlay.Settings.set('extraTimeOffset', extraTimeOffset);
        SyncPlay.Settings.set('enableSyncCorrection', syncCorrection);
        SyncPlay.Settings.set('minDelaySpeedToSync', minDelaySpeedToSync);
        SyncPlay.Settings.set('maxDelaySpeedToSync', maxDelaySpeedToSync);
        SyncPlay.Settings.set('speedToSyncDuration', speedToSyncDuration);
        SyncPlay.Settings.set('minDelaySkipToSync', minDelaySkipToSync);
        SyncPlay.Settings.set('useSpeedToSync', useSpeedToSync);
        SyncPlay.Settings.set('useSkipToSync', useSkipToSync);

        Events.trigger(SyncPlay.Settings, 'update');
    }
}

export default SettingsEditor;
