import type { BrandingOptions } from '@jellyfin/sdk/lib/generated-client/models/branding-options';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import Delete from '@mui/icons-material/Delete';
import Upload from '@mui/icons-material/Upload';
import Alert from '@mui/joy/Alert';
import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import React, { useCallback, useEffect, useState } from 'react';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';

import { getBrandingOptionsQuery, QUERY_KEY, useBrandingOptions } from 'apps/dashboard/features/branding/api/useBrandingOptions';
import Loading from 'components/loading/LoadingComponent';
import Image from 'components/Image';
import Page from 'components/Page';
import { SPLASHSCREEN_URL } from 'constants/branding';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { queryClient } from 'utils/query/queryClient';
import { ActionData } from 'types/actionData';
import { EmbySwitch, EmbyTextarea } from '../../../../elements';

const BRANDING_CONFIG_KEY = 'branding';
const BrandingOption = {
    CustomCss: 'CustomCss',
    LoginDisclaimer: 'LoginDisclaimer',
    SplashscreenEnabled: 'SplashscreenEnabled'
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const brandingOptions: BrandingOptions = {
        CustomCss: data.CustomCss?.toString(),
        LoginDisclaimer: data.LoginDisclaimer?.toString(),
        SplashscreenEnabled: data.SplashscreenEnabled === 'on'
    };

    await getConfigurationApi(api)
        .updateNamedConfiguration({
            key: BRANDING_CONFIG_KEY,
            body: JSON.stringify(brandingOptions)
        });

    void queryClient.invalidateQueries({
        queryKey: [ QUERY_KEY ]
    });

    return {
        isSaved: true
    };
};

export const loader = () => {
    return queryClient.ensureQueryData(
        getBrandingOptionsQuery(ServerConnections.getCurrentApi()));
};

export const Component = () => {
    const { api } = useApi();
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';

    const {
        data: defaultBrandingOptions,
        isPending
    } = useBrandingOptions();
    const [ brandingOptions, setBrandingOptions ] = useState(defaultBrandingOptions || {});

    const [ error, setError ] = useState<string>();

    const [ isSplashscreenEnabled, setIsSplashscreenEnabled ] = useState(brandingOptions.SplashscreenEnabled ?? false);
    const [ splashscreenUrl, setSplashscreenUrl ] = useState<string>();
    
    useEffect(() => {
        if (!api || isSubmitting) return;
        setSplashscreenUrl(api.getUri(SPLASHSCREEN_URL, { t: Date.now() }));
    }, [ api, isSubmitting ]);

    const onSplashscreenDelete = useCallback(() => {
        setError(undefined);
        if (!api) return;

        getImageApi(api)
            .deleteCustomSplashscreen()
            .then(() => {
                setSplashscreenUrl(api.getUri(SPLASHSCREEN_URL, { t: Date.now() }));
            })
            .catch(e => {
                console.error('[BrandingPage] error deleting image', e);
                setError('ImageDeleteFailed');
            });
    }, [ api ]);

    const onSplashscreenUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setError(undefined);
        const files = event.target.files;
        if (!api || !files) return false;

        const file = files[0];
        const reader = new FileReader();
        reader.onerror = e => {
            console.error('[BrandingPage] error reading file', e);
            setError('ImageUploadFailed');
        };
        reader.onload = () => {
            if (!reader.result) return;
            const dataUrl = reader.result as string;
            const body = dataUrl.split(',')[1] as never;
            getImageApi(api)
                .uploadCustomSplashscreen(
                    { body },
                    { headers: { ['Content-Type']: file.type } }
                )
                .then(() => {
                    setSplashscreenUrl(dataUrl);
                })
                .catch(e => {
                    console.error('[BrandingPage] error uploading splashscreen', e);
                    setError('ImageUploadFailed');
                });
        };
        reader.readAsDataURL(file);
    }, [ api ]);

    const handleSplashscreenToggle = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const isEnabled = e.target.checked;
        setIsSplashscreenEnabled(isEnabled);

        await getConfigurationApi(api!)
            .updateNamedConfiguration({
                key: BRANDING_CONFIG_KEY,
                body: JSON.stringify({
                    ...defaultBrandingOptions,
                    SplashscreenEnabled: isEnabled
                })
            });

        void queryClient.invalidateQueries({
            queryKey: [ QUERY_KEY ]
        });
    }, [ api, defaultBrandingOptions ]);

    const setBrandingOption = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        setBrandingOptions({
            ...brandingOptions,
            [event.target.name]: event.target.value
        });
    }, [ brandingOptions ]);

    if (isPending) return <Loading />;

    return (
        <Page
            id='brandingPage'
            title={globalize.translate('HeaderBranding')}
            className='mainAnimatedPage type-interior'
        >
            <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
                <Form method='POST'>
                    <Stack spacing={4}>
                        <Typography level='h2'>
                            {globalize.translate('HeaderBranding')}
                        </Typography>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert color='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        {error && (
                            <Alert color='danger'>
                                {globalize.translate(error)}
                            </Alert>
                        )}

                        <Stack
                            direction={{ xs: 'column', sm: 'row' }}
                            spacing={3}
                            alignItems="flex-start"
                        >
                            <Box sx={{ flex: 1, width: '100%', maxWidth: 300 }}>
                                <Image
                                    isLoading={false}
                                    url={isSplashscreenEnabled ? splashscreenUrl : undefined}
                                />
                            </Box>

                            <Stack spacing={2} sx={{ flex: 1 }}>
                                <EmbySwitch
                                    name={BrandingOption.SplashscreenEnabled}
                                    label={globalize.translate('EnableSplashScreen')}
                                    checked={isSplashscreenEnabled}
                                    onChange={handleSplashscreenToggle}
                                />

                                <Typography level='body-sm'>
                                    {globalize.translate('CustomSplashScreenSize')}
                                </Typography>

                                <Button
                                    component='label'
                                    variant='outlined'
                                    color="neutral"
                                    startDecorator={<Upload />}
                                    disabled={!isSplashscreenEnabled}
                                >
                                    <input
                                        type='file'
                                        accept='image/*'
                                        hidden
                                        onChange={onSplashscreenUpload}
                                    />
                                    {globalize.translate('UploadCustomImage')}
                                </Button>

                                <Button
                                    variant='outlined'
                                    color='danger'
                                    startDecorator={<Delete />}
                                    disabled={!isSplashscreenEnabled}
                                    onClick={onSplashscreenDelete}
                                >
                                    {globalize.translate('DeleteCustomImage')}
                                </Button>
                            </Stack>
                        </Stack>

                        <EmbyTextarea
                            name={BrandingOption.LoginDisclaimer}
                            label={globalize.translate('LabelLoginDisclaimer')}
                            helperText={globalize.translate('LabelLoginDisclaimerHelp')}
                            value={brandingOptions?.LoginDisclaimer || ''}
                            onChange={setBrandingOption}
                            sx={{ fontFamily: 'monospace' }}
                        />

                        <EmbyTextarea
                            name={BrandingOption.CustomCss}
                            label={globalize.translate('LabelCustomCss')}
                            helperText={globalize.translate('LabelCustomCssHelp')}
                            value={brandingOptions?.CustomCss || ''}
                            onChange={setBrandingOption}
                            minRows={10}
                            sx={{ fontFamily: 'monospace' }}
                        />

                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                type='submit'
                                size='lg'
                                loading={isSubmitting}
                            >
                                {globalize.translate('Save')}
                            </Button>
                        </Box>
                    </Stack>
                </Form>
            </Box>
        </Page>
    );
};

Component.displayName = 'BrandingPage';