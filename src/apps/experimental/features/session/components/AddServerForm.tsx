import React, { ChangeEventHandler, FC, useCallback, useEffect, useRef, useState } from 'react';

import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';
import appSettings from 'scripts/settings/appSettings';
import { appRouter } from 'components/router/appRouter';
import loading from 'components/loading/loading';
import Input from 'elements/emby-input/Input';
import Button from 'elements/emby-button/Button';
import globalize from 'lib/globalize';
import { useServerConnectionResultHandler } from '../hooks/useServerConnectionResultHandler';

const AddServerForm: FC = () => {
    const ref = useRef<HTMLInputElement>(null);
    const [host, setHost] = useState<string>('');

    const handleConnectionResult = useServerConnectionResultHandler();

    const onHostChange = useCallback<ChangeEventHandler<HTMLInputElement>>(e => setHost(e.target.value), []);

    const onCancel = useCallback(() => {
        appRouter
            .back()
            .catch(err => {
                console.log('[AddServerForm] Failed to navigate back.', err);
            });
    }, []);

    const onSubmit = useCallback<React.FormEventHandler>((e) => {
        e.preventDefault();
        loading.show();

        // eslint-disable-next-line sonarjs/slow-regex
        const hostTrimmed = host.replace(/\/+$/, '');

        ServerConnections.connectToAddress(hostTrimmed, {
            enableAutoLogin: appSettings.enableAutoLogin
        })
            .then((result) => {
                handleConnectionResult(result);
            })
            .catch((err) => {
                handleConnectionResult({
                    State: ConnectionState.Unavailable
                });

                console.log('[AddServerForm] Failed to connect.', err);
            })
            .finally(() => {
                loading.hide();
            });
    }, [host, handleConnectionResult]);

    useEffect(() => {
        ref.current?.focus();
    }, []);

    return (
        <form
            className='addServerForm'
            style={{ margin: '0 auto' }}
            noValidate
            onSubmit={onSubmit}
        >

            <h1>{globalize.translate('HeaderConnectToServer')}</h1>
            <div className='inputContainer'>
                <Input
                    id='txtServerHost'
                    type='url'
                    required
                    ref={ref}
                    label={globalize.translate('LabelServerHost')}
                    value={host}
                    onChange={onHostChange}
                />
                <div className='fieldDescription'>{globalize.translate('LabelServerHostHelp')}</div>
            </div>
            <br />
            <Button
                type='submit'
                className='raised button-submit block'
                title={globalize.translate('Connect')}
            />
            <Button
                type='button'
                className='raised button-cancel block btnCancel'
                title={globalize.translate('ButtonCancel')}
                onClick={onCancel}
            />
        </form>
    );
};

export default AddServerForm;
