/**
 * This is a modified version from https://github.com/vankasteelj/opensubtitles.com
 */
const methods = require('./methods.json');

class OpenSubtitlesApiClass {
    /**
     * Class constructor
     * @param {*} settings API Key and optional settings
     */
    constructor(settings = {}) {
        if (!settings.apikey) throw Error('requires an apikey');

        this._authentication = {};
        const userAgent = __PACKAGE_JSON_NAME__ + ' v' + __PACKAGE_JSON_VERSION__ ;
        this._settings = {
            apikey: settings.apikey,
            endpoint: settings.endpoint || 'https://api.opensubtitles.com/api/v1',
            headers: {
                'Content-Type': 'application/json',
                'Accept': '*/*',
                'User-Agent': userAgent,
                'X-User-Agent': userAgent // https://forum.opensubtitles.org/viewtopic.php?t=18251
            }
        };
        this.last_response = null;
        this._construct();
    }

    /**
     * Creates methods for all requests
     */
    _construct() {
        for (const url in methods) {
            const urlParts = url.split('/');
            const name = urlParts.pop(); // key for function

            let tmp = this;
            for (let p = 1; p < urlParts.length; ++p) { // acts like mkdir -p
                tmp = tmp[urlParts[p]] || (tmp[urlParts[p]] = {});
            }

            tmp[name] = (() => {
                const method = methods[url]; // closure forces copy
                return (params) => {
                    return this._call(method, params);
                };
            })();
        }
    }

    /**
     * Parse url before api call
     * @param {*} method REST API Method
     * @param {*} params Request parameters
     * @returns url
     */
    _parse(method, params = {}) {
        let url = this._settings.endpoint + method.url.split('?')[0];

        // ?Part
        const queryParts = [];
        const queryPart = method.url.split('?')[1];
        if (queryPart) {
            const queryParams = queryPart.split('&');
            for (const i in queryParams) {
                const name = queryParams[i].split('=')[0]; // that ; is needed
                (params[name] || params[name] === 0) && queryParts.push(`${name}=${encodeURIComponent(params[name])}`);
            }
        }

        if (queryParts.length) url += '?' + queryParts.join('&');

        return url;
    }

    /**
     * Parse methods then hit API
     * @param {*} method REST API Method
     * @param {*} params Request parameters
     * @returns Response JSON
     */
    async _call(method, params = {}) {
        const url = this._parse(method, params);
        const req = {
            method: method.method,
            headers: Object.assign({}, this._settings.headers)
        };

        // HEADERS Authorization
        if ( method.opts?.auth ) {
            if (!this._authentication.token && !params.token) throw Error('requires a bearer token, login first');
            req.headers['Authorization'] = 'Bearer ' + (this._authentication.token || params.token);
        }

        // HEADERS Api-Key
        req.headers['Api-Key'] = this._settings.apikey;

        // JSON body
        if (req.method !== 'GET') {
            req.body = (method.body ? Object.assign({}, method.body) : {});
            for (const k in params) {
                if (k in req.body) req.body[k] = params[k];
            }
            for (const k in req.body) {
                if (!req.body[k]) delete req.body[k];
            }
            req.body = JSON.stringify(req.body);
        }

        // Actual call
        try {
            this.last_response = await fetch(url, req);
            if (this.last_response.status == 200) {
                return ( this.last_response ).json();
            }
            console.error('[opensubtitles] last_response', this.last_response.status, this.last_response);
        } catch (err) {
            console.error('[opensubtitles]', err, url, req);
        }
        return {};
    }
}

export default OpenSubtitlesApiClass;
