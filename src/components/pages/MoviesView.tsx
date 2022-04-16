import React, { Component } from 'react';
import ItemsContainerElement from '../dashboard/ItemsContainerElement';
import PaperButtonElement from '../dashboard/PaperButtonElement';
import TabbedView from '../tabbedview/TabbedView';
import globalize from '../../scripts/globalize';
import * as userSettings from '../../scripts/settings/userSettings';
import libraryMenu from '../../scripts/libraryMenu';
import '../../elements/emby-scroller/emby-scroller';
import '../../elements/emby-itemscontainer/emby-itemscontainer';
import '../../elements/emby-tabs/emby-tabs';
import '../../elements/emby-button/emby-button';

type IProps = {
    tab?: string;
    topParentId: string;
}

type ControllerProps = {
    destroy: () => void;
    refreshed: boolean;
    initTab: () => void;
    preRender: () => void;
    renderTab: () => void;
}

export class MoviesView extends Component <IProps> {
    element: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);
        this.element = React.createRef();
    }

    setTitle() {
        const view = this.element.current;

        if (!view) {
            console.error('Unexpected null reference');
            return;
        }

        if (!view.getAttribute('data-title')) {
            const parentId = this.props.topParentId;

            if (parentId) {
                window.ApiClient.getItem(window.ApiClient.getCurrentUserId(), parentId).then(function (item) {
                    view.setAttribute('data-title', item.Name as string);
                    libraryMenu.setTitle(item.Name);
                });
            } else {
                view.setAttribute('data-title', globalize.translate('Movies'));
                libraryMenu.setTitle(globalize.translate('Movies'));
            }
        }
    }

    getDefaultTabIndex(folderId: string) {
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
    }

    getTabs = () => {
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

    getTabController(instance: { tabControllers: ControllerProps[]; }, index: number) {
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

        return import(/* webpackChunkName: "[request]" */ `../../controllers/movies/${depends}`).then(({ default: controllerFactory }) => {
            let tabContent;
            let controller = instance.tabControllers[index];

            if (!controller) {
                tabContent = this.element.current?.querySelector(".pageTabContent[data-index='" + index + "']");

                if (index == 0 || index == 3) {
                    controller = new controllerFactory(this.element.current, this.props.topParentId, tabContent, {
                        mode: index ? 'favorites' : 'movies'
                    });
                } else {
                    controller = new controllerFactory(this.element.current, this.props.topParentId, tabContent);
                }

                instance.tabControllers[index] = controller;
                if (controller.initTab) {
                    controller.initTab();
                }
            }
            return controller;
        });
    }

    render() {
        return (
            <div ref={this.element}>
                <TabbedView
                    getDefaultTabIndex={this.getDefaultTabIndex}
                    getTabs={this.getTabs}
                    getTabController={this.getTabController}
                    tab={this.props.tab}
                    topParentId={this.props.topParentId}
                    setTitle={this.setTitle}
                >
                    <div className='pageTabContent' id='moviesTab' data-index='0'>
                        <div className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                            <div className='paging'></div>
                            <PaperButtonElement
                                is='paper-icon-button-light'
                                className='btnSelectView autoSize'
                                title='ButtonSelectView'
                                icon='material-icons view_comfy'
                            />
                            <PaperButtonElement
                                is='paper-icon-button-light'
                                className='btnSort autoSize'
                                title='Sort'
                                icon='material-icons sort_by_alpha'
                            />
                            <PaperButtonElement
                                is='paper-icon-button-light'
                                type='submit'
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

                            <PaperButtonElement
                                is='paper-icon-button-light'
                                className='btnSort autoSize'
                                title='Sort'
                                icon='material-icons sort_by_alpha'
                            />
                            <PaperButtonElement
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
                            <PaperButtonElement
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
                            <PaperButtonElement
                                is='paper-icon-button-light'
                                className='btnSelectView autoSize'
                                title='ButtonSelectView'
                                icon='material-icons view_comfy'
                            />
                            <PaperButtonElement
                                is='paper-icon-button-light'
                                className='btnSort autoSize'
                                title='Sort'
                                icon='material-icons sort_by_alpha'
                            />
                            <PaperButtonElement
                                is='paper-icon-button-light'
                                type='button'
                                className='btnNewCollection autoSize'
                                title='add'
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
                </TabbedView>
            </div>

        );
    }
}

export default MoviesView;
