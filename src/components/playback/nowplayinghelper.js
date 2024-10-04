export function getNowPlayingNames(nowPlayingItem, includeNonNameInfo) {
    let topItem = nowPlayingItem;
    let bottomItem = null;
    let topText = nowPlayingItem.Name;

    if (nowPlayingItem.AlbumId && nowPlayingItem.MediaType === 'Audio') {
        topItem = {
            Id: nowPlayingItem.AlbumId,
            Name: nowPlayingItem.Album,
            Type: 'MusicAlbum',
            IsFolder: true
        };
    }

    if (nowPlayingItem.MediaType === 'Video') {
        if (nowPlayingItem.IndexNumber != null) {
            topText = nowPlayingItem.IndexNumber + ' - ' + topText;
        }
        if (nowPlayingItem.ParentIndexNumber != null) {
            topText = nowPlayingItem.ParentIndexNumber + '.' + topText;
        }
    }

    let bottomText = '';

    if (nowPlayingItem.ArtistItems?.length) {
        bottomItem = {
            Id: nowPlayingItem.ArtistItems[0].Id,
            Name: nowPlayingItem.ArtistItems[0].Name,
            Type: 'MusicArtist',
            IsFolder: true
        };

        bottomText = nowPlayingItem.ArtistItems.map(function (a) {
            return a.Name;
        }).join(', ');
    } else if (nowPlayingItem.Artists?.length) {
        bottomText = nowPlayingItem.Artists.join(', ');
    } else if (nowPlayingItem.SeriesName || nowPlayingItem.Album) {
        bottomText = topText;
        topText = nowPlayingItem.SeriesName || nowPlayingItem.Album;

        bottomItem = topItem;

        if (nowPlayingItem.SeriesId) {
            topItem = {
                Id: nowPlayingItem.SeriesId,
                Name: nowPlayingItem.SeriesName,
                Type: 'Series',
                IsFolder: true
            };
        } else {
            topItem = null;
        }
    } else if (nowPlayingItem.ProductionYear && includeNonNameInfo !== false) {
        bottomText = nowPlayingItem.ProductionYear;
    }

    const list = [];

    list.push({
        text: topText,
        item: topItem
    });

    if (bottomText) {
        list.push({
            text: bottomText,
            item: bottomItem
        });
    }

    return list;
}

export default {
    getNowPlayingNames: getNowPlayingNames
};
