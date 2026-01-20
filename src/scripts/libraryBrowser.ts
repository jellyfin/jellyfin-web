import globalize from '../lib/globalize';

export function showLayoutMenu(button: HTMLElement, currentLayout: string, views?: any[]): void {
    let dispatchEvent = true;
    let viewList = views;

    if (!viewList) {
        dispatchEvent = false;
        const layouts = button.getAttribute('data-layouts');
        viewList = layouts ? layouts.split(',') : ['List', 'Poster', 'PosterCard', 'Thumb', 'ThumbCard'];
    }

    const menuItems = viewList.map((v) => ({
        name: globalize.translate(v),
        id: v,
        selected: currentLayout === v
    }));

    import('../components/actionSheet/actionSheet').then(({ default: actionsheet }) => {
        actionsheet.show({
            items: menuItems,
            positionTo: button,
            callback: (id: string) => {
                button.dispatchEvent(new CustomEvent('layoutchange', {
                    detail: { viewStyle: id },
                    bubbles: true,
                    cancelable: false
                }));

                if (!dispatchEvent && (window as any).$) {
                    (window as any).$(button).trigger('layoutchange', [id]);
                }
            }
        });
    });
}

export function getQueryPagingHtml(options: any): string {
    const { startIndex, limit, totalRecordCount } = options;
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

export function showSortMenu(options: any): void {
    Promise.all([
        import('../components/dialogHelper/dialogHelper'),
        import('../elements/emby-radio/emby-radio')
    ]).then(([{ default: dialogHelper }]) => {
        const dlg = dialogHelper.createDialog({
            removeOnClose: true,
            modal: false,
            entryAnimationDuration: 160,
            exitAnimationDuration: 200
        });
        dlg.classList.add('ui-body-a', 'background-theme-a', 'formDialog');
        
        let html = '<div style="margin:0;padding:1.25em 1.5em 1.5em;">';
        html += '<h2 style="margin:0 0 .5em;">' + globalize.translate('HeaderSortBy') + '</h2><div>';
        
        options.items.forEach((item: any) => {
            const radioValue = item.id.replace(',', '_');
            const isChecked = (options.query.SortBy || '').replace(',', '_') === radioValue ? ' checked' : '';
            html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortBy" data-id="' + item.id + '" value="' + radioValue + '" class="menuSortBy" ' + isChecked + ' /><span>' + item.name + '</span></label>';
        });

        html += '</div><h2 style="margin: 1em 0 .5em;">' + globalize.translate('HeaderSortOrder') + '</h2><div>';
        
        const ascChecked = options.query.SortOrder === 'Ascending' ? ' checked' : '';
        html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Ascending" class="menuSortOrder" ' + ascChecked + ' /><span>' + globalize.translate('Ascending') + '</span></label>';
        
        const descChecked = options.query.SortOrder === 'Descending' ? ' checked' : '';
        html += '<label class="radio-label-block"><input type="radio" is="emby-radio" name="SortOrder" value="Descending" class="menuSortOrder" ' + descChecked + ' /><span>' + globalize.translate('Descending') + '</span></label>';
        
        html += '</div></div>';
        dlg.innerHTML = html;
        dialogHelper.open(dlg);

        dlg.querySelectorAll('.menuSortBy').forEach(el => {
            el.addEventListener('change', (e: any) => {
                if (e.target.checked) {
                    options.query.SortBy = e.target.value.replace('_', ',');
                    options.query.StartIndex = 0;
                    options.callback?.();
                }
            });
        });

        dlg.querySelectorAll('.menuSortOrder').forEach(el => {
            el.addEventListener('change', (e: any) => {
                if (e.target.checked) {
                    options.query.SortOrder = e.target.value;
                    options.query.StartIndex = 0;
                    options.callback?.();
                }
            });
        });
    });
}

const libraryBrowser = {
    showLayoutMenu,
    getQueryPagingHtml,
    showSortMenu
};

(window as any).LibraryBrowser = libraryBrowser;

export default libraryBrowser;
