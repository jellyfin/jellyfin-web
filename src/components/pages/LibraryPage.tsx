import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import ButtonElement from '../dashboard/elements/ButtonElement';
import SectionTitleLinkElement from '../dashboard/elements/SectionTitleLinkElement';
import taskbutton from '../../scripts/taskbutton';
import VirtualFolders from '../dashboard/library/VirtualFolders';
import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import loading from '../loading/loading';

type IVirtualFolders = VirtualFolderInfo & {
    icon?: string;
    showType?: boolean;
    showLocations?: boolean;
    showMenu?: boolean;
    showNameWithIcon?: boolean;
}

const LibraryPage: FunctionComponent = () => {
    const [ virtualFolders, setVirtualFolders ] = useState<IVirtualFolders[]>([]);

    const element = useRef<HTMLDivElement>(null);

    const getTabs = () => {
        return [{
            href: '#/library.html',
            name: globalize.translate('HeaderLibraries')
        }, {
            href: '#/librarydisplay.html',
            name: globalize.translate('Display')
        }, {
            href: '#/metadataimages.html',
            name: globalize.translate('Metadata')
        }, {
            href: '#/metadatanfo.html',
            name: globalize.translate('TabNfoSettings')
        }];
    };

    const shouldRefreshLibraryAfterChanges = () => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        return page.id === 'mediaLibraryPage';
    };

    const reloadVirtualFolders = useCallback((result) => {
        result.push({
            Name: globalize.translate('ButtonAddMediaLibrary'),
            icon: 'add_circle',
            showType: false,
            showLocations: false,
            showMenu: false,
            showNameWithIcon: true
        });

        setVirtualFolders(result);
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

        LibraryMenu.setTabs('librarysetup', 0, getTabs);

        taskbutton({
            mode: 'on',
            progressElem: page.querySelector('.refreshProgress'),
            taskKey: 'RefreshLibrary',
            button: page.querySelector('#btnRefresh')
        });

        return () => {
            taskbutton({
                mode: 'off',
                progressElem: page.querySelector('.refreshProgress'),
                taskKey: 'RefreshLibrary',
                button: page.querySelector('#btnRefresh')
            });
        };
    }, [reloadLibrary]);

    return (
        <div ref={element} id='mediaLibraryPage'>
            <div className='content-primary'>
                <div className='flex align-items-center padded-top padded-bottom'>
                    <ButtonElement
                        type='button'
                        id='btnRefresh'
                        className='raised button-submit'
                        title='ButtonScanAllLibraries'
                    />

                    <progress max='100' className='refreshProgress hide' style={{display: 'inline-block', verticalAlign: 'middle'}}></progress>

                    <SectionTitleLinkElement
                        className='raised button-alt'
                        title='Help'
                        url='https://docs.jellyfin.org/general/server/libraries.html'
                    />

                </div>

                <VirtualFolders
                    reloadLibrary={reloadLibrary}
                    virtualFolders={virtualFolders}
                    shouldRefreshLibraryAfterChanges={shouldRefreshLibraryAfterChanges}
                />
            </div>
        </div>
    );
};

export default LibraryPage;
