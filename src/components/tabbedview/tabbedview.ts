/**
 * @deprecated This module is deprecated in favor of React + ui-primitives/Tabs.
 *
 * Migration:
 *    - Tabbed views → React with ui-primitives/Tabs (Radix UI)
 *    - Tab controllers → React components
 *    - View destruction → useEffect cleanup
 *
 * @see src/ui-primitives/Tabs.tsx
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import { clearBackdrop } from '../backdrop/backdrop';
import * as mainTabsManager from '../maintabsmanager';
import layoutManager from '../layoutManager';
import '../../elements/emby-tabs/emby-tabs';
import LibraryMenu from '../../scripts/libraryMenu';

export interface TabController {
    onResume?: (params: { autoFocus?: boolean; refresh?: boolean }) => void;
    onPause?: () => void;
    destroy?: () => void;
    refreshed?: boolean;
}

export interface TabViewParams {
    tab?: string;
    parentId?: string;
    [key: string]: string | undefined;
}

export interface TabChangeEventDetail {
    selectedTabIndex: string;
    previousIndex: number | null;
}

export interface ViewShowDetail {
    autoFocus?: boolean;
    refresh?: boolean;
}

type DestroyCallback = () => void;

interface TabbedViewState {
    tabControllers: TabController[];
    view: HTMLDivElement | null;
    params: TabViewParams | null;
    currentTabController: TabController | null;
    initialTabIndex: number;
}

function onViewDestroy(this: TabbedViewState): void {
    const tabControllers = this.tabControllers;

    if (tabControllers) {
        tabControllers.forEach((t: TabController) => {
            if (t.destroy) {
                t.destroy();
            }
        });

        this.tabControllers = [];
    }

    this.view = null;
    this.params = null;
    this.currentTabController = null;
    this.initialTabIndex = 0;
}

class TabbedView {
    tabControllers: TabController[];
    view: HTMLDivElement | null;
    params: TabViewParams | null;
    currentTabController: TabController | null;
    initialTabIndex: number;

    validateTabLoad?: (index: number) => Promise<void>;
    getTabs?: () => HTMLElement[];
    getTabController?: (index: number) => Promise<TabController>;
    getDefaultTabIndex?: (parentId?: string) => number;

    constructor(view: HTMLDivElement, params: TabViewParams) {
        this.tabControllers = [];
        this.view = view;
        this.params = params;
        this.currentTabController = null;

        const self = this;

        const defaultTabIndex = this.getDefaultTabIndex ? this.getDefaultTabIndex(params.parentId) : 0;
        let currentTabIndex = parseInt(
            params.tab || defaultTabIndex.toString(),
            10
        );
        this.initialTabIndex = currentTabIndex;

        const validateTabLoad = (index: number): Promise<void> => {
            return self.validateTabLoad ? self.validateTabLoad(index) : Promise.resolve();
        };

        const loadTab = (index: number, previousIndex: number | null): void => {
            validateTabLoad(index).then(() => {
                if (self.getTabController) {
                    self.getTabController(index).then((controller: TabController) => {
                        const refresh = !controller.refreshed;

                        controller.onResume?.({
                            autoFocus: previousIndex == null && layoutManager.tv,
                            refresh: refresh
                        });

                        controller.refreshed = true;

                        currentTabIndex = index;
                        self.currentTabController = controller;
                    });
                }
            });
        };

        const getTabContainers = (): HTMLElement[] => {
            return Array.from(view.querySelectorAll('.tabContent'));
        };

        const onTabChange = (e: any): void => {
            const detail = e.detail as TabChangeEventDetail;
            const newIndex = parseInt(detail.selectedTabIndex, 10);
            const previousIndex = detail.previousIndex;

            const previousTabController = previousIndex == null ? null : self.tabControllers[previousIndex];
            if (previousTabController?.onPause) {
                previousTabController.onPause();
            }

            loadTab(newIndex, previousIndex);
        };

        view.addEventListener('viewbeforehide', this.onPause.bind(this));

        view.addEventListener('viewbeforeshow', () => {
            mainTabsManager.setTabs(
                view,
                currentTabIndex,
                () => (self.getTabs ? (self.getTabs() as any[]) : []),
                getTabContainers,
                null,
                onTabChange,
                false
            );
        });

        view.addEventListener('viewshow', (e: any) => {
            self.onResume(e.detail);
        });

        view.addEventListener('viewdestroy', onViewDestroy.bind(this));
    }

    onResume(detail?: ViewShowDetail): void {
        this.setTitle();
        clearBackdrop();

        const currentTabController = this.currentTabController;

        if (!currentTabController) {
            mainTabsManager.selectedTabIndex(this.initialTabIndex);
        } else if (currentTabController?.onResume) {
            currentTabController.onResume(detail || {});
        }
    }

    onPause(): void {
        const currentTabController = this.currentTabController;

        if (currentTabController?.onPause) {
            currentTabController.onPause();
        }
    }

    setTitle(): void {
        LibraryMenu.setTitle('');
    }
}

export default TabbedView;
