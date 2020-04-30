import { ar, be, bg, ca, cs, da, de, el, enGB, enUS, es, faIR, fi, fr, frCA, he, hi, hr, hu, id, it, ja, kk, ko, lt, ms, nb,
    nl, pl, ptBR, pt, ro, ru, sk, sl, sv, tr, uk, vi, zhCN, zhTW } from 'date-fns/locale';
import globalize from 'globalize';

const dateLocales = (locale) => ({
    'ar': ar,
    'be-by': be,
    'bg-bg': bg,
    'ca': ca,
    'cs': cs,
    'da': da,
    'de': de,
    'el': el,
    'en-gb': enGB,
    'en-us': enUS,
    'es': es,
    'es-ar': es,
    'es-mx': es,
    'fa': faIR,
    'fi': fi,
    'fr': fr,
    'fr-ca': frCA,
    'gsw': de,
    'he': he,
    'hi-in': hi,
    'hr': hr,
    'hu': hu,
    'id': id,
    'it': it,
    'ja': ja,
    'kk': kk,
    'ko': ko,
    'lt-lt': lt,
    'ms': ms,
    'nb': nb,
    'nl': nl,
    'pl': pl,
    'pt-br': ptBR,
    'pt-pt': pt,
    'ro': ro,
    'ru': ru,
    'sk': sk,
    'sl-si': sl,
    'sv': sv,
    'tr': tr,
    'uk': uk,
    'vi': vi,
    'zh-cn': zhCN,
    'zh-hk': zhCN,
    'zh-tw': zhTW
})[locale];

export function getLocale() {
    return dateLocales(globalize.getCurrentLocale()) || enUS;
}

export const localeWithSuffix = { addSuffix: true, locale: getLocale() };

export default {
    getLocale: getLocale,
    localeWithSuffix: localeWithSuffix
};
