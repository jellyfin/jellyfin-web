
import React, {FunctionComponent, useEffect, useState, useRef} from 'react';
import Dashboard from '../../scripts/clientUtils';
import globalize from '../../scripts/globalize';
import loading from '../loading/loading';
import dom from '../../scripts/dom';
import confirm from '../../components/confirm/confirm';
import SectionTitleContainer from '../DashboardComponent/users/userprofiles/SectionTitleContainer';
import UserCardBox from '../DashboardComponent/users/userprofiles/UserCardBox';
import '../../elements/emby-button/paper-icon-button-light';
import '../../components/cardbuilder/card.scss';
import '../../elements/emby-button/emby-button';
import '../../components/indicators/indicators.scss';
import '../../assets/css/flexstyles.scss';

type MenuEntry = {
    name: string;
    id: string;
    icon: string;
}

const UserProfilesPage: FunctionComponent = () => {
    const [ users, setUsers ] = useState([]);

    const localUsersRef = useRef(null);

    const loadData = () => {
        loading.show();
        window.ApiClient.getUsers().then(function (result) {
            setUsers(result);
            loading.hide();
        });
    };

    useEffect(() => {
        loadData();

        const showUserMenu = (elem) => {
            const card = dom.parentWithClass(elem, 'card');
            const userId = card.getAttribute('data-userid');

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
                    callback: function (id) {
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

        const deleteUser = (id) => {
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

        localUsersRef?.current?.addEventListener('click', function (e) {
            const btnUserMenu = dom.parentWithClass(e.target, 'btnUserMenu');

            if (btnUserMenu) {
                showUserMenu(btnUserMenu);
            }
        });
    }, []);

    return (
        <div className='content-primary'>
            <div className='verticalSection verticalSection-extrabottompadding'>
                <SectionTitleContainer />
                <div
                    ref={localUsersRef}
                    className='localUsers itemsContainer vertical-wrap'
                >
                    {users.map((user, index: number)=> (
                        <UserCardBox key={index} user={user} />
                    ))}
                </div>
            </div>
        </div>

    );
};

export default UserProfilesPage;
