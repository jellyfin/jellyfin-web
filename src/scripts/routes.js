define([
    "emby-button",
    "emby-input",
    "scripts/livetvcomponents",
    "paper-icon-button-light",
    "emby-itemscontainer",
    "emby-collapse",
    "emby-select",
    "livetvcss",
    "emby-checkbox",
    "emby-slider",
    "listViewStyle",
    "dashboardcss"], function () {

    function defineRoute(newRoute) {
        var path = newRoute.path;
        console.log("Defining route: " + path);
        newRoute.dictionary = "core";
        Emby.Page.addRoute(path, newRoute);
    }

    console.log("Defining core routes");

    defineRoute({
        path: "/addplugin.html",
        autoFocus: false,
        roles: "admin",
        controller: "addpluginpage"
    });
    defineRoute({
        path: "/autoorganizelog.html",
        roles: "admin"
    });
    defineRoute({
        path: "/channelsettings.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/addserver.html",
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: "addserver"
    });
    defineRoute({
        path: "/dashboard.html",
        autoFocus: false,
        roles: "admin",
        controller: "dashboardpage"
    });
    defineRoute({
        path: "/dashboardgeneral.html",
        controller: "dashboardgeneral",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/dashboardhosting.html",
        autoFocus: false,
        roles: "admin",
        controller: "dashboardhosting"
    });
    defineRoute({
        path: "/devices/devices.html",
        autoFocus: false,
        roles: "admin",
        controller: "devices"
    });
    defineRoute({
        path: "/devices/device.html",
        autoFocus: false,
        roles: "admin",
        controller: "device"
    });
    defineRoute({
        path: "/dlnaprofile.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/dlnaprofiles.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/dlnasettings.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/edititemmetadata.html",
        controller: "edititemmetadata",
        autoFocus: false
    });
    defineRoute({
        path: "/encodingsettings.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/forgotpassword.html",
        anonymous: true,
        startup: true,
        controller: "forgotpassword"
    });
    defineRoute({
        path: "/forgotpasswordpin.html",
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: "forgotpasswordpin"
    });
    defineRoute({
        path: "/home.html",
        autoFocus: false,
        controller: "home",
        transition: "fade",
        type: "home"
    });
    defineRoute({
        path: "/list/list.html",
        autoFocus: false,
        controller: "list",
        transition: "fade"
    });
    defineRoute({
        path: "/index.html",
        autoFocus: false,
        isDefaultRoute: true
    });
    defineRoute({
        path: "/itemdetails.html",
        controller: "itemdetailpage",
        autoFocus: false,
        transition: "fade"
    });
    defineRoute({
        path: "/library.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/librarydisplay.html",
        autoFocus: false,
        roles: "admin",
        controller: "librarydisplay"
    });
    defineRoute({
        path: "/librarysettings.html",
        autoFocus: false,
        roles: "admin",
        controller: "librarysettings"
    });
    defineRoute({
        path: "/livetv.html",
        controller: "livetvsuggested",
        autoFocus: false,
        transition: "fade"
    });
    defineRoute({
        path: "/livetvguideprovider.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/livetvsettings.html",
        autoFocus: false
    });
    defineRoute({
        path: "/livetvstatus.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/livetvtuner.html",
        autoFocus: false,
        roles: "admin",
        controller: "livetvtuner"
    });
    defineRoute({
        path: "/log.html",
        roles: "admin",
        controller: "logpage"
    });
    defineRoute({
        path: "/login.html",
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: "loginpage"
    });
    defineRoute({
        path: "/metadataadvanced.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/metadataimages.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/metadatanfo.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/movies.html",
        autoFocus: false,
        controller: "moviesrecommended",
        transition: "fade"
    });
    defineRoute({
        path: "/music.html",
        controller: "musicrecommended",
        autoFocus: false,
        transition: "fade"
    });
    defineRoute({
        path: "/mypreferencesdisplay.html",
        autoFocus: false,
        transition: "fade",
        controller: "mypreferencesdisplay"
    });
    defineRoute({
        path: "/mypreferenceshome.html",
        autoFocus: false,
        transition: "fade",
        controller: "mypreferenceshome"
    });
    defineRoute({
        path: "/mypreferencessubtitles.html",
        autoFocus: false,
        transition: "fade",
        controller: "mypreferencessubtitles"
    });
    defineRoute({
        path: "/mypreferenceslanguages.html",
        autoFocus: false,
        transition: "fade",
        controller: "mypreferenceslanguages"
    });
    defineRoute({
        path: "/mypreferencesmenu.html",
        autoFocus: false,
        transition: "fade",
        controller: "mypreferencescommon"
    });
    defineRoute({
        path: "/myprofile.html",
        autoFocus: false,
        transition: "fade",
        controller: "myprofile"
    });
    defineRoute({
        path: "/notificationsetting.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/notificationsettings.html",
        controller: "notificationsettings",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/nowplaying.html",
        controller: "nowplayingpage",
        autoFocus: false,
        transition: "fade",
        fullscreen: true,
        supportsThemeMedia: true,
        enableMediaControl: false
    });
    defineRoute({
        path: "/playbackconfiguration.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/availableplugins.html",
        autoFocus: false,
        roles: "admin",
        controller: "availableplugins"
    });
    defineRoute({
        path: "/installedplugins.html",
        autoFocus: false,
        roles: "admin",
        controller: "installedplugins"
    });
    defineRoute({
        path: "/scheduledtask.html",
        autoFocus: false,
        roles: "admin",
        controller: "scheduledtaskpage"
    });
    defineRoute({
        path: "/scheduledtasks.html",
        autoFocus: false,
        roles: "admin",
        controller: "scheduledtaskspage"
    });
    defineRoute({
        path: "/search.html",
        controller: "searchpage"
    });
    defineRoute({
        path: "/selectserver.html",
        autoFocus: false,
        anonymous: true,
        startup: true,
        controller: "selectserver"
    });
    defineRoute({
        path: "/serveractivity.html",
        autoFocus: false,
        roles: "admin",
        controller: "serveractivity"
    });
    defineRoute({
        path: "/serversecurity.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/streamingsettings.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/support.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/tv.html",
        autoFocus: false,
        controller: "tvrecommended",
        transition: "fade"
    });
    defineRoute({
        path: "/useredit.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/userlibraryaccess.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/usernew.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/userparentalcontrol.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/userpassword.html",
        autoFocus: false,
        controller: "userpasswordpage"
    });
    defineRoute({
        path: "/userprofiles.html",
        autoFocus: false,
        roles: "admin"
    });
    defineRoute({
        path: "/wizardremoteaccess.html",
        autoFocus: false,
        anonymous: true,
        controller: "wizardremoteaccess"
    });
    defineRoute({
        path: "/wizardfinish.html",
        autoFocus: false,
        anonymous: true,
        controller: "wizardfinishpage"
    });
    defineRoute({
        path: "/wizardlibrary.html",
        autoFocus: false,
        anonymous: true
    });
    defineRoute({
        path: "/wizardsettings.html",
        autoFocus: false,
        anonymous: true,
        controller: "wizardsettings"
    });
    defineRoute({
        path: "/wizardstart.html",
        autoFocus: false,
        anonymous: true,
        controller: "wizardstart"
    });
    defineRoute({
        path: "/wizarduser.html",
        controller: "wizarduserpage",
        autoFocus: false,
        anonymous: true
    });
    defineRoute({
        path: "/videoosd.html",
        transition: "fade",
        controller: "videoosd",
        autoFocus: false,
        type: "video-osd",
        supportsThemeMedia: true,
        fullscreen: true,
        enableMediaControl: false
    });
    defineRoute({
        path: "/configurationpage",
        autoFocus: false,
        enableCache: false,
        enableContentQueryString: true,
        roles: "admin"
    });
    defineRoute({
        path: "/",
        isDefaultRoute: true,
        autoFocus: false,
    });
});
