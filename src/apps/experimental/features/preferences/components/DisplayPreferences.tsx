import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from '@tanstack/react-form';
import { Box, Flex, FlexCol } from 'ui-primitives';
import { Text, Heading } from 'ui-primitives';
import { Button } from 'ui-primitives';
import { Divider } from 'ui-primitives';
import { Alert } from 'ui-primitives';
import { Input } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';
import { FormLabel, FormHelperText } from 'ui-primitives';
import { safeAppHost } from 'components/apphost';
import { AppFeature } from 'constants/appFeature';
import { LayoutMode } from 'constants/layoutMode';
import { useApi } from 'hooks/useApi';
import { useThemes } from 'hooks/useThemes';
import globalize from 'lib/globalize';

import { useScreensavers } from '../hooks/useScreensavers';
import type { DisplaySettingsValues } from '../types/displaySettingsValues';

interface DisplayPreferencesProps {
    onSave: (values: DisplaySettingsValues) => Promise<void>;
    initialValues: DisplaySettingsValues;
}

export function DisplayPreferences({ onSave, initialValues }: Readonly<DisplayPreferencesProps>) {
    const { user } = useApi();
    const { screensavers } = useScreensavers();
    const { themes } = useThemes();
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    const form = useForm({
        defaultValues: initialValues,
        onSubmit: async ({ value: values }) => {
            setIsSaving(true);
            setSaveError(null);
            try {
                await onSave(values as DisplaySettingsValues);
                setSaveSuccess(true);
                setTimeout(() => setSaveSuccess(false), 3000);
            } catch (error) {
                setSaveError(error instanceof Error ? error.message : 'Failed to save');
            } finally {
                setIsSaving(false);
            }
        }
    });

    const layoutOptions = [
        { value: LayoutMode.Auto, label: globalize.translate('Auto') },
        { value: LayoutMode.Desktop, label: globalize.translate('Desktop') },
        { value: LayoutMode.Mobile, label: globalize.translate('Mobile') },
        { value: LayoutMode.Tv, label: globalize.translate('TV') }
    ];

    const handleReset = () => {
        form.reset();
        setSaveSuccess(false);
        setSaveError(null);
    };

    return (
        <Box style={{ maxWidth: 800, margin: '0 auto', padding: 24 }}>
            {saveSuccess && (
                <Alert variant="success" style={{ marginBottom: 24 }}>
                    {globalize.translate('SettingsSaved')}
                </Alert>
            )}

            {saveError && (
                <Alert variant="error" style={{ marginBottom: 24 }}>
                    {saveError}
                </Alert>
            )}

            <form
                onSubmit={e => {
                    e.preventDefault();
                    form.handleSubmit();
                }}
            >
                <FlexCol style={{ gap: 24 }}>
                    <Heading.H3>{globalize.translate('Display')}</Heading.H3>

                    {safeAppHost.supports(AppFeature.DisplayMode) && (
                        <form.Field name="layout">
                            {field => (
                                <Box>
                                    <FormLabel>{globalize.translate('LabelDisplayMode')}</FormLabel>
                                    <Select value={field.state.value || ''} onValueChange={field.handleChange}>
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue placeholder={globalize.translate('Auto')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {layoutOptions.map(option => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    {option.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormHelperText>{globalize.translate('DisplayModeHelp')}</FormHelperText>
                                </Box>
                            )}
                        </form.Field>
                    )}

                    {themes.length > 0 && (
                        <form.Field name="theme">
                            {field => (
                                <Box>
                                    <FormLabel>{globalize.translate('LabelTheme')}</FormLabel>
                                    <Select value={field.state.value || ''} onValueChange={field.handleChange}>
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue placeholder="" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {themes.map(({ id, name }) => (
                                                <SelectItem key={id} value={id}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Box>
                            )}
                        </form.Field>
                    )}

                    <form.Field name="disableCustomCss">
                        {field => (
                            <Box>
                                <Checkbox
                                    checked={field.state.value ?? false}
                                    onChange={e => field.handleChange(e.target.checked)}
                                >
                                    {globalize.translate('DisableCustomCss')}
                                </Checkbox>
                                <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                                    {globalize.translate('LabelDisableCustomCss')}
                                </Text>
                            </Box>
                        )}
                    </form.Field>

                    <form.Field name="customCss">
                        {field => (
                            <Box>
                                <FormLabel>{globalize.translate('LabelCustomCss')}</FormLabel>
                                <Input
                                    as="textarea"
                                    value={field.state.value ?? ''}
                                    onChange={e => field.handleChange(e.target.value)}
                                    style={{ minHeight: '144px', fontFamily: 'monospace' }}
                                />
                                <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                                    {globalize.translate('LabelLocalCustomCss')}
                                </Text>
                            </Box>
                        )}
                    </form.Field>

                    {themes.length > 0 && user?.Policy?.IsAdministrator && (
                        <form.Field name="dashboardTheme">
                            {field => (
                                <Box>
                                    <FormLabel>{globalize.translate('LabelDashboardTheme')}</FormLabel>
                                    <Select value={field.state.value || ''} onValueChange={field.handleChange}>
                                        <SelectTrigger style={{ width: '100%' }}>
                                            <SelectValue placeholder="" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {themes.map(({ id, name }) => (
                                                <SelectItem key={id} value={id}>
                                                    {name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </Box>
                            )}
                        </form.Field>
                    )}

                    {screensavers.length > 0 && safeAppHost.supports(AppFeature.Screensaver) && (
                        <>
                            <Divider style={{ margin: '16px 0' }} />

                            <form.Field name="screensaver">
                                {field => (
                                    <Box>
                                        <FormLabel>{globalize.translate('LabelScreensaver')}</FormLabel>
                                        <Select value={field.state.value || ''} onValueChange={field.handleChange}>
                                            <SelectTrigger style={{ width: '100%' }}>
                                                <SelectValue placeholder="" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {screensavers.map(({ id, name }) => (
                                                    <SelectItem key={id} value={id}>
                                                        {name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </Box>
                                )}
                            </form.Field>

                            <form.Field name="screensaverInterval">
                                {field => (
                                    <Box>
                                        <FormLabel>{globalize.translate('LabelBackdropScreensaverInterval')}</FormLabel>
                                        <Input
                                            type="number"
                                            value={field.state.value?.toString() || ''}
                                            onChange={e => field.handleChange(parseFloat(e.target.value) || 0)}
                                            min={1}
                                            max={3600}
                                        />
                                        <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                                            {globalize.translate('LabelBackdropScreensaverIntervalHelp')}
                                        </Text>
                                    </Box>
                                )}
                            </form.Field>
                        </>
                    )}

                    <form.Field name="slideshowInterval">
                        {field => (
                            <Box>
                                <FormLabel>{globalize.translate('LabelSlideshowInterval')}</FormLabel>
                                <Input
                                    type="number"
                                    value={field.state.value?.toString() || ''}
                                    onChange={e => field.handleChange(parseFloat(e.target.value) || 0)}
                                    min={1}
                                    max={3600}
                                />
                                <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                                    {globalize.translate('LabelSlideshowIntervalHelp')}
                                </Text>
                            </Box>
                        )}
                    </form.Field>

                    <form.Field name="enableFasterAnimation">
                        {field => (
                            <Box>
                                <Checkbox
                                    checked={field.state.value ?? false}
                                    onChange={e => field.handleChange(e.target.checked)}
                                >
                                    {globalize.translate('EnableFasterAnimations')}
                                </Checkbox>
                                <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                                    {globalize.translate('EnableFasterAnimationsHelp')}
                                </Text>
                            </Box>
                        )}
                    </form.Field>

                    <form.Field name="enableBlurHash">
                        {field => (
                            <Box>
                                <Checkbox
                                    checked={field.state.value ?? false}
                                    onChange={e => field.handleChange(e.target.checked)}
                                >
                                    {globalize.translate('EnableBlurHash')}
                                </Checkbox>
                                <Text size="sm" color="secondary" style={{ marginTop: 4 }}>
                                    {globalize.translate('EnableBlurHashHelp')}
                                </Text>
                            </Box>
                        )}
                    </form.Field>

                    <Flex style={{ gap: 12, marginTop: 16 }}>
                        <Button type="submit" variant="primary" loading={isSaving}>
                            {globalize.translate('Save')}
                        </Button>
                        <Button type="button" variant="ghost" onClick={handleReset}>
                            {globalize.translate('Reset')}
                        </Button>
                    </Flex>
                </FlexCol>
            </form>
        </Box>
    );
}

export default DisplayPreferences;
