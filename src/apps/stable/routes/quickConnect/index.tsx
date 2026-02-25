import { getQuickConnectApi } from '@jellyfin/sdk/lib/utils/api/quick-connect-api';
import React, { FC, FormEvent, useCallback, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

import Page from 'components/Page';
import globalize from 'lib/globalize';
import Input from 'elements/emby-input/Input';
import Button from 'elements/emby-button/Button';
import { useApi } from 'hooks/useApi';
import { useUsers } from 'hooks/useUsers';

import './quickConnect.scss';

const QuickConnectPage: FC = () => {
    const { api, user } = useApi();
    const { data: usersData } = useUsers();
    const [ searchParams ] = useSearchParams();
    const [ code, setCode ] = useState(searchParams.get('code') ?? '');
    const [ selectedUserId, setSelectedUserId ] = useState<string>(user?.Id ?? '');
    const [ error, setError ] = useState<string>();
    const [ success, setSuccess ] = useState(false);

    const isAdmin = user?.Policy?.IsAdministrator ?? false;

    const onCodeChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        setCode(event.currentTarget.value);
    }, []);

    const onUserChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedUserId(event.currentTarget.value);
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

        // Use selected user ID for admins, otherwise use current user
        const userId = isAdmin && selectedUserId ?
            selectedUserId :
            (searchParams.get('userId') ?? user?.Id);

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
    }, [api, code, searchParams, user?.Id, isAdmin, selectedUserId]);

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
                                {isAdmin && usersData && (
                                    <div className='inputContainer'>
                                        <label htmlFor='selectUser' className='inputLabel'>
                                            {globalize.translate('LabelUser')}
                                        </label>
                                        <select
                                            id='selectUser'
                                            className='emby-select-withcolor emby-select'
                                            value={selectedUserId}
                                            onChange={onUserChange}
                                        >
                                            {usersData.map((u) => (
                                                <option key={u.Id} value={u.Id}>
                                                    {u.Name}
                                                </option>
                                            ))}
                                        </select>
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
