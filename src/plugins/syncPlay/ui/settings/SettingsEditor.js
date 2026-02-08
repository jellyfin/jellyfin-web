/**
 * Module that displays an editor for changing SyncPlay settings.
 * @module components/syncPlay/settings/SettingsEditor
 */

import { getSetting, setSetting } from '../../core/Settings';
import dialogHelper from '../../../../components/dialogHelper/dialogHelper';
import layoutManager from '../../../../components/layoutManager';
import { pluginManager } from '../../../../components/pluginManager';
import loading from '../../../../components/loading/loading';
import toast from '../../../../components/toast/toast';
import globalize from '../../../../lib/globalize';
import { PluginType } from '../../../../types/plugin.ts';
import { toFloat } from '../../../../utils/string.ts';
import Events from '../../../../utils/events.ts';

import 'material-design-icons-iconfont';
import '../../../../elements/emby-input/emby-input';
import '../../../../elements/emby-select/emby-select';
import '../../../../elements/emby-button/emby-button';
import '../../../../elements/emby-button/paper-icon-button-light';
import '../../../../elements/emby-checkbox/emby-checkbox';
import '../../../../components/listview/listview.scss';
import '../../../../components/formdialog.scss';

const SyncProfiles = {
    conservative: {
        useSpeedToSync: true,
        useSkipToSync: true,
        minDelaySpeedToSync: 90,
        maxDelaySpeedToSync: 3600,
        speedToSyncDuration: 1400,
        minDelaySkipToSync: 700,
        maxLateCommandMillis: 1600,
        maxLateSeekRecoveryMillis: 6000,
        seekReadySettleDelayMs: 260,
        maxSeekSettleDiffMillis: 1100,
        seekReadyEventTimeoutMs: 1700,
        zeroSeekAnchorMillis: 500,
        commandCooldownMs: 220,
        bufferingThresholdMillis: 2300
    },
    balanced: {
        useSpeedToSync: true,
        useSkipToSync: true,
        minDelaySpeedToSync: 60,
        maxDelaySpeedToSync: 3000,
        speedToSyncDuration: 1000,
        minDelaySkipToSync: 400,
        maxLateCommandMillis: 1200,
        maxLateSeekRecoveryMillis: 5000,
        seekReadySettleDelayMs: 180,
        maxSeekSettleDiffMillis: 900,
        seekReadyEventTimeoutMs: 1200,
        zeroSeekAnchorMillis: 400,
        commandCooldownMs: 140,
        bufferingThresholdMillis: 1800
    },
    aggressive: {
        useSpeedToSync: true,
        useSkipToSync: true,
        minDelaySpeedToSync: 40,
        maxDelaySpeedToSync: 2200,
        speedToSyncDuration: 700,
        minDelaySkipToSync: 250,
        maxLateCommandMillis: 900,
        maxLateSeekRecoveryMillis: 3500,
        seekReadySettleDelayMs: 120,
        maxSeekSettleDiffMillis: 700,
        seekReadyEventTimeoutMs: 900,
        zeroSeekAnchorMillis: 250,
        commandCooldownMs: 90,
        bufferingThresholdMillis: 1200
    }
};

const LatencyPollIntervalMs = 60000;
const AggressiveMaxLatencyMs = 45;
const BalancedMaxLatencyMs = 120;

function centerFocus(elem, horiz, on) {
    import('../../../../scripts/scrollHelper').then((scrollHelper) => {
        const fn = on ? 'on' : 'off';
        scrollHelper.centerFocus[fn](elem, horiz);
    });
}

function toPositiveNumber(value, fallback) {
    const parsed = toFloat(value, fallback);
    if (!Number.isFinite(parsed)) {
        return fallback;
    }

    return Math.max(0, parsed);
}

/**
 * Class that displays an editor for changing SyncPlay settings.
 */
class SettingsEditor {
    constructor(apiClient, timeSyncCore, options = {}) {
        this.apiClient = apiClient;
        this.timeSyncCore = timeSyncCore;
        this.options = options;
        this.SyncPlay = pluginManager.firstOfType(PluginType.SyncPlay)?.instance;
        this.latencyPoller = null;
        this.latencyRequestInFlight = false;
        this.onDialogCloseBound = this.onDialogClose.bind(this);
        this.onCheckLatencyBound = this.onCheckLatencyClick.bind(this);
    }

    getProfileLabel(profile) {
        if (profile === 'aggressive') {
            return globalize.translate('LabelSyncPlaySettingsSyncProfileAggressive');
        }

        if (profile === 'conservative') {
            return globalize.translate('LabelSyncPlaySettingsSyncProfileConservative');
        }

        return globalize.translate('LabelSyncPlaySettingsSyncProfileBalanced');
    }

