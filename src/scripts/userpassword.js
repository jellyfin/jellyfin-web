define(['jQuery', 'loading', 'libraryMenu'], function ($, loading, libraryMenu) {
    'use strict';

    /**
     * @param page
     * @param user
     */
    function loadUser (page, user) {
        libraryMenu.setTitle(user.Name);

        if (user.ConnectLinkType == 'Guest') {
            $('.connectMessage', page).show();
        } else {
            $('.connectMessage', page).hide();
        }

        loading.hide();
    }

    /**
     * @param page
     */
    function loadData (page) {
        loading.show();
        var userId = getParameterByName('userId');
        ApiClient.getUser(userId).then(function (user) {
            loadUser(page, user);
        });
    }

    $(document).on('pageinit', '#userPasswordPage', function () {
        $('.adminUpdatePasswordForm').off('submit', UpdatePasswordPage.onSubmit).on('submit', UpdatePasswordPage.onSubmit);
        $('.adminLocalAccessForm').off('submit', UpdatePasswordPage.onLocalAccessSubmit).on('submit', UpdatePasswordPage.onLocalAccessSubmit);
    }).on('pagebeforeshow', '#userPasswordPage', function () {
        loadData(this);
    });
});
