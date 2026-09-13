import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { ItemFields } from '@jellyfin/sdk/lib/generated-client/models/item-fields';
import { ItemSortBy } from '@jellyfin/sdk/lib/generated-client/models/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { getCompanyApi } from '@jellyfin/sdk/lib/utils/api/company-api';

import cardBuilder from 'components/cardbuilder/cardBuilder';
import loading from 'components/loading/loading';
import { ServerConnections } from 'lib/jellyfin-apiclient';

function getPromise(params, companyKind) {
    loading.show();

    const api = ServerConnections.getApi(ApiClient.serverId());
    if (!api) {
        console.error('[TvCompanies] no Api instance available for server', ApiClient.serverId());
        return Promise.resolve(undefined);
    }

    return getCompanyApi(api)
        .getCompanies({
            userId: ApiClient.getCurrentUserId(),
            companyTypes: [companyKind],
            includeItemTypes: ['Series'],
            parentId: params.topParentId ?? undefined,
            fields: [ItemFields.DateCreated, ItemFields.PrimaryImageAspectRatio],
            enableImageTypes: [ImageType.Thumb],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending]
        })
        .then(({ data }) => data);
}

function reloadItems(context, promise) {
    promise.then(function (result) {
        if (!result) {
            loading.hide();
            return;
        }

        const elem = context.querySelector('#items');
        cardBuilder.buildCards(result.Items, {
            itemsContainer: elem,
            shape: 'backdrop',
            preferThumb: true,
            showTitle: true,
            scalable: true,
            centerText: true,
            overlayMoreButton: true,
            context: 'tvshows'
        });
        loading.hide();

        import('components/autoFocuser').then(({ default: autoFocuser }) => {
            autoFocuser.autoFocus(context);
        });
    });
}

/**
 * Builds the tab controller listing the companies of one kind credited on this library's series.
 * @param {string} companyKind - The kind of company to list.
 * @returns {Function} The tab controller.
 */
export default function createCompaniesController(companyKind) {
    return function (view, params, tabContent) {
        let promise;
        const self = this;

        self.preRender = function () {
            promise = getPromise(params, companyKind);
        };

        self.renderTab = function () {
            reloadItems(tabContent, promise);
        };
    };
}
