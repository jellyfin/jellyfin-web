import globalize from 'lib/globalize';

export function showLayoutMenu (button, currentLayout, views) {
    let dispatchEvent = true;

    if (!views) {
        dispatchEvent = false;
        views = button.getAttribute('data-layouts');
        views = views ? views.split(',') : ['List', 'Poster', 'PosterCard', 'Thumb', 'ThumbCard'];
    }

    const menuItems = views.map(function (v) {
        return {
            name: globalize.translate(v),
            id: v,
            selected: currentLayout == v
        };
    });

    import('../components/actionSheet/actionSheet').then(({ default: actionsheet }) => {
        actionsheet.show({
            items: menuItems,
            positionTo: button,
            callback: function (id) {
                button.dispatchEvent(new CustomEvent('layoutchange', {
                    detail: {
                        viewStyle: id
                    },
                    bubbles: true,
                    cancelable: false
                }));

                if (!dispatchEvent && window.$) {
                    $(button).trigger('layoutchange', [id]);
                }
            }
        }).catch(() => { /* no-op */ });
    });
}

export function getQueryPagingHtml (options) {
    const startIndex = options.startIndex;
    const limit = options.limit;
    const totalRecordCount = options.totalRecordCount;
    let html = '';
    const recordsStart = totalRecordCount ? startIndex + 1 : 0;
    const recordsEnd = limit ? Math.min(startIndex + limit, totalRecordCount) : totalRecordCount;
    const showControls = limit > 0 && limit < totalRecordCount;

    html += '<div class="listPaging">';

    html += '<span style="vertical-align:middle;">';
    html += globalize.translate('ListPaging', recordsStart, recordsEnd, totalRecordCount);
    html += '</span>';

    if (showControls || options.viewButton || options.filterButton || options.sortButton || options.addLayoutButton) {
        html += '<div style="display:inline-block;">';

        if (showControls) {
            html += '<button is="paper-icon-button-light" class="btnPreviousPage autoSize" ' + (startIndex ? '' : 'disabled') + '><span class="material-icons arrow_back" aria-hidden="true"></span></button>';
            html += '<button is="paper-icon-button-light" class="btnNextPage autoSize" ' + (startIndex + limit >= totalRecordCount ? 'disabled' : '') + '><span class="material-icons arrow_forward" aria-hidden="true"></span></button>';
        }

        if (options.addLayoutButton) {
            html += '<button is="paper-icon-button-light" title="' + globalize.translate('ButtonSelectView') + '" class="btnChangeLayout autoSize" data-layouts="' + (options.layouts || '') + '" onclick="LibraryBrowser.showLayoutMenu(this, \'' + (options.currentLayout || '') + '\');"><span class="material-icons view_comfy" aria-hidden="true"></span></button>';
        }

        if (options.sortButton) {
            html += '<button is="paper-icon-button-light" class="btnSort autoSize" title="' + globalize.translate('Sort') + '"><span class="material-icons sort_by_alpha" aria-hidden="true"></span></button>';
        }

        if (options.filterButton) {
            html += '<button is="paper-icon-button-light" class="btnFilter autoSize" title="' + globalize.translate('Filter') + '"><span class="material-icons filter_alt" aria-hidden="true"></span></button>';
        }

        html += '</div>';
    }

    html += '</div>';
    return html;
}

