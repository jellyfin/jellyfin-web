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

function download(file) {
    const a = document.createElement('a');
    a.download = typeof file === 'string' ? '' : file.filename;
    a.href = typeof file === 'string' ? file : file.url;
    if ((a.protocol === 'http:' || a.protocol === 'https:') && a.origin !== document.location.origin) {
        // Cross-origin links navigate instead of honoring the download attribute.
        // Each request needs its own frame so later downloads cannot cancel it.
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = a.href;
        frame.onload = function () {
            frame.parentNode?.removeChild(frame);
        };
        document.documentElement.appendChild(frame);
        return;
    }
    a.click();
}

export default function (urls) {
    if (!urls) {
        throw new Error('`urls` required');
    }

    if (typeof document.createElement('a').download === 'undefined' || browser.iOS) {
        return fallback(urls.map(file => typeof file === 'string' ? file : file.url));
    }

    let delay = 0;

    return Promise.all(urls.map(function (url) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                download(url);
                resolve();
            }, 100 * ++delay);
        });
    }));
}
