import dom from 'dom';
import focusManager from 'focusManager';
import dialogHelper from 'dialogHelper';
import inputManager from 'inputManager';
import layoutManager from 'layoutManager';
import connectionManager from 'connectionManager';
import globalize from 'globalize';
import * as userSettings from 'userSettings';
import 'emby-checkbox';
import 'emby-input';
import 'paper-icon-button-light';
import 'emby-select';
import 'material-icons';
import 'css!./../formdialog';
import 'emby-button';
import 'flexStyles';

class FilterMenu {
    onSubmit(e) {
        e.preventDefault();
        return false;
    }
    renderOptions(context, selector, cssClass, items, isCheckedFn) {
        var elem = context.querySelector(selector);

        if (items.length) {
            elem.classList.remove('hide');
        } else {
            elem.classList.add('hide');
        }

        var html = '';

        html += items.map(function (filter) {
            var itemHtml = '';

            var checkedHtml = isCheckedFn(filter) ? ' checked' : '';
            itemHtml += '<label>';
            itemHtml += '<input is="emby-checkbox" type="checkbox"' + checkedHtml + ' data-filter="' + filter.Id + '" class="' + cssClass + '"/>';
            itemHtml += '<span>' + filter.Name + '</span>';
            itemHtml += '</label>';

            return itemHtml;
        }).join('');

        elem.querySelector('.filterOptions').innerHTML = html;
    }

    renderDynamicFilters(context, result, options) {
        this.renderOptions(context, '.genreFilters', 'chkGenreFilter', result.Genres, function (i) {
            // Switching from | to ,
            var delimeter = (options.settings.GenreIds || '').indexOf('|') === -1 ? ',' : '|';
            return (delimeter + (options.settings.GenreIds || '') + delimeter).indexOf(delimeter + i.Id + delimeter) !== -1;
        });
    }
    loadDynamicFilters(context, options) {
        var apiClient = connectionManager.getApiClient(options.serverId);

        var filterMenuOptions = Object.assign(options.filterMenuOptions, {

            UserId: apiClient.getCurrentUserId(),
            ParentId: options.parentId,
            IncludeItemTypes: options.itemTypes.join(',')
        });

        apiClient.getFilters(filterMenuOptions).then((result) => {
            this.renderDynamicFilters(context, result, options);
        });
    }

    initEditor(context, settings) {
        context.querySelector('form').addEventListener('submit', this.onSubmit);

        var elems = context.querySelectorAll('.simpleFilter');
        var i;
        var length;

        for (i = 0, length = elems.length; i < length; i++) {
            if (elems[i].tagName === 'INPUT') {
                elems[i].checked = settings[elems[i].getAttribute('data-settingname')] || false;
            } else {
                elems[i].querySelector('input').checked = settings[elems[i].getAttribute('data-settingname')] || false;
            }
        }

        var videoTypes = settings.VideoTypes ? settings.VideoTypes.split(',') : [];
        elems = context.querySelectorAll('.chkVideoTypeFilter');

        for (i = 0, length = elems.length; i < length; i++) {
            elems[i].checked = videoTypes.indexOf(elems[i].getAttribute('data-filter')) !== -1;
        }

        var seriesStatuses = settings.SeriesStatus ? settings.SeriesStatus.split(',') : [];
        elems = context.querySelectorAll('.chkSeriesStatus');

        for (i = 0, length = elems.length; i < length; i++) {
            elems[i].checked = seriesStatuses.indexOf(elems[i].getAttribute('data-filter')) !== -1;
        }

        if (context.querySelector('.basicFilterSection .viewSetting:not(.hide)')) {
            context.querySelector('.basicFilterSection').classList.remove('hide');
        } else {
            context.querySelector('.basicFilterSection').classList.add('hide');
        }

        if (context.querySelector('.featureSection .viewSetting:not(.hide)')) {
            context.querySelector('.featureSection').classList.remove('hide');
        } else {
            context.querySelector('.featureSection').classList.add('hide');
        }
    }

