import OpenSubtitlesManager from '../../../scripts/opensubtitles/opensubtitles';
import autoFocuser from '../../../components/autoFocuser';
//-----------------------------------------------------------
import globalize from '../../../lib/globalize';
import loading from '../../../components/loading/loading';
import template from '../../../components/opensubtitlesSettings/opensubtitlesSettings.html';
//-----------------------------------------------------------

export default function (view) {
    function showStatusMessage( element, code, reqStatus = null ) {
        const status = element.querySelector('.loginStatus');

        let statusMsg = '';
        switch ( code ) {
            case 0:
                statusMsg = globalize.translate('OpenSubtitlesStatusLoggedOut');
                break;
            case 1:
                statusMsg = globalize.translate('OpenSubtitlesStatusLoggedIn', OpenSubtitlesManager.allowedDownloads());
                break;
            case 2:
                statusMsg = globalize.translate('OpenSubtitlesStatusFailedToLogIn', reqStatus || 0);
                break;
            default: break;
        }
        status.innerHTML = '<span>' + statusMsg + '</span>';
        status.classList.remove('hide');
    }

    async function onSubmit( event ) {
        event.preventDefault();
        loading.show();

        const element = event.srcElement.ownerDocument;
        const enabled = element.querySelector('#chkEnableOpenSubtitles').checked;
        const selectLanguages = element.querySelectorAll('.selectPreferredSubtitleLanguage');
        let languages = '';
        for (const select of selectLanguages) {
            if ( select.value != -1 ) {
                if ( languages ) {
                    languages += ',';
                }
                languages += select.value;
            }
        }
        const user = element.querySelector('#txtOpenSubtitlesUser').value;
        const pwd = element.querySelector('#txtOpenSubtitlesPassword').value;
        const tokenElement = element.querySelector('#txtOpenSubtitlesApiToken');

        await OpenSubtitlesManager.setSettings(enabled, user, pwd, languages, tokenElement.value);
        if ( !enabled ) {
            showStatusMessage( element, 0 );
        } else {
            const resStatus = OpenSubtitlesManager.api.last_response?.status || 200;
            if ( resStatus == 200 ) {
                showStatusMessage( element, 1 );
            } else {
                showStatusMessage( element, 2, resStatus );
                // Let user pass his API token directly (found at opensubtitles.com/users/profile)
                tokenElement.parentElement.classList.remove('hide');
            }
        }
        loading.hide();
    }

    function selectLanguageOnChange( event ) {
        const src = event.srcElement;
        const element = src.ownerDocument;
        const selectLanguages = element.querySelectorAll('.selectPreferredSubtitleLanguage');

        // Hide and disable 3rd when turning off the 2nd
        const curIndex = Array.from(selectLanguages).findIndex(s => s.id == src.id);
        if ( src.value == -1 ) {
            for (let i = curIndex + 1; i < selectLanguages.length; i++) {
                const select = selectLanguages[i];
                select.value = -1;
                select.disabled = true;
                select.parentElement.classList.add('hide');
            }
        } else if ( (curIndex + 1) < selectLanguages.length ) {
            const select = selectLanguages[curIndex + 1];
            select.disabled = false;
            select.parentElement.classList.remove('hide');
        }

        // Get languages
        let curSelectedLanguages = '';
        for (const select of selectLanguages) {
            if ( select.value != -1 ) {
                if ( curSelectedLanguages ) {
                    curSelectedLanguages += ',';
                }
                curSelectedLanguages += select.value;
            }
        }
        curSelectedLanguages = curSelectedLanguages.split(',');

        // Disable already selected option from other select elements
        for (const select of selectLanguages) {
            for (const option of select.options) {
                option.disabled = curSelectedLanguages.includes( option.value ) && (option.value !== select.value);
            }
        }
    }

    function chkEnableOnChange( event ) {
        const src = event.srcElement;
        const container = src.ownerDocument.querySelector('#OpenSubtitlesContainerOnlyIfAvailable');
        if ( src.checked ) {
            container.classList.remove('hide');
        } else {
            container.classList.add('hide');
        }
    }

    view.addEventListener('viewshow', function () {
        const element = view.querySelector('.settingsContainer');
        if ( !element ) {
            console.error('settingsContainer not found!');
            return;
        }
        element.classList.add('opensubtitlesettings');
        element.innerHTML = globalize.translateHtml(template, 'core');

        // Fill user credentials
        const credentials = OpenSubtitlesManager.credentials();
        if ( credentials?.username ) {
            element.querySelector('#txtOpenSubtitlesUser').value = credentials.username;
            element.querySelector('#txtOpenSubtitlesPassword').value = credentials.password;
            element.querySelector('#txtOpenSubtitlesApiToken').value = credentials.token;
        }

        // Fill user language preferences
        const curSelectedLanguages = ( OpenSubtitlesManager.settings?.languages || 'en' ).split(',');
        const selectLanguages = element.querySelectorAll('.selectPreferredSubtitleLanguage');
        for (let i = 0; i < selectLanguages.length; i++) {
            const select = selectLanguages[i];
            const language = (curSelectedLanguages.length > i) ? (curSelectedLanguages[i]) : '';
            // Must have at least one language preference
            if ( i != 0) {
                select.innerHTML = '<option value="-1"' + (language ? '' : ' selected') + '>' + globalize.translate('None') + '</option>';
            } else {
                select.innerHTML = '';
            }
            select.innerHTML += OpenSubtitlesManager.utils.Languages.map(function (v) {
                const selected = (language === v.language_code) ? ' selected' : '';
                let out = '<option value="' + v.language_code + '" ' + selected;
                if ( curSelectedLanguages.includes( v.language_code ) && (v.language_code !== language) ) {
                    out += 'disabled';
                }
                out += '>' + v.language_code + ' - ' + globalize.translate(v.language_name) + '</option>';
                return out;
            }).join('');
            if ( !language && i && !curSelectedLanguages[i - 1] ) {
                select.disabled = true;
                select.parentElement.classList.add('hide');
            }
            select.addEventListener('change', selectLanguageOnChange);
        }

        // Load enable information
        const chkEnable = element.querySelector('#chkEnableOpenSubtitles');
        chkEnable.checked = credentials?.username;
        if ( chkEnable.checked ) {
            element.querySelector('#OpenSubtitlesContainerOnlyIfAvailable').classList.remove('hide');
        }
        chkEnable.addEventListener('change', chkEnableOnChange);
        element.querySelector('form').addEventListener('submit', onSubmit);
        autoFocuser.autoFocus(view);

        // Show current status
        OpenSubtitlesManager.refreshUserInfo().then( ()=>{
            showStatusMessage( element, OpenSubtitlesManager.isLoggedIn ? 1 : 0 );
        });
    });

    view.addEventListener('viewdestroy', function () {
        //
    });
}
