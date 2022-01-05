import React, { FunctionComponent, useEffect, useRef } from 'react';
import Dashboard from '../../../scripts/clientUtils';
import globalize from '../../../scripts/globalize';
import LibraryMenu from '../../../scripts/libraryMenu';
import confirm from '../../confirm/confirm';
import loading from '../../loading/loading';
import toast from '../../toast/toast';
import ButtonElement from './ButtonElement';
import CheckBoxElement from './CheckBoxElement';
import InputElement from './InputElement';

type IProps = {
    userId?: string;
}

const UserPasswordForm: FunctionComponent<IProps> = ({userId}: IProps) => {
    const element = useRef(null);

    const loadUser = (Id) => {
        window.ApiClient.getUser(Id).then(function (user) {
            Dashboard.getCurrentUser().then(function (loggedInUser) {
                LibraryMenu.setTitle(user.Name);

                let showPasswordSection = true;
                let showLocalAccessSection = false;

                if (user.ConnectLinkType == 'Guest') {
                    element.current?.querySelector('.localAccessSection').classList.add('hide');
                    showPasswordSection = false;
                } else if (user.HasConfiguredPassword) {
                    element.current?.querySelector('.btnResetPassword').classList.remove('hide');
                    element.current?.querySelector('#fldCurrentPassword').classList.remove('hide');
                    showLocalAccessSection = true;
                } else {
                    element.current?.querySelector('.btnResetPassword').classList.add('hide');
                    element.current?.querySelector('#fldCurrentPassword').classList.add('hide');
                }

                if (showPasswordSection && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
                    element.current?.querySelector('.passwordSection').classList.remove('hide');
                } else {
                    element.current?.querySelector('.passwordSection').classList.add('hide');
                }

                if (showLocalAccessSection && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
                    element.current?.querySelector('.localAccessSection').classList.remove('hide');
                } else {
                    element.current?.querySelector('.localAccessSection').classList.add('hide');
                }

                const txtEasyPassword = element.current?.querySelector('#txtEasyPassword');
                txtEasyPassword.value = '';

                if (user.HasConfiguredEasyPassword) {
                    txtEasyPassword.placeholder = '******';
                    element.current?.querySelector('.btnResetEasyPassword').classList.remove('hide');
                } else {
                    txtEasyPassword.removeAttribute('placeholder');
                    txtEasyPassword.placeholder = '';
                    element.current?.querySelector('.btnResetEasyPassword').classList.add('hide');
                }

                element.current.querySelector('.chkEnableLocalEasyPassword').checked = user.Configuration.EnableLocalPassword;

                import('../../autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(element.current);
                });
            });
        });

        element.current.querySelector('#txtCurrentPassword').value = '';
        element.current.querySelector('#txtNewPassword').value = '';
        element.current.querySelector('#txtNewPasswordConfirm').value = '';
    };

    useEffect(() => {
        loadUser(userId);

        const onSubmit = (e) => {
            const form = element.current;

            if (form.querySelector('#txtNewPassword').value != form.querySelector('#txtNewPasswordConfirm').value) {
                toast(globalize.translate('PasswordMatchError'));
            } else {
                loading.show();
                savePassword();
            }

            e.preventDefault();
            return false;
        };

        const savePassword = () => {
            let currentPassword = element.current?.querySelector('#txtCurrentPassword').value;
            const newPassword = element.current?.querySelector('#txtNewPassword').value;

            if (element.current?.querySelector('#fldCurrentPassword').classList.contains('hide')) {
                // Firefox does not respect autocomplete=off, so clear it if the field is supposed to be hidden (and blank)
                // This should only happen when user.HasConfiguredPassword is false, but this information is not passed on
                currentPassword = '';
            }

            window.ApiClient.updateUserPassword(userId, currentPassword, newPassword).then(function () {
                loading.hide();
                toast(globalize.translate('PasswordSaved'));

                loadUser(userId);
            }, function () {
                loading.hide();
                Dashboard.alert({
                    title: globalize.translate('HeaderLoginFailure'),
                    message: globalize.translate('MessageInvalidUser')
                });
            });
        };

        const onLocalAccessSubmit = (e) => {
            loading.show();
            saveEasyPassword();
            e.preventDefault();
            return false;
        };

        const saveEasyPassword = () => {
            const easyPassword = element.current?.querySelector('#txtEasyPassword').value;

            if (easyPassword) {
                window.ApiClient.updateEasyPassword(userId, easyPassword).then(function () {
                    onEasyPasswordSaved(userId);
                });
            } else {
                onEasyPasswordSaved(userId);
            }
        };

        const onEasyPasswordSaved = (Id) => {
            window.ApiClient.getUser(Id).then(function (user) {
                user.Configuration.EnableLocalPassword = element.current?.querySelector('.chkEnableLocalEasyPassword').checked;
                window.ApiClient.updateUserConfiguration(user.Id, user.Configuration).then(function () {
                    loading.hide();
                    toast(globalize.translate('SettingsSaved'));

                    loadUser(userId);
                });
            });
        };

        const resetEasyPassword = () => {
            const msg = globalize.translate('PinCodeResetConfirmation');

            confirm(msg, globalize.translate('HeaderPinCodeReset')).then(function () {
                loading.show();
                window.ApiClient.resetEasyPassword(userId).then(function () {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('PinCodeResetComplete'),
                        title: globalize.translate('HeaderPinCodeReset')
                    });
                    loadUser(userId);
                });
            });
        };

        const resetPassword = () => {
            const msg = globalize.translate('PasswordResetConfirmation');
            confirm(msg, globalize.translate('ResetPassword')).then(function () {
                loading.show();
                window.ApiClient.resetUserPassword(userId).then(function () {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('PasswordResetComplete'),
                        title: globalize.translate('ResetPassword')
                    });
                    loadUser(userId);
                });
            });
        };

        element?.current?.querySelector('.updatePasswordForm').addEventListener('submit', onSubmit);
        element?.current?.querySelector('.localAccessForm').addEventListener('submit', onLocalAccessSubmit);

        element?.current?.querySelector('.btnResetEasyPassword').addEventListener('click', resetEasyPassword);
        element?.current?.querySelector('.btnResetPassword').addEventListener('click', resetPassword);
    }, [userId]);

    return (
        <div ref={element}>
            <form
                className='updatePasswordForm passwordSection hide'
                style={{margin: '0 auto 2em'}}
            >
                <div className='detailSection'>
                    <div id='fldCurrentPassword' className='inputContainer hide'>
                        <InputElement
                            type='password'
                            id='txtCurrentPassword'
                            label='LabelCurrentPassword'
                            options={'autoComplete="off"'}
                        />
                    </div>
                    <div className='inputContainer'>
                        <InputElement
                            type='password'
                            id='txtNewPassword'
                            label='LabelNewPassword'
                            options={'autoComplete="off"'}
                        />
                    </div>
                    <div className='inputContainer'>
                        <InputElement
                            type='password'
                            id='txtNewPasswordConfirm'
                            label='LabelNewPasswordConfirm'
                            options={'autoComplete="off"'}
                        />
                    </div>
                    <br />
                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                        />
                        <ButtonElement
                            type='button'
                            className='raised btnResetPassword button-cancel block hide'
                            title='ResetPassword'
                        />
                    </div>
                </div>
            </form>
            <br />
            <form
                className='localAccessForm localAccessSection'
                style={{margin: '0 auto'}}
            >
                <div className='detailSection'>
                    <div className='detailSectionHeader'>
                        {globalize.translate('HeaderEasyPinCode')}
                    </div>
                    <br />
                    <div>
                        {globalize.translate('EasyPasswordHelp')}
                    </div>
                    <br />
                    <div className='inputContainer'>
                        <InputElement
                            type='number'
                            id='txtEasyPassword'
                            label='LabelEasyPinCode'
                            options={'autoComplete="off" pattern="[0-9]*" step="1" maxlength="5"'}
                        />
                    </div>
                    <br />
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnableLocalEasyPassword'
                            title='LabelInNetworkSignInWithEasyPassword'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('LabelInNetworkSignInWithEasyPasswordHelp')}
                        </div>
                    </div>
                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                        />
                        <ButtonElement
                            type='button'
                            className='raised btnResetEasyPassword button-cancel block hide'
                            title='ButtonResetEasyPassword'
                        />
                    </div>
                </div>
            </form>
        </div>
    );
};

export default UserPasswordForm;
