import { ar, be, bg, ca, cs, da, de, el, enGB, enUS, es, faIR, fi, fr, frCA, he, hi, hr, hu, id, it, kk, ko, lt, ms, nb, nl, pl, ptBR, pt, ro, ru, sk, sl, sv, tr, uk, vi, zhCN, zhTW } from 'date-fns/locale';
import globalize from 'globalize';

export function getLocale() {
    switch (globalize.getCurrentLocale()) {
        case 'ar':
            return ar;
        case 'be-by':
            return be;
        case 'bg-bg':
            return bg;
        case 'ca':
            return ca;
        case 'cs':
            return cs;
        case 'da':
            return da;
        case 'de':
            return de;
        case 'el':
            return el;
        case 'en-gb':
            return enGB;
        case 'en-us':
            return enUS;
        case 'es':
            return es;
        case 'es-ar':
            return es;
        case 'es-mx':
            return es;
        case 'fa':
            return faIR;
        case 'fi':
            return fi;
        case 'fr':
            return fr;
        case 'fr-ca':
            return frCA;
        case 'gsw':
            return de;
        case 'he':
            return he;
        case 'hi-in':
            return hi;
        case 'hr':
            return hr;
        case 'hu':
            return hu;
        case 'id':
            return id;
        case 'it':
            return it;
        case 'kk':
            return kk;
        case 'ko':
            return ko;
        case 'lt-lt':
            return lt;
        case 'ms':
            return ms;
        case 'nb':
            return nb;
        case 'nl':
            return nl;
        case 'pl':
            return pl;
        case 'pt-br':
            return ptBR;
        case 'pt-pt':
            return pt;
        case 'ro':
            return ro;
        case 'ru':
            return ru;
        case 'sk':
            return sk;
        case 'sl-si':
            return sl;
        case 'sv':
            return sv;
        case 'tr':
            return tr;
        case 'uk':
            return uk;
        case 'vi':
            return vi;
        case 'zh-cn':
            return zhCN;
        case 'zh-hk':
            return zhCN;
        case 'zh-tw':
            return zhTW;
        default:
            return enUS;
    }
}
export const localeWithSuffix = { addSuffix: true, locale: getLocale() };
