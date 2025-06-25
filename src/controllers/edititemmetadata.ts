import loading from 'components/loading/loading';
import { getCurrentItemId, setCurrentItemId } from 'scripts/editorsidebar';

function reload(context, itemId) {
    loading.show();

    if (itemId) {
        import('../components/metadataEditor/metadataEditor').then(({ default: metadataEditor }) => {
            metadataEditor.embed(context.querySelector('.editPageInnerContent'), itemId, ApiClient.serverInfo().Id);
        });
    } else {
        context.querySelector('.editPageInnerContent').innerHTML = '';
        loading.hide();
    }
}

export default function (view) {
    view.addEventListener('viewshow', function () {
        reload(this, getCurrentItemId());
    });

    setCurrentItemId(null);

    view.querySelector('.libraryTree').addEventListener('itemclicked', function (event) {
        const data = event.detail;

        if (data.id != getCurrentItemId()) {
            setCurrentItemId(data.id);
            reload(view, data.id);
        }
    });
}
