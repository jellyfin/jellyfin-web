const languages = require('./languages.json');

/**
 * OpenSubtitles supported languages and codes
 */
const Languages = languages.data.sort( function(a, b) {
    if (a.language_code < b.language_code) {
        return -1;
    } else if (a.language_code > b.language_code) {
        return 1;
    }
    return 0;
});

/**
 * Converts srt text to Jellyfin Html Video Player json
 * @param {string} srt srt text
 * @returns JSON Object
 */
function srtToJson( srt ) {
    const data = srt.split('\n');
    const out = { TrackEvents: [] };
    let obj = { Text: '' };
    try {
        for (let line of data) {
            line = line.trim();
            if ( !line.length && obj.EndPositionTicks && obj.StartPositionTicks && obj.Text ) {
                if ( !obj.Id ) {
                    obj.Id = 1 + out.TrackEvents.length;
                }
                if ( out.TrackEvents.length
                  && (obj.StartPositionTicks == out.TrackEvents.at(-1).StartPositionTicks) ) {
                    // Some srt files do multiline like this
                    out.TrackEvents.at(-1).Text += '\n' + obj.Text;
                } else {
                    out.TrackEvents.push(obj);
                }
                obj = { Text: '' };
            } else if ( !isNaN(line) ) {
                //obj.Id = String( parseInt(line) );
            } else if (line.includes('-->')) {
                const part = line.split('-->');
                let start = part[0].split(',')[0].trim();
                const timer1 = part[0].split(',')[1].trim();
                let end = part[1].split(',')[0].trim();
                const timer2 = part[1].split(',')[1].replace('\r', '').trim();

                let startMillis = Number(timer1);
                start = start.split(':');
                startMillis += start[2] * 1000;
                startMillis += start[1] * 1000 * 60;
                startMillis += start[0] * 1000 * 60 * 60;

                let endMillis = Number(timer2);
                end = end.split(':');
                endMillis += end[2] * 1000;
                endMillis += end[1] * 1000 * 60;
                endMillis += end[0] * 1000 * 60 * 60;

                obj.StartPositionTicks = startMillis * 10000;
                obj.EndPositionTicks = endMillis * 10000;
            } else {
                if ( obj.Text.length > 0 ) {
                    obj.Text += '\n';
                }
                obj.Text += line;
            }
        }
    } catch (err) { console.error( 'srt_to_json parse error', err ); }
    return out;
}

export default {
    Languages,
    srtToJson
};
