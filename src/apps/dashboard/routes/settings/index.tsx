import { Alert } from 'ui-primitives';
import { Box, Flex } from 'ui-primitives';
import { IconButton } from 'ui-primitives';
import { Heading } from 'ui-primitives';
import { vars } from 'styles/tokens.css.ts';
import { useLocalizationOptions } from 'apps/dashboard/features/settings/api/useLocalizationOptions';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useEffect, useState } from 'react';
import { z } from 'zod';
import { useForm } from '@tanstack/react-form';
import { MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Button } from 'ui-primitives';
import DirectoryBrowser from 'components/directorybrowser/directorybrowser';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';
import { type ActionData } from 'types/actionData';
import { Input } from 'ui-primitives';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from 'ui-primitives';
import { FormControl, FormLabel, FormHelperText } from 'ui-primitives';
import { Checkbox } from 'ui-primitives';

const settingsSchema = z.object({
    serverName: z.string().optional(),
    uiCulture: z.string().optional(),
    cachePath: z.string().optional(),
    metadataPath: z.string().optional(),
    quickConnectAvailable: z.boolean().optional(),
    libraryScanFanoutConcurrency: z.preprocess(
        value => (value === '' || value == null ? undefined : Number(value)),
        z.number().int().min(0).optional()
    ),
    parallelImageEncodingLimit: z.preprocess(
        value => (value === '' || value == null ? undefined : Number(value)),
        z.number().int().min(0).optional()
    )
});

