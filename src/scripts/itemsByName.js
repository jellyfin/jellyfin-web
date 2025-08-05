import listView from 'components/listview/listview';
import cardBuilder from 'components/cardbuilder/cardBuilder';
import imageLoader from 'components/images/imageLoader';
import globalize from 'lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';

import 'elements/emby-itemscontainer/emby-itemscontainer';
import 'elements/emby-button/emby-button';

function renderItems(page, item) {
    const sections = [];

    if (item.ArtistCount) {
        sections.push({
            name: globalize.translate('Artists'),
            type: 'MusicArtist'
        });
    }

    if (item.ProgramCount && item.Type === 'Person') {
        sections.push({
            name: globalize.translate('HeaderUpcomingOnTV'),
            type: 'Program'
        });
    }

    if (item.MovieCount) {
        sections.push({
            name: globalize.translate('Movies'),
            type: 'Movie'
        });
    }

    if (item.SeriesCount) {
        sections.push({
            name: globalize.translate('Shows'),
            type: 'Series'
        });
    }

    if (item.EpisodeCount) {
        sections.push({
            name: globalize.translate('Episodes'),
            type: 'Episode'
        });
    }

    if (item.TrailerCount) {
        sections.push({
            name: globalize.translate('Trailers'),
            type: 'Trailer'
        });
    }

    if (item.AlbumCount) {
        sections.push({
            name: globalize.translate('Albums'),
            type: 'MusicAlbum'
        });
    }

    if (item.MusicVideoCount) {
        sections.push({
            name: globalize.translate('MusicVideos'),
            type: 'MusicVideo'
        });
    }

    const elem = page.querySelector('#childrenContent');
    elem.innerHTML = sections.map((section) => {
        let html = '';
        let sectionClass = 'verticalSection';

        if (section.type === 'Audio') {
            sectionClass += ' verticalSection-extrabottompadding';
        }

        html += '<div class="' + sectionClass + '" data-type="' + section.type + '">';
        html += '<div class="sectionTitleContainer sectionTitleContainer-cards">';
        html += '<h2 class="sectionTitle sectionTitle-cards">';
        html += section.name;
        html += '</h2>';
        html += '<a is="emby-linkbutton" href="#" class="clearLink hide" style="margin-left:1em;vertical-align:middle;"><button is="emby-button" type="button" class="raised more raised-mini noIcon">' + globalize.translate('ButtonMore') + '</button></a>';
        html += '</div>';
        html += '<div is="emby-itemscontainer" class="itemsContainer padded-right">';
        html += '</div>';
        html += '</div>';
        return html;
    }).join('');
    const sectionElems = elem.querySelectorAll('.verticalSection');

    for (let i = 0, length = sectionElems.length; i < length; i++) {
        renderSection(item, sectionElems[i], sectionElems[i].getAttribute('data-type'));
    }
}

function renderSection(item, element, type) {
    switch (type) {
        case 'Program':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'Program',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                Limit: 10,
                SortBy: 'StartDate'
            }, {
                shape: 'overflowBackdrop',
                showTitle: true,
                centerText: true,
                overlayMoreButton: true,
                preferThumb: true,
                overlayText: false,
                showAirTime: true,
                showAirDateTime: true,
                showChannelName: true
            });
            break;

        case 'Movie':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'Movie',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                Limit: 10,
                SortOrder: 'Descending,Descending,Ascending',
                SortBy: 'PremiereDate,ProductionYear,SortName'
            }, {
                shape: 'overflowPortrait',
                showTitle: true,
                centerText: true,
                overlayMoreButton: true,
                overlayText: false,
                showYear: true
            });
            break;

        case 'MusicVideo':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'MusicVideo',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                Limit: 10,
                SortBy: 'SortName'
            }, {
                shape: 'overflowBackdrop',
                showTitle: true,
                centerText: true,
                overlayPlayButton: true
            });
            break;

        case 'Trailer':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'Trailer',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                Limit: 10,
                SortBy: 'SortName'
            }, {
                shape: 'overflowPortrait',
                showTitle: true,
                centerText: true,
                overlayPlayButton: true
            });
            break;

        case 'Series':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'Series',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                Limit: 10,
                SortBy: 'SortName'
            }, {
                shape: 'overflowPortrait',
                showTitle: true,
                centerText: true,
                overlayMoreButton: true
            });
            break;

        case 'MusicAlbum':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'MusicAlbum',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                SortOrder: 'Descending,Descending,Ascending',
                SortBy: 'PremiereDate,ProductionYear,Sortname'
            }, {
                shape: 'overflowSquare',
                playFromHere: true,
                showTitle: true,
                showYear: true,
                coverImage: true,
                centerText: true,
                overlayPlayButton: true
            });
            break;

        case 'MusicArtist':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'MusicArtist',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                Limit: 8,
                SortBy: 'SortName'
            }, {
                shape: 'overflowSquare',
                playFromHere: true,
                showTitle: true,
                showParentTitle: true,
                coverImage: true,
                centerText: true,
                overlayPlayButton: true
            });
            break;

        case 'Episode':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'Episode',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                Limit: 6,
                SortBy: 'SortName'
            }, {
                shape: 'overflowBackdrop',
                showTitle: true,
                showParentTitle: true,
                centerText: true,
                overlayPlayButton: true
            });
            break;

        case 'Audio':
            loadItems(element, item, type, {
                MediaTypes: '',
                IncludeItemTypes: 'Audio',
                PersonTypes: '',
                ArtistIds: '',
                AlbumArtistIds: '',
                SortBy: 'AlbumArtist,Album,SortName'
            }, {
                playFromHere: true,
                action: 'playallfromhere',
                smallIcon: true,
                artist: true
            });
    }
}

