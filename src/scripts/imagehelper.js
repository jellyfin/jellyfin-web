
/* eslint-disable indent */
    const deviceAppNameIconList = [
        {
            names: ['Samsung Smart TV'],
            icon: 'samsung.svg'
        },
        {
            names: ['Xbox One'],
            icon: 'xbox.svg'
        },
        {
            names: ['Sony PS4'],
            icon: 'playstation.svg'
        },
        {
            names: ['Kodi'],
            icon: 'kodi.svg'
        },
        {
            names: ['Jellyfin Android', 'Android TV'],
            icon: 'android.svg'
        }
    ]

    const deviceNameIconList = [
        {
            names: ['Opera'],
            icon: 'opera.svg'
        },
        {
            names: ['Chrome'],
            icon: 'chrome.svg'
        },
        {
            names: ['Firefox'],
            icon: 'firefox.svg'
        },
        {
            names: ['Safari'],
            icon: 'safari.svg'
        },
        {
            names: ['Edge Chromium'],
            icon: 'edgechromium.svg'
        },
        {
            names: ['Edge'],
            icon: 'edge.svg'
        },
        {
            names: ['Internet Explorer'],
            icon: 'msie.svg'
        }
    ]

    export function getDeviceIcon(device) {
        const baseUrl = 'assets/img/devices/';

        let appName = device.AppName ?? device.Client ?? undefined;
        if (!appName)
            return baseUrl + 'other.svg';

        if (appName === 'Jellyfin Web') {
            let deviceName = device.Name ?? device.DeviceName ?? undefined;
            if (!deviceName)
                return baseUrl + 'html5.svg';

            deviceName = deviceName.toLocaleLowerCase();

            const result = deviceNameIconList.find((cur) => {
                const index = cur.names.findIndex((val) => val.toLocaleLowerCase().includes(deviceName));
                return index !== -1;
            });

            return result ? baseUrl + result.icon : baseUrl + 'html5.svg';
        } else {
            appName = appName.toLocaleLowerCase();

            const result = deviceAppNameIconList.find((cur) => {
                const index = cur.names.findIndex((val) => val.toLocaleLowerCase().includes(appName));
                return index !== -1;
            });

            return result ? baseUrl + result.icon : baseUrl +'other.svg';
        }
    }

    export function getLibraryIcon(library) {
        switch (library) {
            case 'movies':
                return 'video_library';
            case 'music':
                return 'library_music';
            case 'photos':
                return 'photo_library';
            case 'livetv':
                return 'live_tv';
            case 'tvshows':
                return 'tv';
            case 'trailers':
                return 'local_movies';
            case 'homevideos':
                return 'photo_library';
            case 'musicvideos':
                return 'music_video';
            case 'books':
                return 'library_books';
            case 'channels':
                return 'videocam';
            case 'playlists':
                return 'view_list';
            default:
                return 'folder';
        }
    }

/* eslint-enable indent */

export default {
    getDeviceIcon: getDeviceIcon,
    getLibraryIcon: getLibraryIcon
};