export const Component = (): React.ReactElement => {
    const { data: config, isPending: isConfigPending, isError: isConfigError } = useConfiguration();
    const {
        data: languageOptions,
        isPending: isLocalizationOptionsPending,
        isError: isLocalizationOptionsError
    } = useLocalizationOptions();

    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm({
        defaultValues: {
            serverName: '',
            uiCulture: '',
            cachePath: '',
            metadataPath: '',
            quickConnectAvailable: false,
            libraryScanFanoutConcurrency: 0,
            parallelImageEncodingLimit: 0
        },
        onSubmit: async ({ value: values }) => {
            setIsSubmitting(true);
            try {
                const api = ServerConnections.getCurrentApi();
                if (!api) {
                    throw new Error('No Api instance available');
                }

                const { data: currentConfig } = await getConfigurationApi(api).getConfiguration();

                currentConfig.ServerName = values.serverName?.toString() ?? null;
                currentConfig.UICulture = values.uiCulture?.toString() ?? null;
                currentConfig.CachePath = values.cachePath?.toString() ?? null;
                currentConfig.MetadataPath = values.metadataPath?.toString() ?? null;
                currentConfig.QuickConnectAvailable = Boolean(values.quickConnectAvailable);
                currentConfig.LibraryScanFanoutConcurrency = Number(values.libraryScanFanoutConcurrency ?? 0);
                currentConfig.ParallelImageEncodingLimit = Number(values.parallelImageEncodingLimit ?? 0);

                await getConfigurationApi(api).updateConfiguration({ serverConfiguration: currentConfig });

                void queryClient.invalidateQueries({
                    queryKey: [QUERY_KEY]
                });

                setActionData({ isSaved: true });
            } catch (error) {
                setActionData({ isSaved: false });
            } finally {
                setIsSubmitting(false);
            }
        }
    });

    const showCachePathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: function (path: string) {
                if (path) {
                    form.setFieldValue('cachePath', path);
                }

                picker.close();
            },
            validateWriteable: true,
            header: globalize.translate('HeaderSelectServerCachePath'),
            instruction: globalize.translate('HeaderSelectServerCachePathHelp')
        });
    }, [form]);

    const showMetadataPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            path: form.state.values.metadataPath,
            callback: function (path: string) {
                if (path) {
                    form.setFieldValue('metadataPath', path);
                }

                picker.close();
            },
            validateWriteable: true,
            header: globalize.translate('HeaderSelectMetadataPath'),
            instruction: globalize.translate('HeaderSelectMetadataPathHelp')
        });
    }, [form]);

    useEffect(() => {
        if (!isConfigPending && !isConfigError && config) {
            form.reset({
                serverName: config.ServerName || '',
                uiCulture: config.UICulture || '',
                cachePath: config.CachePath || '',
                metadataPath: config.MetadataPath || '',
                quickConnectAvailable: Boolean(config.QuickConnectAvailable),
                libraryScanFanoutConcurrency: config.LibraryScanFanoutConcurrency ?? 0,
                parallelImageEncodingLimit: config.ParallelImageEncodingLimit ?? 0
            });
        }
    }, [config, form, isConfigPending, isConfigError]);

    if (isConfigPending || isLocalizationOptionsPending) {
        return <Loading />;
    }

    return (
        <Page
            id="dashboardGeneralPage"
            title={globalize.translate('General')}
            className="type-interior mainAnimatedPage"
        >
            <Box style={{ maxWidth: 800, margin: '0 auto', padding: vars.spacing['6'] }}>
                {isConfigError || isLocalizationOptionsError ? (
                    <Alert variant="error">{globalize.translate('SettingsPageLoadError')}</Alert>
                ) : (
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            form.handleSubmit();
                        }}
                    >
                        <Flex style={{ flexDirection: 'column', gap: vars.spacing['7'] }}>
                            <Heading.H2 style={{ margin: 0 }}>{globalize.translate('Settings')}</Heading.H2>

                            {!isSubmitting && actionData?.isSaved && (
                                <Alert variant="success">{globalize.translate('SettingsSaved')}</Alert>
                            )}

                            <form.Field name="serverName">
                                {field => (
                                    <Input
                                        label={globalize.translate('LabelServerName')}
                                        helperText={globalize.translate('LabelServerNameHelp')}
                                        value={field.state.value ?? ''}
                                        onChange={event => field.handleChange(event.target.value)}
                                    />
                                )}
                            </form.Field>

                            <form.Field name="uiCulture">
                                {field => (
                                    <FormControl>
                                        <FormLabel>{globalize.translate('LabelPreferredDisplayLanguage')}</FormLabel>
                                        <Select value={field.state.value ?? ''} onValueChange={field.handleChange}>
                                            <SelectTrigger>
                                                <SelectValue
                                                    placeholder={globalize.translate('LabelPreferredDisplayLanguage')}
                                                />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {languageOptions?.map(l => (
                                                    <SelectItem key={l.Value} value={l.Value || ''}>
                                                        {l.Name}
                                                    </SelectItem>
                                                )) ?? []}
                                            </SelectContent>
                                        </Select>
                                        <FormHelperText>
                                            {globalize.translate('LabelDisplayLanguageHelp')}
                                        </FormHelperText>
                                    </FormControl>
                                )}
                            </form.Field>

                            <Heading.H4 style={{ marginTop: vars.spacing['5'], marginBottom: 0 }}>
                                {globalize.translate('HeaderPaths')}
                            </Heading.H4>

                            <form.Field name="cachePath">
                                {field => (
                                    <Input
                                        label={globalize.translate('LabelCachePath')}
                                        helperText={globalize.translate('LabelCachePathHelp')}
                                        value={field.state.value ?? ''}
                                        onChange={event => field.handleChange(event.target.value)}
                                        style={{ position: 'relative' }}
                                        endDecorator={
                                            <IconButton onClick={showCachePathPicker} size="sm" variant="plain">
                                                <MagnifyingGlassIcon />
                                            </IconButton>
                                        }
                                    />
                                )}
                            </form.Field>

                            <form.Field name="metadataPath">
                                {field => (
                                    <Input
                                        label={globalize.translate('LabelMetadataPath')}
                                        helperText={globalize.translate('LabelMetadataPathHelp')}
                                        value={field.state.value ?? ''}
                                        onChange={event => field.handleChange(event.target.value)}
                                        style={{ position: 'relative' }}
                                        endDecorator={
                                            <IconButton onClick={showMetadataPathPicker} size="sm" variant="plain">
                                                <MagnifyingGlassIcon />
                                            </IconButton>
                                        }
                                    />
                                )}
                            </form.Field>

                            <Heading.H4 style={{ marginTop: vars.spacing['5'], marginBottom: 0 }}>
                                {globalize.translate('QuickConnect')}
                            </Heading.H4>

                            <form.Field name="quickConnectAvailable">
                                {field => (
                                    <Checkbox
                                        checked={Boolean(field.state.value)}
                                        onChange={event => field.handleChange(event.target.checked)}
                                    >
                                        {globalize.translate('EnableQuickConnect')}
                                    </Checkbox>
                                )}
                            </form.Field>

                            <Heading.H4 style={{ marginTop: vars.spacing['5'], marginBottom: 0 }}>
                                {globalize.translate('HeaderPerformance')}
                            </Heading.H4>

                            <form.Field name="libraryScanFanoutConcurrency">
                                {field => (
                                    <Input
                                        type="number"
                                        label={globalize.translate('LibraryScanFanoutConcurrency')}
                                        helperText={globalize.translate('LibraryScanFanoutConcurrencyHelp')}
                                        value={field.state.value?.toString() ?? ''}
                                        onChange={event => field.handleChange(Number(event.target.value))}
                                    />
                                )}
                            </form.Field>

                            <form.Field name="parallelImageEncodingLimit">
                                {field => (
                                    <Input
                                        type="number"
                                        label={globalize.translate('LabelParallelImageEncodingLimit')}
                                        helperText={globalize.translate('LabelParallelImageEncodingLimitHelp')}
                                        value={field.state.value?.toString() ?? ''}
                                        onChange={event => field.handleChange(Number(event.target.value))}
                                    />
                                )}
                            </form.Field>

                            <Box style={{ marginTop: vars.spacing['5'], display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type="submit" size="lg" loading={isSubmitting}>
                                    {globalize.translate('Save')}
                                </Button>
                            </Box>
                        </Flex>
                    </form>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'SettingsPage';