    getRecommendedProfileForLatency(latencyMs) {
        if (latencyMs <= AggressiveMaxLatencyMs) {
            return 'aggressive';
        }

        if (latencyMs <= BalancedMaxLatencyMs) {
            return 'balanced';
        }

        return 'conservative';
    }

    updateLatencyPresentation(latencyMs) {
        if (!this.context || !this.context.isConnected) {
            return;
        }

        const latencyLabel = this.context.querySelector('#syncPlayLatencyMetric');
        const recommendationLabel = this.context.querySelector('#syncPlayLatencyRecommendation');
        if (!latencyLabel || !recommendationLabel) {
            return;
        }

        if (!Number.isFinite(latencyMs)) {
            latencyLabel.textContent = globalize.translate('LabelSyncPlaySettingsCurrentLatencyUnavailable');
            recommendationLabel.textContent = globalize.translate('LabelSyncPlaySettingsLatencyRecommendationUnavailable');
            return;
        }

        const roundedLatency = Math.max(0, Math.round(latencyMs));
        const profile = this.getRecommendedProfileForLatency(roundedLatency);
        const profileLabel = this.getProfileLabel(profile);
        latencyLabel.textContent = globalize.translate('LabelSyncPlaySettingsCurrentLatencyValue', roundedLatency);
        recommendationLabel.textContent = globalize.translate('LabelSyncPlaySettingsLatencyRecommendationValue', profileLabel);
    }

    setLatencyButtonDisabled(disabled) {
        const checkButton = this.context?.querySelector('.btnCheckLatency');
        if (checkButton) {
            checkButton.disabled = disabled;
        }
    }

    onCheckLatencyClick() {
        this.pollLatencyMetric(true);
    }

    pollLatencyMetric(showMeasuring = false) {
        if (!this.apiClient || this.latencyRequestInFlight) {
            return;
        }

        if (showMeasuring) {
            const latencyLabel = this.context?.querySelector('#syncPlayLatencyMetric');
            if (latencyLabel) {
                latencyLabel.textContent = globalize.translate('LabelSyncPlaySettingsCurrentLatencyMeasuring');
            }
        }

        this.latencyRequestInFlight = true;
        this.setLatencyButtonDisabled(true);
        const requestStartedAt = Date.now();

        this.apiClient.getServerTime()
            .then((response) => {
                if (response && typeof response.json === 'function') {
                    return response.json();
                }

                return Promise.resolve(null);
            })
            .then(() => {
                const elapsed = Date.now() - requestStartedAt;
                this.updateLatencyPresentation(elapsed / 2);
            })
            .catch((error) => {
                console.debug('SyncPlay settings latency metric failed', error);
                this.updateLatencyPresentation(null);
            })
            .finally(() => {
                this.latencyRequestInFlight = false;
                this.setLatencyButtonDisabled(false);
            });
    }

    startLatencyPolling() {
        this.stopLatencyPolling();
        this.pollLatencyMetric(true);
        this.latencyPoller = setInterval(() => {
            this.pollLatencyMetric();
        }, LatencyPollIntervalMs);
    }

    stopLatencyPolling() {
        if (this.latencyPoller) {
            clearInterval(this.latencyPoller);
            this.latencyPoller = null;
        }
    }

