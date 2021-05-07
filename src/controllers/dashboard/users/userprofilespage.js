import loading from '../../../components/loading/loading';
import dom from '../../../scripts/dom';
import globalize from '../../../scripts/globalize';
import { formatDistanceToNow } from 'date-fns';
import { localeWithSuffix } from '../../../scripts/dfnshelper';
import '../../../elements/emby-button/paper-icon-button-light';
import '../../../components/cardbuilder/card.scss';
import '../../../elements/emby-button/emby-button';
import '../../../components/indicators/indicators.scss';
import '../../../assets/css/flexstyles.scss';
import Dashboard, { pageIdOn } from '../../../scripts/clientUtils';
import confirm from '../../../components/confirm/confirm';
import cardBuilder from '../../../components/cardbuilder/cardBuilder';

/* eslint-disable indent */

    function deleteUser(page, id) {
        const msg = globalize.translate('DeleteUserConfirmation');

        confirm({
            title: globalize.translate('DeleteUser'),
            text: msg,
            confirmText: globalize.translate('Delete'),
            primary: 'delete'
        }).then(function () {
            loading.show();
            ApiClient.deleteUser(id).then(function () {
                loadData(page);
            });
        });
    }

    function showUserMenu(elem) {
        const card = dom.parentWithClass(elem, 'card');
        const page = dom.parentWithClass(card, 'page');
        const userId = card.getAttribute('data-userid');
        const menuItems = [];
        menuItems.push({
            name: globalize.translate('ButtonOpen'),
            id: 'open',
            icon: 'mode_edit'
        });
        menuItems.push({
            name: globalize.translate('ButtonLibraryAccess'),
            id: 'access',
            icon: 'lock'
        });
        menuItems.push({
            name: globalize.translate('ButtonParentalControl'),
            id: 'parentalcontrol',
            icon: 'person'
        });
        menuItems.push({
            name: globalize.translate('Delete'),
            id: 'delete',
            icon: 'delete'
        });

        import('../../../components/actionSheet/actionSheet').then(({default: actionsheet}) => {
            actionsheet.show({
                items: menuItems,
                positionTo: card,
                callback: function (id) {
                    switch (id) {
                        case 'open':
                            Dashboard.navigate('useredit.html?userId=' + userId);
                            break;

                        case 'access':
                            Dashboard.navigate('userlibraryaccess.html?userId=' + userId);
                            break;

                        case 'parentalcontrol':
                            Dashboard.navigate('userparentalcontrol.html?userId=' + userId);
                            break;

                        case 'delete':
                            deleteUser(page, userId);
                    }
                }
            });
        });
    }

    function getUserHtml(user) {
        let html = '';
        let cssClass = 'card squareCard scalableCard squareCard-scalable';

        if (user.Policy.IsDisabled) {
            cssClass += ' grayscale';
        }

        html += "<div data-userid='" + user.Id + "' class='" + cssClass + "'>";
        html += '<div class="cardBox visualCardBox">';
        html += '<div class="cardScalable visualCardBox-cardScalable">';
        html += '<div class="cardPadder cardPadder-square"></div>';
        html += `<a is="emby-linkbutton" class="cardContent ${imgUrl ? '' : cardBuilder.getDefaultBackgroundClass()}" href="#!/useredit.html?userId=${user.Id}">`;
        let imgUrl;

        if (user.PrimaryImageTag) {
            imgUrl = ApiClient.getUserImageUrl(user.Id, {
                width: 300,
                tag: user.PrimaryImageTag,
                type: 'Primary'
            });
        }

        let imageClass = 'cardImage';

        if (user.Policy.IsDisabled) {
            imageClass += ' disabledUser';
        }

        if (imgUrl) {
            html += '<div class="' + imageClass + '" style="background-image:url(\'' + imgUrl + "');\">";
        } else {
            html += `<div class="${imageClass} ${imgUrl ? '' : cardBuilder.getDefaultBackgroundClass()} flex align-items-center justify-content-center">`;
            html += '<span class="material-icons cardImageIcon person"></span>';
        }

        html += '</div>';
        html += '</a>';
        html += '</div>';
        html += '<div class="cardFooter visualCardBox-cardFooter">';
        html += '<div class="cardText flex align-items-center">';
        html += '<div class="flex-grow" style="overflow:hidden;text-overflow:ellipsis;">';
        html += user.Name;
        html += '</div>';
        html += '<button type="button" is="paper-icon-button-light" class="btnUserMenu flex-shrink-zero"><span class="material-icons more_vert"></span></button>';
        html += '</div>';
        html += '<div class="cardText cardText-secondary">';
        const lastSeen = getLastSeenText(user.LastActivityDate);
        html += lastSeen != '' ? lastSeen : '&nbsp;';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        return html + '</div>';
    }
    // FIXME: It seems that, sometimes, server sends date in the future, so date-fns displays messages like 'in less than a minute'. We should fix
    // how dates are returned by the server when the session is active and show something like 'Active now', instead of past/future sentences
    function getLastSeenText(lastActivityDate) {
        if (lastActivityDate) {
            return globalize.translate('LastSeen', formatDistanceToNow(Date.parse(lastActivityDate), localeWithSuffix));
        }

        return '';
    }

    function getUserSectionHtml(users) {
        return users.map(function (u__q) {
            return getUserHtml(u__q);
        }).join('');
    }

    function renderUsers(page, users) {
        page.querySelector('.localUsers').innerHTML = getUserSectionHtml(users);
    }

    function loadData(page) {
        loading.show();
        ApiClient.getUsers().then(function (users) {
            renderUsers(page, users);
            loading.hide();
        });
    }

    pageIdOn('pageinit', 'userProfilesPage', function () {
        const page = this;
        page.querySelector('.btnAddUser').addEventListener('click', function() {
            Dashboard.navigate('usernew.html');
        });
        page.querySelector('.localUsers').addEventListener('click', function (e__e) {
            const btnUserMenu = dom.parentWithClass(e__e.target, 'btnUserMenu');

            if (btnUserMenu) {
                showUserMenu(btnUserMenu);
            }
        });
    });

    pageIdOn('pagebeforeshow', 'userProfilesPage', function () {
        loadData(this);
    });

/* eslint-enable indent */
