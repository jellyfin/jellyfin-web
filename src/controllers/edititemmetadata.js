import loading from 'loading';
import layoutManager from 'layoutManager';
import * as userSettings from 'userSettings';
import 'scripts/editorsidebar';

function reload(context, itemId) {
    loading.show();

    if (itemId) {
        import('metadataEditor').then(({ default: metadataEditor }) => {
            metadataEditor.embed(context.querySelector('.editPageInnerContent'), itemId, ApiClient.serverInfo().Id);
        });
    } else {
        context.querySelector('.editPageInnerContent').innerHTML = '';
        loading.hide();
    }
}

export default function (view, params) {
    view.addEventListener('viewbeforeshow', function (e) {
        document.body.classList.remove('stickyDrawer');
    });
    view.addEventListener('viewshow', function () {
        reload(this, MetadataEditor.getCurrentItemId());
    });
    view.addEventListener('viewbeforehide', function (e) {
        if (layoutManager.desktop && userSettings.enableStickyDrawer()) {
            document.body.classList.add('stickyDrawer');
        }
    });
    MetadataEditor.setCurrentItemId(null);
    view.querySelector('.libraryTree').addEventListener('itemclicked', function (event) {
        var data = event.detail;

        if (data.id != MetadataEditor.getCurrentItemId()) {
            MetadataEditor.setCurrentItemId(data.id);
            reload(view, data.id);
        }
    });
}
