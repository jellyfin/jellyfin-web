import React, { FunctionComponent, useCallback, useEffect, useMemo, useRef } from 'react';
import globalize from '../scripts/globalize';
import * as userSettings from '../scripts/settings/userSettings';
import '../elements/emby-scroller/emby-scroller';
import '../elements/emby-itemscontainer/emby-itemscontainer';
import '../elements/emby-tabs/emby-tabs';
import '../elements/emby-button/emby-button';
import IconButtonElement from '../elements/IconButtonElement';
import ItemsContainerElement from '../elements/ItemsContainerElement';
import * as mainTabsManager from '../components/maintabsmanager';
import Page from '../components/Page';
import libraryMenu from '../scripts/libraryMenu';

type IProps = {
    tab?: string | null;
    topParentId: string | null;
}

type ControllerProps = {
    destroy: () => void;
    refreshed: boolean;
    initTab: () => void;
    preRender: () => void;
    renderTab: () => void;
}

const Movies: FunctionComponent<IProps> = (props: IProps) => {
    const getDefaultTabIndex = (folderId: string | null) => {
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

    const currentTabIndex = useRef(parseInt(props.tab || getDefaultTabIndex(props.topParentId).toString()));
    const tabControllers = useMemo<ControllerProps[]>(() => [], []);
    const renderedTabs = useMemo<number[]>(() => [], []);
    const element = useRef<HTMLDivElement>(null);

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

    const getTabContainers = () => {
        return element.current?.querySelectorAll('.pageTabContent');
    };

    const getTabController = useCallback((index: number) => {
        if (index == null) {
            throw new Error('index cannot be null');
        }

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

        return import(/* webpackChunkName: "[request]" */ `../controllers/movies/${depends}`).then(({ default: controllerFactory }) => {
            let tabContent;
            let controller = tabControllers[index];

            if (!controller) {
                tabContent = element.current?.querySelector(".pageTabContent[data-index='" + index + "']");

                if (index == 0 || index == 3) {
                    controller = new controllerFactory(props, tabContent, {
                        mode: index ? 'favorites' : 'movies'
                    });
                } else {
                    controller = new controllerFactory(props, tabContent);
                }

                tabControllers[index] = controller;

                if (controller.initTab) {
                    controller.initTab();
                }
            }

            return controller;
        });
    }, [props, tabControllers]);

    const onViewDestroy = useCallback(() => {
        if (tabControllers) {
            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });
        }
    }, [tabControllers]);

    const preLoadTab = useCallback((index: number) => {
        getTabController(index).then((controller: ControllerProps) => {
            if (renderedTabs.indexOf(index) == -1 && controller.preRender) {
                controller.preRender();
            }
        });
    }, [getTabController, renderedTabs]);

    const onBeforeTabChange = useCallback((e: { detail: { selectedTabIndex: string; }; }) => {
        preLoadTab(parseInt(e.detail.selectedTabIndex));
    }, [preLoadTab]);

    const loadTab = useCallback((index: number) => {
        currentTabIndex.current = index;

        getTabController(index).then((controller: ControllerProps) => {
            if (renderedTabs.indexOf(index) == -1) {
                renderedTabs.push(index);
                controller.renderTab();
            }
        });
    }, [getTabController, renderedTabs]);

    const onTabChange = useCallback((e: { detail: { selectedTabIndex: string; }; }) => {
        const newIndex = parseInt(e.detail.selectedTabIndex);
        loadTab(newIndex);
    }, [loadTab]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }
        mainTabsManager.setTabs(element.current, currentTabIndex.current, getTabs, getTabContainers, onBeforeTabChange, onTabChange);
        if (!page.getAttribute('data-title')) {
            const parentId = props.topParentId;

            if (parentId) {
                window.ApiClient.getItem(window.ApiClient.getCurrentUserId(), parentId).then((item) => {
                    page.setAttribute('data-title', item.Name as string);
                    libraryMenu.setTitle(item.Name);
                });
            } else {
                page.setAttribute('data-title', globalize.translate('Movies'));
                libraryMenu.setTitle(globalize.translate('Movies'));
            }
        }
        return () => {
            onViewDestroy();
        };
    }, [onBeforeTabChange, onTabChange, onViewDestroy, props.topParentId]);

    return (
        <div ref={element}>
            <Page
                id='moviesPage'
                className='mainAnimatedPage libraryPage backdropPage collectionEditorPage pageWithAbsoluteTabs withTabs'
                backDropType='movie'
            >
                <div className='pageTabContent' id='moviesTab' data-index='0'>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnShuffle autoSize hide'
                            title='Shuffle'
                            icon='material-icons shuffle'
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnSelectView autoSize'
                            title='ButtonSelectView'
                            icon='material-icons view_comfy'
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnSort autoSize'
                            title='Sort'
                            icon='material-icons sort_by_alpha'
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnFilter autoSize'
                            title='Filter'
                            icon='material-icons filter_list'
                        />

                    </div>

                    <div className='alphaPicker alphaPicker-fixed alphaPicker-vertical'>
                    </div>

                    <ItemsContainerElement
                        id=''
                        className='itemsContainer padded-left padded-right'
                    />

                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>
                    </div>
                </div>
                <div className='pageTabContent' id='suggestionsTab' data-index='1'>
                    <div id='resumableSection' className='verticalSection hide'>
                        <div className='sectionTitleContainer sectionTitleContainer-cards'>
                            <h2 className='sectionTitle sectionTitle-cards padded-left'>
                                {globalize.translate('HeaderContinueWatching')}
                            </h2>
                        </div>

                        <ItemsContainerElement
                            id='resumableItems'
                            className='itemsContainer padded-left padded-right'
                        />

                    </div>

                    <div className='verticalSection'>
                        <div className='sectionTitleContainer sectionTitleContainer-cards'>
                            <h2 className='sectionTitle sectionTitle-cards padded-left'>
                                {globalize.translate('HeaderLatestMovies')}
                            </h2>
                        </div>

                        <ItemsContainerElement
                            id='recentlyAddedItems'
                            className='itemsContainer padded-left padded-right'
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
                <div className='pageTabContent' id='trailersTab' data-index='2'>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>

                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnSort autoSize'
                            title='Sort'
                            icon='material-icons sort_by_alpha'
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnFilter autoSize'
                            title='Filter'
                            icon='material-icons filter_list'
                        />

                    </div>

                    <div className='alphaPicker alphaPicker-fixed alphaPicker-fixed-right alphaPicker-vertical'>
                    </div>

                    <ItemsContainerElement
                        id=''
                        className='itemsContainer vertical-wrap padded-left padded-right'
                    />

                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>
                    </div>
                </div>
                <div className='pageTabContent' id='favoritesTab' data-index='3'>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnSelectView autoSize'
                            title='ButtonSelectView'
                            icon='material-icons view_comfy'
                        />
                    </div>

                    <ItemsContainerElement
                        id=''
                        className='itemsContainer padded-left padded-right'
                    />

                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>
                    </div>
                </div>
                <div className='pageTabContent' id='collectionsTab' data-index='4'>
                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnSelectView autoSize'
                            title='ButtonSelectView'
                            icon='material-icons view_comfy'
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnSort autoSize'
                            title='Sort'
                            icon='material-icons sort_by_alpha'
                        />
                        <IconButtonElement
                            is='paper-icon-button-light'
                            className='btnNewCollection autoSize'
                            title='Add'
                            icon='material-icons add'
                        />

                    </div>

                    <ItemsContainerElement
                        id=''
                        className='itemsContainer vertical-wrap centered padded-left padded-right'
                    />

                    <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                        <div className='paging'></div>
                    </div>
                </div>
                <div className='pageTabContent' id='genresTab' data-index='5'>
                    <div id='items'></div>
                </div>
            </Page>
        </div>
    );
};

export default Movies;