    saveValues(context, settings, settingsKey) {
        var elems = context.querySelectorAll('.simpleFilter');
        var i;
        var length;
        for (i = 0, length = elems.length; i < length; i++) {
            if (elems[i].tagName === 'INPUT') {
                this.setBasicFilter(context, settingsKey + '-filter-' + elems[i].getAttribute('data-settingname'), elems[i]);
            } else {
                this.setBasicFilter(context, settingsKey + '-filter-' + elems[i].getAttribute('data-settingname'), elems[i].querySelector('input'));
            }
        }

        // Video type
        var videoTypes = [];
        elems = context.querySelectorAll('.chkVideoTypeFilter');

        for (i = 0, length = elems.length; i < length; i++) {
            if (elems[i].checked) {
                videoTypes.push(elems[i].getAttribute('data-filter'));
            }
        }
        userSettings.setFilter(settingsKey + '-filter-VideoTypes', videoTypes.join(','));

        // Series status
        var seriesStatuses = [];
        elems = context.querySelectorAll('.chkSeriesStatus');

        for (i = 0, length = elems.length; i < length; i++) {
            if (elems[i].checked) {
                seriesStatuses.push(elems[i].getAttribute('data-filter'));
            }
        }

        // Genres
        var genres = [];
        elems = context.querySelectorAll('.chkGenreFilter');

        for (i = 0, length = elems.length; i < length; i++) {
            if (elems[i].checked) {
                genres.push(elems[i].getAttribute('data-filter'));
            }
        }
        userSettings.setFilter(settingsKey + '-filter-GenreIds', genres.join(','));
    }
    setBasicFilter(context, key, elem) {
        var value = elem.checked;
        value = value ? value : null;
        userSettings.setFilter(key, value);
    }
    moveCheckboxFocus(elem, offset) {
        var parent = dom.parentWithClass(elem, 'checkboxList-verticalwrap');
        var elems = focusManager.getFocusableElements(parent);

        var index = -1;
        for (var i = 0, length = elems.length; i < length; i++) {
            if (elems[i] === elem) {
                index = i;
                break;
            }
        }

        index += offset;

        index = Math.min(elems.length - 1, index);
        index = Math.max(0, index);

        var newElem = elems[index];
        if (newElem) {
            focusManager.focus(newElem);
        }
    }
    centerFocus(elem, horiz, on) {
        import('scrollHelper').then(({ default: scrollHelper }) => {
            var fn = on ? 'on' : 'off';
            scrollHelper.centerFocus[fn](elem, horiz);
        });
    }
    onInputCommand(e) {
        switch (e.detail.command) {
            case 'left':
                this.moveCheckboxFocus(e.target, -1);
                e.preventDefault();
                break;
            case 'right':
                this.moveCheckboxFocus(e.target, 1);
                e.preventDefault();
                break;
            default:
                break;
        }
    }
    bindCheckboxInput(context, on) {
        var elems = context.querySelectorAll('.checkboxList-verticalwrap');
        for (var i = 0, length = elems.length; i < length; i++) {
            if (on) {
                inputManager.on(elems[i], this.onInputCommand);
            } else {
                inputManager.off(elems[i], this.onInputCommand);
            }
        }
    }
    show(options) {
        return new Promise( (resolve, reject) => {
            import('text!./filtermenu.template.html').then(({ default: template }) => {
                var dialogOptions = {
                    removeOnClose: true,
                    scrollY: false
                };
                if (layoutManager.tv) {
                    dialogOptions.size = 'fullscreen';
                } else {
                    dialogOptions.size = 'small';
                }

                var dlg = dialogHelper.createDialog(dialogOptions);

                dlg.classList.add('formDialog');

                var html = '';

                html += '<div class="formDialogHeader">';
                html += '<button is="paper-icon-button-light" class="btnCancel hide-mouse-idle-tv" tabindex="-1"><span class="material-icons arrow_back"></span></button>';
                html += '<h3 class="formDialogHeaderTitle">${Filters}</h3>';

                html += '</div>';

                html += template;

                dlg.innerHTML = globalize.translateHtml(html, 'core');

                var settingElements = dlg.querySelectorAll('.viewSetting');
                for (var i = 0, length = settingElements.length; i < length; i++) {
                    if (options.visibleSettings.indexOf(settingElements[i].getAttribute('data-settingname')) === -1) {
                        settingElements[i].classList.add('hide');
                    } else {
                        settingElements[i].classList.remove('hide');
                    }
                }

                this.initEditor(dlg, options.settings);
                this.loadDynamicFilters(dlg, options);

                this.bindCheckboxInput(dlg, true);
                dlg.querySelector('.btnCancel').addEventListener('click', function () {
                    dialogHelper.close(dlg);
                });

                if (layoutManager.tv) {
                    this.centerFocus(dlg.querySelector('.formDialogContent'), false, true);
                }

                var submitted;

                dlg.querySelector('form').addEventListener('change', function () {
                    submitted = true;
                }, true);

                dialogHelper.open(dlg).then( () => {
                    this.bindCheckboxInput(dlg, false);

                    if (layoutManager.tv) {
                        this.centerFocus(dlg.querySelector('.formDialogContent'), false, false);
                    }

                    if (submitted) {
                        //if (!options.onChange) {
                        this.saveValues(dlg, options.settings, options.settingsKey);
                        return resolve();
                        //}
                    }
                    return resolve();
                });
            });
        });
    }
}

export default FilterMenu;