export function showSortMenu (options) {
    Promise.all([
        import('../components/dialogHelper/dialogHelper'),
        import('../elements/emby-radio/emby-radio'),
        import('../elements/emby-checkbox/emby-checkbox')
    ]).then(([{ default: dialogHelper }]) => {
        const isUnplayedFirst = options.query.UnplayedFirst === true ||
            (options.query.SortBy || '').startsWith('IsPlayed,');
        const rawSortBy = (options.query.SortBy || '').replace(/^IsPlayed,/, '');

        let rawSortOrder = options.query.SortOrder || 'Ascending';
        if (isUnplayedFirst && rawSortOrder.startsWith('Ascending,')) {
            rawSortOrder = rawSortOrder.substring('Ascending,'.length).split(',')[0];
        }

        const dlg = dialogHelper.createDialog({
            removeOnClose: true,
            modal: false,
            entryAnimationDuration: 160,
            exitAnimationDuration: 200
        });
        dlg.classList.add('ui-body-a');
        dlg.classList.add('background-theme-a');
        dlg.classList.add('formDialog');
        let html = '';
        html += '<div style="margin:0;padding:1.25em 1.5em 1.5em;">';
        html += '<h2 style="margin:0 0 .5em;">';
        html += globalize.translate('HeaderSortBy');
        html += '</h2>';
        let i;
        let length;
        let isChecked;
        html += '<div>';
        for (i = 0, length = options.items.length; i < length; i++) {
            const option = options.items[i];
            const radioValue = option.id.replace(',', '_');
            isChecked = (rawSortBy || '').replace(',', '_') == radioValue ? ' checked' : '';
            html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortBy" data-id="' + option.id + '" value="' + radioValue + '" class="menuSortBy" ' + isChecked + ' /><span>' + option.name + '</span></label>';
        }

        html += '</div>';
        html += '<h2 style="margin: 1em 0 .5em;">';
        html += globalize.translate('HeaderSortOrder');
        html += '</h2>';
        html += '<div>';
        isChecked = rawSortOrder == 'Ascending' ? ' checked' : '';
        html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Ascending" class="menuSortOrder" ' + isChecked + ' /><span>' + globalize.translate('Ascending') + '</span></label>';
        isChecked = rawSortOrder == 'Descending' ? ' checked' : '';
        html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Descending" class="menuSortOrder" ' + isChecked + ' /><span>' + globalize.translate('Descending') + '</span></label>';
        html += '</div>';

        const enableUnplayedSort = options.enableUnplayedSort !== false;
        if (enableUnplayedSort) {
            html += '<div style="margin-top: 1em;">';
            isChecked = isUnplayedFirst ? ' checked' : '';
            html += '<label class="checkboxContainer" style="margin-bottom: 0;"><input type="checkbox" is="emby-checkbox" class="chkUnplayedFirst" ' + isChecked + ' /><span>' + globalize.translate('OptionUnplayedFirst') + '</span></label>';
            html += '</div>';
        }

        html += '</div>';
        dlg.innerHTML = html;
        dialogHelper.open(dlg);

        function applySort() {
            const selectedSortBy = dlg.querySelector('.menuSortBy:checked');
            const selectedSortOrder = dlg.querySelector('.menuSortOrder:checked');
            const unplayedFirstCheckbox = dlg.querySelector('.chkUnplayedFirst');

            const currentBaseSortBy = selectedSortBy ? selectedSortBy.getAttribute('data-id') : rawSortBy;
            const currentBaseSortOrder = selectedSortOrder ? selectedSortOrder.value : rawSortOrder;
            const currentUnplayedFirst = unplayedFirstCheckbox ? unplayedFirstCheckbox.checked : false;

            const cleanBaseSortBy = (currentBaseSortBy || '').replace(/^IsPlayed,/, '');
            let finalSortBy = cleanBaseSortBy;
            let finalSortOrder = currentBaseSortOrder;

            if (currentUnplayedFirst && cleanBaseSortBy) {
                finalSortBy = 'IsPlayed,' + cleanBaseSortBy;
                finalSortOrder = 'Ascending,' + currentBaseSortOrder;
            }

            const changed = options.query.SortBy !== finalSortBy ||
                options.query.SortOrder !== finalSortOrder ||
                options.query.UnplayedFirst !== currentUnplayedFirst;

            options.query.SortBy = finalSortBy;
            options.query.SortOrder = finalSortOrder;
            options.query.UnplayedFirst = currentUnplayedFirst;
            options.query.StartIndex = 0;

            if (options.callback && changed) {
                options.callback();
            }
        }

        const sortBys = dlg.querySelectorAll('.menuSortBy');
        for (i = 0, length = sortBys.length; i < length; i++) {
            sortBys[i].addEventListener('change', applySort);
        }

        const sortOrders = dlg.querySelectorAll('.menuSortOrder');
        for (i = 0, length = sortOrders.length; i < length; i++) {
            sortOrders[i].addEventListener('change', applySort);
        }

        const chkUnplayedFirst = dlg.querySelector('.chkUnplayedFirst');
        if (chkUnplayedFirst) {
            chkUnplayedFirst.addEventListener('change', applySort);
        }
    });
}

const libraryBrowser = {
    showLayoutMenu,
    getQueryPagingHtml,
    showSortMenu
};

window.LibraryBrowser = libraryBrowser;

export default libraryBrowser;
