import browser from '../scripts/browser';

function fallback(urls) {
    let i = 0;

    (function createIframe() {
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = urls[i++];
        document.documentElement.appendChild(frame);

        // the download init has to be sequential otherwise IE only use the first
        const interval = setInterval(function () {
            if (frame.contentWindow.document.readyState === 'complete' || frame.contentWindow.document.readyState === 'interactive') {
                clearInterval(interval);

                // Safari needs a timeout
                setTimeout(function () {
                    frame.parentNode.removeChild(frame);
                }, 1000);

                if (i < urls.length) {
                    createIframe();
                }
            }
        }, 100);
    })();
}

function sameDomain(url) {
    const a = document.createElement('a');
    a.href = url;

    return window.location.hostname === a.hostname && window.location.protocol === a.protocol;
}

function download(url) {
    const a = document.createElement('a');
    a.download = '';
    a.href = url;
    // firefox doesn't support `a.click()`...
    a.dispatchEvent(new MouseEvent('click'));
}

export default function (urls) {
    if (!urls) {
        throw new Error('`urls` required');
    }

    if (typeof document.createElement('a').download === 'undefined') {
        return fallback(urls);
    }

    let delay = 0;

    urls.forEach(function (url) {
        // the download init has to be sequential for firefox if the urls are not on the same domain
        if (browser.firefox && !sameDomain(url)) {
            setTimeout(download.bind(null, url), 100 * ++delay);
            return;
        }

        download(url);
    });
}
