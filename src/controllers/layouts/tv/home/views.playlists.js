import {getplaylists} from './imagehelper';
import cardBuilder from 'cardBuilder';
import focusManager from 'focusManager';

function loadAll(element, parentId) {
    const options = {
        ParentId: parentId,
        EnableImageTypes: 'Primary,Backdrop,Thumb',
        SortBy: 'SortName'
    };
    return getplaylists(options).then(({Items}) => {
        const section = element.querySelector('.allSection');
        if (!section) {
            return;
        }
        cardBuilder.buildCards(Items, {
            parentContainer: section,
            itemsContainer: section.querySelector('.itemsContainer'),
            shape: 'auto',
            showTitle: true,
            overlayText: true,
            rows: {
                portrait: 2,
                square: 3,
                backdrop: 3
            },
            scalable: false
        });
        return;
    });
}

export class PlaylistsView {
    constructor(element, parentId, autoFocus) {
        if (autoFocus) {
            focusManager.autoFocus(element);
        }
        this.loadData = isRefresh => {
            if (isRefresh) {
                return Promise.resolve();
            }
            return loadAll(element, parentId);
        };
    }

    destroy() { }
}

export default PlaylistsView;
