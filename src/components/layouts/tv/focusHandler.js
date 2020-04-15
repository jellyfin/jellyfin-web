import connectionManager from "connectionManager";
import itemHelper from "itemHelper";
import imagehelper from "components/layouts/tv/imagehelper";
import backdrop from "backdrop";
import mediaInfo from "mediaInfo";
import focusManager from "focusManager";
import scrollHelper from "scrollHelper";
import browser from "browser";

export class focusHandler {
    constructor(options) {
        const parent = options.parent;
        let focusedElement;
        let zoomElement;
        let currentAnimation;
        const isHorizontal = options.scroller ? options.scroller.options.horizontal : options.horizontal;
        const zoomScale = options.zoomScale || (isHorizontal ? "1.16" : "1.12");
        const zoomInEase = "ease-out";
        const zoomOutEase = "ease-in";
        const zoomDuration = 160;
        let lastFocus = 0;
        parent.addEventListener("focus", onFocusIn, true);
        parent.addEventListener("blur", onFocusOut, true);
        const selectedItemInfoInner = options.selectedItemInfoInner;
        const selectedIndexElement = options.selectedIndexElement;
        let selectedItemPanel;
        const enableSelectedItemPanel = options.selectedItemMode == "panel";
        const enableAnimations = (() => {
            if (browser.animate && !browser.slow) {
                return true;
            }
            return false;
        })();
        function onFocusIn(e) {
            const focused = focusManager.focusableParent(e.target);
            focusedElement = focused;
            if (focused) {
                if (selectedIndexElement) {
                    const index = focused.getAttribute("data-index");
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
        function onFocusOut(e) {
            clearSelectedItemInfo();
            focusedElement = null;
            const zoomed = zoomElement;
            zoomElement = null;
            if (zoomed) {
                zoomOut(zoomed);
            }
            if (currentAnimation) {
                currentAnimation.cancel();
                currentAnimation = null;
            }
        }
        let zoomTimeout;
        let selectedMediaInfoTimeout;
        function startZoomTimer() {
            if (zoomTimeout) {
                clearTimeout(zoomTimeout);
            }
            zoomTimeout = setTimeout(onZoomTimeout, 50);
            if (selectedMediaInfoTimeout) {
                clearTimeout(selectedMediaInfoTimeout);
            }
            selectedMediaInfoTimeout = setTimeout(onSelectedMediaInfoTimeout, 160);
        }
        function onZoomTimeout() {
            const focused = focusedElement;
            if (focused && document.activeElement == focused) {
                zoomIn(focused);
            }
        }
        function onSelectedMediaInfoTimeout() {
            const focused = focusedElement;
            if (focused && document.activeElement == focused) {
                setSelectedItemInfo(focused);
            }
        }
        function zoomIn(elem) {
            if (!enableAnimations) {
                return;
            }
            if (elem.classList.contains("noScale")) {
                return;
            }
            const card = elem;
            if (document.activeElement != card) {
                return;
            }
            const cardBox = card.querySelector(".cardBox");
            if (!cardBox) {
                return;
            }
            elem = cardBox;
            const keyframes = [{
                transform: "scale(1)  ",
                offset: 0
            }, {
                transform: "scale(" + zoomScale + ")",
                offset: 1
            }];
            const onAnimationFinished = () => {
                zoomElement = elem;
                currentAnimation = null;
            };
            if (elem.animate) {
                const timing = {
                    duration: zoomDuration,
                    iterations: 1,
                    fill: "both",
                    easing: zoomInEase
                };
                const animation = elem.animate(keyframes, timing);
                animation.onfinish = onAnimationFinished;
                currentAnimation = animation;
            } else {
                onAnimationFinished();
            }
        }
        function setSelectedItemInfo(card) {
            const id = card.getAttribute("data-id");
            if (!id) {
                return;
            }
            if (options.enableBackdrops !== false || selectedItemInfoInner) {
                const serverId = card.getAttribute("data-serverid");
                const apiClient = connectionManager.getApiClient(serverId);
                apiClient.getItem(apiClient.getCurrentUserId(), id).then(item => {
                    if (options.enableBackdrops) {
                        backdrop.setBackdrops([item]);
                    }
                    setSelectedInfo(card, item);
                });
            }
        }
        function setSelectedInfo(card, item) {
            if (enableSelectedItemPanel) {
                const div = document.createElement("div");
                div.classList.add("selectedItemPanel");
                document.body.appendChild(div);
                selectedItemPanel = div;
                slideInLeft(div);
                return;
            }
            if (!selectedItemInfoInner) {
                return;
            }
            let html = "";
            const mediaInfoHtml = mediaInfo.getMediaInfoHtml(item);
            html += "<div>";
            html += "<div>";
            if (item.AlbumArtist) {
                html += item.AlbumArtist + " - ";
            }
            html += itemHelper.getDisplayName(item);
            html += "</div>";
            if (mediaInfoHtml) {
                html += "<div class=\"selectedItemMediaInfo\">";
                html += mediaInfoHtml;
                html += "</div>";
            }
            html += "</div>";
            const logoImageUrl = imagehelper.getlogoImageUrl(item, {});
            if (logoImageUrl) {
                selectedItemInfoInner.classList.add("selectedItemInfoInnerWithLogo");
                html += `<div class="selectedItemInfoLogo" style="background-image:url('${logoImageUrl}');"></div>`;
            } else {
                selectedItemInfoInner.classList.remove("selectedItemInfoInnerWithLogo");
            }
            selectedItemInfoInner.innerHTML = html;
            if (html && enableAnimations) {
                fadeIn(selectedItemInfoInner, 1);
            }
        }
        function clearSelectedItemInfo() {
            if (enableSelectedItemPanel) {
                const panel = selectedItemPanel;
                if (panel) {
                    selectedItemPanel = null;
                    slideOutRightAndRemove(panel);
                }
            } else if (selectedItemInfoInner) {
                selectedItemInfoInner.innerHTML = "";
            }
        }
        function slideInLeft(elem) {
            const keyframes = [{
                transform: "translate3d(100%, 0, 0)",
                offset: 0
            }, {
                transform: "translate3d(0, 0, 0)",
                offset: 1
            }];
            const timing = {
                duration: 200,
                iterations: 1,
                fill: "forwards",
                easing: "ease-out"
            };
            elem.animate(keyframes, timing);
        }
        function slideOutRightAndRemove(elem) {
            const keyframes = [{
                transform: "translate3d(0, 0, 0)",
                offset: 0
            }, {
                transform: "translate3d(100%, 0, 0)",
                offset: 1
            }];
            const timing = {
                duration: 100,
                iterations: 1,
                fill: "forwards",
                easing: "ease-out"
            };
            elem.animate(keyframes, timing).onfinish = () => {
                elem.parentNode.removeChild(elem);
            };
        }
        function zoomOut(elem) {
            const keyframes = [{
                transform: "scale(" + zoomScale + ")  ",
                offset: 0
            }, {
                transform: "scale(1)",
                offset: 1
            }];
            if (elem.animate) {
                const timing = {
                    duration: zoomDuration,
                    iterations: 1,
                    fill: "both",
                    easing: zoomOutEase
                };
                elem.animate(keyframes, timing);
            }
        }
        function fadeIn(elem, iterations) {
            const keyframes = [{
                opacity: "0",
                offset: 0
            }, {
                opacity: "1",
                offset: 1
            }];
            const timing = {
                duration: 300,
                iterations: iterations
            };
            return elem.animate(keyframes, timing);
        }
        this.destroy = () => {
            parent.removeEventListener("focus", onFocusIn, true);
            parent.removeEventListener("blur", onFocusOut, true);
        };
    }
}
export default focusHandler;
