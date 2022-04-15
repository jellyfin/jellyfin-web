import React, { Component } from 'react';
import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import backdrop from '../backdrop/backdrop';
import layoutManager from '../layoutManager';
import * as mainTabsManager from '../maintabsmanager';
import '../../elements/emby-tabs/emby-tabs';
import '../../elements/emby-button/emby-button';
import '../../elements/emby-scroller/emby-scroller';

type IProps = {
    tab?: string;
}

type ControllerProps = {
    onResume: (
        // eslint-disable-next-line no-empty-pattern
        {}
    ) => void;
    refreshed: boolean;
    onPause: () => void;
    destroy: () => void;
}

class HomeView extends Component <IProps> {
    tabControllers: ControllerProps[];
    initialTabIndex: number | null;
    currentTabController!: ControllerProps | null;
    currentTabIndex: number;
    element: React.RefObject<HTMLDivElement>;

    constructor(props: IProps) {
        super(props);
        this.element = React.createRef();

        this.tabControllers = [];
        this.currentTabIndex = parseInt(props.tab || this.getDefaultTabIndex().toString());
        this.initialTabIndex = this.currentTabIndex;
    }

    componentDidMount() {
        mainTabsManager.setTabs(this.element.current, this.currentTabIndex, this.getTabs, this.getTabContainers, null, this.onTabChange, false);

        this.onResume();
    }

    componentWillUnmount() {
        this.onPause();
        this.onViewDestroy();
    }

    onViewDestroy = () => {
        const tabControllers = this.tabControllers;

        if (tabControllers) {
            tabControllers.forEach(function (t) {
                if (t.destroy) {
                    t.destroy();
                }
            });
        }

        this.currentTabController = null;
        this.initialTabIndex = null;
    };

    loadTab = (index: number, previousIndex: number | null) => {
        this.getTabController(index).then((controller: ControllerProps) => {
            const refresh = !controller.refreshed;

            controller.onResume({
                autoFocus: previousIndex == null && layoutManager.tv,
                refresh: refresh
            });

            controller.refreshed = true;

            this.currentTabIndex = index;
            this.currentTabController = controller;
        });
    };

    getTabContainers = () => {
        const view = this.element.current;

        if (!view) {
            console.error('Unexpected null reference');
            return;
        }

        return view?.querySelectorAll('.tabContent');
    };

    onTabChange = (e: { detail: { selectedTabIndex: string; previousIndex: number | null }; }) => {
        const newIndex = parseInt(e.detail.selectedTabIndex);
        const previousIndex = e.detail.previousIndex;

        const previousTabController = previousIndex == null ? null : this.tabControllers[previousIndex];
        if (previousTabController && previousTabController.onPause) {
            previousTabController.onPause();
        }

        this.loadTab(newIndex, previousIndex);
    };

    setTitle() {
        LibraryMenu.setTitle(null);
    }

    onPause = () => {
        const currentTabController = this.currentTabController;

        if (currentTabController && currentTabController.onPause) {
            currentTabController.onPause();
        }
        (document.querySelector('.skinHeader') as HTMLDivElement).classList.remove('noHomeButtonHeader');
    };

    onResume = () => {
        this.setTitle();
        backdrop.clearBackdrop();

        const currentTabController = this.currentTabController;

        if (!currentTabController) {
            mainTabsManager.selectedTabIndex(this.initialTabIndex);
        } else if (currentTabController && currentTabController.onResume) {
            currentTabController.onResume({});
        }
        (document.querySelector('.skinHeader') as HTMLDivElement).classList.add('noHomeButtonHeader');
    };

    getDefaultTabIndex() {
        return 0;
    }

    getTabs() {
        return [{
            name: globalize.translate('Home')
        }, {
            name: globalize.translate('Favorites')
        }];
    }

    getTabController(index: number) {
        if (index == null) {
            throw new Error('index cannot be null');
        }

        let depends = '';

        switch (index) {
            case 0:
                depends = 'hometab';
                break;

            case 1:
                depends = 'favorites';
        }

        return import(/* webpackChunkName: "[request]" */ `../../controllers/${depends}`).then(({ default: controllerFactory }) => {
            let controller = this.tabControllers[index];

            if (!controller) {
                controller = new controllerFactory(this.element.current?.querySelector(".tabContent[data-index='" + index + "']"), this.props);
                this.tabControllers[index] = controller;
            }

            return controller;
        });
    }

    render() {
        return (
            <div ref={this.element}>
                <div className='tabContent pageTabContent' id='homeTab' data-index='0'>
                    <div className='sections'></div>
                </div>
                <div className='tabContent pageTabContent' id='favoritesTab' data-index='1'>
                    <div className='sections'></div>
                </div>
            </div>
        );
    }
}

export default HomeView;
