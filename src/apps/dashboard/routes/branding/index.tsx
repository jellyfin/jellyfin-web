import type { BrandingOptionsDto } from '@jellyfin/sdk/lib/generated-client/models/branding-options-dto';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import Delete from '@mui/icons-material/Delete';
import Upload from '@mui/icons-material/Upload';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useState } from 'react';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';

import { getBrandingOptionsQuery, QUERY_KEY, useBrandingOptions } from 'apps/dashboard/features/branding/api/useBrandingOptions';
import Loading from 'components/loading/LoadingComponent';
import Image from 'components/Image';
import Page from 'components/Page';
import { SPLASHSCREEN_URL } from 'constants/branding';
import { DomError } from '@/constants/domError';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { readFileAsBase64 } from '@/utils/file';
import { queryClient } from 'utils/query/queryClient';
import type { ActionData } from 'types/actionData';

const BRANDING_CONFIG_KEY = 'branding';
const BrandingOption = {
    CustomCss: 'CustomCss',
    LoginDisclaimer: 'LoginDisclaimer',
    SplashscreenEnabled: 'SplashscreenEnabled'
};

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getApi();
    if (!api) throw new Error('No Api instance available');

    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    const brandingOptions: BrandingOptionsDto = {
        CustomCss: data.CustomCss?.toString(),
        LoginDisclaimer: data.LoginDisclaimer?.toString(),
        SplashscreenEnabled: data.SplashscreenEnabled?.toString() === 'on'
    };

    await getSystemApi(api)
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

export const loader = async () => {
    const api = ServerConnections.getApi();
    if (!api) return {};

    return queryClient.ensureQueryData(
        getBrandingOptionsQuery(api));
};

export const Component = () => {
    const { api } = useApi();
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';

    const {
        data: defaultBrandingOptions,
        isPending,
        isError
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

    const onSplashscreenUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        setError(undefined);

        const files = event.target.files;

        if (!api || !files) return false;

        const file = files[0];
        let body: string | undefined;
        try {
            body = await readFileAsBase64(file);
        } catch (e) {
            console.error('[BrandingPage] error reading file', e);
            if (e instanceof DOMException && e.name === DomError.Abort) {
                setError('ImageUploadCancelled');
            } else {
                setError('ImageUploadFailed');
            }
        }
        if (!body) return;

        try {
            await getImageApi(api)
                .uploadCustomSplashscreen(
                    // NOTE: TypeScript SDK thinks body should be a File but in reality it requires a Base64 string
                    { body: body as never as File },
                    { headers: { ['Content-Type']: file.type } }
                );

            setSplashscreenUrl(URL.createObjectURL(file));
        } catch (e) {
            console.error('[BrandingPage] error uploading splashscreen', e);
            setError('ImageUploadFailed');
        }
    }, [ api ]);

    const setSplashscreenEnabled = useCallback(async (_: React.ChangeEvent<HTMLInputElement>, isEnabled: boolean) => {
        setIsSplashscreenEnabled(isEnabled);

        await getSystemApi(api!)
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
        if (Object.keys(BrandingOption).includes(event.target.name)) {
            setBrandingOptions({
                ...brandingOptions,
                [event.target.name]: event.target.value
            });
        }
    }, [ brandingOptions ]);

    const onSubmit = useCallback(() => {
        setError(undefined);
    }, []);

    if (isPending) return <Loading />;

    return (
        <Page
            id='brandingPage'
            title={globalize.translate('HeaderBranding')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Form
                    method='POST'
                    onSubmit={onSubmit}
                >
                    {isError ? (
                        <Alert severity='error'>{globalize.translate('BrandingLoadError')}</Alert>
                    ) : (
                        <Stack spacing={3}>
                            <Typography variant='h1'>
                                {globalize.translate('HeaderBranding')}
                            </Typography>

                            {!isSubmitting && actionData?.isSaved && (
                                <Alert severity='success'>
                                    {globalize.translate('SettingsSaved')}
                                </Alert>
                            )}

                            {error && (
                                <Alert severity='error'>
                                    {globalize.translate(error)}
                                </Alert>
                            )}

                            <Stack
                                direction={{
                                    xs: 'column',
                                    sm: 'row'
                                }}
                                spacing={3}
                            >
                                <Box sx={{ flex: '1 1 0' }}>
                                    <Image
                                        isLoading={false}
                                        url={
                                            isSplashscreenEnabled ?
                                                splashscreenUrl :
                                                undefined
                                        }
                                    />
                                </Box>

                                <Stack
                                    spacing={{ xs: 3, sm: 2 }}
                                    sx={{ flex: '1 1 0' }}
                                >
                                    <FormControlLabel
                                        control={
                                            <Switch
                                                name={BrandingOption.SplashscreenEnabled}
                                                checked={isSplashscreenEnabled}
                                                onChange={setSplashscreenEnabled}
                                            />
                                        }
                                        label={globalize.translate('EnableSplashScreen')}
                                    />

                                    <Typography variant='body2'>
                                        {globalize.translate('CustomSplashScreenSize')}
                                    </Typography>

                                    <Button
                                        component='label'
                                        variant='outlined'
                                        startIcon={<Upload />}
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
                                        color='error'
                                        startIcon={<Delete />}
                                        disabled={!isSplashscreenEnabled}
                                        onClick={onSplashscreenDelete}
                                    >
                                        {globalize.translate('DeleteCustomImage')}
                                    </Button>
                                </Stack>
                            </Stack>

                            <TextField
                                fullWidth
                                multiline
                                minRows={5}
                                maxRows={5}
                                name={BrandingOption.LoginDisclaimer}
                                label={globalize.translate('LabelLoginDisclaimer')}
                                helperText={globalize.translate('LabelLoginDisclaimerHelp')}
                                value={brandingOptions?.LoginDisclaimer}
                                onChange={setBrandingOption}
                                slotProps={{
                                    input: {
                                        className: 'textarea-mono'
                                    }
                                }}
                            />

                            <TextField
                                fullWidth
                                multiline
                                minRows={5}
                                maxRows={20}
                                name={BrandingOption.CustomCss}
                                label={globalize.translate('LabelCustomCss')}
                                helperText={globalize.translate('LabelCustomCssHelp')}
                                spellCheck={false}
                                value={brandingOptions?.CustomCss}
                                onChange={setBrandingOption}
                                slotProps={{
                                    input: {
                                        className: 'textarea-mono'
                                    }
                                }}
                            />

                            <Button
                                type='submit'
                                size='large'
                            >
                                {globalize.translate('Save')}
                            </Button>
                        </Stack>
                    )}
                </Form>
            </Box>
        </Page>
    );
};

Component.displayName = 'BrandingPage';
