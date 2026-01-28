import React, { useState } from 'react';
import {
    ModernSettingsForm,
    SettingsSection,
    SettingsCard,
    SettingsAlert,
    FormSelect,
    FormCheckbox,
    ToggleSection
} from 'components/settings/SettingsForm';
import { useAlert } from 'components/dialog/AlertDialog';
import globalize from 'lib/globalize';
import { Box } from 'ui-primitives';

interface ExampleUserSettings {
    enableNotifications: boolean;
    emailFrequency: string;
    theme: string;
    autoPlay: boolean;
    quality: string;
    enableAnalytics: boolean;
}

export function ExampleUserSettingsPage() {
    const [settings, setSettings] = useState<ExampleUserSettings>({
        enableNotifications: true,
        emailFrequency: 'weekly',
        theme: 'dark',
        autoPlay: true,
        quality: '1080p',
        enableAnalytics: false
    });
    const [isSaving, setIsSaving] = useState(false);
    const { alert, dialog } = useAlert({ title: 'Settings Saved' });

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('Saved settings:', settings);
            alert('Your settings have been saved successfully.');
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        console.log('Settings cancelled');
    };

    const themeOptions = [
        { value: 'dark', label: globalize.translate('ThemeDark') },
        { value: 'light', label: globalize.translate('ThemeLight') },
        { value: 'system', label: globalize.translate('ThemeSystem') }
    ];

    const qualityOptions = [
        { value: 'auto', label: globalize.translate('Auto') },
        { value: '4k', label: '4K' },
        { value: '1080p', label: '1080p' },
        { value: '720p', label: '720p' },
        { value: '480p', label: '480p' }
    ];

    const frequencyOptions = [
        { value: 'realtime', label: globalize.translate('Realtime') },
        { value: 'daily', label: globalize.translate('Daily') },
        { value: 'weekly', label: globalize.translate('Weekly') },
        { value: 'never', label: globalize.translate('Never') }
    ];

    return (
        <>
            <ModernSettingsForm onSave={handleSave} onCancel={handleCancel} isSaving={isSaving}>
                <SettingsAlert variant="info">{globalize.translate('SettingsApplyToAllDevices')}</SettingsAlert>

                <SettingsSection
                    title={globalize.translate('HeaderNotifications')}
                    description={globalize.translate('NotificationsDescription')}
                >
                    <SettingsCard
                        title={globalize.translate('EmailNotifications')}
                        action={
                            <FormCheckbox
                                label=""
                                checked={settings.enableNotifications}
                                onChange={checked => setSettings(s => ({ ...s, enableNotifications: checked }))}
                            />
                        }
                    >
                        <FormSelect
                            label={globalize.translate('EmailFrequency')}
                            value={settings.emailFrequency}
                            onChange={value => setSettings(s => ({ ...s, emailFrequency: value }))}
                            options={frequencyOptions}
                        />
                    </SettingsCard>

                    <SettingsCard title={globalize.translate('PushNotifications')}>
                        <FormCheckbox
                            label={globalize.translate('EnableAnalytics')}
                            checked={settings.enableAnalytics}
                            onChange={checked => setSettings(s => ({ ...s, enableAnalytics: checked }))}
                            description={globalize.translate('AnalyticsHelp')}
                        />
                    </SettingsCard>
                </SettingsSection>

                <Box component="hr" style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                <SettingsSection title={globalize.translate('HeaderPlayback')}>
                    <ToggleSection
                        title={globalize.translate('AutoPlayNextEpisode')}
                        checked={settings.autoPlay}
                        onToggle={checked => setSettings(s => ({ ...s, autoPlay: checked }))}
                    >
                        <FormSelect
                            label={globalize.translate('DefaultQuality')}
                            value={settings.quality}
                            onChange={value => setSettings(s => ({ ...s, quality: value }))}
                            options={qualityOptions}
                            description={globalize.translate('QualityDescription')}
                        />
                    </ToggleSection>
                </SettingsSection>

                <Box component="hr" style={{ margin: '24px 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

                <SettingsSection title={globalize.translate('HeaderAppearance')}>
                    <FormSelect
                        label={globalize.translate('Theme')}
                        value={settings.theme}
                        onChange={value => setSettings(s => ({ ...s, theme: value }))}
                        options={themeOptions}
                    />
                </SettingsSection>
            </ModernSettingsForm>
            {dialog}
        </>
    );
}

export default ExampleUserSettingsPage;
