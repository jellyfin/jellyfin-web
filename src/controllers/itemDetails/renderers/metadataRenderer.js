import globalize from 'lib/globalize';
import { appRouter } from '../../../components/router/appRouter';
import { hideAll } from '../utils/viewHelpers';

export function renderGenres(page, item, context) {
    const genres = item.GenreItems || [];
    const type = context === 'music' ? 'MusicGenre' : 'Genre';

    const html = genres
        .map((p) => {
            return (
                '<a style="color:inherit;" class="button-link" is="emby-linkbutton" href="' +
                appRouter.getRouteUrl(
                    {
                        Name: p.Name,
                        Type: type,
                        ServerId: item.ServerId,
                        Id: p.Id
                    },
                    {
                        context: context
                    }
                ) +
                '">' +
                escapeHtml(p.Name) +
                '</a>'
            );
        })
        .join(', ');

    const genresLabel = page.querySelector('.genresLabel');
    genresLabel.innerHTML = globalize.translate(genres.length > 1 ? 'Genres' : 'Genre');
    const genresValue = page.querySelector('.genres');
    genresValue.innerHTML = html;

    const genresGroup = page.querySelector('.genresGroup');
    if (genres.length) {
        genresGroup.classList.remove('hide');
    } else {
        genresGroup.classList.add('hide');
    }
}

export function renderWriter(page, item, context) {
    const writers = (item.People || []).filter((person) => {
        return person.Type === 'Writer';
    });

    if (writers.length) {
        const html = writers
            .map((person) => {
                return `<a class="textlink" href="${person.Url}" is="emby-linkbutton">${escapeHtml(person.Name)}</a>`;
            })
            .join(', ');

        page.querySelector('.writersLabel').innerHTML = globalize.translate('Writers');
        page.querySelector('.writers').innerHTML = html;
        page.querySelector('.writersGroup').classList.remove('hide');
    } else {
        page.querySelector('.writersGroup').classList.add('hide');
    }
}

export function renderDirector(page, item, context) {
    const directors = (item.People || []).filter((person) => {
        return person.Type === 'Director';
    });

    if (directors.length) {
        const html = directors
            .map((person) => {
                return `<a class="textlink" href="${person.Url}" is="emby-linkbutton">${escapeHtml(person.Name)}</a>`;
            })
            .join(', ');

        page.querySelector('.directorLabel').innerHTML = globalize.translate('Director');
        page.querySelector('.director').innerHTML = html;
        page.querySelector('.directorGroup').classList.remove('hide');
    } else {
        page.querySelector('.directorGroup').classList.add('hide');
    }
}

export function renderStudio(page, item, context) {
    if (item.Studios && item.Studios.length) {
        const html = item.Studios.map((studio) => {
            return `<a class="textlink" href="${appRouter.getRouteUrl(studio, { context: context })}" is="emby-linkbutton">${escapeHtml(studio.Name)}</a>`;
        }).join(', ');

        page.querySelector('.studioLabel').innerHTML = globalize.translate('Studio');
        page.querySelector('.studio').innerHTML = html;
        page.querySelector('.studioGroup').classList.remove('hide');
    } else {
        page.querySelector('.studioGroup').classList.add('hide');
    }
}

export function renderTagline(page, item) {
    if (item.Taglines && item.Taglines.length) {
        page.querySelector('.taglineLabel').innerHTML = globalize.translate('Tagline');
        page.querySelector('.tagline').innerHTML = item.Taglines[0];
        page.querySelector('.taglineGroup').classList.remove('hide');
    } else {
        page.querySelector('.taglineGroup').classList.add('hide');
    }
}
