import connectionManager from 'connectionManager';
import itemHelper from 'itemHelper';
import {getlogoImageUrl} from './imagehelper';
import backdrop from 'backdrop';
import mediaInfo from 'mediaInfo';
import focusManager from 'focusManager';
import scrollHelper from 'scrollHelper';
import browser from 'browser';

export class FocusHandler {
    constructor(options) {
        const parent = options.parent;
        let focusedElement;
        let currentAnimation;
        let lastFocus = 0;
        parent.addEventListener('focus', onFocusIn, true);
        parent.addEventListener('blur', onFocusOut, true);
        const selectedItemInfoInner = options.selectedItemInfoInner;
        const selectedIndexElement = options.selectedIndexElement;
        const enableAnimations = (() => {
            if (browser.animate && !browser.slow) {
                return true;
            }
            return false;
        })();
        function onFocusIn({target}) {
            const focused = focusManager.focusableParent(target);
            focusedElement = focused;
            if (focused) {
                if (selectedIndexElement) {
                    const index = focused.getAttribute('data-index');
                    if (index) {
                        selectedIndexElement.innerHTML = 1 + parseInt(index);
                    }
                }
                if (options.scroller) {
                    const now = new Date().getTime();
                    const animate = now - lastFocus > 50;
                    options.scroller.toCenter(focused, !animate);
                    lastFocus = now;
                } else if (options.scrollElement) {
                    scrollHelper.toCenter(options.scrollElement, focused, options.horizontal);
                }
                startZoomTimer();
            }
        }
        function onFocusOut() {
            clearSelectedItemInfo();
            focusedElement = null;
            if (currentAnimation) {
                currentAnimation.cancel();
                currentAnimation = null;
            }
        }
        let selectedMediaInfoTimeout;
        function startZoomTimer() {
            if (selectedMediaInfoTimeout) {
                clearTimeout(selectedMediaInfoTimeout);
            }
            selectedMediaInfoTimeout = setTimeout(onSelectedMediaInfoTimeout, 150);
        }
        function onSelectedMediaInfoTimeout() {
            const focused = focusedElement;
            if (focused && document.activeElement == focused) {
                setSelectedItemInfo(focused);
            }
        }
        function setSelectedItemInfo(card) {
            const id = card.getAttribute('data-id');
            if (!id) {
                return;
            }
            if (options.enableBackdrops !== false || selectedItemInfoInner) {
                const serverId = card.getAttribute('data-serverid');
                const apiClient = connectionManager.getApiClient(serverId);
                apiClient.getItem(apiClient.getCurrentUserId(), id).then(item => {
                    if (options.enableBackdrops) {
                        backdrop.setBackdrops([item]);
                    }
                    setSelectedInfo(item);
                });
            }
        }
        function setSelectedInfo(item) {
            if (!selectedItemInfoInner) {
                return;
            }
            let html = '';
            const logoImageUrl = getlogoImageUrl(item, {});
            if (logoImageUrl) {
                html += `<div class="selectedItemInfoLogo" style="background-image:url('${logoImageUrl}');"></div>`;
            }
            html += '<div class="selectedItemNameInfo">';
            if (item.AlbumArtist) {
                html += `${item.AlbumArtist} - `;
            }
            html += itemHelper.getDisplayName(item);
            html += '</div>';
            const mediaInfoHtml = mediaInfo.getMediaInfoHtml(item);
            if (mediaInfoHtml) {
                html += '<div class="selectedItemMediaInfo">';
                html += mediaInfoHtml;
                html += '</div>';
            }
            selectedItemInfoInner.innerHTML = html;
            if (html && enableAnimations) {
                fadeIn(selectedItemInfoInner, 1);
            }
        }
        function clearSelectedItemInfo() {
            if (selectedItemInfoInner) {
                selectedItemInfoInner.innerHTML = '';
            }
        }
        function fadeIn(elem, iterations) {
            const keyframes = [{
                opacity: '0',
                offset: 0
            }, {
                opacity: '1',
                offset: 1
            }];
            const timing = {
                duration: 300,
                iterations
            };
            return elem.animate(keyframes, timing);
        }
        this.destroy = () => {
            parent.removeEventListener('focus', onFocusIn, true);
            parent.removeEventListener('blur', onFocusOut, true);
        };
    }
}
export default FocusHandler;
