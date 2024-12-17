import React, { ChangeEvent, useCallback, useEffect, useState } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import LogItem from 'components/dashboard/logs/LogItem';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { Alert, Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { type ActionFunctionArgs, type LoaderFunctionArgs, Form, useActionData } from 'react-router-dom';
import ServerConnections from 'components/ServerConnections';

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

export const Logs = () => {
    const actionData = useActionData() as ActionData | undefined;
    const { api } = useApi();
    const [ logs, setLogs ] = useState<LogFile[]>([]);
    const [ logsLoading, setLogsLoading ] = useState<boolean>(true);
    const [ configLoading, setConfigLoading ] = useState<boolean>(true);
    const [ logWarningMessageChecked, setLogWarningMessageChecked ] = useState<boolean>(false);
    const [ slowResponseTime, setSlowResponseTime ] = useState<string>('');
    const [ isSubmitting, setIsSubmitting ] = useState(false);

    const setLogWarningMessage = useCallback((_: ChangeEvent<HTMLInputElement>, checked: boolean) => {
        setLogWarningMessageChecked(checked);
    }, []);

    const onResponseTimeChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
        setSlowResponseTime(event.target.value);
    }, []);

    const loadLogs = useCallback(() => {
        if (!api) return;

        return getSystemApi(api)
            .getServerLogs()
            .then(({ data }) => {
                setLogs(data);
            });
    }, [api]);

    const onSubmit = useCallback(() => {
        setIsSubmitting(true);
    }, []);

    useEffect(() => {
        if (!api) return;

        loadLogs()?.then(() => {
            setLogsLoading(false);
        }).catch(err => {
            console.error('[logs] An error occurred while fetching logs', err);
        });

        getConfigurationApi(api)
            .getConfiguration()
            .then(({ data: config }) => {
                if (config.EnableSlowResponseWarning) {
                    setLogWarningMessageChecked(config.EnableSlowResponseWarning);
                }
                if (config.SlowResponseThresholdMs != null) {
                    setSlowResponseTime(String(config.SlowResponseThresholdMs));
                }
                setConfigLoading(false);
            })
            .catch(err => {
                console.error('[logs] An error occurred while fetching system config', err);
            });
    }, [logsLoading, configLoading, api, loadLogs]);

    if (logsLoading || configLoading) {
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
                                    checked={logWarningMessageChecked}
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
                            value={slowResponseTime}
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
                        {logs.map(log => {
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
