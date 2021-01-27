import UserPasswordPage from '../../dashboard/users/userpasswordpage';
import loading from '../../../components/loading/loading';
import libraryMenu from '../../../scripts/libraryMenu';
import { appHost } from '../../../components/apphost';
import globalize from '../../../scripts/globalize';
import '../../../elements/emby-button/emby-button';
import Dashboard from '../../../scripts/clientUtils';
import toast from '../../../components/toast/toast';
import confirm from '../../../components/confirm/confirm';

function reloadUser(page) {
    const userId = getParameterByName('userId');
    loading.show();
    ApiClient.getUser(userId).then(function (user) {
        page.querySelector('.username').innerHTML = user.Name;
        libraryMenu.setTitle(user.Name);

        let imageUrl = 'assets/img/avatar.png';
        if (user.PrimaryImageTag) {
            imageUrl = ApiClient.getUserImageUrl(user.Id, {
                tag: user.PrimaryImageTag,
                type: 'Primary'
            });
        }

        const userImage = page.querySelector('#image');
        userImage.style.backgroundImage = 'url(' + imageUrl + ')';

        Dashboard.getCurrentUser().then(function (loggedInUser) {
            if (user.PrimaryImageTag) {
                page.querySelector('#btnAddImage').classList.add('hide');
                page.querySelector('#btnDeleteImage').classList.remove('hide');
            } else if (appHost.supports('fileinput') && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
                page.querySelector('#btnDeleteImage').classList.add('hide');
                page.querySelector('#btnAddImage').classList.remove('hide');
            }
        });
        loading.hide();
    });
}

function onFileReaderError(evt) {
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
}

function onFileReaderAbort() {
    loading.hide();
    toast(globalize.translate('FileReadCancelled'));
}

function setFiles(page, files) {
    const userImage = page.querySelector('#image');
    const file = files[0];

    if (!file || !file.type.match('image.*')) {
        return false;
    }

    const reader = new FileReader();
    reader.onerror = onFileReaderError;
    reader.onabort = onFileReaderAbort;
    reader.onload = function (evt) {
        userImage.style.backgroundImage = 'url(' + evt.target.result + ')';
        const userId = getParameterByName('userId');
        ApiClient.uploadUserImage(userId, 'Primary', file).then(function () {
            loading.hide();
            reloadUser(page);
        });
    };

    reader.readAsDataURL(file);
}

export default function (view, params) {
    reloadUser(view);
    new UserPasswordPage(view, params);
    view.querySelector('#btnDeleteImage').addEventListener('click', function () {
        confirm(globalize.translate('DeleteImageConfirmation'), globalize.translate('DeleteImage')).then(function () {
            loading.show();
            const userId = getParameterByName('userId');
            ApiClient.deleteUserImage(userId, 'primary').then(function () {
                loading.hide();
                reloadUser(view);
            });
        });
    });
    view.querySelector('#btnAddImage').addEventListener('click', function () {
        view.querySelector('#uploadImage').click();
    });
    view.querySelector('#uploadImage').addEventListener('change', function (evt) {
        setFiles(view, evt.target.files);
    });
}
