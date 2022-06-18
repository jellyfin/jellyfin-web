import React, { FunctionComponent, useCallback, useEffect, useRef } from 'react';

import Dashboard from '../../utils/dashboard';
import globalize from '../../scripts/globalize';
import loading from '../loading/loading';
import ButtonElement from '../dashboard/elements/ButtonElement';
import CheckBoxElement from '../dashboard/elements/CheckBoxElement';
import LibraryMenu from '../../scripts/libraryMenu';
import SelectElement from '../dashboard/elements/SelectElement';

const LibraryDisplayPage: FunctionComponent = () => {
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

    const loadPage = useCallback((config) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        (page.querySelector('.chkFolderView') as HTMLInputElement).checked = config.EnableFolderView;
        (page.querySelector('.chkGroupMoviesIntoCollections') as HTMLInputElement).checked = config.EnableGroupingIntoCollections;
        (page.querySelector('.chkDisplaySpecialsWithinSeasons') as HTMLInputElement).checked = config.DisplaySpecialsWithinSeasons;
        (page.querySelector('.chkExternalContentInSuggestions') as HTMLInputElement).checked = config.EnableExternalContentInSuggestions;
        (page.querySelector('#chkSaveMetadataHidden') as HTMLInputElement).checked = config.SaveMetadataHidden;
    }, []);

    const loadData = useCallback(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        window.ApiClient.getServerConfiguration().then(function(config) {
            loadPage(config);
        });
        window.ApiClient.getNamedConfiguration('metadata').then(function(metadata) {
            (page.querySelector('#selectDateAdded') as HTMLSelectElement).selectedIndex = metadata.UseFileCreationTimeForDateAdded ? 1 : 0;
        });

        window.ApiClient.getSystemInfo().then(function(info) {
            console.log('OperatingSystem', info);
            if (info.OperatingSystem === 'Windows') {
                (page.querySelector('.fldSaveMetadataHidden') as HTMLDivElement).classList.remove('hide');
            } else {
                (page.querySelector('.fldSaveMetadataHidden') as HTMLDivElement).classList.add('hide');
            }
        });
    }, [loadPage]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        LibraryMenu.setTabs('librarysetup', 1, getTabs);
        loadData();

        (page.querySelector('.libraryDisplayForm') as HTMLFormElement).addEventListener('submit', function(e) {
            loading.show();
            window.ApiClient.getServerConfiguration().then(function(config) {
                config.EnableFolderView = (page.querySelector('.chkFolderView') as HTMLInputElement).checked;
                config.EnableGroupingIntoCollections = (page.querySelector('.chkGroupMoviesIntoCollections') as HTMLInputElement).checked;
                config.DisplaySpecialsWithinSeasons = (page.querySelector('.chkDisplaySpecialsWithinSeasons') as HTMLInputElement).checked;
                config.EnableExternalContentInSuggestions = (page.querySelector('.chkExternalContentInSuggestions') as HTMLInputElement).checked;
                config.SaveMetadataHidden = (page.querySelector('#chkSaveMetadataHidden') as HTMLInputElement).checked;
                window.ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
            });
            window.ApiClient.getNamedConfiguration('metadata').then(function(config) {
                config.UseFileCreationTimeForDateAdded = (page.querySelector('#selectDateAdded') as HTMLSelectElement).value === '1';
                window.ApiClient.updateNamedConfiguration('metadata', config);
            });

            e.preventDefault();
            loading.hide();
            return false;
        });
    }, [loadData]);

    const optionDateAdded = () => {
        let content = '';
        content += `<option value='0'>${globalize.translate('OptionDateAddedImportTime')}</option>`;
        content += `<option value='1'>${globalize.translate('OptionDateAddedFileTime')}</option>`;
        return content;
    };

    return (
        <div ref={element}>
            <div className='content-primary'>
                <form className='libraryDisplayForm'>
                    <div className='selectContainer'>
                        <SelectElement
                            id='selectDateAdded'
                            label='LabelDateAddedBehavior'
                        >
                            {optionDateAdded()}
                        </SelectElement>
                        <div className='fieldDescription'>
                            {globalize.translate('LabelDateAddedBehaviorHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            className='chkFolderView'
                            title='OptionDisplayFolderView'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionDisplayFolderViewHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer'>
                        <CheckBoxElement
                            className='chkDisplaySpecialsWithinSeasons'
                            title='LabelDisplaySpecialsWithinSeasons'
                        />
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            className='chkGroupMoviesIntoCollections'
                            title='LabelGroupMoviesIntoCollections'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('LabelGroupMoviesIntoCollectionsHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription'>
                        <CheckBoxElement
                            className='chkExternalContentInSuggestions'
                            title='OptionEnableExternalContentInSuggestions'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionEnableExternalContentInSuggestionsHelp')}
                        </div>
                    </div>
                    <div className='checkboxContainer checkboxContainer-withDescription fldSaveMetadataHidden hide'>
                        <CheckBoxElement
                            className='chkAirDays'
                            elementId='chkSaveMetadataHidden'
                            dataFilter='Sunday'
                            title='OptionSaveMetadataAsHidden'
                        />
                        <div className='fieldDescription checkboxFieldDescription'>
                            {globalize.translate('OptionSaveMetadataAsHiddenHelp')}
                        </div>
                    </div>
                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LibraryDisplayPage;
