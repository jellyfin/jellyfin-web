import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import ButtonElement from '../dashboard/users/ButtonElement';
import loading from '../loading/loading';
import Dashboard from '../../utils/dashboard';
import { UserDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import CheckBoxElement from '../dashboard/users/CheckBoxElement';
import SelectUserElement from '../dashboard/users/SelectUserElement';
import SelectReleaseDateFormat from '../dashboard/library/SelectReleaseDateFormat';
import alert from '../alert';

const LibraryMetaDataNfoPage: FunctionComponent = () => {
    const [ users, setUsers ] = useState<UserDto[]>([]);
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

    const showConfirmMessage = useCallback(() => {
        alert({
            text: globalize.translate('MetadataSettingChangeHelp')
        });
    }, []);

    const loadPage = useCallback((page, config) => {
        page.querySelector('#selectUser').value = config.UserId || '';
        page.querySelector('#selectReleaseDateFormat').value = config.ReleaseDateFormat;
        page.querySelector('.chkSaveImagePaths').checked = config.SaveImagePathsInNfo;
        page.querySelector('.chkEnablePathSubstitution').checked = config.EnablePathSubstitution;
        page.querySelector('.chkEnableExtraThumbs').checked = config.EnableExtraThumbsDuplication;
        loading.hide();
    }, []);

    const loadData = useCallback((page) => {
        loading.show();
        const promise1 = window.ApiClient.getUsers();
        const promise2 = window.ApiClient.getNamedConfiguration('xbmcmetadata');
        Promise.all([promise1, promise2]).then(responses => {
            setUsers(responses[0]);
            loadPage(page, responses[1]);
        });
    }, [loadPage]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        LibraryMenu.setTabs('metadata', 3, getTabs);
        loadData(page);

        const onSubmit = (e: Event) => {
            loading.show();
            window.ApiClient.getNamedConfiguration('xbmcmetadata').then(config => {
                config.UserId = (page.querySelector('#selectUser') as HTMLSelectElement).value || null;
                config.ReleaseDateFormat = (page.querySelector('#selectReleaseDateFormat') as HTMLSelectElement).value;
                config.SaveImagePathsInNfo = (page.querySelector('.chkSaveImagePaths') as HTMLInputElement).checked;
                config.EnablePathSubstitution = (page.querySelector('.chkEnablePathSubstitution') as HTMLInputElement).checked;
                config.EnableExtraThumbsDuplication = (page.querySelector('.chkEnableExtraThumbs') as HTMLInputElement).checked;
                window.ApiClient.updateNamedConfiguration('xbmcmetadata', config).then(() => {
                    Dashboard.processServerConfigurationUpdateResult();
                    showConfirmMessage();
                });
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        (page.querySelector('.metadataNfoForm') as HTMLFormElement).addEventListener('submit', onSubmit);

        return () => {
            (page.querySelector('.metadataNfoForm') as HTMLFormElement).removeEventListener('submit', onSubmit);
        };
    }, [loadData, showConfirmMessage]);

    return (
        <div ref={element}>
            <div className='content-primary'>
                <form className='metadataNfoForm'>
                    <p>
                        {globalize.translate('HeaderKodiMetadataHelp')}
                    </p>
                    <br />
                    <div className='selectContainer'>
                        <SelectUserElement
                            name='selectUser'
                            id='selectUser'
                            label='LabelKodiMetadataUser'
                            users={users}
                        />
                        <div className='fieldDescription'>
                            {globalize.translate('LabelKodiMetadataUserHelp')}
                        </div>
                    </div>
                    <div className='selectContainer'>
                        <SelectReleaseDateFormat
                            name='selectReleaseDateFormat'
                            id='selectReleaseDateFormat'
                            label='LabelKodiMetadataDateFormat'
                        />
                        <div className='fieldDescription'>
                            {globalize.translate('LabelKodiMetadataDateFormatHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkSaveImagePaths'
                            title='LabelKodiMetadataSaveImagePaths'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('LabelKodiMetadataSaveImagePathsHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnablePathSubstitution'
                            title='LabelKodiMetadataEnablePathSubstitution'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('LabelKodiMetadataEnablePathSubstitutionHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            type='checkbox'
                            className='chkEnableExtraThumbs'
                            title='LabelKodiMetadataEnableExtraThumbs'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('LabelKodiMetadataEnableExtraThumbsHelp')}
                        </div>
                    </div>
                    <ButtonElement
                        type='submit'
                        className='raised button-submit block'
                        title='Save'
                    />
                </form>
            </div>
        </div>
    );
};

export default LibraryMetaDataNfoPage;
