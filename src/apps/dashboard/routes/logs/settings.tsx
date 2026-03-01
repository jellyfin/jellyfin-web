import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { type ActionFunctionArgs, Form, useActionData, useNavigation } from 'react-router-dom';
import { useConfiguration } from 'hooks/useConfiguration';
import type { ServerConfiguration } from '@jellyfin/sdk/lib/generated-client/models/server-configuration';
import { ActionData } from 'types/actionData';

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const formData = await request.formData();
    const { data: config } = await getConfigurationApi(api).getConfiguration();

    const enableWarningMessage = formData.get('EnableWarningMessage');
    const activityLogRetentionDays = formData.get('ActivityLogRetentionDays')?.toString();

    config.EnableSlowResponseWarning = enableWarningMessage === 'on';

    const responseTime = formData.get('SlowResponseTime');
    if (responseTime) {
        config.SlowResponseThresholdMs = parseInt(responseTime.toString(), 10);
    }

    if (activityLogRetentionDays) config.ActivityLogRetentionDays = parseInt(activityLogRetentionDays, 10);

    await getConfigurationApi(api)
        .updateConfiguration({ serverConfiguration: config });

    return {
        isSaved: true
    };
};

export const Component = () => {
    const navigation = useNavigation();
    const actionData = useActionData() as ActionData | undefined;
    const isSubmitting = navigation.state === 'submitting';

    const { isPending: isConfigurationPending, data: defaultConfiguration } = useConfiguration();
    const [ loading, setLoading ] = useState(true);
    const [ configuration, setConfiguration ] = useState<ServerConfiguration>( {} );

    useEffect(() => {
        if (!isConfigurationPending && defaultConfiguration) {
            setConfiguration(defaultConfiguration);
            setLoading(false);
        }
    }, [isConfigurationPending, defaultConfiguration]);

    const setLogWarningMessage = useCallback((_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setConfiguration({
            ...configuration,
            EnableSlowResponseWarning: checked
        });
    }, [configuration]);

    const onResponseTimeChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
        setConfiguration({
            ...configuration,
            SlowResponseThresholdMs: parseInt(event.target.value, 10)
        });
    }, [configuration]);

    const onActivityLogRetentionDaysChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
        setConfiguration({
            ...configuration,
            ActivityLogRetentionDays: parseInt(event.target.value, 10)
        });
    }, [configuration]);

    if (isConfigurationPending || loading) {
        return <Loading />;
    }

    return (
        <Page
            id='logPage'
            title={globalize.translate('TabLogSettings')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Form method='POST'>
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('TabLogSettings')}
                        </Typography>

                        {!isSubmitting && actionData?.isSaved && (
                            <Alert severity='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        <TextField
                            type='number'
                            name='ActivityLogRetentionDays'
                            label={globalize.translate('LabelActivityLogRetentionDays')}
                            value={configuration?.ActivityLogRetentionDays}
                            helperText={globalize.translate('LabelActivityLogRetentionDaysHelp')}
                            onChange={onActivityLogRetentionDaysChange}
                            slotProps={{
                                htmlInput: {
                                    min: 0,
                                    max: 3650,
                                    required: true
                                }
                            }}
                        />

                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={configuration?.EnableSlowResponseWarning}
                                    onChange={setLogWarningMessage}
                                    name={'EnableWarningMessage'}
                                />
                            }
                            label={globalize.translate('LabelSlowResponseEnabled')}
                        />

                        <TextField
                            fullWidth
                            type='number'
                            name='SlowResponseTime'
                            label={globalize.translate('LabelSlowResponseTime')}
                            value={configuration?.SlowResponseThresholdMs}
                            disabled={!configuration?.EnableSlowResponseWarning}
                            onChange={onResponseTimeChange}
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

Component.displayName = 'LogsSettingsPage';
