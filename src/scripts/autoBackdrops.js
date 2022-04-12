import { clearBackdrop, setBackdrops } from '../components/backdrop/backdrop';
import * as userSettings from './settings/userSettings';
import libraryMenu from './libraryMenu';
import { pageClassOn } from '../utils/dashboard';

const cache = {};

function enabled() {
    return userSettings.enableBackdrops();
}

function getBackdropItemIds(apiClient, userId, types, parentId) {
    const key = `backdrops2_${userId + (types || '') + (parentId || '')}`;
    let data = cache[key];

    if (data) {
        console.debug(`Found backdrop id list in cache. Key: ${key}`);
        data = JSON.parse(data);
        return Promise.resolve(data);
    }

    const options = {
        SortBy: 'IsFavoriteOrLiked,Random',
        Limit: 20,
        Recursive: true,
        IncludeItemTypes: types,
        ImageTypes: 'Backdrop',
        ParentId: parentId,
        EnableTotalRecordCount: false,
        MaxOfficialRating: parentId ? '' : 'PG-13'
    };
    return apiClient.getItems(apiClient.getCurrentUserId(), options).then(function (result) {
        const images = result.Items.map(function (i) {
            return {
                Id: i.Id,
                tag: i.BackdropImageTags[0],
                ServerId: i.ServerId
            };
        });
        cache[key] = JSON.stringify(images);
        return images;
    });
}

function showBackdrop(type, parentId) {
    const apiClient = window.ApiClient;

    if (apiClient) {
        getBackdropItemIds(apiClient, apiClient.getCurrentUserId(), type, parentId).then(function (images) {
            if (images.length) {
                setBackdrops(images.map(function (i) {
                    i.BackdropImageTags = [i.tag];
                    return i;
                }));
            } else {
                clearBackdrop();
            }
        });
    }
}

pageClassOn('pageshow', 'page', function () {
    const page = this;

    if (!page.classList.contains('selfBackdropPage')) {
        if (page.classList.contains('backdropPage')) {
            if (enabled()) {
                const type = page.getAttribute('data-backdroptype');
                const parentId = page.classList.contains('globalBackdropPage') ? '' : libraryMenu.getTopParentId();
                showBackdrop(type, parentId);
            } else {
                page.classList.remove('backdropPage');
                clearBackdrop();
            }
        } else {
            clearBackdrop();
        }
    }
});

