class CastSenderApi {
    load() {
        if (window.appMode === 'cordova' || window.appMode === 'android') {
            window.chrome = window.chrome || {};
            return Promise.resolve();
        } else {
            let ccLoaded = false;
            if (ccLoaded) {
                return Promise.resolve();
            }

            return new Promise((resolve) => {
                const fileref = document.createElement('script');
                fileref.setAttribute('type', 'text/javascript');

                fileref.onload = () => {
                    ccLoaded = true;
                    resolve();
                };

                fileref.setAttribute('src', 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js');
                document.querySelector('head').appendChild(fileref);
            });
        }
    }
}

export default CastSenderApi;
