define(["controllers/userpasswordpage", "loading", "libraryMenu", "apphost", "emby-button"], function (Userpasswordpage, loading, libraryMenu, appHost) {
    "use strict";

    function reloadUser(page) {
        var userId = getParameterByName("userId");
        loading.show();
        ApiClient.getUser(userId).then(function (user) {
            page.querySelector(".username").innerHTML = user.Name;
            var uploadUserImage = page.querySelector("#uploadUserImage");
            uploadUserImage.value = "";
            uploadUserImage.dispatchEvent(new CustomEvent("change", {}));
            libraryMenu.setTitle(user.Name);
            var imageUrl = "img/logindefault.png";
            if (user.PrimaryImageTag) {
                imageUrl = ApiClient.getUserImageUrl(user.Id, {
                    height: 200,
                    tag: user.PrimaryImageTag,
                    type: "Primary"
                });
            }
            var fldImage = page.querySelector("#fldImage");
            fldImage.classList.remove("hide");
            fldImage.innerHTML = "<img width='140px' src='" + imageUrl + "' />";
            Dashboard.getCurrentUser().then(function (loggedInUser) {
                if (appHost.supports("fileinput") && (loggedInUser.Policy.IsAdministrator || user.Policy.EnableUserPreferenceAccess)) {
                    page.querySelector(".newImageForm").classList.remove("hide");

                    if (user.PrimaryImageTag) {
                        page.querySelector("#btnDeleteImage").classList.remove("hide");
                    } else {
                        page.querySelector("#btnDeleteImage").classList.add("hide");
                    }
                } else {
                    page.querySelector(".newImageForm").classList.add("hide");
                    page.querySelector("#btnDeleteImage").classList.add("hide");
                }
            });
            loading.hide();
        });
    }

    function onFileReaderError(evt) {
        loading.hide();
        switch (evt.target.error.code) {
            case evt.target.error.NOT_FOUND_ERR:
                require(["toast"], function (toast) {
                    toast(Globalize.translate("FileNotFound"));
                });
                break;
            case evt.target.error.NOT_READABLE_ERR:
                require(["toast"], function (toast) {
                    toast(Globalize.translate("FileReadError"));
                });
                break;
            case evt.target.error.ABORT_ERR:
                break;
            default:
                require(["toast"], function (toast) {
                    toast(Globalize.translate("FileReadError"));
                });
        }
    }

    function onFileReaderAbort(evt) {
        loading.hide();

        require(["toast"], function (toast) {
            toast(Globalize.translate("FileReadCancelled"));
        });
    }

    function setFiles(page, files) {
        var file = files[0];

        if (!file || !file.type.match("image.*")) {
            page.querySelector("#userImageOutput").innerHTML = "";
            page.querySelector("#fldUpload").classList.add("hide");
            return void (currentFile = null);
        }

        currentFile = file;
        var reader = new FileReader();
        reader.onerror = onFileReaderError;

        reader.onloadstart = function () {
            page.querySelector("#fldUpload").classList.add("hide");
        };

        reader.onabort = onFileReaderAbort;

        reader.onload = function (evt) {
            var html = ['<img style="max-width:100%;max-height:100%;" src="', evt.target.result, '" title="', escape(file.name), '"/>'].join("");
            page.querySelector("#userImageOutput").innerHTML = html;
            page.querySelector("#fldUpload").classList.remove("hide");
        };

        reader.readAsDataURL(file);
    }

    function onImageDragOver(evt) {
        evt.preventDefault();
        evt.originalEvent.dataTransfer.dropEffect = "Copy";
        return false;
    }

    var currentFile;
    return function (view, params) {
        reloadUser(view);
        new Userpasswordpage(view, params);
        view.querySelector("#userImageDropZone").addEventListener("dragOver", onImageDragOver);
        view.querySelector("#btnDeleteImage").addEventListener("click", function () {
            require(["confirm"], function (confirm) {
                confirm(Globalize.translate("DeleteImageConfirmation"), Globalize.translate("DeleteImage")).then(function () {
                    loading.show();
                    var userId = getParameterByName("userId");
                    ApiClient.deleteUserImage(userId, "primary").then(function () {
                        loading.hide();
                        reloadUser(view);
                    });
                });
            });
        });
        view.querySelector(".btnBrowse").addEventListener("click", function () {
            view.querySelector("#uploadUserImage").click();
        });
        view.querySelector(".newImageForm").addEventListener("submit", function (evt) {
            var file = currentFile;
            if (!file || "image/png" != file.type && "image/jpeg" != file.type && "image/jpeg" != file.type) {
                return false;
            }

            loading.show();
            var userId = getParameterByName("userId");
            ApiClient.uploadUserImage(userId, "Primary", file).then(function () {
                loading.hide();
                reloadUser(view);
            });
            evt.preventDefault();
            return false;
        });
        view.querySelector("#uploadUserImage").addEventListener("change", function (evt) {
            setFiles(view, evt.target.files);
        });
    };
});
