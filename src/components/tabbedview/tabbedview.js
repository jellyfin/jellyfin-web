import backdrop from '../backdrop/backdrop';
import * as mainTabsManager from '../maintabsmanager';
import layoutManager from '../layoutManager';
import '../../elements/emby-tabs/emby-tabs';
import { appRouter } from '../appRouter';

function onViewDestroy() {
    const tabControllers = this.tabControllers;

    if (tabControllers) {
        tabControllers.forEach(function (t) {
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

function onBeforeTabChange() {

}

class TabbedView {
    constructor(view, params) {
        this.tabControllers = [];
        this.view = view;
        this.params = params;

        const self = this;

        let currentTabIndex = parseInt(params.tab || this.getDefaultTabIndex(params.parentId));
        this.initialTabIndex = currentTabIndex;

        function validateTabLoad(index) {
            return self.validateTabLoad ? self.validateTabLoad(index) : Promise.resolve();
        }

        function loadTab(index, previousIndex) {
            validateTabLoad(index).then(function () {
                self.getTabController(index).then(function (controller) {
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
            const newIndex = parseInt(e.detail.selectedTabIndex);
            const previousIndex = e.detail.previousIndex;

            const previousTabController = previousIndex == null ? null : self.tabControllers[previousIndex];
            if (previousTabController && previousTabController.onPause) {
                previousTabController.onPause();
            }

            loadTab(newIndex, previousIndex);
        }

        view.addEventListener('viewbeforehide', this.onPause.bind(this));

        view.addEventListener('viewbeforeshow', function () {
            mainTabsManager.setTabs(view, currentTabIndex, self.getTabs, getTabContainers, onBeforeTabChange, onTabChange, false);
        });

        view.addEventListener('viewshow', function (e) {
            self.onResume(e.detail);
        });

        view.addEventListener('viewdestroy', onViewDestroy.bind(this));
    }

    onResume() {
        this.setTitle();
        backdrop.clearBackdrop();

        const currentTabController = this.currentTabController;

        if (!currentTabController) {
            mainTabsManager.selectedTabIndex(this.initialTabIndex);
        } else if (currentTabController && currentTabController.onResume) {
            currentTabController.onResume({});
        }
    }

    onPause() {
        const currentTabController = this.currentTabController;

        if (currentTabController && currentTabController.onPause) {
            currentTabController.onPause();
        }
    }
    setTitle() {
        appRouter.setTitle('');
    }
}

export default TabbedView;
