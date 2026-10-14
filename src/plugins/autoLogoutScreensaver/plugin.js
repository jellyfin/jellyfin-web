import { PluginType } from 'constants/pluginType';
import Dashboard from 'utils/dashboard';
import globalize from 'lib/globalize';
import { playbackManager } from 'components/playback/playbackmanager';

class AutoLogoutScreensaver {
	constructor() {
		this.name = 'AutoLogoutScreensaver';
		this.version = '1.0';
		this.type = PluginType.Screensaver;
		this.id = 'autologoutscreensaver';
		this.description = '';
		this.supportsAnonymous = false;
		this.hideOnClick = true;
		this.hideOnMouse = true;
		this.hideOnKey = true;
		this._msg_ = "";
		this._msg_counter_ = "";
		this._counter_ = "";
		this.interval = null;
	}

    fadeOut(elem, iterations) {
        const keyframes = [
            { opacity: '1', offset: 0 },
            { opacity: '0', offset: 1 }];
        const timing = { duration: 900, iterations: iterations };
        return elem.animate(keyframes, timing);
    }
	
    stopInterval() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }
	
	countdown() {
		this._msg_counter_.innerHTML = this._counter_;
		if (!this._counter_) {	
			this.stopInterval();
			Dashboard.logout();
			
			setTimeout(() => {	
				const elem = document.querySelector('.autoLogoutScreenSaver');
				if (elem)
					elem.remove();
				document.body.classList.remove('screensaver-noScroll');
			}, 1000);
		} else {
			this.fadeOut(this._msg_counter_, 1);
			this._counter_ --;
		}
	}

    show() {	
		// Stop any instance that could be running.
		this.stopInterval();
		
		this._counter_ = 3;
		
		import('./style.scss').then(() => {
			let elem = document.querySelector('.autoLogoutScreenSaver');
            if (!elem) {
                elem = document.createElement('div');
                elem.classList.add('autoLogoutScreenSaver');
                document.body.appendChild(elem);
            }
			
			// Retrieve some palette related properties of the theme in use.
			const ref = document.getElementsByClassName("backgroundContainer")[0];
			const computedStyles = window.getComputedStyle(ref);
			const fgcolor = computedStyles.getPropertyValue('--jf-palette-text-primary');
			const bgcolor = computedStyles.getPropertyValue('--jf-palette-background-default');
			// and apply them 
			elem.style.backgroundColor = bgcolor;
			elem.style.color = fgcolor;
			
			let elem2 = document.createElement('div');
			elem2.classList.add('autoLogoutText');
			elem.appendChild(elem2);
			elem2.innerHTML = '<span id="autoLogoutMesg" class="autoLogoutMesg"></span>';
			elem2.innerHTML += '<br><span id="autoLogoutCounter" class="autoLogoutCounter"></span>';
			
			this._msg_ = document.getElementById("autoLogoutMesg");
			this._msg_counter_ = document.getElementById("autoLogoutCounter");
			
			this._msg_.innerHTML = globalize.translate('SigningOut');
			
			this.countdown();
			this.interval = setInterval(this.countdown.bind(this), 1000);
        });
    };
	
    hide() {
        this.stopInterval();
		const elem = document.querySelector('.autoLogoutScreenSaver');
		if (elem) {
            return new Promise((resolve) => {
				elem.remove();
				resolve();
            });
        }
        return Promise.resolve();
    };
}

export default AutoLogoutScreensaver;
