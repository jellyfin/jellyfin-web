define([
    'jQuery',
    'emby-button',
    'emby-input',
    'scripts/livetvcomponents',
    'paper-icon-button-light',
    'emby-itemscontainer',
    'emby-collapse',
    'emby-select',
    'livetvcss',
    'emby-checkbox',
    'emby-slider',
    'listViewStyle',
    'dashboardcss',
    'detailtablecss'], function () {

    function defineRoute(newRoute) {
        var path = newRoute.alias ? newRoute.alias : newRoute.path;
        console.debug('defining route: ' + path);
        newRoute.dictionary = 'core';
        Emby.Page.addRoute(path, newRoute);
    }

    console.debug('defining core routes');

    defineRoute({
        path: '/addserver.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'auth/addserver'
    });
    defineRoute({
        path: '/selectserver.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'auth/selectserver',
        type: 'selectserver'
    });
    defineRoute({
        path: '/login.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'auth/login',
        type: 'login'
    });
    defineRoute({
        path: '/forgotpassword.html',
        anonymous: true,
        startup: true,
        controller: 'auth/forgotpassword'
    });
    defineRoute({
        path: '/forgotpasswordpin.html',
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: 'auth/forgotpasswordpin'
    });

    defineRoute({
        path: '/mypreferencesmenu.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/menu'
    });
    defineRoute({
        path: '/myprofile.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/profile'
    });
    defineRoute({
        path: '/mypreferencesdisplay.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/display'
    });
    defineRoute({
        path: '/mypreferenceshome.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/home'
    });
    defineRoute({
        path: '/mypreferencesplayback.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/playback'
    });
    defineRoute({
        path: '/mypreferencessubtitles.html',
        autoFocus: false,
        transition: 'fade',
        controller: 'user/subtitles'
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
        path: '/addplugin.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/add'
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
        path: '/notificationsetting.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/notifications/notification'
    });
    defineRoute({
        path: '/notificationsettings.html',
        controller: 'dashboard/notifications/notifications',
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
        path: '/availableplugins.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/available'
    });
    defineRoute({
        path: '/repositories.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/repositories'
    });

    defineRoute({
        path: '/home.html',
        autoFocus: false,
        controller: 'home',
        transition: 'fade',
        type: 'home'
    });
    defineRoute({
        path: '/search.html',
        controller: 'searchpage'
    });
    defineRoute({
        path: '/list.html',
        autoFocus: false,
        controller: 'list',
        transition: 'fade'
    });
    defineRoute({
        alias: '/details',
        path: '/controllers/itemDetails/index.html',
        controller: 'itemDetails/index',
        autoFocus: false,
        transition: 'fade'
    });
    defineRoute({
        path: '/livetv.html',
        controller: 'livetv/livetvsuggested',
        autoFocus: false,
        transition: 'fade'
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
        controller: 'movies/moviesrecommended',
        transition: 'fade'
    });
    defineRoute({
        path: '/music.html',
        controller: 'music/musicrecommended',
        autoFocus: false,
        transition: 'fade'
    });
    defineRoute({
        path: '/installedplugins.html',
        autoFocus: false,
        roles: 'admin',
        controller: 'dashboard/plugins/installed'
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
        controller: 'shows/tvrecommended',
        transition: 'fade'
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
        path: '/wizardremoteaccess.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/remoteaccess'
    });
    defineRoute({
        path: '/wizardfinish.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/finish'
    });
    defineRoute({
        path: '/wizardlibrary.html',
        autoFocus: false,
        anonymous: true,
        controller: 'dashboard/mediaLibrary'
    });
    defineRoute({
        path: '/wizardsettings.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/settings'
    });
    defineRoute({
        path: '/wizardstart.html',
        autoFocus: false,
        anonymous: true,
        controller: 'wizard/start'
    });
    defineRoute({
        path: '/wizarduser.html',
        controller: 'wizard/user',
        autoFocus: false,
        anonymous: true
    });

    defineRoute({
        path: '/videoosd.html',
        transition: 'fade',
        controller: 'playback/videoosd',
        autoFocus: false,
        type: 'video-osd',
        supportsThemeMedia: true,
        fullscreen: true,
        enableMediaControl: false
    });
    defineRoute({
        path: '/nowplaying.html',
        controller: 'playback/nowplaying',
        autoFocus: false,
        transition: 'fade',
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
});
