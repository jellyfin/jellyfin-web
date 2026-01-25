import browser from '../scripts/browser';

function fallback(urls: string[]) {
    let i = 0;

    const createIframe = () => {
        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.src = urls[i++];
        document.documentElement.appendChild(frame);

        const interval = setInterval(() => {
            if (
                frame.contentWindow?.document.readyState === 'complete' ||
                frame.contentWindow?.document.readyState === 'interactive'
            ) {
                clearInterval(interval);
                setTimeout(() => {
                    frame.parentNode?.removeChild(frame);
                }, 1000);

                if (i < urls.length) {
                    createIframe();
                }
            }
        }, 100);
    };

    createIframe();
}

function download(url: string) {
    const a = document.createElement('a');
    a.download = '';
    a.href = url;
    a.click();
}

export default function multiDownload(urls: string[]): void {
    if (!urls) {
        throw new Error('`urls` required');
    }

    if (typeof document.createElement('a').download === 'undefined' || browser.iOS) {
        fallback(urls);
        return;
    }

    let delay = 0;
    urls.forEach(url => {
        setTimeout(() => download(url), 100 * ++delay);
    });
}
