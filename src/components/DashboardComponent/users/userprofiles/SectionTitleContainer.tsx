import React, {FunctionComponent, useEffect, useRef} from 'react';
import Dashboard from '../../../../scripts/clientUtils';
import globalize from '../../../../scripts/globalize';

const createButtonElement = () => ({
    __html: `<button
    is="emby-button"
    type="button"
    class="fab btnAddUser submit sectionTitleButton"
    style="margin-left:1em;"
    title="${globalize.translate('ButtonAddUser')}">
    <span class="material-icons add"></span>
</button>`
});

const createLinkElement = () => ({
    __html: `<a
    is="emby-linkbutton"
    rel="noopener noreferrer"
    style="margin-left:2em!important;"
    class="raised button-alt headerHelpButton"
    target="_blank"
    href="https://docs.jellyfin.org/general/server/users/adding-managing-users.html"
    >
    ${globalize.translate('Help')}
    </a>`
});

const SectionTitleContainer: FunctionComponent = () => {
    const btnAddUserRef = useRef(null);
    useEffect(() => {
        btnAddUserRef?.current?.querySelector('.btnAddUser').addEventListener('click', function() {
            Dashboard.navigate('usernew.html');
        });
    }, []);

    return (
        <div
            className='sectionTitleContainer sectionTitleContainer-cards'
            style={{display: 'flex', alignItems: 'center', paddingBottom: '1em'}}
        >
            <h2 className='sectionTitle sectionTitle-cards'>
                {globalize.translate('HeaderUsers')}
            </h2>
            <div ref={btnAddUserRef}
                dangerouslySetInnerHTML={createButtonElement()}
            />
            <div
                dangerouslySetInnerHTML={createLinkElement()}
            />
        </div>
    );
};

export default SectionTitleContainer;
