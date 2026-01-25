import { clearBackdrop, setBackdropImages, setBackdrops } from '../components/backdrop/backdrop';
import * as userSettings from './settings/userSettings';
import libraryMenu from './libraryMenu';
import { pageClassOn } from '../utils/dashboard';
import { queryClient } from '../utils/query/queryClient';
import { getBrandingOptionsQuery } from '../apps/dashboard/features/branding/api/useBrandingOptions';
import { SPLASHSCREEN_URL } from '../constants/branding';
import { ServerConnections } from '../lib/jellyfin-apiclient';

const cache: Record<string, string> = {};

function enabled(): boolean {
    return (userSettings as any).enableBackdrops();
}

function getBackdropItemIds(apiClient: any, _userId: string, types?: string, parentId?: string): Promise<any[]> {
    const key = `backdrops2_${apiClient.getCurrentUserId() + (types || '') + (parentId || '')}`;
    const cachedData = cache[key];

    if (cachedData) {
        return Promise.resolve(JSON.parse(cachedData));
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

    return apiClient.getItems(apiClient.getCurrentUserId(), options).then((result: any) => {
        const images = result.Items.map((i: any) => ({
            Id: i.Id,
            tag: i.BackdropImageTags[0],
            ServerId: i.ServerId
        }));
        cache[key] = JSON.stringify(images);
        return images;
    });
}

function showBackdrop(type?: string, parentId?: string) {
    const apiClient = ServerConnections.currentApiClient();
    if (apiClient) {
        getBackdropItemIds(apiClient, apiClient.getCurrentUserId(), type, parentId).then(images => {
            if (images.length) {
                setBackdrops(
                    images.map((i: any) => {
                        i.BackdropImageTags = [i.tag];
                        return i;
                    })
                );
            } else {
                clearBackdrop();
            }
        });
    }
}

async function showSplashScreen() {
    const api = ServerConnections.getCurrentApi();
    const brandingOptions = await queryClient.fetchQuery(getBrandingOptionsQuery(api));
    if (brandingOptions.SplashscreenEnabled) {
        setBackdropImages([api.getUri(SPLASHSCREEN_URL, { t: Date.now() })]);
    } else {
        clearBackdrop();
    }
}

pageClassOn('pageshow', 'page', function (this: HTMLElement) {
    if (!this.classList.contains('selfBackdropPage')) {
        if (this.classList.contains('backdropPage')) {
            const type = this.getAttribute('data-backdroptype') || undefined;
            if (type === 'splashscreen') {
                showSplashScreen();
            } else if (enabled()) {
                const parentId = this.classList.contains('globalBackdropPage')
                    ? undefined
                    : libraryMenu.getTopParentId() || undefined;
                showBackdrop(type, parentId);
            } else {
                this.classList.remove('backdropPage');
                clearBackdrop();
            }
        } else {
            clearBackdrop();
        }
    }
});
