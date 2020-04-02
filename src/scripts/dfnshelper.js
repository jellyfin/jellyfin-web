import * as locale from 'date-fns/locale'
define(["globalize"], function (globalize) {
    "use strict";

    function getLocale()
    {
        switch (globalize.getCurrentLocale()) {
            case 'ar':
                return locale.ar;
            case 'be-by':
                return locale.be;
            case 'bg-bg':
                return locale.bg;
            case 'ca':
                return locale.ca;
            case 'cs':
                return locale.cs;
            case 'da':
                return locale.da;
            case 'de':
                return locale.de;
            case 'el':
                return locale.el;
            case 'en-gb':
                return locale.enGB;
            case 'en-us':
                return locale.enUS;
            case 'es':
                return locale.es;
            case 'es-ar':
                return locale.es;
            case 'es-mx':
                return locale.es;
            case 'fa':
                return locale.faIR;
            case 'fi':
                return locale.fi;
            case 'fr':
                return locale.fr;
            case 'fr-ca':
                return locale.frCA;
            case 'gsw':
                return locale.de;
            case 'he':
                return locale.he;
            case 'hi-in':
                return locale.hi;
            case 'hr':
                return locale.hr;
            case 'hu':
                return locale.hu;
            case 'id':
                return locale.id;
            case 'it':
                return locale.it;
            case 'kk':
                return locale.kk;
            case 'ko':
                return locale.ko;
            case 'lt-lt':
                return locale.lt;
            case 'ms':
                return locale.ms;
            case 'nb':
                return locale.nb;
            case 'nl':
                return locale.nl;
            case 'pl':
                return locale.pl;
            case 'pt-br':
                return locale.ptBR;
            case 'pt-pt':
                return locale.pt;
            case 'ro':
                return locale.ro;
            case 'ru':
                return locale.ru;
            case 'sk':
                return locale.sk;
            case 'sl-si':
                return locale.sl;
            case 'sv':
                return locale.sv;
            case 'tr':
                return locale.tr;
            case 'uk':
                return locale.uk;
            case 'vi':
                return locale.vi;
            case 'zh-cn':
                return locale.zhCN;
            case 'zh-hk':
                return locale.zhCN;
            case 'zh-tw':
                return locale.zhTW;
            default:
                return locale.enUS;
        }
    }
    return {
        getLocale: getLocale
    };
});