import TabbedView from 'tabbedView';
import globalize from 'globalize';
import require from 'require';
import 'emby-tabs';
import 'emby-button';
import 'emby-scroller';

function getTabs() {
    return [{
        name: globalize.translate('Home')
    }, {
        name: globalize.translate('Favorites')
    }];
}

function getDefaultTabIndex() {
    return 0;
}

function getRequirePromise(deps) {
    return new Promise(function (resolve, reject) {
        require(deps, resolve);
    });
}

function getTabController(index) {
    if (null == index) {
        throw new Error('index cannot be null');
    }

    const depends = [];

    switch (index) {
        case 0:
            depends.push('controllers/hometab');
            break;

        case 1:
            depends.push('controllers/favorites');
    }

    const instance = this;
    return getRequirePromise(depends).then(function (controllerFactory) {
        let controller = instance.tabControllers[index];

        if (!controller) {
            controller = new controllerFactory(instance.view.querySelector(".tabContent[data-index='" + index + "']"), instance.params);
            instance.tabControllers[index] = controller;
        }

        return controller;
    });
}

class HomeView {
    constructor(view, params) {
        TabbedView.call(this, view, params);
    }
    setTitle() {
        Emby.Page.setTitle(null);
    }
    onPause() {
        TabbedView.prototype.onPause.call(this);
        document.querySelector('.skinHeader').classList.remove('noHomeButtonHeader');
    }
    onResume(options) {
        TabbedView.prototype.onResume.call(this, options);
        document.querySelector('.skinHeader').classList.add('noHomeButtonHeader');
    }
}

Object.assign(HomeView.prototype, TabbedView.prototype);
HomeView.prototype.getTabs = getTabs;
HomeView.prototype.getDefaultTabIndex = getDefaultTabIndex;
HomeView.prototype.getTabController = getTabController;

export default HomeView;
