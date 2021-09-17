import React, { FunctionComponent, useEffect, useState, useRef } from 'react';
import Dashboard from '../../scripts/clientUtils';
import LibraryMenu from '../../scripts/libraryMenu';
import globalize from '../../scripts/globalize';
import toast from '../toast/toast';
import loading from '../loading/loading';
import confirm from '../confirm/confirm';
import SectionTitleLinkElement from '../DashboardComponent/users/userprofiles/ElementWarpper/SectionTitle/SectionTitleLinkElement';
import TabLinkElement from '../DashboardComponent/users/userprofiles/ElementWarpper/TabLinkElement';
import InputElement from '../DashboardComponent/users/userprofiles/ElementWarpper/InputElement';
import ButtonElement from '../DashboardComponent/users/userprofiles/ElementWarpper/ButtonElement';
import CheckBoxElement from '../DashboardComponent/users/userprofiles/ElementWarpper/CheckBoxElement';
import '../../elements/emby-button/emby-button';

type IProps = {
    params?: Record<string, any>;
    userId?: string;
}

const UserPasswordPage: FunctionComponent<IProps> = (params: IProps) => {
    const [ userName, setUserName ] = useState('');

    const element = useRef(null);

    const loadUser = (params: IProps) => {
        const userId = params.userId;
        window.ApiClient.getUser(userId).then(function (user) {
            Dashboard.getCurrentUser().then(function (loggedInUser) {
                LibraryMenu.setTitle(user.Name);
                setUserName(user.Name);

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

                import('../../components/autoFocuser').then(({default: autoFocuser}) => {
                    autoFocuser.autoFocus(element.current);
                });
            });
        });

        element.current.querySelector('#txtCurrentPassword').value = '';
        element.current.querySelector('#txtNewPassword').value = '';
        element.current.querySelector('#txtNewPasswordConfirm').value = '';
    };

    useEffect(() => {
        loadUser(params);

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
            const userId = params.userId;
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

                loadUser(params);
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
            const userId = params.userId;
            const easyPassword = element.current?.querySelector('#txtEasyPassword').value;

            if (easyPassword) {
                window.ApiClient.updateEasyPassword(userId, easyPassword).then(function () {
                    onEasyPasswordSaved(userId);
                });
            } else {
                onEasyPasswordSaved(userId);
            }
        };

        const onEasyPasswordSaved = (userId) => {
            window.ApiClient.getUser(userId).then(function (user) {
                user.Configuration.EnableLocalPassword = element.current?.querySelector('.chkEnableLocalEasyPassword').checked;
                window.ApiClient.updateUserConfiguration(user.Id, user.Configuration).then(function () {
                    loading.hide();
                    toast(globalize.translate('SettingsSaved'));

                    loadUser(params);
                });
            });
        };

        const resetEasyPassword = () => {
            const msg = globalize.translate('PinCodeResetConfirmation');

            confirm(msg, globalize.translate('HeaderPinCodeReset')).then(function () {
                const userId = params.userId;
                loading.show();
                window.ApiClient.resetEasyPassword(userId).then(function () {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('PinCodeResetComplete'),
                        title: globalize.translate('HeaderPinCodeReset')
                    });
                    loadUser(params);
                });
            });
        };

        const resetPassword = () => {
            const msg = globalize.translate('PasswordResetConfirmation');
            confirm(msg, globalize.translate('ResetPassword')).then(function () {
                const userId = params.userId;
                loading.show();
                window.ApiClient.resetUserPassword(userId).then(function () {
                    loading.hide();
                    Dashboard.alert({
                        message: globalize.translate('PasswordResetComplete'),
                        title: globalize.translate('ResetPassword')
                    });
                    loadUser(params);
                });
            });
        };

        element?.current?.querySelector('.updatePasswordForm').addEventListener('submit', onSubmit);
        element?.current?.querySelector('.localAccessForm').addEventListener('submit', onLocalAccessSubmit);

        element?.current?.querySelector('.btnResetEasyPassword').addEventListener('click', resetEasyPassword);
        element?.current?.querySelector('.btnResetPassword').addEventListener('click', resetPassword);
    }, [params]);

    return (
        <div ref={element}>
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
                    <form
                        className='updatePasswordForm passwordSection hide'
                        style={{margin: '0 auto 2em'}}>
                        <div className='detailSection'>
                            <div id='fldCurrentPassword' className='inputContainer hide'>
                                <InputElement
                                    type='password'
                                    id='txtCurrentPassword'
                                    label='LabelCurrentPassword'
                                    autoComplete='off'
                                />
                            </div>
                            <div className='inputContainer'>
                                <InputElement
                                    type='password'
                                    id='txtNewPassword'
                                    label='LabelNewPassword'
                                    autoComplete='off'
                                />
                            </div>
                            <div className='inputContainer'>
                                <InputElement
                                    type='password'
                                    id='txtNewPasswordConfirm'
                                    label='LabelNewPasswordConfirm'
                                    autoComplete='off'
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
                        style={{margin: '0 auto'}}>
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
                                    autoComplete='off'
                                    options={'pattern="[0-9]*" step="1" maxlength="5"'}
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
            </div>
        </div>
    );
};

export default UserPasswordPage;
