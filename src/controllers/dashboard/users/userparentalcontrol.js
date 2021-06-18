import datetime from '../../../scripts/datetime';
import loading from '../../../components/loading/loading';
import libraryMenu from '../../../scripts/libraryMenu';
import globalize from '../../../scripts/globalize';
import '../../../components/listview/listview.scss';
import '../../../elements/emby-button/paper-icon-button-light';
import toast from '../../../components/toast/toast';

function populateRatings(allParentalRatings, page) {
    let html = '';
    html += "<option value=''></option>";
    let rating;
    const ratings = [];

    for (let i = 0, length = allParentalRatings.length; i < length; i++) {
        if (rating = allParentalRatings[i], ratings.length) {
            const lastRating = ratings[ratings.length - 1];

            if (lastRating.Value === rating.Value) {
                lastRating.Name += '/' + rating.Name;
                continue;
            }
        }

        ratings.push({
            Name: rating.Name,
            Value: rating.Value
        });
    }

    for (let i = 0, length = ratings.length; i < length; i++) {
        rating = ratings[i];
        html += "<option value='" + rating.Value + "'>" + rating.Name + '</option>';
    }

    const selectMaxParentalRating = page.querySelector('#selectMaxParentalRating');
    selectMaxParentalRating.innerHTML = html;
}

function loadUnratedItems(page, user) {
    const items = [{
        name: globalize.translate('Books'),
        value: 'Book'
    }, {
        name: globalize.translate('Channels'),
        value: 'ChannelContent'
    }, {
        name: globalize.translate('LiveTV'),
        value: 'LiveTvChannel'
    }, {
        name: globalize.translate('Movies'),
        value: 'Movie'
    }, {
        name: globalize.translate('Music'),
        value: 'Music'
    }, {
        name: globalize.translate('Trailers'),
        value: 'Trailer'
    }, {
        name: globalize.translate('Shows'),
        value: 'Series'
    }];
    let html = '';
    html += '<h3 class="checkboxListLabel">' + globalize.translate('HeaderBlockItemsWithNoRating') + '</h3>';
    html += '<div class="checkboxList paperList checkboxList-paperList">';

    for (let i = 0, length = items.length; i < length; i++) {
        const item = items[i];
        const checkedAttribute = user.Policy.BlockUnratedItems.indexOf(item.value) != -1 ? ' checked="checked"' : '';
        html += '<label><input type="checkbox" is="emby-checkbox" class="chkUnratedItem" data-itemtype="' + item.value + '" type="checkbox"' + checkedAttribute + '><span>' + item.name + '</span></label>';
    }

    html += '</div>';

    const blockUnratedItems = page.querySelector('.blockUnratedItems');
    blockUnratedItems.innerHTML = html;
    blockUnratedItems.dispatchEvent(new CustomEvent('create'));
}

function loadUser(page, user, allParentalRatings) {
    page.querySelector('.username').innerHTML = user.Name;
    libraryMenu.setTitle(user.Name);
    loadUnratedItems(page, user);
    loadBlockedTags(page, user.Policy.BlockedTags);
    populateRatings(allParentalRatings, page);
    let ratingValue = '';

    if (user.Policy.MaxParentalRating) {
        for (let i = 0, length = allParentalRatings.length; i < length; i++) {
            const rating = allParentalRatings[i];

            if (user.Policy.MaxParentalRating >= rating.Value) {
                ratingValue = rating.Value;
            }
        }
    }

    page.querySelector('#selectMaxParentalRating').value = ratingValue;

    if (user.Policy.IsAdministrator) {
        page.querySelector('.accessScheduleSection').classList.add('hide');
    } else {
        page.querySelector('.accessScheduleSection').classList.remove('hide');
    }

    renderAccessSchedule(page, user.Policy.AccessSchedules || []);
    loading.hide();
}

function loadBlockedTags(page, tags) {
    let html = tags.map(function (h) {
        let li = '<div class="listItem">';
        li += '<div class="listItemBody">';
        li += '<h3 class="listItemBodyText">';
        li += h;
        li += '</h3>';
        li += '</div>';
        li += '<button type="button" is="paper-icon-button-light" class="blockedTag btnDeleteTag listItemButton" data-tag="' + h + '"><span class="material-icons delete"></span></button>';
        return li += '</div>';
    }).join('');

    if (html) {
        html = '<div class="paperList">' + html + '</div>';
    }

    const blockedTags = page.querySelector('.blockedTags');
    blockedTags.innerHTML = html;

    for (const btnDeleteTag of blockedTags.querySelectorAll('.btnDeleteTag')) {
        btnDeleteTag.addEventListener('click', function () {
            const tag = this.getAttribute('data-tag');
            const newTags = tags.filter(function (t) {
                return t != tag;
            });
            loadBlockedTags(page, newTags);
        });
    }
}

