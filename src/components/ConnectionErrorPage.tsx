import React, { FC, useEffect, useState } from 'react';

import { appHost } from 'components/apphost';
import Page from 'components/Page';
import { AppFeature } from 'constants/appFeature';
import LinkButton from 'elements/emby-button/LinkButton';
import globalize from 'lib/globalize';
import { ConnectionState } from 'lib/jellyfin-apiclient';

interface ConnectionErrorPageProps {
    state: ConnectionState
}

const ConnectionErrorPage: FC<ConnectionErrorPageProps> = ({
    state
}) => {
    const [ title, setTitle ] = useState<string>();
    const [ htmlMessage, setHtmlMessage ] = useState<string>();
    const [ message, setMessage ] = useState<string>();

    useEffect(() => {
        switch (state) {
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
                    <p dangerouslySetInnerHTML={{ __html: htmlMessage }} />
                )}
                {message && (
                    <p>{message}</p>
                )}
                {appHost.supports(AppFeature.MultiServer) && (
                    <LinkButton
                        className='raised'
                        href='/selectserver'
                    >
                        {globalize.translate('ButtonChangeServer')}
                    </LinkButton>
                )}
            </div>
        </Page>
    );
};

export default ConnectionErrorPage;