    onDialogClose() {
        this.stopLatencyPolling();
        if (this.context) {
            const checkButton = this.context.querySelector('.btnCheckLatency');
            if (checkButton) {
                checkButton.removeEventListener('click', this.onCheckLatencyBound);
            }

            this.context.removeEventListener('close', this.onDialogCloseBound);
            this.context.removeEventListener('closing', this.onDialogCloseBound);
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
        this.context.addEventListener('close', this.onDialogCloseBound);
        this.context.addEventListener('closing', this.onDialogCloseBound);

        this.context.querySelector('form').addEventListener('submit', (event) => {
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
        const checkButton = this.context.querySelector('.btnCheckLatency');
        if (checkButton) {
            checkButton.addEventListener('click', this.onCheckLatencyBound);
        }

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

    getCurrentSettingsSnapshot() {
        const playbackCore = this.SyncPlay?.Manager.playbackCore;
        const controller = this.SyncPlay?.Manager.getController?.();
        const timeSyncCore = this.SyncPlay?.Manager.timeSyncCore;

        return {
            syncProfile: getSetting('syncProfile') || 'balanced',
            extraTimeOffset: toPositiveNumber(timeSyncCore?.extraTimeOffset, 0),
            enableSyncCorrection: playbackCore?.enableSyncCorrection ?? true,
            enforceReadyBeforeUnpause: controller?.isReadyGateBeforeUnpauseEnabled?.() ?? true,
            useSpeedToSync: playbackCore?.useSpeedToSync ?? true,
            useSkipToSync: playbackCore?.useSkipToSync ?? true,
            minDelaySpeedToSync: toPositiveNumber(playbackCore?.minDelaySpeedToSync, 60),
            maxDelaySpeedToSync: toPositiveNumber(playbackCore?.maxDelaySpeedToSync, 3000),
            speedToSyncDuration: toPositiveNumber(playbackCore?.speedToSyncDuration, 1000),
            minDelaySkipToSync: toPositiveNumber(playbackCore?.minDelaySkipToSync, 400),
            maxLateCommandMillis: toPositiveNumber(playbackCore?.maxLateCommandMillis, 1200),
            maxLateSeekRecoveryMillis: toPositiveNumber(playbackCore?.maxLateSeekRecoveryMillis, 5000),
            seekReadySettleDelayMs: toPositiveNumber(playbackCore?.seekReadySettleDelayMs, 180),
            maxSeekSettleDiffMillis: toPositiveNumber(playbackCore?.maxSeekSettleDiffMillis, 900),
            seekReadyEventTimeoutMs: toPositiveNumber(playbackCore?.seekReadyEventTimeoutMs, 1200),
            zeroSeekAnchorMillis: toPositiveNumber(playbackCore?.zeroSeekAnchorMillis, 400),
            commandCooldownMs: toPositiveNumber(controller?.getCommandCooldownMs?.(), 140),
            bufferingThresholdMillis: toPositiveNumber(getSetting('bufferingThresholdMillis'), 1800)
        };
    }

    getResolvedProfileSettings(profile, currentSettings) {
        if (profile === 'custom' || !SyncProfiles[profile]) {
            return currentSettings;
        }

        return {
            ...currentSettings,
            ...SyncProfiles[profile]
        };
    }

    setProfileManagedFieldsDisabled(disabled) {
        const managedFields = this.context.querySelectorAll('[data-profile-managed="true"]');
        managedFields.forEach((field) => {
            field.disabled = disabled;
        });
    }

    applySettingsToForm(settings) {
        const { context } = this;

        context.querySelector('#txtExtraTimeOffset').value = settings.extraTimeOffset;
        context.querySelector('#chkSyncCorrection').checked = settings.enableSyncCorrection;
        context.querySelector('#chkEnforceReadyBeforeUnpause').checked = settings.enforceReadyBeforeUnpause;
        context.querySelector('#chkSpeedToSync').checked = settings.useSpeedToSync;
        context.querySelector('#chkSkipToSync').checked = settings.useSkipToSync;
        context.querySelector('#txtMinDelaySpeedToSync').value = settings.minDelaySpeedToSync;
        context.querySelector('#txtMaxDelaySpeedToSync').value = settings.maxDelaySpeedToSync;
        context.querySelector('#txtSpeedToSyncDuration').value = settings.speedToSyncDuration;
        context.querySelector('#txtMinDelaySkipToSync').value = settings.minDelaySkipToSync;
        context.querySelector('#txtMaxLateCommandMillis').value = settings.maxLateCommandMillis;
        context.querySelector('#txtMaxLateSeekRecoveryMillis').value = settings.maxLateSeekRecoveryMillis;
        context.querySelector('#txtSeekReadySettleDelayMs').value = settings.seekReadySettleDelayMs;
        context.querySelector('#txtMaxSeekSettleDiffMillis').value = settings.maxSeekSettleDiffMillis;
        context.querySelector('#txtSeekReadyEventTimeoutMs').value = settings.seekReadyEventTimeoutMs;
        context.querySelector('#txtZeroSeekAnchorMillis').value = settings.zeroSeekAnchorMillis;
        context.querySelector('#txtCommandCooldownMs').value = settings.commandCooldownMs;
        context.querySelector('#txtBufferingThresholdMillis').value = settings.bufferingThresholdMillis;
    }

    onProfileChange() {
        const profile = this.context.querySelector('#selectSyncProfile').value || 'balanced';
        if (profile !== 'custom') {
            const currentSettings = this.collectFormSettings();
            const resolvedSettings = this.getResolvedProfileSettings(profile, currentSettings);
            this.applySettingsToForm(resolvedSettings);
        }

        this.setProfileManagedFieldsDisabled(profile !== 'custom');
    }

    async initEditor() {
        const { context } = this;
        const currentSettings = this.getCurrentSettingsSnapshot();
        let selectedProfile = currentSettings.syncProfile;
        if (selectedProfile !== 'custom' && !SyncProfiles[selectedProfile]) {
            selectedProfile = 'balanced';
        }

        context.querySelector('#selectSyncProfile').value = selectedProfile;
        const resolvedSettings = this.getResolvedProfileSettings(selectedProfile, currentSettings);
        this.applySettingsToForm(resolvedSettings);
        this.setProfileManagedFieldsDisabled(selectedProfile !== 'custom');
        this.startLatencyPolling();

        context.querySelector('#selectSyncProfile').addEventListener('change', () => {
            this.onProfileChange();
        });
    }

    collectFormSettings() {
        const { context } = this;

        return {
            syncProfile: context.querySelector('#selectSyncProfile').value || 'balanced',
            extraTimeOffset: toPositiveNumber(context.querySelector('#txtExtraTimeOffset').value, 0),
            enableSyncCorrection: context.querySelector('#chkSyncCorrection').checked,
            enforceReadyBeforeUnpause: context.querySelector('#chkEnforceReadyBeforeUnpause').checked,
            useSpeedToSync: context.querySelector('#chkSpeedToSync').checked,
            useSkipToSync: context.querySelector('#chkSkipToSync').checked,
            minDelaySpeedToSync: toPositiveNumber(context.querySelector('#txtMinDelaySpeedToSync').value, 60),
            maxDelaySpeedToSync: toPositiveNumber(context.querySelector('#txtMaxDelaySpeedToSync').value, 3000),
            speedToSyncDuration: toPositiveNumber(context.querySelector('#txtSpeedToSyncDuration').value, 1000),
            minDelaySkipToSync: toPositiveNumber(context.querySelector('#txtMinDelaySkipToSync').value, 400),
            maxLateCommandMillis: toPositiveNumber(context.querySelector('#txtMaxLateCommandMillis').value, 1200),
            maxLateSeekRecoveryMillis: toPositiveNumber(context.querySelector('#txtMaxLateSeekRecoveryMillis').value, 5000),
            seekReadySettleDelayMs: toPositiveNumber(context.querySelector('#txtSeekReadySettleDelayMs').value, 180),
            maxSeekSettleDiffMillis: toPositiveNumber(context.querySelector('#txtMaxSeekSettleDiffMillis').value, 900),
            seekReadyEventTimeoutMs: toPositiveNumber(context.querySelector('#txtSeekReadyEventTimeoutMs').value, 1200),
            zeroSeekAnchorMillis: toPositiveNumber(context.querySelector('#txtZeroSeekAnchorMillis').value, 400),
            commandCooldownMs: toPositiveNumber(context.querySelector('#txtCommandCooldownMs').value, 140),
            bufferingThresholdMillis: toPositiveNumber(context.querySelector('#txtBufferingThresholdMillis').value, 1800)
        };
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
        const formSettings = this.collectFormSettings();
        const effectiveSettings = this.getResolvedProfileSettings(formSettings.syncProfile, formSettings);

        setSetting('syncProfile', formSettings.syncProfile);
        setSetting('extraTimeOffset', effectiveSettings.extraTimeOffset);
        setSetting('enableSyncCorrection', effectiveSettings.enableSyncCorrection);
        setSetting('enforceReadyBeforeUnpause', effectiveSettings.enforceReadyBeforeUnpause);
        setSetting('useSpeedToSync', effectiveSettings.useSpeedToSync);
        setSetting('useSkipToSync', effectiveSettings.useSkipToSync);
        setSetting('minDelaySpeedToSync', effectiveSettings.minDelaySpeedToSync);
        setSetting('maxDelaySpeedToSync', effectiveSettings.maxDelaySpeedToSync);
        setSetting('speedToSyncDuration', effectiveSettings.speedToSyncDuration);
        setSetting('minDelaySkipToSync', effectiveSettings.minDelaySkipToSync);
        setSetting('maxLateCommandMillis', effectiveSettings.maxLateCommandMillis);
        setSetting('maxLateSeekRecoveryMillis', effectiveSettings.maxLateSeekRecoveryMillis);
        setSetting('seekReadySettleDelayMs', effectiveSettings.seekReadySettleDelayMs);
        setSetting('maxSeekSettleDiffMillis', effectiveSettings.maxSeekSettleDiffMillis);
        setSetting('seekReadyEventTimeoutMs', effectiveSettings.seekReadyEventTimeoutMs);
        setSetting('zeroSeekAnchorMillis', effectiveSettings.zeroSeekAnchorMillis);
        setSetting('commandCooldownMs', effectiveSettings.commandCooldownMs);
        setSetting('bufferingThresholdMillis', effectiveSettings.bufferingThresholdMillis);

        Events.trigger(this.SyncPlay?.Manager, 'settings-update');
    }
}

export default SettingsEditor;
