import { af, arDZ, be, bg, bn, ca, cs, da, de, el, enGB, enUS, eo, es, faIR, fi, fr, frCA, he, hi, hr, hu, gl, id, is, it, ja, kk, ko, lt, ms, nb,
    nl, pl, ptBR, pt, ro, ru, sk, sl, sv, ta, th, tr, uk, vi, zhCN, zhTW } from 'date-fns/locale';
import globalize from './globalize';

const dateLocales = (locale) => ({
    'af': af,
    'ar': arDZ,
    'be-by': be,
    'bg-bg': bg,
    'bn': bn,
    'ca': ca,
    'cs': cs,
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
    'ms': ms,
    'nb': nb,
    'nl': nl,
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

export const localeWithSuffix = { addSuffix: true, locale: getLocale() };

export default {
    getLocale: getLocale,
    localeWithSuffix: localeWithSuffix
};
