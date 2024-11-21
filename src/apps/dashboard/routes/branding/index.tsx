import type { BrandingOptions } from '@jellyfin/sdk/lib/generated-client/models/branding-options';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import React, { useCallback, useEffect, useState } from 'react';
import { type ActionFunctionArgs, Form, useActionData } from 'react-router-dom';

import { getBrandingOptionsQuery, QUERY_KEY, useBrandingOptions } from 'apps/dashboard/features/branding/api/useBrandingOptions';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import ServerConnections from 'components/ServerConnections';
import globalize from 'lib/globalize';
import { queryClient } from 'utils/query/queryClient';

interface ActionData {
    isSaved: boolean
}

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
        SplashscreenEnabled: data.SplashscreenEnabled?.toString() === 'on'
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
    const actionData = useActionData() as ActionData | undefined;
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const {
        data: defaultBrandingOptions,
        isPending
    } = useBrandingOptions();
    const [ brandingOptions, setBrandingOptions ] = useState(defaultBrandingOptions || {});

    useEffect(() => {
        setIsSubmitting(false);
    }, [ actionData ]);

    const onSubmit = useCallback(() => {
        setIsSubmitting(true);
    }, []);

    const setSplashscreenEnabled = useCallback((_: React.ChangeEvent<HTMLInputElement>, isEnabled: boolean) => {
        setBrandingOptions({
            ...brandingOptions,
            [BrandingOption.SplashscreenEnabled]: isEnabled
        });
    }, [ brandingOptions ]);

    const setBrandingOption = useCallback((event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
        if (Object.keys(BrandingOption).includes(event.target.name)) {
            setBrandingOptions({
                ...brandingOptions,
                [event.target.name]: event.target.value
            });
        }
    }, [ brandingOptions ]);

    if (isPending) return <Loading />;

    return (
        <Page
            id='brandingPage'
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Form
                    method='POST'
                    onSubmit={onSubmit}
                >
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('HeaderBranding')}
                        </Typography>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert severity='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    name={BrandingOption.SplashscreenEnabled}
                                    checked={brandingOptions?.SplashscreenEnabled}
                                    onChange={setSplashscreenEnabled}
                                />
                            }
                            label={globalize.translate('EnableSplashScreen')}
                        />

                        <TextField
                            fullWidth
                            multiline
                            minRows={5}
                            maxRows={5}
                            InputProps={{
                                className: 'textarea-mono'
                            }}
                            name={BrandingOption.LoginDisclaimer}
                            label={globalize.translate('LabelLoginDisclaimer')}
                            helperText={globalize.translate('LabelLoginDisclaimerHelp')}
                            value={brandingOptions?.LoginDisclaimer}
                            onChange={setBrandingOption}
                        />

                        <TextField
                            fullWidth
                            multiline
                            minRows={5}
                            maxRows={20}
                            InputProps={{
                                className: 'textarea-mono'
                            }}
                            name={BrandingOption.CustomCss}
                            label={globalize.translate('LabelCustomCss')}
                            helperText={globalize.translate('LabelCustomCssHelp')}
                            value={brandingOptions?.CustomCss}
                            onChange={setBrandingOption}
                        />

                        <Button
                            type='submit'
                            size='large'
                        >
                            {globalize.translate('Save')}
                        </Button>
                    </Stack>
                </Form>
            </Box>
        </Page>
    );
};

Component.displayName = 'BrandingPage';
