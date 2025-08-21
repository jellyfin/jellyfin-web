import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import SectionTabs from '../../../../components/dashboard/users/SectionTabs';
import UserPasswordForm from '../../../../components/dashboard/users/UserPasswordForm';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import Page from '../../../../components/Page';
import loading from '../../../../components/loading/loading';

const UserPassword = () => {
    const [ searchParams ] = useSearchParams();
    const userId = searchParams.get('userId');
    const [ userName, setUserName ] = useState('');

    const loadUser = useCallback(() => {
        if (!userId) {
            console.error('[userpassword] missing user id');
            return;
        }

        loading.show();
        window.ApiClient.getUser(userId).then(function (user) {
            if (!user.Name) {
                throw new Error('Unexpected null user.Name');
            }
            setUserName(user.Name);
            loading.hide();
        }).catch(err => {
            console.error('[userpassword] failed to fetch user', err);
        });
    }, [userId]);
    useEffect(() => {
        loadUser();
    }, [loadUser]);

    return (
        <Page
            id='userPasswordPage'
            className='mainAnimatedPage type-interior userPasswordPage'
        >
            <div className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={userName}
                    />
                </div>
                <SectionTabs activeTab='userpassword'/>
                <div className='readOnlyContent'>
                    <UserPasswordForm
                        userId={userId}
                    />
                </div>
            </div>
        </Page>

    );
};

export default UserPassword;