function deleteAccessSchedule(page, schedules, index) {
    schedules.splice(index, 1);
    renderAccessSchedule(page, schedules);
}

function renderAccessSchedule(page, schedules) {
    let html = '';
    let index = 0;
    html += schedules.map(function (a) {
        let itemHtml = '';
        itemHtml += '<div class="liSchedule listItem" data-day="' + a.DayOfWeek + '" data-start="' + a.StartHour + '" data-end="' + a.EndHour + '">';
        itemHtml += '<div class="listItemBody two-line">';
        itemHtml += '<h3 class="listItemBodyText">';
        itemHtml += globalize.translate('Option' + a.DayOfWeek);
        itemHtml += '</h3>';
        itemHtml += '<div class="listItemBodyText secondary">' + getDisplayTime(a.StartHour) + ' - ' + getDisplayTime(a.EndHour) + '</div>';
        itemHtml += '</div>';
        itemHtml += '<button type="button" is="paper-icon-button-light" class="btnDelete listItemButton" data-index="' + index + '"><span class="material-icons delete"></span></button>';
        itemHtml += '</div>';
        index++;
        return itemHtml;
    }).join('');
    const accessScheduleList = page.querySelector('.accessScheduleList');
    accessScheduleList.innerHTML = html;
    for (const btnDelete of accessScheduleList.querySelectorAll('.btnDelete')) {
        btnDelete.addEventListener('click', function () {
            deleteAccessSchedule(page, schedules, parseInt(this.getAttribute('data-index')));
        });
    }
}

function onSaveComplete() {
    loading.hide();
    toast(globalize.translate('SettingsSaved'));
}

function saveUser(user, page) {
    user.Policy.MaxParentalRating = page.querySelector('#selectMaxParentalRating').value || null;
    user.Policy.BlockUnratedItems = Array.prototype.filter.call(page.querySelectorAll('.chkUnratedItem'), function (i) {
        return i.checked;
    }).map(function (i) {
        return i.getAttribute('data-itemtype');
    });
    user.Policy.AccessSchedules = getSchedulesFromPage(page);
    user.Policy.BlockedTags = getBlockedTagsFromPage(page);
    ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
        onSaveComplete();
    });
}

function getDisplayTime(hours) {
    let minutes = 0;
    const pct = hours % 1;

    if (pct) {
        minutes = parseInt(60 * pct);
    }

    return datetime.getDisplayTime(new Date(2000, 1, 1, hours, minutes, 0, 0));
}

function showSchedulePopup(page, schedule, index) {
    schedule = schedule || {};
    import('../../../components/accessSchedule/accessSchedule').then(({default: accessschedule}) => {
        accessschedule.show({
            schedule: schedule
        }).then(function (updatedSchedule) {
            const schedules = getSchedulesFromPage(page);

            if (index == -1) {
                index = schedules.length;
            }

            schedules[index] = updatedSchedule;
            renderAccessSchedule(page, schedules);
        });
    });
}

function getSchedulesFromPage(page) {
    return Array.prototype.map.call(page.querySelectorAll('.liSchedule'), function (elem) {
        return {
            DayOfWeek: elem.getAttribute('data-day'),
            StartHour: elem.getAttribute('data-start'),
            EndHour: elem.getAttribute('data-end')
        };
    });
}

function getBlockedTagsFromPage(page) {
    return Array.prototype.map.call(page.querySelectorAll('.blockedTag'), function (elem) {
        return elem.getAttribute('data-tag');
    });
}

function showBlockedTagPopup(page) {
    import('../../../components/prompt/prompt').then(({default: prompt}) => {
        prompt({
            label: globalize.translate('LabelTag')
        }).then(function (value) {
            const tags = getBlockedTagsFromPage(page);

            if (tags.indexOf(value) == -1) {
                tags.push(value);
                loadBlockedTags(page, tags);
            }
        });
    });
}

window.UserParentalControlPage = {
    onSubmit: function (e) {
        const page = this.closest('#userParentalControlPage');
        loading.show();
        const userId = getParameterByName('userId');
        ApiClient.getUser(userId).then(function (result) {
            saveUser(result, page);
        });
        e.preventDefault();
        e.stopPropagation();
        return false;
    }
};

export default function (view) {
    view.querySelector('.btnAddSchedule').addEventListener('click', function () {
        showSchedulePopup(view, {}, -1);
    });

    view.querySelector('.btnAddBlockedTag').addEventListener('click', function () {
        showBlockedTagPopup(view);
    });

    view.querySelector('.userParentalControlForm').addEventListener('submit', UserParentalControlPage.onSubmit);

    view.addEventListener('viewshow', function () {
        const page = this;
        loading.show();
        const userId = getParameterByName('userId');
        const promise1 = ApiClient.getUser(userId);
        const promise2 = ApiClient.getParentalRatings();
        Promise.all([promise1, promise2]).then(function (responses) {
            loadUser(page, responses[0], responses[1]);
        });
    });
}

