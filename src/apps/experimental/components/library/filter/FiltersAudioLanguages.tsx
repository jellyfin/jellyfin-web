import React, { FC, useCallback } from 'react';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { LibraryViewSettings } from 'types/library';

// Language code to English name mapping (ISO 639-1 and ISO 639-2/B)
const languageNames: Record<string, string> = {
    // ISO 639-1 (2-letter codes)
    aa: 'Afar', ab: 'Abkhazian', af: 'Afrikaans', ak: 'Akan', am: 'Amharic',
    ar: 'Arabic', as: 'Assamese', ay: 'Aymara', az: 'Azerbaijani', ba: 'Bashkir',
    be: 'Belarusian', bg: 'Bulgarian', bh: 'Bihari', bi: 'Bislama', bn: 'Bengali',
    bo: 'Tibetan', br: 'Breton', bs: 'Bosnian', ca: 'Catalan', ce: 'Chechen',
    co: 'Corsican', cs: 'Czech', cy: 'Welsh', da: 'Danish', de: 'German',
    dz: 'Dzongkha', el: 'Greek', en: 'English', eo: 'Esperanto', es: 'Spanish',
    et: 'Estonian', eu: 'Basque', fa: 'Persian', fi: 'Finnish', fj: 'Fijian',
    fo: 'Faroese', fr: 'French', fy: 'Western Frisian', ga: 'Irish', gd: 'Scottish Gaelic',
    gl: 'Galician', gn: 'Guarani', gu: 'Gujarati', ha: 'Hausa', he: 'Hebrew',
    hi: 'Hindi', hr: 'Croatian', ht: 'Haitian', hu: 'Hungarian', hy: 'Armenian',
    id: 'Indonesian', ig: 'Igbo', is: 'Icelandic', it: 'Italian', ja: 'Japanese',
    jv: 'Javanese', ka: 'Georgian', kk: 'Kazakh', km: 'Khmer', kn: 'Kannada',
    ko: 'Korean', ku: 'Kurdish', ky: 'Kyrgyz', la: 'Latin', lb: 'Luxembourgish',
    lo: 'Lao', lt: 'Lithuanian', lv: 'Latvian', mg: 'Malagasy', mi: 'Maori',
    mk: 'Macedonian', ml: 'Malayalam', mn: 'Mongolian', mr: 'Marathi', ms: 'Malay',
    mt: 'Maltese', my: 'Burmese', ne: 'Nepali', nl: 'Dutch', no: 'Norwegian',
    ny: 'Chichewa', or: 'Odia', pa: 'Punjabi', pl: 'Polish', ps: 'Pashto',
    pt: 'Portuguese', qu: 'Quechua', rm: 'Romansh', ro: 'Romanian', ru: 'Russian',
    rw: 'Kinyarwanda', sa: 'Sanskrit', sd: 'Sindhi', si: 'Sinhala', sk: 'Slovak',
    sl: 'Slovenian', sm: 'Samoan', sn: 'Shona', so: 'Somali', sq: 'Albanian',
    sr: 'Serbian', ss: 'Swati', st: 'Southern Sotho', su: 'Sundanese', sv: 'Swedish',
    sw: 'Swahili', ta: 'Tamil', te: 'Telugu', tg: 'Tajik', th: 'Thai',
    ti: 'Tigrinya', tk: 'Turkmen', tl: 'Tagalog', tn: 'Tswana', to: 'Tongan',
    tr: 'Turkish', ts: 'Tsonga', tt: 'Tatar', tw: 'Twi', ug: 'Uyghur',
    uk: 'Ukrainian', ur: 'Urdu', uz: 'Uzbek', vi: 'Vietnamese', xh: 'Xhosa',
    yi: 'Yiddish', yo: 'Yoruba', zh: 'Chinese', zu: 'Zulu',
    // ISO 639-2/B (3-letter codes)
    aar: 'Afar', abk: 'Abkhazian', afr: 'Afrikaans', aka: 'Akan', amh: 'Amharic',
    ara: 'Arabic', asm: 'Assamese', aym: 'Aymara', aze: 'Azerbaijani', bak: 'Bashkir',
    bel: 'Belarusian', bul: 'Bulgarian', bih: 'Bihari', bis: 'Bislama', ben: 'Bengali',
    tib: 'Tibetan', bre: 'Breton', bos: 'Bosnian', cat: 'Catalan', che: 'Chechen',
    cos: 'Corsican', cze: 'Czech', wel: 'Welsh', dan: 'Danish', ger: 'German',
    dzo: 'Dzongkha', gre: 'Greek', eng: 'English', epo: 'Esperanto', spa: 'Spanish',
    est: 'Estonian', baq: 'Basque', per: 'Persian', fin: 'Finnish', fij: 'Fijian',
    fao: 'Faroese', fre: 'French', fry: 'Western Frisian', gle: 'Irish', gla: 'Scottish Gaelic',
    glg: 'Galician', grn: 'Guarani', guj: 'Gujarati', hau: 'Hausa', heb: 'Hebrew',
    hin: 'Hindi', hrv: 'Croatian', hat: 'Haitian', hun: 'Hungarian', arm: 'Armenian',
    ind: 'Indonesian', ibo: 'Igbo', ice: 'Icelandic', ita: 'Italian', jpn: 'Japanese',
    jav: 'Javanese', geo: 'Georgian', kaz: 'Kazakh', khm: 'Khmer', kan: 'Kannada',
    kor: 'Korean', kur: 'Kurdish', kir: 'Kyrgyz', lat: 'Latin', ltz: 'Luxembourgish',
    lao: 'Lao', lit: 'Lithuanian', lav: 'Latvian', mlg: 'Malagasy', mao: 'Maori',
    mac: 'Macedonian', mal: 'Malayalam', mon: 'Mongolian', mar: 'Marathi', may: 'Malay',
    mlt: 'Maltese', bur: 'Burmese', nep: 'Nepali', dut: 'Dutch', nor: 'Norwegian',
    nya: 'Chichewa', ori: 'Odia', pan: 'Punjabi', pol: 'Polish', pus: 'Pashto',
    por: 'Portuguese', que: 'Quechua', roh: 'Romansh', rum: 'Romanian', rus: 'Russian',
    kin: 'Kinyarwanda', san: 'Sanskrit', snd: 'Sindhi', sin: 'Sinhala', slo: 'Slovak',
    slv: 'Slovenian', smo: 'Samoan', sna: 'Shona', som: 'Somali', alb: 'Albanian',
    srp: 'Serbian', ssw: 'Swati', sot: 'Southern Sotho', sun: 'Sundanese', swe: 'Swedish',
    swa: 'Swahili', tam: 'Tamil', tel: 'Telugu', tgk: 'Tajik', tha: 'Thai',
    tir: 'Tigrinya', tuk: 'Turkmen', tgl: 'Tagalog', tsn: 'Tswana', ton: 'Tongan',
    tur: 'Turkish', tso: 'Tsonga', tat: 'Tatar', twi: 'Twi', uig: 'Uyghur',
    ukr: 'Ukrainian', urd: 'Urdu', uzb: 'Uzbek', vie: 'Vietnamese', xho: 'Xhosa',
    yid: 'Yiddish', yor: 'Yoruba', chi: 'Chinese', zul: 'Zulu',
    // Additional common codes
    und: 'Undetermined', mul: 'Multiple languages', zxx: 'No linguistic content',
    mis: 'Miscellaneous', qaa: 'Reserved', cmn: 'Mandarin Chinese', yue: 'Cantonese',
    nob: 'Norwegian Bokmål', nno: 'Norwegian Nynorsk', fil: 'Filipino',
    gsw: 'Swiss German', cnr: 'Montenegrin', hbs: 'Serbo-Croatian'
};

