import React, { Component } from 'react';
import * as mainTabsManager from '../maintabsmanager';

type IProps = {
    tab?: string;
    topParentId: string;
    setTitle: () => void;
    getDefaultTabIndex: (folderId: string) => number;
    getTabs: () => void;
    getTabController: (
        instance: { tabControllers: ControllerProps[]; },
        index: number
        ) => Promise<ControllerProps>;
    children?: React.ReactNode
}

export type ControllerProps = {
    destroy: () => void;
    refreshed: boolean;
    initTab: () => void;
    preRender: () => void;
    renderTab: () => void;
}

class TabbedView extends Component <IProps> {
    tabControllers: ControllerProps[];
    renderedTabs: number[];
    currentTabIndex: number;
    currentTabController!: ControllerProps | null;
    element: React.RefObject<HTMLDivElement>;
    getTabController: (instance: this, index: number) => Promise<ControllerProps>;
    setTitle: () => void;

    constructor(props: IProps) {
        super(props);
        this.element = React.createRef();
        this.tabControllers = [];
        this.renderedTabs = [];
        this.currentTabIndex = parseInt(props.tab || props.getDefaultTabIndex(props.topParentId).toString());

        this.getTabController = props.getTabController;
        this.setTitle = props.setTitle;
    }

    componentDidMount() {
        this.initTabs();
        this.setTitle();
    }

    componentWillUnmount() {
        for (const tabController of this.tabControllers) {
            if (tabController.destroy) {
                tabController.destroy();
            }
        }
    }

    initTabs = () => {
        mainTabsManager.setTabs(this.element.current, this.currentTabIndex, this.props.getTabs, this.getTabContainers, this.onBeforeTabChange, this.onTabChange);
    };

    getTabContainers = () => {
        return this.element.current?.querySelectorAll('.pageTabContent');
    };

    preLoadTab = (index: number) => {
        this.getTabController(this, index).then((controller: ControllerProps) => {
            if (this.renderedTabs.indexOf(index) == -1 && controller.preRender) {
                controller.preRender();
            }
        });
    };

    onBeforeTabChange = (e: { detail: { selectedTabIndex: string; }; }) => {
        this.preLoadTab(parseInt(e.detail.selectedTabIndex));
    };

    loadTab = (index: number) => {
        this.currentTabIndex = index;

        this.getTabController(this, index).then((controller: ControllerProps) => {
            if (this.renderedTabs.indexOf(index) == -1) {
                this.renderedTabs.push(index);
                controller.renderTab();
            }
        });
    };

    onTabChange = (e: { detail: { selectedTabIndex: string; }; }) => {
        const newIndex = parseInt(e.detail.selectedTabIndex);
        this.loadTab(newIndex);
    };

    render() {
        return (
            <div ref={this.element}>
                {this.props.children}
            </div>
        );
    }
}

export default TabbedView;
