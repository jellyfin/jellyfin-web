import layoutManager from 'components/layoutManager';
import toast from '../../../components/toast/toast';
import globalize from '../../../lib/globalize';
import appSettings from '../../../scripts/settings/appSettings';
import Events from '../../../utils/events';
import keyboardNavigation from 'scripts/keyboardNavigation';

export default function (view) {
    function submit(e) {
        appSettings.enableGamepad(view.querySelector('.chkEnableGamepad').checked);
        appSettings.enableSmoothScroll(view.querySelector('.chkSmoothScroll').checked);

        toast(globalize.translate('SettingsSaved'));

        Events.trigger(view, 'saved');

        e?.preventDefault();

        return false;
    }

    view.addEventListener('viewshow', function () {
        view.querySelector('.enableGamepadContainer').classList.toggle('hide', !keyboardNavigation.canEnableGamepad());
        view.querySelector('.smoothScrollContainer').classList.toggle('hide', !layoutManager.tv);

        view.querySelector('.chkEnableGamepad').checked = appSettings.enableGamepad();
        view.querySelector('.chkSmoothScroll').checked = appSettings.enableSmoothScroll();

        view.querySelector('form').addEventListener('submit', submit);
        view.querySelector('.btnSave').classList.remove('hide');

        import('../../../components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(view);
        });
    });
}
