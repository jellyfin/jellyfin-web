import escapeHTML from 'escape-html';
import { getAuthenticationApi } from '@jellyfin/sdk/lib/utils/api/authentication-api';
import React, { FC, FormEvent, useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Loading from 'components/loading/LoadingComponent';
import Page from 'components/Page';
import Button from 'elements/emby-button/Button';
import Input from 'elements/emby-input/Input';
import SelectElement from 'elements/SelectElement';
import { useApi } from 'hooks/useApi';
import { useUsers } from 'hooks/useUsers';
import globalize from 'lib/globalize';

import './quickConnect.scss';

const QuickConnectPage: FC = () => {
    const { api, user } = useApi();
    const {
        data: users,
        isPending
    } = useUsers();
    const [ searchParams ] = useSearchParams();
    const userIdDefault = searchParams.get('userId') ?? user?.Id;
    const [ code, setCode ] = useState(searchParams.get('code') ?? '');
    const [ error, setError ] = useState<string>();
    const [ success, setSuccess ] = useState(false);

    const onCodeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setCode(event.currentTarget.value);
    }, []);

    const onSubmitCode = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(undefined);

        const form = e.currentTarget;
        if (!form.checkValidity()) {
            setError('QuickConnectInvalidCode');
            return;
        }

        const userId = form.querySelector<HTMLSelectElement>('#userId')?.value;

        if (!api) {
            console.error('[QuickConnect] cannot authorize, missing api instance');
            setError('UnknownError');
            return;
        }

        const normalizedCode = code.replace(/\s/g, '');
        console.log('[QuickConnect] authorizing code %s as user %s', normalizedCode, userId);

        getAuthenticationApi(api)
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
    }, [ api, code ]);

    if (isPending) return <Loading />;

    return (
        <Page
            id='quickConnectPreferencesPage'
            title={globalize.translate('QuickConnect')}
            className='mainAnimatedPage libraryPage userPreferencesPage noSecondaryNavPage'
            shouldAutoFocus
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
                                <Link to='/home' className='button-link emby-button'>
                                    {globalize.translate('GoHome')}
                                </Link>
                            </div>
                        ) : (
                            <>
                                {user?.Policy?.IsAdministrator && (
                                    <div className='selectContainer'>
                                        <SelectElement
                                            id='userId'
                                            label='LabelUser'
                                        >
                                            {
                                                users
                                                    ?.filter(u => !u.Policy?.IsDisabled)
                                                    .map(u => (
                                                        `<option value=${u.Id} ${u.Id === userIdDefault ? 'selected' : ''}>`
                                                        + escapeHTML(u.Name)
                                                        + '</option>'
                                                    ))
                                            }
                                        </SelectElement>
                                    </div>
                                )}

                                <div className='inputContainer'>
                                    <Input
                                        value={code}
                                        onChange={onCodeChange}
                                        id='txtQuickConnectCode'
                                        label={globalize.translate('LabelQuickConnectCode')}
                                        type='text'
                                        inputMode='numeric'
                                        pattern='[0-9\s]*'
                                        minLength={6}
                                        required
                                        autoComplete='off'
                                    />
                                </div>
                                <Button
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
