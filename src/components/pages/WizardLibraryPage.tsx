import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

import globalize from '../../scripts/globalize';
import ButtonElement from '../dashboard/users/ButtonElement';
import SectionTitleLinkElement from '../dashboard/users/SectionTitleLinkElement';
import VirtualFolders from '../dashboard/library/VirtualFolders';
import Dashboard from '../../utils/dashboard';
import loading from '../loading/loading';
import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';

type IVirtualFolders = VirtualFolderInfo & {
    icon?: string;
    showType?: boolean;
    showLocations?: boolean;
    showMenu?: boolean;
    showIndicators?: boolean;
    showNameWithIcon?: boolean;
    elementId?: string;
}

const WizardLibraryPage: FunctionComponent = () => {
    const [ virtualFolders, setVirtualFolders ] = useState<IVirtualFolders[]>([]);

    const element = useRef<HTMLDivElement>(null);

    const shouldRefreshLibraryAfterChanges = () => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        return page.id === 'mediaLibraryPage';
    };

    const next = () => {
        Dashboard.navigate('wizardsettings.html');
    };

    const reloadVirtualFolders = useCallback((virtualFolders) => {
        virtualFolders.push({
            Name: globalize.translate('ButtonAddMediaLibrary'),
            icon: 'add_circle',
            Locations: [],
            showType: false,
            showLocations: false,
            showMenu: false,
            showIndicators: false,
            showNameWithIcon: false,
            elementId: 'addLibrary'
        });

        setVirtualFolders(virtualFolders);
    }, []);

    const reloadLibrary = useCallback(() => {
        loading.show();
        window.ApiClient.getVirtualFolders().then((result) => {
            reloadVirtualFolders(result);
            loading.hide();
        });
    }, [reloadVirtualFolders]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        reloadLibrary();

        (page.querySelector('.btnPrevious') as HTMLButtonElement).addEventListener('click', function() {
            window.history.back();
        });

        (page.querySelector('.btnNext') as HTMLButtonElement).addEventListener('click', function() {
            next();
        });
    }, [reloadLibrary]);

    return (
        <div ref={element} className='padded-left padded-right padded-top'>
            <div className='ui-corner-all ui-shadow wizardContent'>
                <div>
                    <h2 style={{display: 'inline-block'}}>
                        {globalize.translate('HeaderSetupLibrary')}
                    </h2>
                    <SectionTitleLinkElement
                        className='raised button-alt'
                        title='Help'
                        url='https://docs.jellyfin.org/general/server/libraries.html'
                    />
                </div>
                <br />
                <VirtualFolders
                    reloadLibrary={reloadLibrary}
                    virtualFolders={virtualFolders}
                    shouldRefreshLibraryAfterChanges={shouldRefreshLibraryAfterChanges}
                />
                <br />
                <br />
                <div className='wizardNavigation'>
                    <ButtonElement
                        type='button'
                        className='raised btnPrevious button-cancel'
                        title='Previous'
                    />
                    <ButtonElement
                        type='button'
                        className='raised btnNext button-submit'
                        title='Next'
                    />
                </div>
            </div>
        </div>
    );
};

export default WizardLibraryPage;
