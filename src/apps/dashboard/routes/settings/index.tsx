import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import IconButton from '@mui/joy/IconButton';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import { useLocalizationOptions } from 'apps/dashboard/features/settings/api/useLocalizationOptions';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import React, { useCallback, useEffect, useState } from 'react';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';
import SearchIcon from '@mui/icons-material/Search';
import Button from '@mui/joy/Button';
import Link from '@mui/joy/Link';
import DirectoryBrowser from 'components/directorybrowser/directorybrowser';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { queryClient } from 'utils/query/queryClient';
import { ActionData } from 'types/actionData';
import { EmbyInput, EmbySelect, EmbyCheckbox } from '../../../../elements';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const { data: config } = await getConfigurationApi(api).getConfiguration();
    const formData = await request.formData();

    config.ServerName = formData.get('ServerName')?.toString();
    config.UICulture = formData.get('UICulture')?.toString();
    config.CachePath = formData.get('CachePath')?.toString();
    config.MetadataPath = formData.get('MetadataPath')?.toString();
    config.QuickConnectAvailable = formData.get('QuickConnectAvailable')?.toString() === 'on';
    config.LibraryScanFanoutConcurrency = parseInt(formData.get('LibraryScanFanoutConcurrency')?.toString() || '0', 10);
    config.ParallelImageEncodingLimit = parseInt(formData.get('ParallelImageEncodingLimit')?.toString() || '0', 10);

    await getConfigurationApi(api)
        .updateConfiguration({ serverConfiguration: config });

    void queryClient.invalidateQueries({
        queryKey: [ QUERY_KEY ]
    });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const {
        data: config,
        isPending: isConfigPending,
        isError: isConfigError
    } = useConfiguration();
    const {
        data: languageOptions,
        isPending: isLocalizationOptionsPending,
        isError: isLocalizationOptionsError
    } = useLocalizationOptions();

    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';
    const [ cachePath, setCachePath ] = useState<string | null | undefined>('');
    const [ metadataPath, setMetadataPath ] = useState<string | null | undefined>('');

    const onCachePathChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setCachePath(event.target.value);
    }, []);

    const onMetadataPathChange = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setMetadataPath(event.target.value);
    }, []);

    const showCachePathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            callback: function (path: string) {
                if (path) {
                    setCachePath(path);
                }

                picker.close();
            },
            validateWriteable: true,
            header: globalize.translate('HeaderSelectServerCachePath'),
            instruction: globalize.translate('HeaderSelectServerCachePathHelp')
        });
    }, []);

    const showMetadataPathPicker = useCallback(() => {
        const picker = new DirectoryBrowser();

        picker.show({
            path: metadataPath,
            callback: function (path: string) {
                if (path) {
                    setMetadataPath(path);
                }

                picker.close();
            },
            validateWriteable: true,
            header: globalize.translate('HeaderSelectMetadataPath'),
            instruction: globalize.translate('HeaderSelectMetadataPathHelp')
        });
    }, [metadataPath]);

    useEffect(() => {
        if (!isConfigPending && !isConfigError) {
            setCachePath(config.CachePath);
            setMetadataPath(config.MetadataPath);
        }
    }, [config, isConfigPending, isConfigError]);

    if (isConfigPending || isLocalizationOptionsPending) {
        return <Loading />;
    }

    return (
        <Page
            id='dashboardGeneralPage'
            title={globalize.translate('General')}
            className='type-interior mainAnimatedPage'
        >
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
                {isConfigError || isLocalizationOptionsError ? (
                    <Alert color='danger'>{globalize.translate('SettingsPageLoadError')}</Alert>
                ) : (
                    <Form method='POST'>
                        <Stack spacing={4}>
                            <Typography level='h2'>{globalize.translate('Settings')}</Typography>

                            {!isSubmitting && actionData?.isSaved && (
                                <Alert color='success'>
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}

                            <EmbyInput
                                name='ServerName'
                                label={globalize.translate('LabelServerName')}
                                helperText={globalize.translate('LabelServerNameHelp')}
                                defaultValue={config.ServerName}
                            />

                            <EmbySelect
                                name='UICulture'
                                label={globalize.translate('LabelPreferredDisplayLanguage')}
                                helperText={globalize.translate('LabelDisplayLanguageHelp')}
                                defaultValue={config.UICulture}
                                options={languageOptions.map(l => ({ label: l.Name, value: l.Value || '' }))}
                            />

                            <Typography level='title-lg' sx={{ mt: 2 }}>{globalize.translate('HeaderPaths')}</Typography>

                            <EmbyInput
                                name='CachePath'
                                label={globalize.translate('LabelCachePath')}
                                helperText={globalize.translate('LabelCachePathHelp')}
                                value={cachePath || ''}
                                onChange={onCachePathChange}
                                endDecorator={
                                    <IconButton onClick={showCachePathPicker}>
                                        <SearchIcon />
                                    </IconButton>
                                }
                            />

                            <EmbyInput
                                name='MetadataPath'
                                label={globalize.translate('LabelMetadataPath')}
                                helperText={globalize.translate('LabelMetadataPathHelp')}
                                value={metadataPath || ''}
                                onChange={onMetadataPathChange}
                                endDecorator={
                                    <IconButton onClick={showMetadataPathPicker}>
                                        <SearchIcon />
                                    </IconButton>
                                }
                            />

                            <Typography level='title-lg' sx={{ mt: 2 }}>{globalize.translate('QuickConnect')}</Typography>

                            <EmbyCheckbox
                                name='QuickConnectAvailable'
                                label={globalize.translate('EnableQuickConnect')}
                                defaultChecked={config.QuickConnectAvailable}
                            />

                            <Typography level='title-lg' sx={{ mt: 2 }}>{globalize.translate('HeaderPerformance')}</Typography>

                            <EmbyInput
                                name='LibraryScanFanoutConcurrency'
                                type='number'
                                label={globalize.translate('LibraryScanFanoutConcurrency')}
                                helperText={globalize.translate('LibraryScanFanoutConcurrencyHelp')}
                                defaultValue={config.LibraryScanFanoutConcurrency || ''}
                                slotProps={{ input: { min: 0, step: 1 } }}
                            />

                            <EmbyInput
                                name='ParallelImageEncodingLimit'
                                type='number'
                                label={globalize.translate('LabelParallelImageEncodingLimit')}
                                helperText={globalize.translate('LabelParallelImageEncodingLimitHelp')}
                                defaultValue={config.ParallelImageEncodingLimit || ''}
                                slotProps={{ input: { min: 0, step: 1 } }}
                            />

                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                                <Button type='submit' size='lg' loading={isSubmitting}>
                                    {globalize.translate('Save')}
                                </Button>
                            </Box>
                        </Stack>
                    </Form>
                )}
            </Box>
        </Page>
    );
};

Component.displayName = 'SettingsPage';