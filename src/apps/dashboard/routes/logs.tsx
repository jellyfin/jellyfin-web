import React, { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import type { LogFile } from '@jellyfin/sdk/lib/generated-client/models/log-file';
import { getConfigurationApi } from '@jellyfin/sdk/lib/utils/api/configuration-api';
import { getSystemApi } from '@jellyfin/sdk/lib/utils/api/system-api';
import LogItem from 'components/dashboard/logs/LogItem';
import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import ButtonElement from 'elements/ButtonElement';
import CheckBoxElement from 'elements/CheckBoxElement';
import InputElement from 'elements/InputElement';
import SectionTitleContainer from 'elements/SectionTitleContainer';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import toast from 'components/toast/toast';

const Logs = () => {
    const { api } = useApi();
    const [ logs, setLogs ] = useState<LogFile[]>([]);
    const [ loading, setLoading ] = useState(false);
    const element = useRef<HTMLDivElement>(null);

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

        const page = element.current;

        if (!page) return;

        getConfigurationApi(api)
            .getConfiguration()
            .then(({ data: config }) => {
                config.EnableSlowResponseWarning = (page.querySelector('.chkSlowResponseWarning') as HTMLInputElement).checked;
                config.SlowResponseThresholdMs = parseInt((page.querySelector('#txtSlowResponseWarning') as HTMLInputElement).value, 10);
                getConfigurationApi(api)
                    .updateConfiguration({ serverConfiguration: config })
                    .then(() => toast(globalize.translate('SettingsSaved')))
                    .catch(err => {
                        console.error('[logs] failed to update configuration data', err);
                    });
            })
            .catch(err => {
                console.error('[logs] failed to get configuration data', err);
            });
    }, [api]);

    useEffect(() => {
        if (!api) return;

        loadLogs()?.then(() => {
            setLoading(false);
        }).catch(err => {
            console.error('[logs] An error occurred while fetching logs', err);
        });

        const page = element.current;

        if (!page || loading) return;

        getConfigurationApi(api)
            .getConfiguration()
            .then(({ data: config }) => {
                if (config.EnableSlowResponseWarning) {
                    (page.querySelector('.chkSlowResponseWarning') as HTMLInputElement).checked = config.EnableSlowResponseWarning;
                }
                if (config.SlowResponseThresholdMs != null) {
                    (page.querySelector('#txtSlowResponseWarning') as HTMLInputElement).value = String(config.SlowResponseThresholdMs);
                }
            })
            .catch(err => {
                console.error('[logs] An error occurred while fetching system config', err);
            });
    }, [loading, api, loadLogs]);

    if (loading) {
        return <Loading />;
    }

    return (
        <Page
            id='logPage'
            title={globalize.translate('TabLogs')}
            className='mainAnimatedPage type-interior'
        >
            <div ref={element} className='content-primary'>
                <form className='logsForm' onSubmit={onSubmit}>
                    <div className='verticalSection'>
                        <SectionTitleContainer
                            title={globalize.translate('TabLogs')}
                        />
                    </div>

                    <div className='verticalSection'>
                        <div className='checkboxContainer checkboxContainer-withDescription'>
                            <CheckBoxElement
                                className='chkSlowResponseWarning'
                                title='LabelSlowResponseEnabled'
                            />
                        </div>
                        <div className='inputContainer'>
                            <InputElement
                                type='number'
                                id='txtSlowResponseWarning'
                                label='LabelSlowResponseTime'
                            />
                        </div>
                        <br />
                        <div>
                            <ButtonElement
                                type='submit'
                                className='raised button-submit block'
                                title='Save'
                            />
                        </div>
                    </div>
                </form>
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
            </div>
        </Page>
    );
};

export default Logs;
