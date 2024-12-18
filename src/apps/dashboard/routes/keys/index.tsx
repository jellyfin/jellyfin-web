import Page from 'components/Page';
import SectionTitleContainer from 'elements/SectionTitleContainer';
import { useApi } from 'hooks/useApi';
import globalize from 'lib/globalize';
import React, { useCallback } from 'react';
import type { AuthenticationInfo } from '@jellyfin/sdk/lib/generated-client/models/authentication-info';
import Loading from 'components/loading/LoadingComponent';
import confirm from 'components/confirm/confirm';
import ApiKeyCell from 'apps/dashboard/features/keys/components/ApiKeyCell';
import { useApiKeys } from 'apps/dashboard/features/keys/api/useApiKeys';
import { useRevokeKey } from 'apps/dashboard/features/keys/api/useRevokeKey';
import { useCreateKey } from 'apps/dashboard/features/keys/api/useCreateKey';

const ApiKeys = () => {
    const { api } = useApi();
    const { data: keys, isLoading } = useApiKeys();
    const revokeKey = useRevokeKey();
    const createKey = useCreateKey();

    const onRevokeKey = useCallback((accessToken: string) => {
        if (!api) return;

        confirm(globalize.translate('MessageConfirmRevokeApiKey'), globalize.translate('HeaderConfirmRevokeApiKey')).then(function () {
            revokeKey.mutate({
                key: accessToken
            });
        }).catch(err => {
            console.error('[apikeys] failed to show confirmation dialog', err);
        });
    }, [api, revokeKey]);

    const showNewKeyPopup = useCallback(() => {
        if (!api) return;

        import('../../../../components/prompt/prompt').then(({ default: prompt }) => {
            prompt({
                title: globalize.translate('HeaderNewApiKey'),
                label: globalize.translate('LabelAppName'),
                description: globalize.translate('LabelAppNameExample')
            }).then((value) => {
                createKey.mutate({
                    app: value
                });
            }).catch(() => {
                // popup closed
            });
        }).catch(err => {
            console.error('[apikeys] failed to load api key popup', err);
        });
    }, [api, createKey]);

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
                            return <ApiKeyCell key={key.AccessToken} apiKey={key} revokeKey={onRevokeKey} />;
                        })}
                    </tbody>
                </table>
            </div>
        </Page>
    );
};

export default ApiKeys;
