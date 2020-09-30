import QuickConnectSettings from 'quickConnectSettings';
import globalize from 'globalize';
import toast from 'toast';

export default function (view) {
    let quickConnectSettingsInstance = null;

    view.addEventListener('viewshow', function () {
        const codeElement = view.querySelector('#txtQuickConnectCode');

        quickConnectSettingsInstance = new QuickConnectSettings();

        view.querySelector('#btnQuickConnectActivate').addEventListener('click', () => {
            quickConnectSettingsInstance.activate(quickConnectSettingsInstance).then(() => {
                renderPage();
            });
        });

        view.querySelector('#btnQuickConnectAuthorize').addEventListener('click', () => {
            if (!codeElement.validity.valid) {
                toast(globalize.translate('QuickConnectInvalidCode'));

                return;
            }

            const code = codeElement.value;
            quickConnectSettingsInstance.authorize(code);
        });

        view.querySelector('.quickConnectSettingsContainer').addEventListener('submit', (e) => {
            e.preventDefault();
        });

        renderPage();
    });

    function renderPage(forceActive = false) {
        ApiClient.getQuickConnect('Status').then((status) => {
            const btn = view.querySelector('#btnQuickConnectActivate');
            const container = view.querySelector('.quickConnectSettingsContainer');

            // The activation button should only be visible when quick connect is unavailable (with the text replaced with an error) or when it is available (so it can be activated)
            // The authorization container is only usable when quick connect is active, so it should be hidden otherwise
            container.style.display = 'none';

            if (status === 'Unavailable') {
                btn.textContent = globalize.translate('QuickConnectNotAvailable');
                btn.disabled = true;
                btn.classList.remove('button-submit');
                btn.classList.add('button');
            } else if (status === 'Active' || forceActive) {
                container.style.display = '';
                btn.style.display = 'none';
            }

            return true;
        }).catch((e) => {
            throw e;
        });
    }
}
