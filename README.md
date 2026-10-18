Merge all branches with the most uptodate Jellyfin-web client.<br/>
Releases 'PatchBundle' are produced from this branch.

## Installation

Note that as a prerequisite, you need nodejs and npm to be installed in your system.<br/>
On ubuntu systems, you can use a command like #sudo apt install nodejs.<br/>

Clone this repository<br/>
#cd into its main directory<br/>
#npm install<br/>
#npm run build:development (Or production)<br/>
#mv /usr/share/jellyfin/web /usr/share/jellyfin/web.orig<br/>
#cp -rf dist /usr/share/jellyfin/web<br/>
<br/>
To test, connect jellyfin with your browser as usual  (SRV IP address:8096 by default).</br>
Flush your browser's cache if necessary.</br>
</br>

## Patch Bundle details

### RelocateAccessSchedule
Relocate the "Access Schedule" settings into the access tab.</br>

### AutoLogoutScreenSaver
Add a screen saver to automatically sign users out to keep their account safe.</br>

### FixLogoScreenSaver
Fix screensaver 'Logo' appearing behind the top toolbar and the footer frames.</br>
Fix screensaver 'Logo' incorrectly centered.</br>

### ImproveScreenManager
Fix mousewheel and middle/right click events not handled by the screensaver manager.</br>
Fix keypress events not resetting the screensaver manager internal timer.</br>
Fix event propagating to the UI when leaving a screensaver.</br>

### ImproveDisplayModeTV
Remove margins of section Libraries which caused the screen to scroll horizontally when navigating using arrow keys.</br>

### ThemeHalloween
Intoduce a new Halloween based theme.</br>

