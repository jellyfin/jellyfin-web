import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import LogItem from 'components/dashboard/logs/LogItem';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import globalize from 'lib/globalize';
import { Alert, Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { type ActionFunctionArgs, Form, useActionData } from 'react-router-dom';
import ServerConnections from 'components/ServerConnections';
import { useLogEntries } from 'apps/dashboard/features/logs/api/useLogEntries';
import { useLogOptions } from 'apps/dashboard/features/logs/api/useLogOptions';
import type { ServerConfiguration } from '@jellyfin/sdk/lib/generated-client/models/server-configuration';

interface ActionData {
    isSaved: boolean;
}

export const action = async ({ request }: ActionFunctionArgs) => {
    const api = ServerConnections.getCurrentApi();
    if (!api) throw new Error('No Api instance available');

    const formData = await request.formData();
    const { data: config } = await getConfigurationApi(api).getConfiguration();

    config.EnableSlowResponseWarning = formData.get('EnableWarningMessage') === 'on';

    const responseTime = formData.get('SlowResponseTime');
    if (responseTime) {
        config.SlowResponseThresholdMs = parseInt(responseTime.toString(), 10);
    }

    await getConfigurationApi(api)
        .updateConfiguration({ serverConfiguration: config });

    return {
        isSaved: true
    };
};

const Logs = () => {
    const actionData = useActionData() as ActionData | undefined;
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const { isPending: isLogEntriesPending, data: logs } = useLogEntries();
    const { isPending: isLogOptionsPending, data: defaultLogOptions } = useLogOptions();
    const [ loading, setLoading ] = useState(true);
    const [ logOptions, setLogOptions ] = useState<ServerConfiguration>( {} );

    useEffect(() => {
        if (!isLogOptionsPending && defaultLogOptions) {
            setLogOptions(defaultLogOptions);
            setLoading(false);
        }
    }, [isLogOptionsPending, defaultLogOptions]);

    const setLogWarningMessage = useCallback((_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setLogOptions({
            ...logOptions,
            EnableSlowResponseWarning: checked
        });
    }, [logOptions]);

    const onResponseTimeChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
        setLogOptions({
            ...logOptions,
            SlowResponseThresholdMs: parseInt(event.target.value, 10)
        });
    }, [logOptions]);

    const onSubmit = useCallback(() => {
        setIsSubmitting(true);
    }, []);

    if (isLogEntriesPending || isLogOptionsPending || loading) {
        return <Loading />;
    }

    return (
        <Page
            id='logPage'
            title={globalize.translate('TabLogs')}
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <Form method='POST' onSubmit={onSubmit}>
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('TabLogs')}
                        </Typography>

                        {isSubmitting && actionData?.isSaved && (
                            <Alert severity='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={logOptions?.EnableSlowResponseWarning}
                                    onChange={setLogWarningMessage}
                                    name={'EnableWarningMessage'}
                                />
                            }
                            label={globalize.translate('LabelSlowResponseEnabled')}
                        />

                        <TextField
                            fullWidth
                            type='number'
                            name={'SlowResponseTime'}
                            label={globalize.translate('LabelSlowResponseTime')}
                            value={logOptions?.SlowResponseThresholdMs}
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
                <div className='serverLogs readOnlyContent'>
                    <div className='paperList'>
                        {logs?.map(log => {
                            return <LogItem
                                key={log.Name}
                                logFile={log}
                            />;
                        })}
                    </div>
                </div>
            </Box>
        </Page>
    );
};

export default Logs;
