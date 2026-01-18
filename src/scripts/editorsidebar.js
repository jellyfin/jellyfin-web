import escapeHtml from 'escape-html';
import 'jquery';
import 'material-design-icons-iconfont';

import globalize from 'lib/globalize';
import Dashboard from 'utils/dashboard';
import { getParameterByName } from 'utils/url';

// Disable the naming rules since jstree requires snake_case variables
/* eslint-disable @typescript-eslint/naming-convention */
function getNode(item, folderState, selected) {
    const htmlName = getNodeInnerHtml(item);
    const node = {
        id: item.Id,
        text: htmlName,
        state: {
            opened: item.IsFolder && folderState == 'open',
            selected: selected
        },
        li_attr: {
            serveritemtype: item.Type,
            collectiontype: item.CollectionType
        }
    };
    if (item.IsFolder) {
        node.children = [{
            text: 'Loading...',
            icon: false
        }];
        node.icon = false;
    } else {
        node.icon = false;
    }
    if (node.state.opened) {
        node.li_attr.loadedFromServer = true;
    }
    if (selected) {
        selectedNodeId = item.Id;
    }
    return node;
}

function getNodeInnerHtml(item) {
    let name = item.Name;
    if (item.Number) {
        name = item.Number + ' - ' + name;
    }
    if (item.IndexNumber != null && item.Type != 'Season') {
        name = item.IndexNumber + ' - ' + name;
    }
    let htmlName = "<div class='editorNode'>";
    if (item.IsFolder) {
        htmlName += '<span class="material-icons metadataSidebarIcon folder" aria-hidden="true"></span>';
    } else if (item.MediaType === 'Video') {
        htmlName += '<span class="material-icons metadataSidebarIcon movie" aria-hidden="true"></span>';
    } else if (item.MediaType === 'Audio') {
        htmlName += '<span class="material-icons metadataSidebarIcon audiotrack" aria-hidden="true"></span>';
    } else if (item.Type === 'TvChannel') {
        htmlName += '<span class="material-icons metadataSidebarIcon live_tv" aria-hidden="true"></span>';
    } else if (item.MediaType === 'Photo') {
        htmlName += '<span class="material-icons metadataSidebarIcon photo" aria-hidden="true"></span>';
    } else if (item.MediaType === 'Book') {
        htmlName += '<span class="material-icons metadataSidebarIcon book" aria-hidden="true"></span>';
    }
    if (item.LockData) {
        htmlName += '<span class="material-icons metadataSidebarIcon lock" aria-hidden="true"></span>';
    }
    htmlName += escapeHtml(name);
    htmlName += '</div>';
    return htmlName;
}

function loadChildrenOfRootNode(page, scope, callback) {
    ApiClient.getLiveTvChannels({
        limit: 0
    }).then((result) => {
        const nodes = [];
        nodes.push({
            id: 'MediaFolders',
            text: globalize.translate('HeaderMediaFolders'),
            state: {
                opened: true
            },
            li_attr: {
                itemtype: 'mediafolders',
                loadedFromServer: true
            },
            icon: false
        });
        if (result.TotalRecordCount) {
            nodes.push({
                id: 'livetv',
                text: globalize.translate('LiveTV'),
                state: {
                    opened: false
                },
                li_attr: {
                    itemtype: 'livetv'
                },
                children: [{
                    text: 'Loading...',
                    icon: false
                }],
                icon: false
            });
        }
        callback.call(scope, nodes);
        nodesToLoad.push('MediaFolders');
    });
}

function loadLiveTvChannels(service, openItems, callback) {
    ApiClient.getLiveTvChannels({
        ServiceName: service,
        AddCurrentProgram: false
    }).then((result) => {
        const nodes = result.Items.map((i) => {
            const state = openItems.indexOf(i.Id) == -1 ? 'closed' : 'open';
            return getNode(i, state, false);
        });
        callback(nodes);
    });
}

function loadMediaFolders(page, scope, openItems, callback) {
    ApiClient.getJSON(ApiClient.getUrl('Library/MediaFolders')).then((result) => {
        const nodes = result.Items.map((n) => {
            const state = openItems.indexOf(n.Id) == -1 ? 'closed' : 'open';
            return getNode(n, state, false);
        });
        callback.call(scope, nodes);
        for (let i = 0, length = nodes.length; i < length; i++) {
            if (nodes[i].state.opened) {
                nodesToLoad.push(nodes[i].id);
            }
        }
    });
}

function loadNode(page, scope, node, openItems, selectedId, currentUser, callback) {
    const id = node.id;
    if (id == '#') {
        loadChildrenOfRootNode(page, scope, callback);
        return;
    }
    if (id == 'livetv') {
        loadLiveTvChannels(id, openItems, callback);
        return;
    }
    if (id == 'MediaFolders') {
        loadMediaFolders(page, scope, openItems, callback);
        return;
    }
    const query = {
        ParentId: id,
        Fields: 'Settings',
        IsVirtualUnaired: false,
        IsMissing: false,
        EnableTotalRecordCount: false,
        EnableImages: false,
        EnableUserData: false
    };
    const itemtype = node.li_attr.itemtype;
    if (itemtype != 'Season' && itemtype != 'Series') {
        query.SortBy = 'SortName';
    }
    ApiClient.getItems(Dashboard.getCurrentUserId(), query).then((result) => {
        const nodes = result.Items.map((n) => {
            const state = openItems.indexOf(n.Id) == -1 ? 'closed' : 'open';
            return getNode(n, state, n.Id == selectedId);
        });
        callback.call(scope, nodes);
        for (let i = 0, length = nodes.length; i < length; i++) {
            if (nodes[i].state.opened) {
                nodesToLoad.push(nodes[i].id);
            }
        }
    });
}

