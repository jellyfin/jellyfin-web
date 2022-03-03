import React, { FunctionComponent, useCallback, useEffect, useState } from 'react';
import { appRouter } from '../appRouter';
import SectionTitleLinkElement from '../dashboard/users/SectionTitleLinkElement';
import SectionTabs from '../dashboard/users/SectionTabs';
import UserPasswordForm from '../dashboard/users/UserPasswordForm';

const UserPasswordPage: FunctionComponent = () => {
    const userId = appRouter.param('userId');
    const [ userName, setUserName ] = useState('');

    const loadUser = useCallback(() => {
        window.ApiClient.getUser(userId).then(function (user) {
            if (!user.Name) {
                throw new Error('Unexpected null user.Name');
            }
            setUserName(user.Name);
        });
    }, [userId]);
    useEffect(() => {
        loadUser();
    }, [loadUser]);

    return (
        <div>
            <div className='content-primary'>
                <div className='verticalSection'>
                    <div className='sectionTitleContainer flex align-items-center'>
                        <h2 className='sectionTitle username'>
                            {userName}
                        </h2>
                        <SectionTitleLinkElement
                            className='raised button-alt headerHelpButton'
                            title='Help'
                            url='https://docs.jellyfin.org/general/server/users/'
                        />
                    </div>
                </div>
                <SectionTabs activeTab='userpassword'/>
                <div className='readOnlyContent'>
                    <UserPasswordForm
                        userId={userId}
                    />
                </div>
            </div>
        </div>
    );
};

export default UserPasswordPage;
