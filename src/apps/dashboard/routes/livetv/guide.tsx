import React, { useCallback, useEffect, useRef } from 'react';
import Page from 'components/Page';
import Box from '@mui/material/Box';
import { useNavigate, useParams } from 'react-router-dom';
import globalize from 'lib/globalize';
import { Events } from 'jellyfin-apiclient';

export const Component = () => {
    const { provider } = useParams();
    const navigate = useNavigate();
    const providerTemplateRef = useRef<HTMLDivElement | null>(null);

    const onListingsSubmitted = useCallback(() => {
        navigate('dashboard/livetv');
    }, [navigate]);

    useEffect(() => {
        import(`components/tvproviders/${provider}.template.html`).then(({ default: html }) => {
            if (providerTemplateRef.current) {
                providerTemplateRef.current.innerHTML = globalize.translateHtml(html);

                import(`components/tvproviders/${provider}`).then(({ default: ProviderFactory }) => {
                    const instance = new ProviderFactory(providerTemplateRef.current, '', {});
                    Events.on(instance, 'submitted', onListingsSubmitted);
                    instance.init();
                }).catch(() => {
                    console.log('[livetvguide] Failed to load provider');
                });
            }
        }).catch(() => {
            console.log('[livetvguide] Failed to load provider template');
        });
    }, [ provider, onListingsSubmitted ]);

    return (
        <Page
            id='liveTvGuideProviderPage'
            className='mainAnimatedPage type-interior'
        >
            <Box className='content-primary'>
                <div ref={providerTemplateRef} className='readOnlyContent providerTemplate' style={{ marginTop: '2em' }} />
            </Box>
        </Page>
    );
};

Component.displayName = 'LiveTvGuidePage';
