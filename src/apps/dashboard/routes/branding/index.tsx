import type { BrandingOptions } from '@jellyfin/sdk/lib/generated-client/models/branding-options';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';
import { TrashIcon, UploadIcon } from '@radix-ui/react-icons';
import React, { useCallback, useEffect, useState } from 'react';

import {
    getBrandingOptionsQuery,
    QUERY_KEY,
    useBrandingOptions
} from 'apps/dashboard/features/branding/api/useBrandingOptions';
import Loading from 'components/loading/LoadingComponent';
import Image from 'components/Image';
import Page from 'components/Page';
import { SPLASHSCREEN_URL } from 'constants/branding';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import { queryClient } from 'utils/query/queryClient';
import { type ActionData } from 'types/actionData';
import { Alert } from 'ui-primitives/Alert';
import { Button } from 'ui-primitives/Button';
import { Box, Flex } from 'ui-primitives/Box';
import { Heading, Text } from 'ui-primitives/Text';
import { Switch, FormControlLabel, FormControl, FormLabel, FormHelperText } from 'ui-primitives/FormControl';
import { Input } from 'ui-primitives/Input';
import { vars } from 'styles/tokens.css';
import { logger } from 'utils/logger';

const BRANDING_CONFIG_KEY = 'branding';
const BrandingOption = {
    CustomCss: 'CustomCss',
    LoginDisclaimer: 'LoginDisclaimer',
    SplashscreenEnabled: 'SplashscreenEnabled'
};

export const loader = () => {
    return queryClient.ensureQueryData(getBrandingOptionsQuery(ServerConnections.getCurrentApi()));
};

