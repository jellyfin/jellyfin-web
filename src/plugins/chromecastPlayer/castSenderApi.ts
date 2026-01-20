declare global {
    interface Window {
        chrome?: any;
        appMode?: string;
    }
}

class CastSenderApi {
    private static ccLoaded = false;

    load(): Promise<void> {
        if (window.appMode === 'cordova' || window.appMode === 'android') {
            window.chrome = window.chrome || {};
            return Promise.resolve();
        } else {
            if (CastSenderApi.ccLoaded) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                const fileref = document.createElement('script');
                fileref.setAttribute('type', 'text/javascript');

                fileref.onload = () => {
                    CastSenderApi.ccLoaded = true;
                    resolve();
                };

                fileref.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js');
                document.querySelector('head')?.appendChild(fileref);
            });
        }
    }
}

export default CastSenderApi;