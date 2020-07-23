import UserPasswordPage from 'controllers/dashboard/users/userpasswordpage';
import loading from 'loading';
import libraryMenu from 'libraryMenu';
import appHost from 'apphost';
import globalize from 'globalize';
import 'emby-button';

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
            import('toast').then(({default: toast}) => {
                toast(globalize.translate('FileNotFound'));
            });
            break;
        case evt.target.error.ABORT_ERR:
            onFileReaderAbort();
            break;
        case evt.target.error.NOT_READABLE_ERR:
        default:
            import('toast').then(({default: toast}) => {
                toast(globalize.translate('FileReadError'));
            });
    }
}

function onFileReaderAbort(evt) {
    loading.hide();
    import('toast').then(({default: toast}) => {
        toast(globalize.translate('FileReadCancelled'));
    });
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
        import('confirm').then(({default: confirm}) => {
            confirm(globalize.translate('DeleteImageConfirmation'), globalize.translate('DeleteImage')).then(function () {
                loading.show();
                const userId = getParameterByName('userId');
                ApiClient.deleteUserImage(userId, 'primary').then(function () {
                    loading.hide();
                    reloadUser(view);
                });
            });
        });
    });
    view.querySelector('#btnAddImage').addEventListener('click', function (evt) {
        view.querySelector('#uploadImage').click();
    });
    view.querySelector('#uploadImage').addEventListener('change', function (evt) {
        setFiles(view, evt.target.files);
    });
}
