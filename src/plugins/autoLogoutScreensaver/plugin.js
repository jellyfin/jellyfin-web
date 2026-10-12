import { PluginType } from 'constants/pluginType';
import Dashboard from 'utils/dashboard';
import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';

export default function () {
    const self = this;

    self.name = 'AutoLogoutScreensaver';
    self.type = PluginType.Screensaver;
    self.id = 'autologoutscreensaver';
	self.supportsAnonymous = false;
	self.hideOnClick = true;
	self.hideOnMouse = true;
	self.hideOnKey = true;
	self._msg_;
	self._msg_counter_;
	self._counter_;

	let interval;

    self.stopInterval = function () {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
    }
	
	self.countdown = function () {
		self._counter_ --;
		switch(self._counter_) {	
			case 0:
				self.stopInterval();
				const elem = document.querySelector('.autoLogoutScreenSaver');
				self._msg_.innerHTML = '';
				self._msg_counter_.innerHTML = '';
				Dashboard.logout();
				setTimeout(() => {
					if (elem)
						elem.parentNode.removeChild(elem);
					document.body.classList.remove('screensaver-noScroll');
				}, 1000);
				break;
				
			default:
				self._msg_counter_.innerHTML = self._counter_;
		}
	}

    self.show = function () {
		// Stop any instance that could be running.
		self.stopInterval();
		
		const isPlaying = playbackManager.isPlayingVideo() || playbackManager.isPlayingAudio();
		if (isPlaying)
			return Promise.resolve();
		
		self._counter_ = 4;
		
		import('./style.scss').then(() => {
			let elem = document.querySelector('.autoLogoutScreenSaver');

            if (!elem) {
                elem = document.createElement('div');
                elem.classList.add('autoLogoutScreenSaver');
                document.body.appendChild(elem);
            }
			
			let elem2 = document.createElement('div');
			elem2.classList.add('autoLogoutText');
			elem.appendChild(elem2);
			elem2.innerHTML = '<span id="autoLogoutMesg" class="autoLogoutMesg"></span>';
			
			self._msg_ = document.getElementById("autoLogoutMesg");
			self._msg_.innerHTML = globalize.translate('SigningOut');
			
			elem2.innerHTML += '<br><span id="autoLogoutCounter" class="autoLogoutCounter"></span>';
			self._msg_counter_ = document.getElementById("autoLogoutCounter");
			self.countdown();
			interval = setInterval(self.countdown, 1000);
        });
    };
	
    self.hide = function () {
        self.stopInterval();
		const elem = document.querySelector('.autoLogoutScreenSaver');
		if (elem) {
            return new Promise((resolve) => {
				elem.parentNode.removeChild(elem);
				resolve();
            });
        }
        return Promise.resolve();
    };
}
