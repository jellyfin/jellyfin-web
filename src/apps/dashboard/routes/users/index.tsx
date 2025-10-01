import type { UserDto } from '@jellyfin/sdk/lib/generated-client';
import React, { useEffect, useState, useRef, useCallback } from 'react';

import Dashboard from '../../../../utils/dashboard';
import globalize from '../../../../lib/globalize';
import loading from '../../../../components/loading/loading';
import dom from '../../../../utils/dom';
import confirm from '../../../../components/confirm/confirm';
import UserCardBox from '../../../../components/dashboard/users/UserCardBox';
import SectionTitleContainer from '../../../../elements/SectionTitleContainer';
import '../../../../elements/emby-button/emby-button';
import '../../../../elements/emby-button/paper-icon-button-light';
import '../../../../components/cardbuilder/card.scss';
import '../../../../components/indicators/indicators.scss';
import '../../../../styles/flexstyles.scss';
import Page from '../../../../components/Page';
import { useLocation } from 'react-router-dom';
import Toast from 'apps/dashboard/components/Toast';

type MenuEntry = {
    name?: string;
    id?: string;
    icon?: string;
};

const UserProfiles = () => {
    const location = useLocation();
    const [ isSettingsSavedToastOpen, setIsSettingsSavedToastOpen ] = useState(false);
    const [ users, setUsers ] = useState<UserDto[]>([]);

    const element = useRef<HTMLDivElement>(null);

    const handleToastClose = useCallback(() => {
        setIsSettingsSavedToastOpen(false);
    }, []);

    const loadData = () => {
        loading.show();
        window.ApiClient.getUsers().then(function (result) {
            setUsers(result);
            loading.hide();
        }).catch(err => {
            console.error('[userprofiles] failed to fetch users', err);
        });
    };

    useEffect(() => {
        const page = element.current;

        if (location.state?.openSavedToast) {
            setIsSettingsSavedToastOpen(true);
            window.history.replaceState({}, '');
        }

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        loadData();

        const showUserMenu = async(elem: HTMLElement) => {
            const card = dom.parentWithClass(elem, 'card');
            const userId = card?.getAttribute('data-userid');
            const username = card?.getAttribute('data-username');

            if (!userId) {
                console.error('Unexpected null user id');
                return;
            }

            const menuItems: MenuEntry[] = [];

            menuItems.push({
                name: globalize.translate('ButtonEditUser'),
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
            try {
                const { default: actionsheet } = await import('../../../../components/actionSheet/actionSheet');
                actionsheet.show({
                    items: menuItems,
                    positionTo: card,
                    callback: async function (id: string) {
                        switch (id) {
                            case 'open':
                                try {
                                    await Dashboard.navigate('/dashboard/users/profile?userId=' + userId);
                                } catch (err ) {
                                    console.error('[userprofiles] failed to navigate to user edit page', err);
                                }
                                break;

                            case 'access':
                                try {
                                    await Dashboard.navigate('/dashboard/users/access?userId=' + userId);
                                } catch (err ) {
                                    console.error('[userprofiles] failed to navigate to user library page', err);
                                }
                                break;

                            case 'parentalcontrol':
                                try {
                                    await Dashboard.navigate('/dashboard/users/parentalcontrol?userId=' + userId);
                                } catch (err ) {
                                    console.error('[userprofiles] failed to navigate to parental control page', err);
                                }
                                break;

                            case 'delete':
                                deleteUser(userId, username);
                        }
                    }
                }).catch(() => {
                    // action sheet closed
                });
            } catch (err) {
                console.error('[userprofiles] failed to load action sheet', err);
            }
        };

        const deleteUser = (id: string, username?: string | null) => {
            const title = username ? globalize.translate('DeleteName', username) : globalize.translate('DeleteUser');
            const text = globalize.translate('DeleteUserConfirmation');

            confirm({
                title,
                text,
                confirmText: globalize.translate('Delete'),
                primary: 'delete'
            }).then(async function () {
                loading.show();
                try {
                    await window.ApiClient.deleteUser(id);
                    loadData();
                } catch (err ) {
                    console.error('[userprofiles] failed to delete user', err);
                }
            }).catch(() => {
                // confirm dialog closed
            });
        };

        page.addEventListener('click', async function (e) {
            const btnUserMenu = dom.parentWithClass(e.target as HTMLElement, 'btnUserMenu');

            if (btnUserMenu) {
                await showUserMenu(btnUserMenu);
            }
        });

        (page.querySelector('#btnAddUser') as HTMLButtonElement).addEventListener('click', function() {
            Dashboard.navigate('/dashboard/users/add')
                .catch(err => {
                    console.error('[userprofiles] failed to navigate to new user page', err);
                });
        });
    }, []);

    return (
        <Page
            id='userProfilesPage'
            className='mainAnimatedPage type-interior userProfilesPage fullWidthContent'
            title={globalize.translate('HeaderUsers')}
        >
            <Toast
                open={isSettingsSavedToastOpen}
                onClose={handleToastClose}
                message={globalize.translate('SettingsSaved')}
            />
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={globalize.translate('HeaderUsers')}
                        isBtnVisible={true}
                        btnId='btnAddUser'
                        btnClassName='fab submit sectionTitleButton'
                        btnTitle='ButtonAddUser'
                        btnIcon='add'
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
