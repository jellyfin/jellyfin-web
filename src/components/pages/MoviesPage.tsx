
import React, {FunctionComponent, useCallback, useEffect, useState, useRef} from 'react';
import globalize from '../../scripts/globalize';
import * as mainTabsManager from '../maintabsmanager';
import ButtonPaperElement from '../dashboard/users/ButtonPaperElement';
import ItemsContainerElement from '../dashboard/users/ItemsContainerElement';
import * as userSettings from '../../scripts/settings/userSettings';
import libraryMenu from '../../scripts/libraryMenu';
//import { playbackManager } from '../playback/playbackmanager';
//import { Events } from 'jellyfin-apiclient';

type MenuEntry = {
    name?: string;
    id?: string;
    icon?: string;
}

const getDefaultTabIndex = (folderId) => {
    switch (userSettings.get('landing-' + folderId, false)) {
        case 'suggestions':
            return 1;

        case 'favorites':
            return 3;

        case 'collections':
            return 4;

        case 'genres':
            return 5;

        default:
            return 0;
    }
};

const MoviesPage: FunctionComponent = ({ topParentId, tab }) => {
    let currentTabIndex = parseInt(tab || getDefaultTabIndex(topParentId));
    //const initialTabIndex = currentTabIndex;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const tabControllers: any = [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const renderedTabs: any = [];
    //let currentTabController;

    const element = useRef(null);

    const getTabs = () => {
        return [{
            name: globalize.translate('Movies')
        }, {
            name: globalize.translate('Suggestions')
        }, {
            name: globalize.translate('Trailers')
        }, {
            name: globalize.translate('Favorites')
        }, {
            name: globalize.translate('Collections')
        }, {
            name: globalize.translate('Genres')
        }];
    };

    const getTabController = useCallback((page, index, callback) => {
        let depends = '';

        switch (index) {
            case 0:
                depends = 'movies';
                break;

            case 1:
                depends = 'moviesrecommended.js';
                break;

            case 2:
                depends = 'movietrailers';
                break;

            case 3:
                depends = 'movies';
                break;

            case 4:
                depends = 'moviecollections';
                break;

            case 5:
                depends = 'moviegenres';
                break;
        }

        console.log('depends', depends);
        return import(/* webpackChunkName: "[request]" */ `../../controllers/movies/${depends}`).then(({ default: controllerFactory }) => {
            let tabContent;
            let controller = tabControllers[index];
            if (!controller) {
                tabContent = page.querySelector(".pageTabContent[data-index='" + index + "']");

                if (index == 0 || index == 3) {
                    controller = new controllerFactory(topParentId, tabContent, {
                        mode: index ? 'favorites' : 'movies'
                    });
                } else {
                    controller = new controllerFactory(topParentId, tabContent);
                }

                tabControllers[index] = controller;

                if (controller.initTab) {
                    controller.initTab();
                }
            }
            callback(controller);
        });
    }, [tabControllers, topParentId]);

    const preLoadTab = useCallback((page, index) => {
        getTabController(page, index, function (controller) {
            if (renderedTabs.indexOf(index) == -1 && controller.preRender) {
                controller.preRender();
            }
        });
    }, [getTabController, renderedTabs]);

    const onBeforeTabChange = useCallback((e) => {
        preLoadTab(element?.current, parseInt(e.detail.selectedTabIndex));
    }, [preLoadTab]);

    const loadTab = useCallback((page, index) => {
        console.log('loadTab', index);

        // eslint-disable-next-line react-hooks/exhaustive-deps
        currentTabIndex = index;

        console.log('currentTabIndex', currentTabIndex);
        getTabController(page, index, ((controller) => {
            if (renderedTabs.indexOf(index) == -1) {
                renderedTabs.push(index);
                controller.renderTab();
            }
        }));
    }, []);

    const onTabChange = useCallback((e) => {
        const newIndex = parseInt(e.detail.selectedTabIndex);
        console.log('newIndex', newIndex);
        loadTab(element?.current, newIndex);
    }, [loadTab]);

    const initTabs = useCallback(() => {
        mainTabsManager.setTabs(element?.current, currentTabIndex, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
    }, [currentTabIndex, onBeforeTabChange, onTabChange]);

    const getTabContainers = () => {
        return element?.current.querySelectorAll('.pageTabContent');
    };

    /* const onPlaybackStop = useCallback((e, state) => {
        if (state.NowPlayingItem && state.NowPlayingItem.MediaType == 'Video') {
            // eslint-disable-next-line react-hooks/exhaustive-deps
            renderedTabs = [];
            //mainTabsManager.getTabsElement().triggerTabChange();
        }
    }, []);*/

    useEffect(() => {
        initTabs();

        if (!element?.current?.getAttribute('data-title')) {
            const parentId = topParentId;

            if (parentId) {
                window.ApiClient.getItem(window.ApiClient.getCurrentUserId(), parentId).then(function (item) {
                    element?.current?.setAttribute('data-title', item.Name);
                    libraryMenu.setTitle(item.Name);
                });
            } else {
                element?.current?.setAttribute('data-title', globalize.translate('Movies'));
                libraryMenu.setTitle(globalize.translate('Movies'));
            }
        }

        //Events.on(playbackManager, 'playbackstop', onPlaybackStop);
    }, [initTabs, topParentId]);

    return (
        <div ref={element}>
            <div>
                <div className='pageTabContent' id='moviesTab' data-index={0}>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnSelectView autoSize'
                            title='ButtonSelectView'
                            icon='view_comfy'
                        />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnSort autoSize'
                            title='Sort'
                            icon='sort_by_alpha'
                        />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnFilter autoSize'
                            title='Filter'
                            icon='filter_list'
                        />
                    </div>
                    <div className='alphaPicker alphaPicker-fixed alphaPicker-vertical'>
                    </div>
                    <ItemsContainerElement
                        is='emby-itemscontainer'
                        className='itemsContainer padded-left padded-right'
                        style=''
                    />

                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                    </div>
                </div>
                <div className='pageTabContent' id='suggestionsTab' data-index={1}>
                    <div id='resumableSection' className='verticalSection hide'>
                        <div className='sectionTitleContainer sectionTitleContainer-cards'>
                            <h2 className='sectionTitle sectionTitle-cards padded-left'>
                                {globalize.translate('HeaderContinueWatching')}
                            </h2>
                        </div>
                        <ItemsContainerElement
                            is='emby-itemscontainer'
                            className='resumableItems itemsContainer padded-left padded-right'
                            style=''
                        />

                    </div>
                    <div className='verticalSection'>
                        <div className='sectionTitleContainer sectionTitleContainer-cards'>
                            <h2 className='sectionTitle sectionTitle-cards padded-left'>
                                {globalize.translate('HeaderLatestMovies')}
                            </h2>
                        </div>
                        <ItemsContainerElement
                            is='emby-itemscontainer'
                            className='recentlyAddedItems itemsContainer padded-left padded-right'
                            style=''
                        />

                    </div>
                    <div className='recommendations'>
                    </div>
                    <div className='noItemsMessage hide padded-left padded-right'>
                        <br />
                        <p>
                            {globalize.translate('MessageNoMovieSuggestionsAvailable')}
                        </p>
                    </div>
                </div>
                <div className='pageTabContent' id='trailersTab' data-index={2}>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnSort autoSize'
                            title='Sort'
                            icon='sort_by_alpha'
                        />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnFilter autoSize'
                            title='Filter'
                            icon='filter_list'
                        />
                    </div>
                    <div className='alphaPicker alphaPicker-fixed alphaPicker-fixed-right alphaPicker-vertical'>
                    </div>
                    <ItemsContainerElement
                        is='emby-itemscontainer'
                        className='itemsContainer vertical-wrap padded-left padded-right'
                        style=''
                    />
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                    </div>
                </div>
                <div className='pageTabContent' id='favoritesTab' data-index={3}>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnSelectView autoSize'
                            title='ButtonSelectView'
                            icon='view_comfy'
                        />

                    </div>
                    <ItemsContainerElement
                        is='emby-itemscontainer'
                        className='itemsContainer padded-left padded-right'
                        style=''
                    />
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                    </div>
                </div>
                <div className='pageTabContent' id='collectionsTab' data-index={4}>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnSelectView autoSize'
                            title='ButtonSelectView'
                            icon='view_comfy'
                        />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnSort autoSize'
                            title='Sort'
                            icon='sort_by_alpha'
                        />
                        <ButtonPaperElement
                            is='paper-icon-button-light'
                            className='btnNewCollection autoSize'
                            title='NewCollection'
                            icon='add'
                        />
                    </div>
                    <ItemsContainerElement
                        is='emby-itemscontainer'
                        className='itemsContainer vertical-wrap centered padded-left padded-right'
                        style='text-align:center;'
                    />
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging' />
                    </div>
                </div>
                <div className='pageTabContent' id='genresTab' data-index={5}>
                    <div id='items' />
                </div>
            </div>

        </div>
    );
};

export default MoviesPage;
