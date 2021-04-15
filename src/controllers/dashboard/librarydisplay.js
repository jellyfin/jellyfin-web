import globalize from '../../scripts/globalize';
import loading from '../../components/loading/loading';
import libraryMenu from '../../scripts/libraryMenu';
import '../../elements/emby-checkbox/emby-checkbox';
import '../../elements/emby-button/emby-button';
import Dashboard from '../../scripts/clientUtils';

/* eslint-disable indent */

    function getTabs() {
        return [{
            href: '#!/library.html',
            name: globalize.translate('HeaderLibraries')
        }, {
            href: '#!/librarydisplay.html',
            name: globalize.translate('Display')
        }, {
            href: '#!/metadataimages.html',
            name: globalize.translate('Metadata')
        }, {
            href: '#!/metadatanfo.html',
            name: globalize.translate('TabNfoSettings')
        }];
    }

    export default function(view) {
        function loadData() {
            ApiClient.getServerConfiguration().then(function(config) {
                view.querySelector('.chkFolderView').checked = config.EnableFolderView;
                view.querySelector('.chkGroupMoviesIntoCollections').checked = config.EnableGroupingIntoCollections;
                view.querySelector('.chkDisplaySpecialsWithinSeasons').checked = config.DisplaySpecialsWithinSeasons;
                view.querySelector('.chkExternalContentInSuggestions').checked = config.EnableExternalContentInSuggestions;
                view.querySelector('#chkSaveMetadataHidden').checked = config.SaveMetadataHidden;
            });
            ApiClient.getNamedConfiguration('metadata').then(function(metadata) {
                view.querySelector('#selectDateAdded').selectedIndex = metadata.UseFileCreationTimeForDateAdded ? 1 : 0;
            });
        }

        view.querySelector('form').addEventListener('submit', function(e) {
            loading.show();
            const form = this;
            ApiClient.getServerConfiguration().then(function(config) {
                config.EnableFolderView = form.querySelector('.chkFolderView').checked;
                config.EnableGroupingIntoCollections = form.querySelector('.chkGroupMoviesIntoCollections').checked;
                config.DisplaySpecialsWithinSeasons = form.querySelector('.chkDisplaySpecialsWithinSeasons').checked;
                config.EnableExternalContentInSuggestions = form.querySelector('.chkExternalContentInSuggestions').checked;
                config.SaveMetadataHidden = form.querySelector('#chkSaveMetadataHidden').checked;
                ApiClient.updateServerConfiguration(config).then(Dashboard.processServerConfigurationUpdateResult);
            });
            ApiClient.getNamedConfiguration('metadata').then(function(config) {
                config.UseFileCreationTimeForDateAdded = $('#selectDateAdded', form).val() === '1';
                ApiClient.updateNamedConfiguration('metadata', config);
            });

            e.preventDefault();
            loading.hide();
            return false;
        });

        view.addEventListener('viewshow', function() {
            libraryMenu.setTabs('librarysetup', 1, getTabs);
            loadData();
            ApiClient.getSystemInfo().then(function(info) {
                if (info.OperatingSystem === 'Windows') {
                    view.querySelector('.fldSaveMetadataHidden').classList.remove('hide');
                } else {
                    view.querySelector('.fldSaveMetadataHidden').classList.add('hide');
                }
            });
        });
    }

/* eslint-enable indent */
