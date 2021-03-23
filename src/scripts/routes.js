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
        alias: '/mypreferencesmenu.html',
        path: 'user/menu/index.html',
        autoFocus: false,
        controller: 'user/menu/index'
    });

    defineRoute({
        alias: '/myprofile.html',
        path: 'user/profile/index.html',
        autoFocus: false,
        controller: 'user/profile/index'
    });

    defineRoute({
        alias: '/mypreferencesdisplay.html',
        path: 'user/display/index.html',
        autoFocus: false,
        controller: 'user/display/index'
    });

    defineRoute({
        alias: '/mypreferenceshome.html',
        path: 'user/home/index.html',
        autoFocus: false,
        controller: 'user/home/index'
    });

    defineRoute({
        alias: '/mypreferencesquickconnect.html',
        path: 'user/quickConnect/index.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/quickConnect/index'
    });
    defineRoute({
        alias: '/mypreferencesplayback.html',
        path: 'user/playback/index.html',
        autoFocus: false,
        controller: 'user/playback/index'
    });

    defineRoute({
        alias: '/mypreferencessubtitles.html',
        path: 'user/subtitles/index.html',
        autoFocus: false,
        controller: 'user/subtitles/index'
    });

    defineRoute({
        alias: '/dashboard.html',
        path: 'dashboard/dashboard.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dashboard'
    });

    defineRoute({
        alias: '/dashboardgeneral.html',
        path: 'dashboard/general.html',
        controller: 'dashboard/general',
        autoFocus: false,
        roles: 'admin'
    });

    defineRoute({
        alias: '/networking.html',
        path: 'dashboard/networking.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/networking'
    });

    defineRoute({
        alias: '/devices.html',
        path: 'dashboard/devices/devices.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/devices/devices'
    });

    defineRoute({
        alias: '/device.html',
        path: 'dashboard/devices/device.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/devices/device'
    });

    defineRoute({
        alias: '/quickConnect.html',
        path: 'dashboard/quickConnect.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/quickConnect'
    });

    defineRoute({
        alias: '/dlnaprofile.html',
        path: 'dashboard/dlna/profile.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/profile'
    });

    defineRoute({
        alias: '/dlnaprofiles.html',
        path: 'dashboard/dlna/profiles.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/profiles'
    });

    defineRoute({
        alias: '/dlnasettings.html',
        path: 'dashboard/dlna/settings.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/dlna/settings'
    });

    defineRoute({
        alias: '/addplugin.html',
        path: 'dashboard/plugins/add/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/add/index'
    });

    defineRoute({
        alias: '/library.html',
        path: 'dashboard/library.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/library'
    });

    defineRoute({
        alias: '/librarydisplay.html',
        path: 'dashboard/librarydisplay.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/librarydisplay'
    });

    defineRoute({
        alias: '/edititemmetadata.html',
        path: 'edititemmetadata.html',
        controller: 'edititemmetadata',
        autoFocus: false
    });

    defineRoute({
        alias: '/encodingsettings.html',
        path: 'dashboard/encodingsettings.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/encodingsettings'
    });

    defineRoute({
        alias: '/log.html',
        path: 'dashboard/logs.html',
        roles: 'admin',
        controller: 'dashboard/logs'
    });

    defineRoute({
        alias: '/metadataimages.html',
        path: 'dashboard/metadataimages.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/metadataImages'
    });

    defineRoute({
        alias: '/metadatanfo.html',
        path: 'dashboard/metadatanfo.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/metadatanfo'
    });

    defineRoute({
        alias: '/notificationsetting.html',
        path: 'dashboard/notifications/notification/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/notifications/notification/index'
    });

    defineRoute({
        alias: '/notificationsettings.html',
        path: 'dashboard/notifications/notifications/index.html',
        controller: 'dashboard/notifications/notifications/index',
        autoFocus: false,
        roles: 'admin'
    });

    defineRoute({
        alias: '/playbackconfiguration.html',
        path: 'dashboard/playback.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/playback'
    });

    defineRoute({
        alias: '/availableplugins.html',
        path: 'dashboard/plugins/available/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/available/index'
    });

    defineRoute({
        alias: '/repositories.html',
        path: 'dashboard/plugins/repositories/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/repositories/index'
    });

    defineRoute({
        alias: '/home.html',
        path: 'home.html',
        autoFocus: false,
        controller: 'home',
        type: 'home'
    });

    defineRoute({
        alias: '/search.html',
        path: 'search.html',
        controller: 'searchpage'
    });

    defineRoute({
        alias: '/list.html',
        path: 'list.html',
        autoFocus: false,
        controller: 'list'
    });

    defineRoute({
        alias: '/details',
        path: 'itemDetails/index.html',
        controller: 'itemDetails/index',
        autoFocus: false
    });

    defineRoute({
        alias: '/livetv.html',
        path: 'livetv.html',
        controller: 'livetv/livetvsuggested',
        autoFocus: false
    });

    defineRoute({
        alias: '/livetvguideprovider.html',
        path: 'livetvguideprovider.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvguideprovider'
    });

    defineRoute({
        alias: '/livetvsettings.html',
        path: 'livetvsettings.html',
        autoFocus: false,
        controller: 'livetvsettings'
    });

    defineRoute({
        alias: '/livetvstatus.html',
        path: 'livetvstatus.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvstatus'
    });

    defineRoute({
        alias: '/livetvtuner.html',
        path: 'livetvtuner.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'livetvtuner'
    });

    defineRoute({
        alias: '/movies.html',
        path: 'movies/movies.html',
        autoFocus: false,
        controller: 'movies/moviesrecommended'
    });

    defineRoute({
        alias: '/music.html',
        path: 'music/music.html',
        controller: 'music/musicrecommended',
        autoFocus: false
    });

    defineRoute({
        alias: '/installedplugins.html',
        path: 'dashboard/plugins/installed/index.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/installed/index'
    });

    defineRoute({
        alias: '/scheduledtask.html',
        path: 'dashboard/scheduledtasks/scheduledtask.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/scheduledtasks/scheduledtask'
    });

    defineRoute({
        alias: '/scheduledtasks.html',
        path: 'dashboard/scheduledtasks/scheduledtasks.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/scheduledtasks/scheduledtasks'
    });

    defineRoute({
        alias: '/serveractivity.html',
        path: 'dashboard/serveractivity.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/serveractivity'
    });

    defineRoute({
        alias: '/apikeys.html',
        path: 'dashboard/apikeys.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/apikeys'
    });

    defineRoute({
        alias: '/streamingsettings.html',
        path: 'dashboard/streaming.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/streaming'
    });

    defineRoute({
        alias: '/tv.html',
        path: 'shows/tvrecommended.html',
        autoFocus: false,
        controller: 'shows/tvrecommended'
    });

    defineRoute({
        alias: '/useredit.html',
        path: 'dashboard/users/useredit.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/useredit'
    });

    defineRoute({
        alias: '/userlibraryaccess.html',
        path: 'dashboard/users/userlibraryaccess.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userlibraryaccess'
    });

    defineRoute({
        alias: '/usernew.html',
        path: 'dashboard/users/usernew.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/usernew'
    });

    defineRoute({
        alias: '/userparentalcontrol.html',
        path: 'dashboard/users/userparentalcontrol.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userparentalcontrol'
    });

    defineRoute({
        alias: '/userpassword.html',
        path: 'dashboard/users/userpassword.html',
        autoFocus: false,
        controller: 'dashboard/users/userpasswordpage'
    });

    defineRoute({
        alias: '/userprofiles.html',
        path: 'dashboard/users/userprofiles.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/users/userprofilespage'
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
        alias: '/video',
        path: 'playback/video/index.html',
        controller: 'playback/video/index',
        autoFocus: false,
        type: 'video-osd',
        supportsThemeMedia: true,
        fullscreen: true,
        enableMediaControl: false
    });

    defineRoute({
        alias: '/queue',
        path: 'playback/queue/index.html',
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
        roles: 'admin',
        serverRequest: true
    });

    defineRoute({
        path: '',
        isDefaultRoute: true,
        autoFocus: false
    });

    defineRoute({
        path: 'index.html',
        autoFocus: false,
        isDefaultRoute: true
    });

    console.groupEnd('defining core routes');

/* eslint-enable indent */
