import React, { FunctionComponent, useEffect, useState } from 'react';

import SectionTitleLinkElement from '../DashboardComponent/users/userprofiles/ElementWarpper/SectionTitle/SectionTitleLinkElement';
import TabLinkElement from '../DashboardComponent/users/userprofiles/ElementWarpper/TabLinkElement';
import UserPasswordForm from '../DashboardComponent/users/userprofiles/UserPasswordForm';

type IProps = {
    userId?: string;
}

const UserPasswordPage: FunctionComponent<IProps> = ({userId}: IProps) => {
    const [ userName, setUserName ] = useState('');

    const loadUser = (Id) => {
        window.ApiClient.getUser(Id).then(function (user) {
            setUserName(user.Name);
        });
    };

    useEffect(() => {
        loadUser(userId);
    }, [userId]);

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
                <div
                    data-role='controlgroup'
                    data-type='horizontal'
                    className='localnav'
                    style={{display: 'flex'}}
                >
                    <TabLinkElement
                        className=''
                        tabTitle='Profile'
                        navigateto='useredit.html'
                    />
                    <TabLinkElement
                        className=''
                        tabTitle='TabAccess'
                        navigateto='userlibraryaccess.html'
                    />
                    <TabLinkElement
                        className=''
                        tabTitle='TabParentalControl'
                        navigateto='userparentalcontrol.html'
                    />
                    <TabLinkElement
                        className='ui-btn-active'
                        tabTitle='HeaderPassword'
                        navigateto='userpassword.html'
                    />
                </div>
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
