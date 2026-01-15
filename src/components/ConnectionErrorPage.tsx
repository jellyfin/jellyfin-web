import DOMPurify from 'dompurify';
import React, { FC, useCallback, useEffect, useState } from 'react';

import { safeAppHost } from 'components/apphost';
import Page from 'components/Page';
import toast from 'components/toast/toast';
import { AppFeature } from 'constants/appFeature';
import LinkButton from 'elements/emby-button/LinkButton';
import globalize from 'lib/globalize';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';

interface ConnectionErrorPageProps {
    state: ConnectionState
}

const ConnectionErrorPage: FC<ConnectionErrorPageProps> = ({
    state
}) => {
    const [ title, setTitle ] = useState<string>();
    const [ htmlMessage, setHtmlMessage ] = useState<string>();
    const [ message, setMessage ] = useState<string>();
    const [ isConnectDisabled, setIsConnectDisabled ] = useState(false);

    const onForceConnect = useCallback(async () => {
        setIsConnectDisabled(true);

        try {
            const server = ServerConnections.getLastUsedServer();
            await ServerConnections.updateSavedServerId(server);
            window.location.reload();
        } catch (err) {
            console.error('[ConnectionErrorPage] Failed to force connect to server', err);
            toast(globalize.translate('HeaderConnectionFailure'));
            setIsConnectDisabled(false);
        }
    }, []);

    useEffect(() => {
        switch (state) {
            case ConnectionState.ServerMismatch:
                setTitle(globalize.translate('HeaderServerMismatch'));
                setHtmlMessage(undefined);
                setMessage(globalize.translate('MessageServerMismatch'));
                return;
            case ConnectionState.ServerUpdateNeeded:
                setTitle(globalize.translate('HeaderUpdateRequired'));
                setHtmlMessage(globalize.translate(
                    'ServerUpdateNeeded',
                    '<a href="https://jellyfin.org/downloads/server/">jellyfin.org/downloads/server</a>'
                ));
                setMessage(undefined);
                return;
            case ConnectionState.Unavailable:
                setTitle(globalize.translate('HeaderServerUnavailable'));
                setHtmlMessage(undefined);
                setMessage(globalize.translate('MessageUnableToConnectToServer'));
        }
    }, [ state ]);

    if (!title) return;

    return (
        <Page
            id='connectionErrorPage'
            className='mainAnimatedPage standalonePage'
            isBackButtonEnabled={false}
        >
            <div className='padded-left padded-right'>
                <h1>{title}</h1>
                {htmlMessage && (
                    <p
                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlMessage) }}
                        style={{ maxWidth: '80ch' }}
                    />
                )}
                {message && (
                    <p style={{ maxWidth: '80ch' }}>
                        {message}
                    </p>
                )}

                {safeAppHost.supports(AppFeature.MultiServer) && (
                    <LinkButton
                        className='raised'
                        href='/selectserver'
                    >
                        {globalize.translate('ButtonChangeServer')}
                    </LinkButton>
                )}

                {state === ConnectionState.ServerMismatch && (
                    <LinkButton
                        onClick={onForceConnect}
                        style={ isConnectDisabled ? { pointerEvents: 'none' } : undefined }
                    >
                        {globalize.translate('ConnectAnyway')}
                    </LinkButton>
                )}
            </div>
        </Page>
    );
};

export default ConnectionErrorPage;
