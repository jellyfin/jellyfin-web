import { af, arDZ, be, bg, bn, ca, cs, cy, da, de, el, enGB, enUS, eo, es, et, eu, faIR, fi, fr, frCA, gl, he, hi, hr, hu, id, is, it, ja, kk, ko, lt, lv, ms, nb,
    nl, nn, pl, ptBR, pt, ro, ru, sk, sl, sv, ta, th, tr, uk, vi, zhCN, zhTW } from 'date-fns/locale';
import globalize from './globalize';

const dateLocales = (locale) => ({
    'af': af,
    'ar': arDZ,
    'be-by': be,
    'bg-bg': bg,
    'bn': bn,
    'ca': ca,
    'cs': cs,
    'cy': cy,
    'da': da,
    'de': de,
    'el': el,
    'en-gb': enGB,
    'en-us': enUS,
    'eo': eo,
    'es': es,
    'es-ar': es,
    'es-do': es,
    'es-mx': es,
    'et': et,
    'eu': eu,
    'fa': faIR,
    'fi': fi,
    'fr': fr,
    'fr-ca': frCA,
    'gl': gl,
    'gsw': de,
    'he': he,
    'hi-in': hi,
    'hr': hr,
    'hu': hu,
    'id': id,
    'is': is,
    'it': it,
    'ja': ja,
    'kk': kk,
    'ko': ko,
    'lt-lt': lt,
    'lv': lv,
    'ms': ms,
    'nb': nb,
    'nl': nl,
    'nn': nn,
    'pl': pl,
    'pt': pt,
    'pt-br': ptBR,
    'pt-pt': pt,
    'ro': ro,
    'ru': ru,
    'sk': sk,
    'sl-si': sl,
    'sv': sv,
    'ta': ta,
    'th': th,
    'tr': tr,
    'uk': uk,
    'vi': vi,
    'zh-cn': zhCN,
    'zh-hk': zhCN,
    'zh-tw': zhTW
})[locale];

export function getLocale() {
    return dateLocales(globalize.getCurrentLocale()) || dateLocales(globalize.getCurrentLocale().replace(/-.*/, '')) || enUS;
}

export function getLocaleWithSuffix() {
    return {
        addSuffix: true,
        locale: getLocale()
    };
}

export default {
    getLocale: getLocale,
    getLocaleWithSuffix
};
