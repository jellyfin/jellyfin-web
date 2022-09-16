import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, {FunctionComponent, useEffect, useState, useRef} from 'react';
import Dashboard from '../../utils/dashboard';
import globalize from '../../scripts/globalize';
import loading from '../../components/loading/loading';
import dom from '../../scripts/dom';
import confirm from '../../components/confirm/confirm';
import UserCardBox from '../../components/dashboard/users/UserCardBox';
import SectionTitleContainer from '../../elements/SectionTitleContainer';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-button/paper-icon-button-light';
import '../../components/cardbuilder/card.scss';
import '../../components/indicators/indicators.scss';
import '../../assets/css/flexstyles.scss';
import Page from '../../components/Page';

type MenuEntry = {
    name?: string;
    id?: string;
    icon?: string;
}

const UserProfiles: FunctionComponent = () => {
    const [ users, setUsers ] = useState<UserDto[]>([]);

    const element = useRef<HTMLDivElement>(null);

    const loadData = () => {
        loading.show();
        window.ApiClient.getUsers().then(function (result) {
            setUsers(result);
            loading.hide();
        });
    };

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        loadData();

        const showUserMenu = (elem: HTMLElement) => {
            const card = dom.parentWithClass(elem, 'card');
            const userId = card.getAttribute('data-userid');

            if (!userId) {
                console.error('Unexpected null user id');
                return;
            }

            const menuItems: MenuEntry[] = [];

            menuItems.push({
                name: globalize.translate('ButtonOpen'),
                id: 'open',
                icon: 'mode_edit'
            });
            menuItems.push({
                name: globalize.translate('ButtonLibraryAccess'),
                id: 'access',
                icon: 'lock'
            });
            menuItems.push({
                name: globalize.translate('ButtonParentalControl'),
                id: 'parentalcontrol',
                icon: 'person'
            });
            menuItems.push({
                name: globalize.translate('Delete'),
                id: 'delete',
                icon: 'delete'
            });

            import('../../components/actionSheet/actionSheet').then(({default: actionsheet}) => {
                actionsheet.show({
                    items: menuItems,
                    positionTo: card,
                    callback: function (id: string) {
                        switch (id) {
                            case 'open':
                                Dashboard.navigate('useredit.html?userId=' + userId);
                                break;

                            case 'access':
                                Dashboard.navigate('userlibraryaccess.html?userId=' + userId);
                                break;

                            case 'parentalcontrol':
                                Dashboard.navigate('userparentalcontrol.html?userId=' + userId);
                                break;

                            case 'delete':
                                deleteUser(userId);
                        }
                    }
                });
            });
        };

        const deleteUser = (id: string) => {
            const msg = globalize.translate('DeleteUserConfirmation');

            confirm({
                title: globalize.translate('DeleteUser'),
                text: msg,
                confirmText: globalize.translate('Delete'),
                primary: 'delete'
            }).then(function () {
                loading.show();
                window.ApiClient.deleteUser(id).then(function () {
                    loadData();
                });
            });
        };

        page.addEventListener('click', function (e) {
            const btnUserMenu = dom.parentWithClass(e.target as HTMLElement, 'btnUserMenu');

            if (btnUserMenu) {
                showUserMenu(btnUserMenu);
            }
        });

        (page.querySelector('#btnAddUser') as HTMLButtonElement).addEventListener('click', function() {
            Dashboard.navigate('usernew.html');
        });
    }, []);

    return (
        <Page
            id='userProfilesPage'
            className='mainAnimatedPage type-interior userProfilesPage fullWidthContent'
        >
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={globalize.translate('HeaderUsers')}
                        isBtnVisible={true}
                        btnId='btnAddUser'
                        btnClassName='fab submit sectionTitleButton'
                        btnTitle='ButtonAddUser'
                        btnIcon='add'
                        url='https://docs.jellyfin.org/general/server/users/adding-managing-users.html'
                    />
                </div>

                <div className='localUsers itemsContainer vertical-wrap'>
                    {users.map(user => {
                        return <UserCardBox key={user.Id} user={user} />;
                    })}
                </div>
            </div>
        </Page>

    );
};

export default UserProfiles;
