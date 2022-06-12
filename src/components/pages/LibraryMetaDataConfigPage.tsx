import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';

import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import ButtonElement from '../dashboard/users/ButtonElement';
import loading from '../loading/loading';
import SelectLanguage from '../dashboard/library/SelectLanguage';
import SelectCountry from '../dashboard/library/SelectCountry';
import Dashboard from '../../utils/dashboard';
import { CountryInfo, CultureDto } from '@thornbill/jellyfin-sdk/dist/generated-client';

const LibraryMetaDataConfigPage: FunctionComponent = () => {
    const [ languages, setLanguages] = useState<CultureDto[]>([]);
    const [ countries, setCountries] = useState<CountryInfo[]>([]);

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

    const populateLanguages = useCallback(async () => {
        const allLanguages = await window.ApiClient.getCultures();
        setLanguages(allLanguages);
    }, []);

    const populateCountries = useCallback(async () => {
        const allCountries = await window.ApiClient.getCountries();
        setCountries(allCountries);
    }, []);

    const loadPage = useCallback((page) => {
        const promises = [
            window.ApiClient.getServerConfiguration(),
            populateLanguages(),
            populateCountries()
        ];
        Promise.all(promises).then((responses) => {
            const config = responses[0];
            page.querySelector('#selectLanguage').value = config?.PreferredMetadataLanguage || '';
            page.querySelector('#selectCountry').value = config?.MetadataCountryCode || '';
            loading.hide();
        });
    }, [populateCountries, populateLanguages]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        LibraryMenu.setTabs('metadata', 2, getTabs);
        loading.show();
        loadPage(page);

        const onSubmit = (e: Event) => {
            loading.show();
            window.ApiClient.getServerConfiguration().then((config) => {
                config.PreferredMetadataLanguage = (page.querySelector('#selectLanguage') as HTMLSelectElement).value;
                config.MetadataCountryCode = (page.querySelector('#selectCountry') as HTMLSelectElement).value;
                window.ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        (page.querySelector('.metadataImagesConfigurationForm') as HTMLFormElement).addEventListener('submit', onSubmit);

        return () => {
            (page.querySelector('.metadataImagesConfigurationForm') as HTMLFormElement).removeEventListener('submit', onSubmit);
        };
    }, [loadPage]);

    return (
        <div ref={element}>
            <div className='content-primary'>

                <form className='metadataImagesConfigurationForm'>
                    <h2 style={{marginTop: '0'}}>
                        {globalize.translate('HeaderPreferredMetadataLanguage')}
                    </h2>

                    <p style={{margin: '1.5em 0;'}} >
                        {globalize.translate('DefaultMetadataLangaugeDescription')}
                    </p>

                    <div className='selectContainer'>
                        <SelectLanguage
                            id='selectLanguage'
                            required='required'
                            label='LabelLanguage'
                            languages={languages}
                        />

                    </div>

                    <div className='selectContainer'>
                        <SelectCountry
                            id='selectCountry'
                            required='required'
                            label='LabelCountry'
                            countries={countries}
                        />

                    </div>

                    <br />
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

export default LibraryMetaDataConfigPage;
