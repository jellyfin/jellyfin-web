import React, { FC, useCallback, useEffect, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';

import { safeAppHost } from 'components/apphost';
import Page from 'components/Page';
import ReactMarkdownBox from 'components/ReactMarkdownBox';
import toast from 'components/toast/toast';
import { AppFeature } from 'constants/appFeature';
import { Button } from 'ui-primitives';
import globalize from 'lib/globalize';
import { ConnectionState, ServerConnections } from 'lib/jellyfin-apiclient';

interface ConnectionErrorPageProps {
    state: ConnectionState;
}

const ConnectionErrorPage: FC<ConnectionErrorPageProps> = ({ state }) => {
    const navigate = useNavigate();
    const [title, setTitle] = useState<string>();
    const [htmlMessage, setHtmlMessage] = useState<string>();
    const [message, setMessage] = useState<string>();
    const [isConnectDisabled, setIsConnectDisabled] = useState(false);

    const onForceConnect = useCallback(async () => {
        setIsConnectDisabled(true);

        try {
            const server = ServerConnections.getLastUsedServer();
            await ServerConnections.updateSavedServerId(server);
            // Try to navigate home instead of forcing a reload
            navigate({ to: '/home' });
        } catch (err) {
            console.error('[ConnectionErrorPage] Failed to force connect to server', err);
            toast(globalize.translate('HeaderConnectionFailure'));
            setIsConnectDisabled(false);
        }
    }, [navigate]);

    const onSelectServer = useCallback(() => {
        navigate({ to: '/selectserver' });
    }, [navigate]);

    useEffect(() => {
        switch (state) {
            case ConnectionState.ServerMismatch:
                setTitle(globalize.translate('HeaderServerMismatch'));
                setHtmlMessage(undefined);
                setMessage(globalize.translate('MessageServerMismatch'));
                return;
            case ConnectionState.ServerUpdateNeeded:
                setTitle(globalize.translate('HeaderUpdateRequired'));
                setHtmlMessage(
                    globalize.translate(
                        'ServerUpdateNeeded',
                        '<a href="https://jellyfin.org/downloads/server/">jellyfin.org/downloads/server</a>'
                    )
                );
                setMessage(undefined);
                return;
            case ConnectionState.Unavailable:
                setTitle(globalize.translate('HeaderServerUnavailable'));
                setHtmlMessage(undefined);
                setMessage(globalize.translate('MessageUnableToConnectToServer'));
        }
    }, [state]);

    if (!title) return;

    return (
        <Page id="connectionErrorPage" className="mainAnimatedPage standalonePage" isBackButtonEnabled={false}>
            <div className="padded-left padded-right">
                <h1>{title}</h1>
                {htmlMessage && (
                    <div style={{ maxWidth: '80ch' }}>
                        <ReactMarkdownBox markdown={htmlMessage} />
                    </div>
                )}
                {message && <p style={{ maxWidth: '80ch' }}>{message}</p>}

                {safeAppHost.supports(AppFeature.MultiServer) && (
                    <Button className="raised" onClick={onSelectServer}>
                        {globalize.translate('ButtonChangeServer')}
                    </Button>
                )}

                {state === ConnectionState.ServerMismatch && (
                    <Button onClick={onForceConnect} style={isConnectDisabled ? { pointerEvents: 'none' } : undefined}>
                        {globalize.translate('ConnectAnyway')}
                    </Button>
                )}
            </div>
        </Page>
    );
};

export default ConnectionErrorPage;
