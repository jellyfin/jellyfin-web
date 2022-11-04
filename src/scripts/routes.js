import '../elements/emby-button/emby-button';
import '../elements/emby-input/emby-input';
import '../scripts/livetvcomponents';
import '../elements/emby-button/paper-icon-button-light';
import '../elements/emby-itemscontainer/emby-itemscontainer';
import '../elements/emby-collapse/emby-collapse';
import '../elements/emby-select/emby-select';
import '../elements/emby-checkbox/emby-checkbox';
import '../elements/emby-slider/emby-slider';
import '../assets/css/livetv.scss';
import '../components/listview/listview.scss';
import '../assets/css/dashboard.scss';
import '../assets/css/detailtable.scss';
import { appRouter } from '../components/appRouter';

/* eslint-disable indent */

    console.groupCollapsed('defining core routes');

    function defineRoute(newRoute) {
        const path = newRoute.alias ? newRoute.alias : newRoute.path;
        console.debug('defining route: ' + path);
        newRoute.dictionary = 'core';
        appRouter.addRoute(path, newRoute);
    }

    defineRoute({
        alias: '/addserver.html',
        path: 'session/addServer/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/addServer/index'
    });

    defineRoute({
        alias: '/selectserver.html',
        path: 'session/selectServer/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/selectServer/index',
        type: 'selectserver'
    });

    defineRoute({
        alias: '/login.html',
        path: 'session/login/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/login/index',
        type: 'login'
    });

    defineRoute({
        alias: '/forgotpassword.html',
        path: 'session/forgotPassword/index.html',
        anonymous: true,
        startup: true,
        controller: 'session/forgotPassword/index'
    });

    defineRoute({
        alias: '/forgotpasswordpin.html',
        path: 'session/resetPassword/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/resetPassword/index'
    });

    defineRoute({
        alias: '/wizardremoteaccess.html',
        path: 'wizard/remote/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/remote/index'
    });

    defineRoute({
        alias: '/wizardfinish.html',
        path: 'wizard/finish/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/finish/index'
    });

    defineRoute({
        alias: '/wizardlibrary.html',
        path: 'wizard/library.html',
        autoFocus: false,
        anonymous: true,
        controller: 'dashboard/library'
    });

    defineRoute({
        alias: '/wizardsettings.html',
        path: 'wizard/settings/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/settings/index'
    });

    defineRoute({
        alias: '/wizardstart.html',
        path: 'wizard/start/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/start/index'
    });

    defineRoute({
        alias: '/wizarduser.html',
        path: 'wizard/user/index.html',
        controller: 'wizard/user/index',
        autoFocus: false,
        anonymous: true
    });

    defineRoute({
        path: '/configurationpage',
        autoFocus: false,
        enableCache: false,
        enableContentQueryString: true,
        roles: 'admin',
        serverRequest: true
    });

    console.groupEnd('defining core routes');

/* eslint-enable indent */
