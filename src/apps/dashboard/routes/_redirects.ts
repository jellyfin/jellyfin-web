import type { Redirect } from 'components/router/Redirect';

export const REDIRECTS: Redirect[] = [
    // FIXME: URL params are not included in redirects
    { from: 'addplugin.html', to: '/dashboard/plugins/add' },
    { from: 'apikeys.html', to: '/dashboard/keys' },
    { from: 'availableplugins.html', to: '/dashboard/plugins/catalog' },
    { from: 'dashboard.html', to: '/dashboard' },
    { from: 'dashboardgeneral.html', to: '/dashboard/settings' },
    // FIXME: URL params are not included in redirects
    { from: 'device.html', to: '/dashboard/devices/edit' },
    { from: 'devices.html', to: '/dashboard/devices' },
    // FIXME: URL params are not included in redirects
    { from: 'dlnaprofile.html', to: '/dashboard/dlna/profiles/edit' },
    { from: 'dlnaprofiles.html', to: '/dashboard/dlna/profiles' },
    { from: 'dlnasettings.html', to: '/dashboard/dlna' },
    { from: 'edititemmetadata.html', to: '/metadata' },
    { from: 'encodingsettings.html', to: '/dashboard/playback/transcoding' },
    { from: 'installedplugins.html', to: '/dashboard/plugins' },
    { from: 'library.html', to: '/dashboard/libraries' },
    { from: 'librarydisplay.html', to: '/dashboard/libraries/display' },
    // FIXME: URL params are not included in redirects
    { from: 'livetvguideprovider.html', to: '/dashboard/livetv/guide' },
    { from: 'livetvsettings.html', to: '/dashboard/recordings' },
    { from: 'livetvstatus.html', to: '/dashboard/livetv' },
    // FIXME: URL params are not included in redirects
    { from: 'livetvtuner.html', to: '/dashboard/livetv/tuner' },
    { from: 'log.html', to: '/dashboard/logs' },
    { from: 'metadataimages.html', to: '/dashboard/libraries/metadata' },
    { from: 'metadatanfo.html', to: '/dashboard/libraries/nfo' },
    { from: 'networking.html', to: '/dashboard/networking' },
    { from: 'notificationsettings.html', to: '/dashboard/notifications' },
    { from: 'playbackconfiguration.html', to: '/dashboard/playback/resume' },
    { from: 'quickConnect.html', to: '/dashboard/quickconnect' },
    { from: 'repositories.html', to: '/dashboard/plugins/repositories' },
    // FIXME: URL params are not included in redirects
    { from: 'scheduledtask.html', to: '/dashboard/tasks/edit' },
    { from: 'scheduledtasks.html', to: '/dashboard/tasks' },
    { from: 'serveractivity.html', to: '/dashboard/activity' },
    { from: 'streamingsettings.html', to: '/dashboard/playback/streaming' },
    { from: 'usernew.html', to: '/dashboard/users/add' },
    { from: 'userprofiles.html', to: '/dashboard/users' },
    // FIXME: URL params are not included in redirects
    { from: 'useredit.html', to: '/dashboard/users/profile' },
    // FIXME: URL params are not included in redirects
    { from: 'userlibraryaccess.html', to: '/dashboard/users/access' },
    // FIXME: URL params are not included in redirects
    { from: 'userparentalcontrol.html', to: '/dashboard/users/parentalcontrol' },
    // FIXME: URL params are not included in redirects
    { from: 'userpassword.html', to: '/dashboard/users/password' }
];
