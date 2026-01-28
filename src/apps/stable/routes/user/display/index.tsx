import { vars } from 'styles/tokens.css.ts';

import React, { useCallback, useEffect, useState } from 'react';
import { Button } from 'ui-primitives';
import { Flex } from 'ui-primitives';
import { Box } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { Divider } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { FormLabel, FormHelperText, FormControl } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Alert } from 'ui-primitives';
import { useApi } from 'hooks/useApi';
import { useThemes } from 'hooks/useThemes';
import { currentSettings, UserSettings } from 'scripts/settings/userSettings';
import { useUiStore } from 'store/uiStore';
import LoadingComponent from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { LayoutMode } from '../../../../../constants/layoutMode';
import type { DisplaySettingsValues } from 'apps/experimental/features/preferences/types/displaySettingsValues';

export default function UserDisplayPreferences() {
    const { __legacyApiClient__: apiClient, user: currentUser } = useApi();
    const { themes, defaultTheme } = useThemes();
    const userId = currentUser?.Id || '';
    const savedLayout = useUiStore(state => state.layout);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [values, setValues] = useState<DisplaySettingsValues | null>(null);
    const [userSettings, setUserSettings] = useState<UserSettings>();
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadSettings = useCallback(async () => {
        if (!userId || !apiClient || !currentUser) return;

        try {
            const settings = userId === currentUser?.Id ? currentSettings : new UserSettings();
            await settings.setUserInfo(userId, apiClient);

            const displaySettings: DisplaySettingsValues = {
                customCss: settings.customCss() || '',
                dashboardTheme: settings.dashboardTheme() || defaultTheme?.id || 'default',
                dateTimeLocale: settings.dateTimeLocale() || 'auto',
                disableCustomCss: Boolean(settings.disableCustomCss()),
                displayMissingEpisodes: currentUser?.Configuration?.DisplayMissingEpisodes ?? false,
                enableBlurHash: Boolean(settings.enableBlurhash()),
                enableFasterAnimation: Boolean(settings.enableFastFadein()),
                enableItemDetailsBanner: Boolean(settings.detailsBanner()),
                enableLibraryBackdrops: Boolean(settings.enableBackdrops()),
                enableLibraryThemeSongs: Boolean(settings.enableThemeSongs()),
                enableLibraryThemeVideos: Boolean(settings.enableThemeVideos()),
                enableRewatchingInNextUp: Boolean(settings.enableRewatchingInNextUp()),
                episodeImagesInNextUp: Boolean(settings.useEpisodeImagesInNextUpAndResume()),
                language: settings.language() || 'auto',
                layout: savedLayout || 'auto',
                libraryPageSize: settings.libraryPageSize(),
                maxDaysForNextUp: settings.maxDaysForNextUp(),
                screensaver: settings.screensaver() || 'none',
                screensaverInterval: settings.backdropScreensaverInterval(),
                slideshowInterval: settings.slideshowInterval(),
                theme: settings.theme() || defaultTheme?.id || 'default'
            };

            setValues(displaySettings);
            setUserSettings(settings);
        } catch (err) {
            setError('Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, [userId, apiClient, currentUser, defaultTheme, savedLayout]);

    useEffect(() => {
        if (!userId || !apiClient) {
            setLoading(false);
            return;
        }

        setLoading(true);
        void loadSettings();
    }, [userId, apiClient, loadSettings]);

    const handleSave = async () => {
        if (!userId || !values || !userSettings || !apiClient) return;

        setSaving(true);
        setError(null);
        try {
            userSettings.customCss(values.customCss || '');
            userSettings.dashboardTheme(values.dashboardTheme);
            userSettings.dateTimeLocale(values.dateTimeLocale || 'auto');
            userSettings.disableCustomCss(values.disableCustomCss);
            userSettings.enableBlurhash(values.enableBlurHash);
            userSettings.enableFastFadein(values.enableFasterAnimation);
            userSettings.detailsBanner(values.enableItemDetailsBanner);
            userSettings.enableBackdrops(values.enableLibraryBackdrops);
            userSettings.enableThemeSongs(values.enableLibraryThemeSongs);
            userSettings.enableThemeVideos(values.enableLibraryThemeVideos);
            userSettings.enableRewatchingInNextUp(values.enableRewatchingInNextUp);
            userSettings.useEpisodeImagesInNextUpAndResume(values.episodeImagesInNextUp);
            userSettings.libraryPageSize(values.libraryPageSize);
            userSettings.maxDaysForNextUp(values.maxDaysForNextUp);
            userSettings.screensaver(values.screensaver || 'none');
            userSettings.backdropScreensaverInterval(values.screensaverInterval);
            userSettings.theme(values.theme);

            if (values.language !== 'auto') {
                userSettings.language(values.language);
            }

            useUiStore.getState().setLayout((values.layout || 'auto') as LayoutMode);

            const user = await apiClient.getUser(userId);
            if (user.Id && user.Configuration) {
                user.Configuration.DisplayMissingEpisodes = values.displayMissingEpisodes;
                await apiClient.updateUserConfiguration(user.Id, user.Configuration);
            }

            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
        } catch (err) {
            setError('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const handleFieldChange = (field: keyof DisplaySettingsValues, value: string | boolean | number) => {
        setValues(prev => (prev ? { ...prev, [field]: value } : null));
    };

    if (loading || !values) {
        return <LoadingComponent />;
    }

    const displayModeOptions = [
        { value: 'auto', label: globalize.translate('Auto') },
        { value: 'desktop', label: globalize.translate('Desktop') },
        { value: 'mobile', label: globalize.translate('Mobile') },
        { value: 'tv', label: globalize.translate('TV') }
    ];

    return (
        <Page
            className="libraryPage userPreferencesPage noSecondaryNavPage"
            id="displayPreferencesPage"
            title={globalize.translate('Display')}
        >
            <div className="settingsContainer padded-left padded-right padded-bottom-page">
                {saveSuccess && (
                    <Alert variant="success" style={{ marginBottom: vars.spacing['5'] }}>
                        {globalize.translate('SettingsSaved')}
                    </Alert>
                )}

                {error && (
                    <Alert variant="error" style={{ marginBottom: vars.spacing['5'] }}>
                        {error}
                    </Alert>
                )}

                <Box style={{ maxWidth: '800px', margin: '0 auto' }}>
                    <Box style={{ marginBottom: vars.spacing['6'] }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing['2'] }}>{globalize.translate('Localization')}</Heading.H3>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelDisplayLanguage')}</FormLabel>
                                <Select
                                    value={values.language}
                                    onValueChange={(value: string) => handleFieldChange('language', value)}
                                >
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue />
                                        <SelectContent>
                                            <SelectItem value="auto">{globalize.translate('Auto')}</SelectItem>
                                            <SelectItem value="en">English</SelectItem>
                                            <SelectItem value="es">Español</SelectItem>
                                            <SelectItem value="fr">Français</SelectItem>
                                            <SelectItem value="de">Deutsch</SelectItem>
                                        </SelectContent>
                                    </SelectTrigger>
                                </Select>
                            </FormControl>
                        </Box>
                    </Box>

                    <Divider style={{ margin: '24px 0' }} />

                    <Box style={{ marginBottom: vars.spacing['6'] }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing['2'] }}>{globalize.translate('Display')}</Heading.H3>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelDisplayMode')}</FormLabel>
                                <Select
                                    value={values.layout}
                                    onValueChange={(value: string) => handleFieldChange('layout', value)}
                                >
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue />
                                        <SelectContent>
                                            {displayModeOptions.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectTrigger>
                                </Select>
                            </FormControl>
                            <FormHelperText>{globalize.translate('DisplayModeHelp')}</FormHelperText>
                        </Box>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelTheme')}</FormLabel>
                                <Select
                                    value={values.theme}
                                    onValueChange={(value: string) => handleFieldChange('theme', value)}
                                >
                                    <SelectTrigger style={{ width: '100%' }}>
                                        <SelectValue placeholder={globalize.translate('Auto')} />
                                        <SelectContent>
                                            <SelectItem value="default">{globalize.translate('Auto')}</SelectItem>
                                            {themes.map(opt => (
                                                <SelectItem key={opt.id} value={opt.id}>
                                                    {opt.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </SelectTrigger>
                                </Select>
                            </FormControl>
                        </Box>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                    <Checkbox
                                        checked={values.disableCustomCss}
                                        onChange={e => handleFieldChange('disableCustomCss', e.target.checked)}
                                    />
                                    <FormLabel style={{ marginBottom: 0 }}>
                                        {globalize.translate('DisableCustomCss')}
                                    </FormLabel>
                                </Flex>
                            </FormControl>
                        </Box>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelCustomCss')}</FormLabel>
                                <Input
                                    as="textarea"
                                    value={values.customCss}
                                    onChange={e => handleFieldChange('customCss', e.target.value)}
                                    style={{ minHeight: '100px', fontFamily: 'monospace' }}
                                />
                            </FormControl>
                        </Box>
                    </Box>

                    <Divider style={{ margin: '24px 0' }} />

                    <Box style={{ marginBottom: vars.spacing['6'] }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing['4'] }}>
                            {globalize.translate('HeaderLibraries')}
                        </Heading.H3>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                    <Checkbox
                                        checked={values.enableLibraryBackdrops}
                                        onChange={e => handleFieldChange('enableLibraryBackdrops', e.target.checked)}
                                    />
                                    <FormLabel style={{ marginBottom: 0 }}>
                                        {globalize.translate('Backdrops')}
                                    </FormLabel>
                                </Flex>
                            </FormControl>
                        </Box>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                    <Checkbox
                                        checked={values.enableLibraryThemeSongs}
                                        onChange={e => handleFieldChange('enableLibraryThemeSongs', e.target.checked)}
                                    />
                                    <FormLabel style={{ marginBottom: 0 }}>
                                        {globalize.translate('ThemeSongs')}
                                    </FormLabel>
                                </Flex>
                            </FormControl>
                        </Box>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                    <Checkbox
                                        checked={values.enableLibraryThemeVideos}
                                        onChange={e => handleFieldChange('enableLibraryThemeVideos', e.target.checked)}
                                    />
                                    <FormLabel style={{ marginBottom: 0 }}>
                                        {globalize.translate('ThemeVideos')}
                                    </FormLabel>
                                </Flex>
                            </FormControl>
                        </Box>
                    </Box>

                    <Divider style={{ margin: '24px 0' }} />

                    <Box style={{ marginBottom: vars.spacing['6'] }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing['4'] }}>{globalize.translate('NextUp')}</Heading.H3>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <FormLabel>{globalize.translate('LabelMaxDaysForNextUp')}</FormLabel>
                                <Input
                                    type="number"
                                    value={values.maxDaysForNextUp}
                                    onChange={e =>
                                        handleFieldChange('maxDaysForNextUp', parseFloat(e.target.value) || 0)
                                    }
                                    min={0}
                                    max={1000}
                                />
                            </FormControl>
                        </Box>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                    <Checkbox
                                        checked={values.enableRewatchingInNextUp}
                                        onChange={e => handleFieldChange('enableRewatchingInNextUp', e.target.checked)}
                                    />
                                    <FormLabel style={{ marginBottom: 0 }}>
                                        {globalize.translate('EnableRewatchingNextUp')}
                                    </FormLabel>
                                </Flex>
                            </FormControl>
                        </Box>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                    <Checkbox
                                        checked={values.episodeImagesInNextUp}
                                        onChange={e => handleFieldChange('episodeImagesInNextUp', e.target.checked)}
                                    />
                                    <FormLabel style={{ marginBottom: 0 }}>
                                        {globalize.translate('UseEpisodeImagesInNextUp')}
                                    </FormLabel>
                                </Flex>
                            </FormControl>
                        </Box>
                    </Box>

                    <Divider style={{ margin: '24px 0' }} />

                    <Box style={{ marginBottom: vars.spacing['6'] }}>
                        <Heading.H3 style={{ marginBottom: vars.spacing['4'] }}>{globalize.translate('ItemDetails')}</Heading.H3>

                        <Box style={{ marginBottom: vars.spacing['4'] }}>
                            <FormControl>
                                <Flex style={{ alignItems: 'center', gap: vars.spacing['3'] }}>
                                    <Checkbox
                                        checked={values.enableItemDetailsBanner}
                                        onChange={e => handleFieldChange('enableItemDetailsBanner', e.target.checked)}
                                    />
                                    <FormLabel style={{ marginBottom: 0 }}>
                                        {globalize.translate('EnableDetailsBanner')}
                                    </FormLabel>
                                </Flex>
                            </FormControl>
                        </Box>
                    </Box>

                    <Flex style={{ gap: vars.spacing['4'], justifyContent: 'flex-end' }}>
                        <Button variant="ghost" onClick={loadSettings} disabled={saving}>
                            {globalize.translate('ButtonCancel')}
                        </Button>
                        <Button variant="primary" onClick={handleSave} loading={saving}>
                            {globalize.translate('Save')}
                        </Button>
                    </Flex>
                </Box>
            </div>
        </Page>
    );
}
