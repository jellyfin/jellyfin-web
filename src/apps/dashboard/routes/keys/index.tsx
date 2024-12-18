import Page from 'components/Page';
import SectionTitleContainer from 'elements/SectionTitleContainer';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import React, { useCallback } from 'react';
import { getApiKeyApi } from '@jellyfin/sdk/lib/utils/api/api-key-api';
import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client/models/authentication-info';
import Loading from 'components/loading/LoadingComponent';
import confirm from 'components/confirm/confirm';
import ApiKeyCell from 'apps/dashboard/features/keys/components/ApiKeyCell';
import { useApiKeys } from 'apps/dashboard/features/keys/api/useApiKeys';

const ApiKeys = () => {
    const { api } = useApi();
    const { data: keys, refetch, isLoading } = useApiKeys();

    const revokeKey = useCallback((accessToken: string) => {
        if (!api) return;

        confirm(globalize.translate('MessageConfirmRevokeApiKey'), globalize.translate('HeaderConfirmRevokeApiKey')).then(function () {
            getApiKeyApi(api)
                .revokeKey({ key: accessToken })
                .then(() => refetch())
                .catch(err => {
                    console.error('[apikeys] failed to revoke key', err);
                });
        }).catch(err => {
            console.error('[apikeys] failed to show confirmation dialog', err);
        });
    }, [api, refetch]);

    const showNewKeyPopup = useCallback(() => {
        if (!api) return;

        import('../../../../components/prompt/prompt').then(({ default: prompt }) => {
            prompt({
                title: globalize.translate('HeaderNewApiKey'),
                label: globalize.translate('LabelAppName'),
                description: globalize.translate('LabelAppNameExample')
            }).then((value) => {
                getApiKeyApi(api)
                    .createKey({ app: value })
                    .then(() => refetch())
                    .catch(err => {
                        console.error('[apikeys] failed to create api key', err);
                    });
            }).catch(() => {
                // popup closed
            });
        }).catch(err => {
            console.error('[apikeys] failed to load api key popup', err);
        });
    }, [api, refetch]);

    if (isLoading) {
        return <Loading />;
    }

    return (
        <Page
            id='apiKeysPage'
            title={globalize.translate('HeaderApiKeys')}
            className='mainAnimatedPage type-interior'
        >
            <div className='content-primary'>
                <SectionTitleContainer
                    title={globalize.translate('HeaderApiKeys')}
                    isBtnVisible={true}
                    btnId='btnAddSchedule'
                    btnClassName='fab submit sectionTitleButton btnNewKey'
                    btnTitle={globalize.translate('Add')}
                    btnIcon='add'
                    onClick={showNewKeyPopup}
                />
                <p>{globalize.translate('HeaderApiKeysHelp')}</p>
                <br />
                <table className='tblApiKeys detailTable'>
                    <caption className='clipForScreenReader'>{globalize.translate('ApiKeysCaption')}</caption>
                    <thead>
                        <tr>
                            <th scope='col' className='detailTableHeaderCell'></th>
                            <th scope='col' className='detailTableHeaderCell'>{globalize.translate('HeaderApiKey')}</th>
                            <th scope='col' className='detailTableHeaderCell'>{globalize.translate('HeaderApp')}</th>
                            <th scope='col' className='detailTableHeaderCell'>{globalize.translate('HeaderDateIssued')}</th>
                        </tr>
                    </thead>
                    <tbody className='resultBody'>
                        {keys?.Items?.map((key: AuthenticationInfo) => {
                            return <ApiKeyCell key={key.AccessToken} apiKey={key} revokeKey={revokeKey} />;
                        })}
                    </tbody>
                </table>
            </div>
        </Page>
    );
};

export default ApiKeys;
