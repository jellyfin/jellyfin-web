import imageLoader from 'components/images/imageLoader';

function logoImageUrl(item, apiClient, options) {
    options = options || {};
    options.type = 'Logo';

    if (item.ImageTags?.Logo) {
        options.tag = item.ImageTags.Logo;
        return apiClient.getScaledImageUrl(item.Id, options);
    }

    if (item.ParentLogoImageTag) {
        options.tag = item.ParentLogoImageTag;
        return apiClient.getScaledImageUrl(item.ParentLogoItemId, options);
    }

    return null;
}

export function renderLogo(page, item, apiClient) {
    const detailLogo = page.querySelector('.detailLogo');

    const url = logoImageUrl(item, apiClient, {});

    if (url) {
        detailLogo.classList.remove('hide');
        imageLoader.lazyImage(detailLogo, url);
        // Preload for better performance
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
    } else {
        detailLogo.classList.add('hide');
    }
}

export function renderYear(page, item) {
    const productionYearElement = page.querySelector('.productionYear');
    if (productionYearElement) {
        productionYearElement.textContent = item.ProductionYear || '';
    }
}
