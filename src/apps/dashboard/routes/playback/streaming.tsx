import React from 'react';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import ServerConnections from 'lib/jellyfin-apiclient/ServerConnections';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { QUERY_KEY, useConfiguration } from 'hooks/useConfiguration';
import Loading from 'components/loading/LoadingComponent';
import { ActionData } from 'types/actionData';
import { queryClient } from 'utils/query/queryClient';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const { data: config } = await getConfigurationApi(api).getConfiguration();
    const formData = await request.formData();

    const bitrateLimit = formData.get('StreamingBitrateLimit')?.toString();
    config.RemoteClientBitrateLimit = Math.trunc(1e6 * parseFloat(bitrateLimit || '0'));

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
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';

    const { isPending: isConfigurationPending, data: defaultConfiguration } = useConfiguration();

    if (isConfigurationPending) {
        return <Loading />;
    }

    return (
        <Page
            id='streamingSettingsPage'
            title={globalize.translate('TabStreaming')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Form method='POST'>
                    <Stack spacing={3}>
                        <Typography variant='h2'>
                            {globalize.translate('TabStreaming')}
                        </Typography>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert severity='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        <TextField
                            type='number'
                            inputMode='decimal'
                            name='StreamingBitrateLimit'
                            label={globalize.translate('LabelRemoteClientBitrateLimit')}
                            helperText={globalize.translate('LabelRemoteClientBitrateLimitHelp')}
                            defaultValue={defaultConfiguration?.RemoteClientBitrateLimit ? defaultConfiguration?.RemoteClientBitrateLimit / 1e6 : ''}
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    step: 0.25
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
                </Form>
            </Box>
        </Page>
    );
};

Component.displayName = 'StreamingPage';