function scrollToNode(id) {
    const elem = $('#' + id)[0];
    if (elem) {
        elem.scrollIntoView();
    }
}

function initializeTree(page, currentUser, openItems, selectedId) {
    Promise.all([
        import('jstree'),
        import('jstree/dist/themes/default/style.css')
    ]).then(() => {
        initializeTreeInternal(page, currentUser, openItems, selectedId);
    });
}

function onNodeSelect(event, data) {
    const node = data.node;
    const eventData = {
        id: node.id,
        itemType: node.li_attr.itemtype,
        serverItemType: node.li_attr.serveritemtype,
        collectionType: node.li_attr.collectiontype
    };
    if (eventData.itemType != 'livetv' && eventData.itemType != 'mediafolders') {
        {
            this.dispatchEvent(new CustomEvent('itemclicked', {
                detail: eventData,
                bubbles: true,
                cancelable: false
            }));
        }
        document.querySelector('.editPageSidebar').classList.add('editPageSidebar-withcontent');
    } else {
        document.querySelector('.editPageSidebar').classList.remove('editPageSidebar-withcontent');
    }
}

function onNodeOpen(_, data) {
    const page = $(this).parents('.page')[0];
    const node = data.node;
    if (node.children) {
        loadNodesToLoad(page, node);
    }
    if (node.li_attr && node.id != '#' && !node.li_attr.loadedFromServer) {
        node.li_attr.loadedFromServer = true;
        $.jstree.reference('.libraryTree', page).load_node(node.id, loadNodeCallback);
    }
}

function initializeTreeInternal(page, currentUser, openItems, selectedId) {
    nodesToLoad = [];
    selectedNodeId = null;
    $.jstree.destroy();
    $('.libraryTree', page).jstree({
        'plugins': ['wholerow'],
        core: {
            check_callback: true,
            data: function (node, callback) {
                loadNode(page, this, node, openItems, selectedId, currentUser, callback);
            },
            themes: {
                variant: 'large'
            }
        }
    })
        .off('select_node.jstree', onNodeSelect)
        .on('select_node.jstree', onNodeSelect)
        .off('open_node.jstree', onNodeOpen)
        .on('open_node.jstree', onNodeOpen)
        .off('load_node.jstree', onNodeOpen)
        .on('load_node.jstree', onNodeOpen);
}

function loadNodesToLoad(page, node) {
    const children = node.children;
    for (let i = 0, length = children.length; i < length; i++) {
        const child = children[i];
        if (nodesToLoad.indexOf(child) != -1) {
            nodesToLoad = nodesToLoad.filter((n) => {
                return n != child;
            });
            $.jstree.reference('.libraryTree', page).load_node(child, loadNodeCallback);
        }
    }
}

function loadNodeCallback(node) {
    if (selectedNodeId && node.children && node.children.indexOf(selectedNodeId) != -1) {
        setTimeout(() => {
            scrollToNode(selectedNodeId);
        }, 500);
    }
}

function updateEditorNode(page, item) {
    const elem = $('#' + item.Id + '>a', page)[0];
    if (elem == null) {
        return;
    }
    $('.editorNode', elem).remove();
    $(elem).append(getNodeInnerHtml(item));
    if (item.IsFolder) {
        const tree = jQuery.jstree._reference('.libraryTree');
        const currentNode = tree._get_node(null, false);
        tree.refresh(currentNode);
    }
}

let itemId;
export function setCurrentItemId(id) {
    itemId = id;
}

export function getCurrentItemId() {
    if (itemId) {
        return itemId;
    }
    return getParameterByName('id');
}

let nodesToLoad = [];
let selectedNodeId;
$(document).on('itemsaved', '.metadataEditorPage', function (e, item) {
    updateEditorNode(this, item);
}).on('pagebeforeshow', '.metadataEditorPage', () => {
    import('../styles/metadataeditor.scss');
}).on('pagebeforeshow', '.metadataEditorPage', function () {
    const page = this;
    Dashboard.getCurrentUser().then((user) => {
        if (!user) {
            return;
        }

        const id = getCurrentItemId();
        if (id) {
            ApiClient.getAncestorItems(id, user.Id).then((ancestors) => {
                const ids = ancestors.map((i) => {
                    return i.Id;
                });
                initializeTree(page, user, ids, id);
            });
        } else {
            initializeTree(page, user, []);
        }
    });
}).on('pagebeforehide', '.metadataEditorPage', function () {
    const page = this;
    $('.libraryTree', page)
        .off('select_node.jstree', onNodeSelect)
        .off('open_node.jstree', onNodeOpen)
        .off('load_node.jstree', onNodeOpen);
});
/* eslint-enable @typescript-eslint/naming-convention */
