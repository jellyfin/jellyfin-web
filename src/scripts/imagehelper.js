define(["browser"], function (browser) {
    "use strict";

    function getDeviceIcon(device) {
        var baseUrl = "img/devices/";
        switch (device) {
            case "Opera":
            case "Opera TV":
                return baseUrl + "opera.svg";
            case "Samsung Smart TV":
                return baseUrl + "samsung.svg";
            case "Xbox One":
                return baseUrl + "xbox.svg";
            case "Sony PS4":
                return baseUrl + "playstation.svg";
            case "Chrome":
                return baseUrl + "chrome.svg";
            case "Firefox":
                return baseUrl + "firefox.svg";
            case "Edge":
                return baseUrl + "edge.svg";
            case "Internet Explorer":
                return baseUrl + "msie.svg";
            case "Web Browser":
                return baseUrl + "html5.svg";
            default:
                return baseUrl + "other.svg";
        }
    }

    function getLibraryIcon(library) {
        switch (library) {
            case "movies":
                return "video_library";
            case "music":
                return "library_music";
            case "photos":
                return "photo_library";
            case "livetv":
                return "live_tv";
            case "tvshows":
                return "tv";
            case "trailers":
                return "local_movies";
            case "homevideos":
                return "photo_library";
            case "musicvideos":
                return "music_video";
            case "books":
                return "library_books";
            case "channels":
                return "videocam";
            case "playlists":
                return "view_list";
            default:
                return "folder";
        }
    }

    return {
        getDeviceIcon: getDeviceIcon,
        getLibraryIcon: getLibraryIcon
    };
});