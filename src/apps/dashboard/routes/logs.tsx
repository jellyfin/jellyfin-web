import React, { ChangeEvent, FormEvent, useCallback, useEffect, useState } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import LogItem from 'components/dashboard/logs/LogItem';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import { Alert, Box, Button, FormControlLabel, Stack, Switch, TextField, Typography } from '@mui/material';
import { Form } from 'react-router-dom';

const Logs = () => {
    const { api } = useApi();
    const [ logs, setLogs ] = useState<LogFile[]>([]);
    const [ logsLoading, setLogsLoading ] = useState<boolean>(true);
    const [ configLoading, setConfigLoading ] = useState<boolean>(true);
    const [ logWarningMessageChecked, setLogWarningMessageChecked ] = useState<boolean>(false);
    const [ slowResponseTime, setSlowResponseTime ] = useState<string>('');
    const [ submitted, setSubmitted ] = useState<boolean>(false);

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

    const onSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!api) return;

        getConfigurationApi(api)
            .getConfiguration()
            .then(({ data: config }) => {
                config.EnableSlowResponseWarning = logWarningMessageChecked;
                config.SlowResponseThresholdMs = parseInt(slowResponseTime, 10);
                getConfigurationApi(api)
                    .updateConfiguration({ serverConfiguration: config })
                    .then(() => setSubmitted(true))
                    .catch(err => {
                        console.error('[logs] failed to update configuration data', err);
                    });
            })
            .catch(err => {
                console.error('[logs] failed to get configuration data', err);
            });
    }, [api, logWarningMessageChecked, slowResponseTime]);

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
                <Form className='logsForm' method='POST' onSubmit={onSubmit}>
                    <Stack spacing={3}>
                        <Typography variant='h1'>
                            {globalize.translate('TabLogs')}
                        </Typography>

                        {submitted && (
                            <Alert severity='success'>
                                {globalize.translate('SettingsSaved')}
                            </Alert>
                        )}

                        <FormControlLabel
                            control={
                                <Switch
                                    checked={logWarningMessageChecked}
                                    onChange={setLogWarningMessage}
                                />
                            }
                            label={globalize.translate('LabelSlowResponseEnabled')}
                        />

                        <TextField
                            fullWidth
                            type='number'
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
