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
        const path = newRoute.alias ? newRoute.alias : newRoute.path;
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
        path: '/controllers/session/resetPassword/index.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'session/resetPassword/index'
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
        alias: '/mypreferencesquickconnect.html',
        path: '/controllers/user/quickConnect/index.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/quickConnect/index'
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
        alias: '/dashboard.html',
        path: '/controllers/dashboard/dashboard.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dashboard'
    });

    defineRoute({
        alias: '/dashboardgeneral.html',
        path: '/controllers/dashboard/general.html',
        controller: 'dashboard/general',
        autoFocus: false,
        roles: 'admin'
    });

    defineRoute({
        alias: '/networking.html',
        path: '/controllers/dashboard/networking.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/networking'
    });

    defineRoute({
        alias: '/devices.html',
        path: '/controllers/dashboard/devices/devices.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/devices/devices'
    });

    defineRoute({
        alias: '/device.html',
        path: '/controllers/dashboard/devices/device.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/devices/device'
    });

    defineRoute({
        alias: '/quickConnect.html',
        path: '/controllers/dashboard/quickConnect.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/quickConnect'
    });

    defineRoute({
        alias: '/dlnaprofile.html',
        path: '/controllers/dashboard/dlna/profile.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/profile'
    });

    defineRoute({
        alias: '/dlnaprofiles.html',
        path: '/controllers/dashboard/dlna/profiles.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/profiles'
    });

    defineRoute({
        alias: '/dlnasettings.html',
        path: '/controllers/dashboard/dlna/settings.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/settings'
    });

    defineRoute({
        alias: '/addplugin.html',
        path: '/controllers/dashboard/plugins/add/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/add/index'
    });

    defineRoute({
        alias: '/library.html',
        path: '/controllers/dashboard/library.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/library'
    });

    defineRoute({
        alias: '/librarydisplay.html',
        path: '/controllers/dashboard/librarydisplay.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/librarydisplay'
    });

    defineRoute({
        alias: '/edititemmetadata.html',
        path: '/controllers/edititemmetadata.html',
        controller: 'edititemmetadata',
        autoFocus: false
    });

    defineRoute({
        alias: '/encodingsettings.html',
        path: '/controllers/dashboard/encodingsettings.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/encodingsettings'
    });

    defineRoute({
        alias: '/log.html',
        path: '/controllers/dashboard/logs.html',
        roles: 'admin',
        controller: 'dashboard/logs'
    });

    defineRoute({
        alias: '/metadataimages.html',
        path: '/controllers/dashboard/metadataimages.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/metadataImages'
    });

    defineRoute({
        alias: '/metadatanfo.html',
        path: '/controllers/dashboard/metadatanfo.html',
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
        alias: '/playbackconfiguration.html',
        path: '/controllers/dashboard/playback.html',
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
        alias: '/home.html',
        path: '/controllers/home.html',
        autoFocus: false,
        controller: 'home',
        type: 'home'
    });

    defineRoute({
        alias: '/search.html',
        path: '/controllers/search.html',
        controller: 'searchpage'
    });

    defineRoute({
        alias: '/list.html',
        path: '/controllers/list.html',
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
        alias: '/livetv.html',
        path: '/controllers/livetv.html',
        controller: 'livetv/livetvsuggested',
        autoFocus: false
    });

    defineRoute({
        alias: '/livetvguideprovider.html',
        path: '/controllers/livetvguideprovider.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvguideprovider'
    });

    defineRoute({
        alias: '/livetvsettings.html',
        path: '/controllers/livetvsettings.html',
        autoFocus: false,
        controller: 'livetvsettings'
    });

    defineRoute({
        alias: '/livetvstatus.html',
        path: '/controllers/livetvstatus.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvstatus'
    });

    defineRoute({
        alias: '/livetvtuner.html',
        path: '/controllers/livetvtuner.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvtuner'
    });

    defineRoute({
        alias: '/movies.html',
        path: '/controllers/movies/movies.html',
        autoFocus: false,
        controller: 'movies/moviesrecommended'
    });

    defineRoute({
        alias: '/music.html',
        path: '/controllers/music/music.html',
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
        alias: '/scheduledtask.html',
        path: '/controllers/dashboard/scheduledtasks/scheduledtask.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/scheduledtasks/scheduledtask'
    });

    defineRoute({
        alias: '/scheduledtasks.html',
        path: '/controllers/dashboard/scheduledtasks/scheduledtasks.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/scheduledtasks/scheduledtasks'
    });

    defineRoute({
        alias: '/serveractivity.html',
        path: '/controllers/dashboard/serveractivity.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/serveractivity'
    });

    defineRoute({
        alias: '/apikeys.html',
        path: '/controllers/dashboard/apikeys.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/apikeys'
    });

    defineRoute({
        alias: '/streamingsettings.html',
        path: '/controllers/dashboard/streaming.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/streaming'
    });

    defineRoute({
        alias: '/tv.html',
        path: '/controllers/shows/tvrecommended.html',
        autoFocus: false,
        controller: 'shows/tvrecommended'
    });

    defineRoute({
        alias: '/useredit.html',
        path: '/controllers/dashboard/users/useredit.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/useredit'
    });

    defineRoute({
        alias: '/userlibraryaccess.html',
        path: '/controllers/dashboard/users/userlibraryaccess.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userlibraryaccess'
    });

    defineRoute({
        alias: '/usernew.html',
        path: '/controllers/dashboard/users/usernew.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/usernew'
    });

    defineRoute({
        alias: '/userparentalcontrol.html',
        path: '/controllers/dashboard/users/userparentalcontrol.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userparentalcontrol'
    });

    defineRoute({
        alias: '/userpassword.html',
        path: '/controllers/dashboard/users/userpassword.html',
        autoFocus: false,
        controller: 'dashboard/users/userpasswordpage'
    });

    defineRoute({
        alias: '/userprofiles.html',
        path: '/controllers/dashboard/users/userprofiles.html',
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
        alias: '/wizardlibrary.html',
        path: '/controllers/wizard/library.html',
        autoFocus: false,
        anonymous: true,
        controller: 'dashboard/library'
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
