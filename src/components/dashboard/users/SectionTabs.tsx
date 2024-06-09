import React, { FunctionComponent } from 'react';
import globalize from '../../../scripts/globalize';

type IProps = {
    activeTab: string;
};

const createLinkElement = (activeTab: string) => ({
    __html: `<a href="#"
        is="emby-linkbutton"
        data-role="button"
        class="${activeTab === 'useredit' ? 'ui-btn-active' : ''}"
        onclick="Dashboard.navigate('/dashboard/users/profile', true);">
        ${globalize.translate('Profile')}
    </a>
    <a href="#"
        is="emby-linkbutton"
        data-role="button"
        class="${activeTab === 'userlibraryaccess' ? 'ui-btn-active' : ''}"
        onclick="Dashboard.navigate('/dashboard/users/access', true);">
        ${globalize.translate('TabAccess')}
    </a>
    <a href="#"
        is="emby-linkbutton"
        data-role="button"
        class="${activeTab === 'userparentalcontrol' ? 'ui-btn-active' : ''}"
        onclick="Dashboard.navigate('/dashboard/users/parentalcontrol', true);">
        ${globalize.translate('TabParentalControl')}
    </a>
    <a href="#"
        is="emby-linkbutton"
        data-role="button"
        class="${activeTab === 'userpassword' ? 'ui-btn-active' : ''}"
        onclick="Dashboard.navigate('/dashboard/users/password', true);">
        ${globalize.translate('HeaderPassword')}
    </a>`
});

const SectionTabs: FunctionComponent<IProps> = ({ activeTab }: IProps) => {
    return (
        <div
            data-role='controlgroup'
            data-type='horizontal'
            className='localnav'
            dangerouslySetInnerHTML={createLinkElement(activeTab)}
        />
    );
};

export default SectionTabs;
