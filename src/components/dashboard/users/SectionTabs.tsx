import classNames from 'classnames';
import React, { FC } from 'react';
import LinkButton from '../../../elements/emby-button/LinkButton';
import globalize from '../../../scripts/globalize';
import Dashboard from '../../../utils/dashboard';

const tabs = [
    { name: 'Profile', page: 'useredit' },
    { name: 'TabAccess', page: 'userlibraryaccess' },
    { name: 'TabParentalControl', page: 'userparentalcontrol' },
    { name: 'HeaderPassword', page: 'userpassword' }
];

interface SectionTabsProps {
    activeTab: string;
}

const SectionTabs: FC<SectionTabsProps> = ({ activeTab }) => {
    return (
        <div
            data-role='controlgroup'
            data-type='horizontal'
            className='localnav'
        >
            {
                tabs.map((tab, index) =>
                    <LinkButton
                        key={index}
                        data-role='button'
                        className={classNames(activeTab === tab.page ? 'ui-btn-active' : '')}
                        onClick={() => Dashboard.navigate(`${tab.page}.html`, true)}
                    >
                        {globalize.translate(tab.name)}
                    </LinkButton>
                )
            }
        </div>
    );
};

export default SectionTabs;
