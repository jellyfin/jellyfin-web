import globalize from 'lib/globalize';
import itemHelper from '../../../components/itemHelper';
import { playbackManager } from '../../../components/playback/playbackmanager';
import datetime from '../../../scripts/datetime';

export function renderVideoSelections(page, mediaSources) {
    const mediaSource = getSelectedMediaSource(page, mediaSources);

    const tracks = mediaSource.MediaStreams.filter((m) => {
        return m.Type === 'Video';
    });

    const select = page.querySelector('.selectVideo');
    select.setLabel(globalize.translate('Video'));
    const selectedId = tracks.length ? tracks[0].Index : -1;
    select.innerHTML = tracks
        .map((v) => {
            const selected = v.Index === selectedId ? ' selected' : '';
            const titleParts = [];
            const resolutionText = mediaInfo.getResolutionText(v);

            if (resolutionText) {
                titleParts.push(resolutionText);
            }

            if (v.Codec) {
                titleParts.push(v.Codec.toUpperCase());
            }

            return (
                '<option value="' +
                v.Index +
                '" ' +
                selected +
                '>' +
                (v.DisplayTitle || titleParts.join(' ')) +
                '</option>'
            );
        })
        .join('');
    select.setAttribute('disabled', 'disabled');

    if (tracks.length) {
        page.querySelector('.selectVideoContainer').classList.remove('hide');
    } else {
        page.querySelector('.selectVideoContainer').classList.add('hide');
    }
}

export function renderAudioSelections(page, mediaSources) {
    const mediaSource = getSelectedMediaSource(page, mediaSources);

    const tracks = mediaSource.MediaStreams.filter((m) => {
        return m.Type === 'Audio';
    });
    tracks.sort(itemHelper.sortTracks);
    const select = page.querySelector('.selectAudio');
    select.setLabel(globalize.translate('Audio'));
    const selectedId = mediaSource.DefaultAudioStreamIndex;
    select.innerHTML = tracks
        .map((v) => {
            const selected = v.Index === selectedId ? ' selected' : '';
            return (
                '<option value="' + v.Index + '" ' + selected + '>' + v.DisplayTitle + '</option>'
            );
        })
        .join('');

    if (tracks.length > 1) {
        select.removeAttribute('disabled');
    } else {
        select.setAttribute('disabled', 'disabled');
    }

    if (tracks.length) {
        page.querySelector('.selectAudioContainer').classList.remove('hide');
    } else {
        page.querySelector('.selectAudioContainer').classList.add('hide');
    }
}

export function renderSubtitleSelections(page, mediaSources) {
    const mediaSource = getSelectedMediaSource(page, mediaSources);

    const tracks = mediaSource.MediaStreams.filter((m) => {
        return m.Type === 'Subtitle';
    });
    tracks.sort(itemHelper.sortTracks);
    const select = page.querySelector('.selectSubtitles');
    select.setLabel(globalize.translate('Subtitles'));
    const selectedId =
        mediaSource.DefaultSubtitleStreamIndex == null
            ? -1
            : mediaSource.DefaultSubtitleStreamIndex;

    let selected = selectedId === -1 ? ' selected' : '';
    select.innerHTML =
        '<option value="-1">' +
        globalize.translate('Off') +
        '</option>' +
        tracks
            .map((v) => {
                selected = v.Index === selectedId ? ' selected' : '';
                return (
                    '<option value="' +
                    v.Index +
                    '" ' +
                    selected +
                    '>' +
                    v.DisplayTitle +
                    '</option>'
                );
            })
            .join('');

    if (tracks.length > 0) {
        select.removeAttribute('disabled');
    } else {
        select.setAttribute('disabled', 'disabled');
    }

    if (tracks.length) {
        page.querySelector('.selectSubtitlesContainer').classList.remove('hide');
    } else {
        page.querySelector('.selectSubtitlesContainer').classList.add('hide');
    }
}
