import { authorize } from './helper';
import globalize from '../../../scripts/globalize';
import toast from '../../../components/toast/toast';

export default function (view) {
    view.addEventListener('viewshow', function () {
        const codeElement = view.querySelector('#txtQuickConnectCode');

        view.querySelector('.quickConnectSettingsContainer').addEventListener('submit', (e) => {
            e.preventDefault();

            if (!codeElement.validity.valid) {
                toast(globalize.translate('QuickConnectInvalidCode'));

                return;
            }

            // Remove spaces from code
            const normalizedCode = codeElement.value.replace(/\s/g, '');
            authorize(normalizedCode);
        });
    });
}
