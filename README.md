Merge all branches with the most uptodate Jellyfin-web client.<br/>
Releases 'PatchBundle' are produced from this branch.

### Installation

Note that as a prerequisite, you need nodejs and npm to be installed in your system.<br/>
On ubuntu systems, you can use a command like #sudo apt install nodejs.<br/>

Clone this repository<br/>
#cd into its main directory<br/>
#npm install<br/>
#npm run build:development (Or production)<br/>
#mv /usr/share/jellyfin/web /usr/share/jellyfin/web.orig<br/>
#cp -rf dist /usr/share/jellyfin/web<br/>
<br/>
To test, connect jellyfin with your browser as usual  (SRV IP address:8096 by default) .
Flush your browser's cache if necessary.
