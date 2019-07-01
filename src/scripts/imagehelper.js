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

    return {
        getDeviceIcon: getDeviceIcon,
    };
});