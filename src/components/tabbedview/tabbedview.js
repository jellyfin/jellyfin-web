/**
 * @deprecated This module is deprecated in favor of React + ui-primitives/Tabs.
 *
 * Migration:
    - Tabbed views → React with ui-primitives/Tabs (Radix UI)
    - Tab controllers → React components
    - View destruction → useEffect cleanup
 *
 * @see src/ui-primitives/Tabs.tsx
 * @see src/styles/LEGACY_DEPRECATION_GUIDE.md
 */

import { clearBackdrop } from '../backdrop/backdrop';
import * as mainTabsManager from '../maintabsmanager';
import layoutManager from '../layoutManager';
import '../../elements/emby-tabs/emby-tabs';
import LibraryMenu from '../../scripts/libraryMenu';

function onViewDestroy() {
    const tabControllers = this.tabControllers;

    if (tabControllers) {
        tabControllers.forEach((t) => {
            if (t.destroy) {
                t.destroy();
            }
        });

        this.tabControllers = null;
    }

    this.view = null;
    this.params = null;
    this.currentTabController = null;
    this.initialTabIndex = null;
}

class TabbedView {
    constructor(view, params) {
        this.tabControllers = [];
        this.view = view;
        this.params = params;

        const self = this;

        let currentTabIndex = parseInt(params.tab || this.getDefaultTabIndex(params.parentId), 10);
        this.initialTabIndex = currentTabIndex;

        function validateTabLoad(index) {
            return self.validateTabLoad ? self.validateTabLoad(index) : Promise.resolve();
        }

        function loadTab(index, previousIndex) {
            validateTabLoad(index).then(() => {
                self.getTabController(index).then((controller) => {
                    const refresh = !controller.refreshed;

                    controller.onResume({
                        autoFocus: previousIndex == null && layoutManager.tv,
                        refresh: refresh
                    });

                    controller.refreshed = true;

                    currentTabIndex = index;
                    self.currentTabController = controller;
                });
            });
        }

        function getTabContainers() {
            return view.querySelectorAll('.tabContent');
        }

        function onTabChange(e) {
            const newIndex = parseInt(e.detail.selectedTabIndex, 10);
            const previousIndex = e.detail.previousIndex;

            const previousTabController = previousIndex == null ? null : self.tabControllers[previousIndex];
            if (previousTabController?.onPause) {
                previousTabController.onPause();
            }

            loadTab(newIndex, previousIndex);
        }

        view.addEventListener('viewbeforehide', this.onPause.bind(this));

        view.addEventListener('viewbeforeshow', () => {
            mainTabsManager.setTabs(view, currentTabIndex, self.getTabs, getTabContainers, null, onTabChange, false);
        });

        view.addEventListener('viewshow', (e) => {
            self.onResume(e.detail);
        });

        view.addEventListener('viewdestroy', onViewDestroy.bind(this));
    }

    onResume() {
        this.setTitle();
        clearBackdrop();

        const currentTabController = this.currentTabController;

        if (!currentTabController) {
            mainTabsManager.selectedTabIndex(this.initialTabIndex);
        } else if (currentTabController?.onResume) {
            currentTabController.onResume({});
        }
    }

    onPause() {
        const currentTabController = this.currentTabController;

        if (currentTabController?.onPause) {
            currentTabController.onPause();
        }
    }

    setTitle() {
        LibraryMenu.setTitle('');
    }
}

export default TabbedView;
