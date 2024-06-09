import { getQuickConnectApi } from '@jellyfin/sdk/lib/utils/api/quick-connect-api';
import React, { FC, FormEvent, useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'scripts/globalize';
import InputElement from 'elements/InputElement';
import ButtonElement from 'elements/ButtonElement';
import { useApi } from 'hooks/useApi';

import './quickConnect.scss';

const QuickConnectPage: FC = () => {
    const { api, user } = useApi();
    const [ searchParams ] = useSearchParams();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const initialValue = useMemo(() => searchParams.get('code') ?? '', []);
    const [ code, setCode ] = useState(initialValue);
    const [ error, setError ] = useState<string>();
    const [ success, setSuccess ] = useState(false);

    const onCodeChange = useCallback((value: string) => {
        setCode(value);
    }, []);

    const onSubmitCode = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(undefined);

        const form = e.currentTarget;
        if (!form.checkValidity()) {
            setError('QuickConnectInvalidCode');
            return;
        }

        if (!api) {
            console.error('[QuickConnect] cannot authorize, missing api instance');
            setError('UnknownError');
            return;
        }

        const userId = searchParams.get('userId') ?? user?.Id;
        const normalizedCode = code.replace(/\s/g, '');
        console.log('[QuickConnect] authorizing code %s as user %s', normalizedCode, userId);

        getQuickConnectApi(api)
            .authorizeQuickConnect({
                code: normalizedCode,
                userId
            })
            .then(() => {
                setSuccess(true);
            })
            .catch(() => {
                setError('QuickConnectAuthorizeFail');
            });
    }, [api, code, searchParams, user?.Id]);

    return (
        <Page
            id='quickConnectPreferencesPage'
            title={globalize.translate('QuickConnect')}
            className='mainAnimatedPage libraryPage userPreferencesPage noSecondaryNavPage'
        >
            <div className='padded-left padded-right padded-bottom-page'>
                <form onSubmit={onSubmitCode}>
                    <div className='verticalSection'>
                        <h2 className='sectionTitle'>
                            {globalize.translate('QuickConnect')}
                        </h2>
                        <div>
                            {globalize.translate('QuickConnectDescription')}
                        </div>
                        <br />

                        {error && (
                            <div className='quickConnectError'>
                                {globalize.translate(error)}
                            </div>
                        )}

                        {success ? (
                            <div style={{ textAlign: 'center' }}>
                                <p>
                                    {globalize.translate('QuickConnectAuthorizeSuccess')}
                                </p>
                                <Link to='/home.html' className='button-link emby-button'>
                                    {globalize.translate('GoHome')}
                                </Link>
                            </div>
                        ) : (
                            <>
                                <InputElement
                                    containerClassName='inputContainer'
                                    initialValue={initialValue}
                                    onChange={onCodeChange}
                                    id='txtQuickConnectCode'
                                    label='LabelQuickConnectCode'
                                    type='text'
                                    options="inputmode='numeric' pattern='[0-9\s]*' minlength='6' required autocomplete='off'"
                                />
                                <ButtonElement
                                    type='submit'
                                    className='raised button-submit block'
                                    title={globalize.translate('Authorize')}
                                />
                            </>
                        )}
                    </div>
                </form>
            </div>
        </Page>
    );
};

export default QuickConnectPage;
