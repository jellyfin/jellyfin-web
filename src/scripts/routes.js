import 'emby-button';
import 'emby-input';
import 'scripts/livetvcomponents';
import 'paper-icon-button-light';
import 'emby-itemscontainer';
import 'emby-collapse';
import 'emby-select';
import 'livetvcss';
import 'emby-checkbox';
import 'emby-slider';
import 'listViewStyle';
import 'dashboardcss';
import 'detailtablecss';

/* eslint-disable indent */

    console.groupCollapsed('defining core routes');

    function defineRoute(newRoute) {
        var path = newRoute.alias ? newRoute.alias : newRoute.path;
        console.debug('defining route: ' + path);
        newRoute.dictionary = 'core';
        Emby.Page.addRoute(path, newRoute);
    }

    defineRoute({
        alias: '/addserver.html',
        path: '/controllers/session/addServer/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/addServer/index'
    });

    defineRoute({
        alias: '/selectserver.html',
        path: '/controllers/session/selectServer/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/selectServer/index',
        type: 'selectserver'
    });

    defineRoute({
        alias: '/login.html',
        path: '/controllers/session/login/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/login/index',
        type: 'login'
    });

    defineRoute({
        alias: '/forgotpassword.html',
        path: '/controllers/session/forgotPassword/index.html',
        anonymous: true,
        startup: true,
        controller: 'session/forgotPassword/index'
    });

    defineRoute({
        alias: '/forgotpasswordpin.html',
        path: '/controllers/session/redeemPassword/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/redeemPassword/index'
    });

    defineRoute({
        alias: '/mypreferencesmenu.html',
        path: '/controllers/user/menu/index.html',
        autoFocus: false,
        controller: 'user/menu/index'
    });

    defineRoute({
        alias: '/myprofile.html',
        path: '/controllers/user/profile/index.html',
        autoFocus: false,
        controller: 'user/profile/index'
    });

    defineRoute({
        alias: '/mypreferencesdisplay.html',
        path: '/controllers/user/display/index.html',
        autoFocus: false,
        controller: 'user/display/index'
    });

    defineRoute({
        alias: '/mypreferenceshome.html',
        path: '/controllers/user/home/index.html',
        autoFocus: false,
        controller: 'user/home/index'
    });

    defineRoute({
        alias: '/mypreferencesplayback.html',
        path: '/controllers/user/playback/index.html',
        autoFocus: false,
        controller: 'user/playback/index'
    });

    defineRoute({
        alias: '/mypreferencessubtitles.html',
        path: '/controllers/user/subtitles/index.html',
        autoFocus: false,
        controller: 'user/subtitles/index'
    });

    defineRoute({
        path: '/dashboard.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dashboard'
    });

    defineRoute({
        path: '/dashboardgeneral.html',
        controller: 'dashboard/general',
        autoFocus: false,
        roles: 'admin'
    });

    defineRoute({
        path: '/networking.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/networking'
    });

    defineRoute({
        path: '/devices.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/devices/devices'
    });

    defineRoute({
        path: '/device.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/devices/device'
    });

    defineRoute({
        path: '/dlnaprofile.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/profile'
    });

    defineRoute({
        path: '/dlnaprofiles.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/profiles'
    });

    defineRoute({
        alias: '/addplugin.html',
        path: '/controllers/dashboard/plugins/add/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/add/index'
    });

    defineRoute({
        path: '/library.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/mediaLibrary'
    });

    defineRoute({
        path: '/librarydisplay.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/librarydisplay'
    });

    defineRoute({
        path: '/dlnasettings.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/settings'
    });

    defineRoute({
        path: '/edititemmetadata.html',
        controller: 'edititemmetadata',
        autoFocus: false
    });

    defineRoute({
        path: '/encodingsettings.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/encodingsettings'
    });

    defineRoute({
        path: '/log.html',
        roles: 'admin',
        controller: 'dashboard/logs'
    });

    defineRoute({
        path: '/metadataimages.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/metadataImages'
    });

    defineRoute({
        path: '/metadatanfo.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/metadatanfo'
    });

    defineRoute({
        alias: '/notificationsetting.html',
        path: '/controllers/dashboard/notifications/notification/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/notifications/notification/index'
    });

    defineRoute({
        alias: '/notificationsettings.html',
        path: '/controllers/dashboard/notifications/notifications/index.html',
        controller: 'dashboard/notifications/notifications/index',
        autoFocus: false,
        roles: 'admin'
    });

    defineRoute({
        path: '/playbackconfiguration.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/playback'
    });

    defineRoute({
        alias: '/availableplugins.html',
        path: '/controllers/dashboard/plugins/available/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/available/index'
    });

    defineRoute({
        alias: '/repositories.html',
        path: '/controllers/dashboard/plugins/repositories/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/repositories/index'
    });

    defineRoute({
        path: '/home.html',
        autoFocus: false,
        controller: 'home',
        type: 'home'
    });

    defineRoute({
        path: '/search.html',
        controller: 'searchpage'
    });

    defineRoute({
        path: '/list.html',
        autoFocus: false,
        controller: 'list'
    });

    defineRoute({
        alias: '/details',
        path: '/controllers/itemDetails/index.html',
        controller: 'itemDetails/index',
        autoFocus: false
    });

    defineRoute({
        path: '/livetv.html',
        controller: 'livetv/livetvsuggested',
        autoFocus: false
    });

    defineRoute({
        path: '/livetvguideprovider.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvguideprovider'
    });

    defineRoute({
        path: '/livetvsettings.html',
        autoFocus: false,
        controller: 'livetvsettings'
    });

    defineRoute({
        path: '/livetvstatus.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvstatus'
    });

    defineRoute({
        path: '/livetvtuner.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvtuner'
    });

    defineRoute({
        path: '/movies.html',
        autoFocus: false,
        controller: 'movies/moviesrecommended'
    });

    defineRoute({
        path: '/music.html',
        controller: 'music/musicrecommended',
        autoFocus: false
    });

    defineRoute({
        alias: '/installedplugins.html',
        path: '/controllers/dashboard/plugins/installed/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/installed/index'
    });

    defineRoute({
        path: '/scheduledtask.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/scheduledtasks/scheduledtask'
    });

    defineRoute({
        path: '/scheduledtasks.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/scheduledtasks/scheduledtasks'
    });

    defineRoute({
        path: '/serveractivity.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/serveractivity'
    });

    defineRoute({
        path: '/apikeys.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/apikeys'
    });

    defineRoute({
        path: '/streamingsettings.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/streaming'
    });

    defineRoute({
        path: '/tv.html',
        autoFocus: false,
        controller: 'shows/tvrecommended'
    });

    defineRoute({
        path: '/useredit.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/useredit'
    });

    defineRoute({
        path: '/userlibraryaccess.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userlibraryaccess'
    });

    defineRoute({
        path: '/usernew.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/usernew'
    });

    defineRoute({
        path: '/userparentalcontrol.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userparentalcontrol'
    });

    defineRoute({
        path: '/userpassword.html',
        autoFocus: false,
        controller: 'dashboard/users/userpasswordpage'
    });

    defineRoute({
        path: '/userprofiles.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userprofilespage'
    });

    defineRoute({
        alias: '/wizardremoteaccess.html',
        path: '/controllers/wizard/remote/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/remote/index'
    });

    defineRoute({
        alias: '/wizardfinish.html',
        path: '/controllers/wizard/finish/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/finish/index'
    });

    defineRoute({
        path: '/wizardlibrary.html',
        autoFocus: false,
        anonymous: true,
        controller: 'dashboard/mediaLibrary'
    });

    defineRoute({
        alias: '/wizardsettings.html',
        path: '/controllers/wizard/settings/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/settings/index'
    });

    defineRoute({
        alias: '/wizardstart.html',
        path: '/controllers/wizard/start/index.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/start/index'
    });

    defineRoute({
        alias: '/wizarduser.html',
        path: '/controllers/wizard/user/index.html',
        controller: 'wizard/user/index',
        autoFocus: false,
        anonymous: true
    });

    defineRoute({
        alias: '/video',
        path: '/controllers/playback/video/index.html',
        controller: 'playback/video/index',
        autoFocus: false,
        type: 'video-osd',
        supportsThemeMedia: true,
        fullscreen: true,
        enableMediaControl: false
    });

    defineRoute({
        alias: '/queue',
        path: '/controllers/playback/queue/index.html',
        controller: 'playback/queue/index',
        autoFocus: false,
        fullscreen: true,
        supportsThemeMedia: true,
        enableMediaControl: false
    });

    defineRoute({
        path: '/configurationpage',
        autoFocus: false,
        enableCache: false,
        enableContentQueryString: true,
        roles: 'admin'
    });

    defineRoute({
        path: '/',
        isDefaultRoute: true,
        autoFocus: false
    });

    defineRoute({
        path: '/index.html',
        autoFocus: false,
        isDefaultRoute: true
    });

    console.groupEnd('defining core routes');

/* eslint-enable indent */