export const Component = () => {
    const { api } = useApi();
    const [actionData, setActionData] = useState<ActionData | undefined>();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { data: defaultBrandingOptions, isPending } = useBrandingOptions();
    const [brandingOptions, setBrandingOptions] = useState(defaultBrandingOptions || {});

    const [error, setError] = useState<string>();

    const [isSplashscreenEnabled, setIsSplashscreenEnabled] = useState(brandingOptions.SplashscreenEnabled ?? false);
    const [splashscreenUrl, setSplashscreenUrl] = useState<string>();

    useEffect(() => {
        if (!api || isSubmitting) return;
        setSplashscreenUrl(api.getUri(SPLASHSCREEN_URL, { t: Date.now() }));
    }, [api, isSubmitting]);

    const onSplashscreenDelete = useCallback(() => {
        setError(undefined);
        if (!api) return;

        getImageApi(api)
            .deleteCustomSplashscreen()
            .then(() => {
                setSplashscreenUrl(api.getUri(SPLASHSCREEN_URL, { t: Date.now() }));
            })
            .catch(e => {
                logger.error('[BrandingPage] error deleting image', { error: e });
                setError('ImageDeleteFailed');
            });
    }, [api]);

    const onSplashscreenUpload = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            setError(undefined);
            const files = event.target.files;
            if (!api || !files) return false;

            const file = files[0];
            const reader = new FileReader();
            reader.onerror = e => {
                logger.error('[BrandingPage] error reading file', { error: e });
                setError('ImageUploadFailed');
            };
            reader.onload = () => {
                if (!reader.result) return;
                const dataUrl = reader.result as string;
                const body = dataUrl.split(',')[1] as never;
                getImageApi(api)
                    .uploadCustomSplashscreen({ body }, { headers: { ['Content-Type']: file.type } })
                    .then(() => {
                        setSplashscreenUrl(dataUrl);
                    })
                    .catch(e => {
                        logger.error('[BrandingPage] error uploading splashscreen', { error: e });
                        setError('ImageUploadFailed');
                    });
            };
            reader.readAsDataURL(file);
        },
        [api]
    );

    const handleSplashscreenToggle = useCallback(
        async (isEnabled: boolean) => {
            setIsSplashscreenEnabled(isEnabled);

            await getConfigurationApi(api!).updateNamedConfiguration({
                key: BRANDING_CONFIG_KEY,
                body: JSON.stringify({
                    ...defaultBrandingOptions,
                    SplashscreenEnabled: isEnabled
                })
            });

            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY]
            });
        },
        [api, defaultBrandingOptions]
    );

    const setBrandingOption = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
            setBrandingOptions({
                ...brandingOptions,
                [event.target.name]: event.target.value
            });
        },
        [brandingOptions]
    );

    const handleSubmit = useCallback(async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsSubmitting(true);
        try {
            const currentApi = ServerConnections.getCurrentApi();
            if (!currentApi) {
                throw new Error('No Api instance available');
            }

            const formData = new FormData(event.currentTarget);
            const data = Object.fromEntries(formData);

            const updatedBrandingOptions: BrandingOptions = {
                CustomCss: data.CustomCss?.toString(),
                LoginDisclaimer: data.LoginDisclaimer?.toString(),
                SplashscreenEnabled: data.SplashscreenEnabled === 'on'
            };

            await getConfigurationApi(currentApi).updateNamedConfiguration({
                key: BRANDING_CONFIG_KEY,
                body: JSON.stringify(updatedBrandingOptions)
            });

            void queryClient.invalidateQueries({
                queryKey: [QUERY_KEY]
            });

            setActionData({ isSaved: true });
        } catch (err) {
            setActionData({ isSaved: false });
        } finally {
            setIsSubmitting(false);
        }
    }, []);

    if (isPending) return <Loading />;

    return (
        <Page
            id='brandingPage'
            title={globalize.translate('HeaderBranding')}
            className='mainAnimatedPage type-interior'
        >
            <Box style={{ maxWidth: 800, margin: '0 auto', padding: vars.spacing.lg }}>
                <form onSubmit={handleSubmit}>
                    <Flex style={{ flexDirection: 'column', gap: vars.spacing.xl }}>
                        <Heading.H2>{globalize.translate('HeaderBranding')}</Heading.H2>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert variant='success'>{globalize.translate('SettingsSaved')}</Alert>
                        )}

                        {error && <Alert variant='error'>{globalize.translate(error)}</Alert>}

                        <Flex
                            style={{
                                flexDirection: 'column',
                                gap: vars.spacing.md,
                                alignItems: 'flex-start'
                            }}
                        >
                            <Box style={{ flex: 1, width: '100%', maxWidth: 300 }}>
                                <Image isLoading={false} url={isSplashscreenEnabled ? splashscreenUrl : undefined} />
                            </Box>

                            <Flex style={{ flex: 1, flexDirection: 'column', gap: vars.spacing.md }}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={isSplashscreenEnabled}
                                            onChange={e => handleSplashscreenToggle(e.target.checked)}
                                        />
                                    }
                                    label={globalize.translate('EnableSplashScreen')}
                                />

                                <Text size='sm'>{globalize.translate('CustomSplashScreenSize')}</Text>

                                <Button
                                    component='label'
                                    variant='outlined'
                                    color='neutral'
                                    startDecorator={<UploadIcon />}
                                    disabled={!isSplashscreenEnabled}
                                >
                                    <input type='file' accept='image/*' hidden onChange={onSplashscreenUpload} />
                                    {globalize.translate('UploadCustomImage')}
                                </Button>

                                <Button
                                    variant='outlined'
                                    color='danger'
                                    startDecorator={<TrashIcon />}
                                    disabled={!isSplashscreenEnabled}
                                    onClick={onSplashscreenDelete}
                                >
                                    {globalize.translate('DeleteCustomImage')}
                                </Button>
                            </Flex>
                        </Flex>

                        <Input
                            as='textarea'
                            name={BrandingOption.LoginDisclaimer}
                            label={globalize.translate('LabelLoginDisclaimer')}
                            helperText={globalize.translate('LabelLoginDisclaimerHelp')}
                            value={brandingOptions?.LoginDisclaimer || ''}
                            onChange={setBrandingOption}
                            rows={10}
                            style={{ fontFamily: 'monospace' }}
                        />

                        <Input
                            as='textarea'
                            name={BrandingOption.CustomCss}
                            label={globalize.translate('LabelCustomCss')}
                            helperText={globalize.translate('LabelCustomCssHelp')}
                            value={brandingOptions?.CustomCss || ''}
                            onChange={setBrandingOption}
                            rows={10}
                            style={{ fontFamily: 'monospace' }}
                        />

                        <Box style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <Button type='submit' size='lg' loading={isSubmitting}>
                                {globalize.translate('Save')}
                            </Button>
                        </Box>
                    </Flex>
                </form>
            </Box>
        </Page>
    );
};

Component.displayName = 'BrandingPage';