function loadItems(element, item, type, query, listOptions) {
    query = getQuery(query, item);
    getItemsFunction(query, item)(query.StartIndex, query.Limit, query.Fields).then((result) => {
        // If results are empty, hide the section
        if (!result.Items?.length) {
            element.classList.add('hide');
            return;
        }

        let html = '';

        if (query.Limit && result.TotalRecordCount > query.Limit) {
            const link = element.querySelector('a');
            link.classList.remove('hide');
            link.setAttribute('href', getMoreItemsHref(item, type));
        } else {
            element.querySelector('a').classList.add('hide');
        }

        listOptions.items = result.Items;
        const itemsContainer = element.querySelector('.itemsContainer');

        if (type === 'Audio') {
            html = listView.getListViewHtml(listOptions);
            itemsContainer.classList.remove('vertical-wrap');
            itemsContainer.classList.add('vertical-list');
        } else {
            html = cardBuilder.getCardsHtml(listOptions);
            itemsContainer.classList.add('vertical-wrap');
            itemsContainer.classList.remove('vertical-list');
        }

        itemsContainer.innerHTML = html;
        imageLoader.lazyChildren(itemsContainer);
    });
}

function getMoreItemsHref(item, type) {
    if (item.Type === 'Genre') {
        return '#/list?type=' + type + '&genreId=' + item.Id + '&serverId=' + item.ServerId;
    }

    if (item.Type === 'MusicGenre') {
        return '#/list?type=' + type + '&musicGenreId=' + item.Id + '&serverId=' + item.ServerId;
    }

    if (item.Type === 'Studio') {
        return '#/list?type=' + type + '&studioId=' + item.Id + '&serverId=' + item.ServerId;
    }

    if (item.Type === 'MusicArtist') {
        return '#/list?type=' + type + '&artistId=' + item.Id + '&serverId=' + item.ServerId;
    }

    if (item.Type === 'Person') {
        return '#/list?type=' + type + '&personId=' + item.Id + '&serverId=' + item.ServerId;
    }

    return '#/list?type=' + type + '&parentId=' + item.Id + '&serverId=' + item.ServerId;
}

function addCurrentItemToQuery(query, item) {
    if (item.Type === 'Person') {
        query.PersonIds = item.Id;
    } else if (item.Type === 'Genre') {
        query.Genres = item.Name;
    } else if (item.Type === 'MusicGenre') {
        query.Genres = item.Name;
    } else if (item.Type === 'Studio') {
        query.StudioIds = item.Id;
    } else if (item.Type === 'MusicArtist') {
        query.AlbumArtistIds = item.Id;
    }
}

function getQuery(options, item) {
    let query = {
        SortOrder: 'Ascending',
        IncludeItemTypes: '',
        Recursive: true,
        Fields: 'ParentId,PrimaryImageAspectRatio',
        Limit: 100,
        StartIndex: 0,
        CollapseBoxSetItems: false
    };
    query = Object.assign(query, options || {});
    addCurrentItemToQuery(query, item);
    return query;
}

function getItemsFunction(options, item) {
    const query = getQuery(options, item);
    return (index, limit, fields) => {
        query.StartIndex = index;
        query.Limit = limit;

        if (fields) {
            query.Fields += ',' + fields;
        }

        const apiClient = ServerConnections.getApiClient(item.ServerId);

        if (query.IncludeItemTypes === 'MusicArtist') {
            query.IncludeItemTypes = null;
            return apiClient.getAlbumArtists(apiClient.getCurrentUserId(), query);
        }

        return apiClient.getItems(apiClient.getCurrentUserId(), query);
    };
}

const ItemsByName = {
    renderItems
};

export default ItemsByName;
