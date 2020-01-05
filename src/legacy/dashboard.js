Dashboard.confirm = function (message, title, callback) {
    'use strict';
    require(['confirm'], function (confirm) {
        confirm(message, title).then(function () {
            callback(true) // eslint-disable-line standard/no-callback-literal
        }, function () {
            callback(false) // eslint-disable-line standard/no-callback-literal
        })
    })
}, Dashboard.showLoadingMsg = function () {
    'use strict';
    require(['loading'], function (loading) {
        loading.show()
    })
}, Dashboard.hideLoadingMsg = function () {
    'use strict';
    require(['loading'], function (loading) {
        loading.hide()
    })
};
