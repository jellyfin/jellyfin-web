import React, { FunctionComponent, useCallback, useRef } from 'react';

import globalize from '../../../scripts/globalize';
import dom from '../../../scripts/dom';
import { VirtualFolderInfo } from '@thornbill/jellyfin-sdk/dist/generated-client';
import confirm from '../../confirm/confirm';
import Card from '../../dashboard/library/Card/Card';
import '../../cardbuilder/card.scss';
import '../../../elements/emby-itemrefreshindicator/emby-itemrefreshindicator';

type IProps = {
    reloadLibrary: () => void;
    virtualFolders: IVirtualFolders[];
    shouldRefreshLibraryAfterChanges: () => boolean | undefined;
}

type CollectionType = {
    name?: string;
    value?: string;
    message?: string;
    hidden?: boolean;
}

type IVirtualFolders = VirtualFolderInfo & {
    icon?: string;
    showType?: boolean;
    showLocations?: boolean;
    showMenu?: boolean;
    showIndicators?: boolean;
    showNameWithIcon?: boolean;
    elementId?: string;
}

const VirtualFolders: FunctionComponent<IProps> = ({reloadLibrary, virtualFolders = [], shouldRefreshLibraryAfterChanges}: IProps) => {
    const element = useRef<HTMLDivElement>(null);

    const getCollectionTypeOptions = useCallback(() => {
        return [{
            name: '',
            value: ''
        }, {
            name: globalize.translate('Movies'),
            value: 'movies',
            message: getLink('MovieLibraryHelp', 'https://docs.jellyfin.org/general/server/media/movies.html')
        }, {
            name: globalize.translate('TabMusic'),
            value: 'music',
            message: getLink('MusicLibraryHelp', 'https://docs.jellyfin.org/general/server/media/music.html')
        }, {
            name: globalize.translate('Shows'),
            value: 'tvshows',
            message: getLink('TvLibraryHelp', 'https://docs.jellyfin.org/general/server/media/shows.html')
        }, {
            name: globalize.translate('Books'),
            value: 'books',
            message: getLink('BookLibraryHelp', 'https://docs.jellyfin.org/general/server/media/books.html')
        }, {
            name: globalize.translate('HomeVideosPhotos'),
            value: 'homevideos'
        }, {
            name: globalize.translate('MusicVideos'),
            value: 'musicvideos'
        }, {
            name: globalize.translate('MixedMoviesShows'),
            value: 'mixed',
            message: globalize.translate('MessageUnsetContentHelp')
        }];
    }, []);

    const addVirtualFolder = useCallback(() => {
        import('../../mediaLibraryCreator/mediaLibraryCreator').then(({default: medialibrarycreator}) => {
            new medialibrarycreator({
                collectionTypeOptions: getCollectionTypeOptions().filter((f: CollectionType) => {
                    return !f.hidden;
                }),
                refresh: shouldRefreshLibraryAfterChanges()
            }).then((hasChanges) => {
                if (hasChanges) {
                    reloadLibrary();
                }
            });
        });
    }, [getCollectionTypeOptions, reloadLibrary, shouldRefreshLibraryAfterChanges]);

    const editVirtualFolder = useCallback((virtualFolder) => {
        import('../../mediaLibraryEditor/mediaLibraryEditor').then(({default: medialibraryeditor}) => {
            new medialibraryeditor({
                refresh: shouldRefreshLibraryAfterChanges(),
                library: virtualFolder
            }).then((hasChanges) => {
                if (hasChanges) {
                    reloadLibrary();
                }
            });
        });
    }, [reloadLibrary, shouldRefreshLibraryAfterChanges]);

    const deleteVirtualFolder = useCallback((virtualFolder) => {
        let msg = globalize.translate('MessageAreYouSureYouWishToRemoveMediaFolder');

        if (virtualFolder.Locations?.length) {
            msg += '<br/><br/>' + globalize.translate('MessageTheFollowingLocationWillBeRemovedFromLibrary') + '<br/><br/>';
            msg += virtualFolder.Locations.join('<br/>');
        }

        confirm({
            text: msg,
            title: globalize.translate('HeaderRemoveMediaFolder'),
            confirmText: globalize.translate('Delete'),
            primary: 'delete'
        }).then(() => {
            const refreshAfterChange = shouldRefreshLibraryAfterChanges();
            window.ApiClient.removeVirtualFolder(virtualFolder.Name, refreshAfterChange).then(() => {
                reloadLibrary();
            });
        });
    }, [reloadLibrary, shouldRefreshLibraryAfterChanges]);

    const refreshVirtualFolder = useCallback((virtualFolder) => {
        import('../../refreshdialog/refreshdialog').then(({default: refreshDialog}) => {
            new refreshDialog({
                itemIds: [virtualFolder.ItemId],
                serverId: window.ApiClient.serverId(),
                mode: 'scan'
            }).show();
        });
    }, []);

    const renameVirtualFolder = useCallback((virtualFolder) => {
        import('../../prompt/prompt').then(({default: prompt}) => {
            prompt({
                label: globalize.translate('LabelNewName'),
                confirmText: globalize.translate('ButtonRename')
            }).then((newName) => {
                if (newName && newName != virtualFolder.Name) {
                    const refreshAfterChange = shouldRefreshLibraryAfterChanges();
                    window.ApiClient.renameVirtualFolder(virtualFolder.Name, newName, refreshAfterChange).then(() => {
                        reloadLibrary();
                    });
                }
            });
        });
    }, [reloadLibrary, shouldRefreshLibraryAfterChanges]);

    const editImages = useCallback((virtualFolder) => {
        import('../../imageeditor/imageeditor').then((imageEditor) => {
            imageEditor.show({
                itemId: virtualFolder.ItemId,
                serverId: window.ApiClient.serverId()
            }).then(() => {
                reloadLibrary();
            });
        });
    }, [reloadLibrary]);

    const showCardMenu = useCallback((elem, virtualFolders) => {
        console.log('showCardMenu', elem);
        const card = dom.parentWithClass(elem, 'card');
        const index = parseInt(card.getAttribute('data-index') as string);
        const virtualFolder = virtualFolders[index];
        const menuItems: { name: string; id: string; icon: string; }[] = [];
        menuItems.push({
            name: globalize.translate('EditImages'),
            id: 'editimages',
            icon: 'photo'
        });
        menuItems.push({
            name: globalize.translate('ManageLibrary'),
            id: 'edit',
            icon: 'folder'
        });
        menuItems.push({
            name: globalize.translate('ButtonRename'),
            id: 'rename',
            icon: 'mode_edit'
        });
        menuItems.push({
            name: globalize.translate('ScanLibrary'),
            id: 'refresh',
            icon: 'refresh'
        });
        menuItems.push({
            name: globalize.translate('ButtonRemove'),
            id: 'delete',
            icon: 'delete'
        });

        import('../../actionSheet/actionSheet').then(async (actionSheet) => {
            try {
                const resultId = await actionSheet.show({
                    items: menuItems,
                    positionTo: elem
                });
                switch (resultId) {
                    case 'edit':
                        editVirtualFolder(virtualFolder);
                        break;

                    case 'editimages':
                        editImages(virtualFolder);
                        break;

                    case 'rename':
                        renameVirtualFolder(virtualFolder);
                        break;

                    case 'delete':
                        deleteVirtualFolder(virtualFolder);
                        break;

                    case 'refresh':
                        refreshVirtualFolder(virtualFolder);
                        break;
                    default:
                        break;
                }
            } catch (err) {
                console.log(err);
            }
        });
    }, [deleteVirtualFolder, editImages, editVirtualFolder, refreshVirtualFolder, renameVirtualFolder]);

    const getLink = (text: string, url: string) => {
        return globalize.translate(text, '<a is="emby-linkbutton" class="button-link" href="' + url + '" target="_blank" data-autohide="true">', '</a>');
    };

    const renderVirtualFolders = useCallback((virtualFolders) => {
        element.current?.classList.add('itemsContainer');
        element.current?.classList.add('vertical-wrap');

        element.current?.addEventListener('click', (e) => {
            const addLibrary = dom.parentWithClass(e.target as HTMLButtonElement, 'addLibrary');

            if (addLibrary) {
                addVirtualFolder();
            }

            const btnCardMenu = dom.parentWithClass(e.target as HTMLButtonElement, 'btnCardMenu');

            if (btnCardMenu) {
                showCardMenu(btnCardMenu, virtualFolders);
            }

            const editLibrary = dom.parentWithClass(e.target as HTMLDivElement, 'editLibrary');

            if (editLibrary) {
                const card = dom.parentWithClass(editLibrary, 'card');
                const index = parseInt(card.getAttribute('data-index') as string) ;
                const virtualFolder = virtualFolders[index];

                if (virtualFolder.ItemId) {
                    editVirtualFolder(virtualFolder);
                }
            }
        });
    }, [addVirtualFolder, editVirtualFolder, showCardMenu]);

    renderVirtualFolders(virtualFolders);

    return (
        <div ref={element} id='divVirtualFolders'>
            {virtualFolders.map((virtualFolder, index) => {
                return <Card
                    key={index}
                    index={index}
                    virtualFolder={virtualFolder}
                    getCollectionTypeOptions={getCollectionTypeOptions}
                />;
            })}
        </div>
    );
};

export default VirtualFolders;