const getLanguageName = (code: string): string => {
    const lowerCode = code.toLowerCase();
    return languageNames[lowerCode] ?? code;
};

interface FiltersAudioLanguagesProps {
    audioLanguageOptions: string[];
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FiltersAudioLanguages: FC<FiltersAudioLanguagesProps> = ({
    audioLanguageOptions,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const onFiltersAudioLanguagesChange = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            event.preventDefault();
            const value = event.target.value;
            const existingLanguages = libraryViewSettings?.Filters?.AudioLanguages ?? [];

            const updatedLanguages = existingLanguages.includes(value) ?
                existingLanguages.filter((filter) => filter !== value) :
                [...existingLanguages, value];

            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {
                    ...prevState.Filters,
                    AudioLanguages: updatedLanguages.length ? updatedLanguages : undefined
                }
            }));
        },
        [setLibraryViewSettings, libraryViewSettings?.Filters?.AudioLanguages]
    );

    return (
        <FormGroup>
            {audioLanguageOptions.map((code) => (
                <FormControlLabel
                    key={code}
                    control={
                        <Checkbox
                            checked={
                                !!libraryViewSettings?.Filters?.AudioLanguages?.includes(code)
                            }
                            onChange={onFiltersAudioLanguagesChange}
                            value={code}
                        />
                    }
                    label={getLanguageName(code)}
                />
            ))}
        </FormGroup>
    );
};

export default FiltersAudioLanguages;
