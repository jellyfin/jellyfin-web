import React from 'react';
import { useSearchParams } from 'react-router-dom';

import SectionTabs from '../../../../components/dashboard/users/SectionTabs';
import UserPasswordForm from '../../../../components/dashboard/users/UserPasswordForm';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import Page from '../../../../components/Page';
import { useUser } from 'apps/dashboard/features/users/api/useUser';
import Loading from 'components/loading/LoadingComponent';

const UserPassword = () => {
    const [ searchParams ] = useSearchParams();
    const userId = searchParams.get('userId');
    const { data: user, isPending } = useUser(userId ? { userId: userId } : undefined);

    if (isPending || !user) {
        return <Loading />;
    }

    return (
        <Page
            id='userPasswordPage'
            className='mainAnimatedPage type-interior userPasswordPage'
        >
            <div className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={user?.Name || undefined}
                    />
                </div>
                <SectionTabs activeTab='userpassword'/>
                <div className='readOnlyContent'>
                    <UserPasswordForm
                        user={user}
                    />
                </div>
            </div>
        </Page>

    );
};

export default UserPassword;
