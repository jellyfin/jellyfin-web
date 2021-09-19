import React, { FunctionComponent, useEffect, useState, useRef } from 'react';

import Dashboard from '../../scripts/clientUtils';
import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import { appHost } from '../apphost';
import confirm from '../confirm/confirm';
import ButtonElement from '../DashboardComponent/users/userprofiles/ElementWarpper/ButtonElement';
import UserPasswordForm from '../DashboardComponent/users/userprofiles/UserPasswordForm';
import loading from '../loading/loading';
import toast from '../toast/toast';

type IProps = {
    userId?: string;
}

const UserImagePage: FunctionComponent<IProps> = ({userId}: IProps) => {
    const [ userName, setUserName ] = useState('');

    const element = useRef(null);

    const reloadUser = (Id) => {
        loading.show();
        window.ApiClient.getUser(Id).then(function (user) {
            setUserName(user.Name);
            LibraryMenu.setTitle(user.Name);

            let imageUrl = 'assets/img/avatar.png';
            if (user.PrimaryImageTag) {
                imageUrl = window.ApiClient.getUserImageUrl(user.Id, {
                    tag: user.PrimaryImageTag,
                    type: 'Primary'
                });
            }

            const userImage = element.current?.querySelector('#image');
            userImage.style.backgroundImage = 'url(' + imageUrl + ')';

            Dashboard.getCurrentUser().then(function (loggedInUser) {
                if (user.PrimaryImageTag) {
                    element.current?.querySelector('.btnAddImage').classList.add('hide');
                    element.current?.querySelector('.btnDeleteImage').classList.remove('hide');
                } else if (appHost.supports('fileinput') && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
                    element.current?.querySelector('.btnDeleteImage').classList.add('hide');
                    element.current?.querySelector('.btnAddImage').classList.remove('hide');
                }
            });
            loading.hide();
        });
    };

    useEffect(() => {
        reloadUser(userId);

        const onFileReaderError = (evt) => {
            loading.hide();
            switch (evt.target.error.code) {
                case evt.target.error.NOT_FOUND_ERR:
                    toast(globalize.translate('FileNotFound'));
                    break;
                case evt.target.error.ABORT_ERR:
                    onFileReaderAbort();
                    break;
                case evt.target.error.NOT_READABLE_ERR:
                default:
                    toast(globalize.translate('FileReadError'));
            }
        };

        const onFileReaderAbort = () => {
            loading.hide();
            toast(globalize.translate('FileReadCancelled'));
        };

        const setFiles = (evt) => {
            const userImage = element?.current?.querySelector('#image');
            const file = evt.target.files[0];

            if (!file || !file.type.match('image.*')) {
                return false;
            }

            const reader: FileReader = new FileReader();
            reader.onerror = onFileReaderError;
            reader.onabort = onFileReaderAbort;
            reader.onload = () => {
                userImage.style.backgroundImage = 'url(' + reader.result + ')';
                window.ApiClient.uploadUserImage(userId, 'Primary', file).then(function () {
                    loading.hide();
                    reloadUser(userId);
                });
            };

            reader.readAsDataURL(file);
        };

        element?.current?.querySelector('.btnDeleteImage').addEventListener('click', function () {
            confirm(globalize.translate('DeleteImageConfirmation'), globalize.translate('DeleteImage')).then(function () {
                loading.show();
                window.ApiClient.deleteUserImage(userId, 'primary').then(function () {
                    loading.hide();
                    reloadUser(userId);
                });
            });
        });
        element?.current?.querySelector('.btnAddImage').addEventListener('click', function () {
            element?.current?.querySelector('#uploadImage').click();
        });
        element?.current?.querySelector('#uploadImage').addEventListener('change', function (evt) {
            setFiles(evt);
        });
    }, [userId]);

    return (
        <div ref={element}>
            <div className='padded-left padded-right padded-bottom-page'>
                <div className='readOnlyContent' style={{margin: '0 auto', padding: '0 1em'}}>
                    <div style={{position: 'relative', display: 'inline-block', maxWidth: 200}}>
                        <input id='uploadImage' type='file' accept='image/*' style={{position: 'absolute', right: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer'}} />
                        <div id='image' style={{width: 200, height: 200, backgroundRepeat: 'no-repeat', backgroundPosition: 'center', borderRadius: '100%', backgroundSize: 'cover'}} />
                    </div>
                    <div style={{verticalAlign: 'top', margin: '1em 2em', display: 'inline-block'}}>
                        <h2 className='username' style={{margin: 0, fontSize: 'xx-large'}}>
                            {userName}
                        </h2>
                        <br />
                        <ButtonElement
                            type='button'
                            className='raised btnAddImage hide'
                            title='ButtonAddImage'
                        />
                        <ButtonElement
                            type='button'
                            className='raised btnDeleteImage hide'
                            title='DeleteImage'
                        />
                    </div>
                </div>

                <UserPasswordForm
                    userId={userId}
                />
            </div>
        </div>
    );
};

export default UserImagePage;
