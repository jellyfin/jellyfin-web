import { Events } from 'jellyfin-apiclient';
import toast from '../../../components/toast/toast';
import globalize from '../../../scripts/globalize';
import appSettings from '../../../scripts/settings/appSettings';

export default function (view) {
    function submit(e) {
        appSettings.enableGamepad(view.querySelector('.chkEnableGamepad').checked);

        toast(globalize.translate('SettingsSaved'));

        Events.trigger(view, 'saved');

        e?.preventDefault();

        return false;
    }

    view.addEventListener('viewshow', function () {
        view.querySelector('.chkEnableGamepad').checked = appSettings.enableGamepad();
        view.querySelector('form').addEventListener('submit', submit);
        view.querySelector('.btnSave').classList.remove('hide');

        import('../../../components/autoFocuser').then(({default: autoFocuser}) => {
            autoFocuser.autoFocus(view);
        });
    });
}
