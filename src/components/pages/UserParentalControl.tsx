import React, { FunctionComponent, useCallback, useEffect, useState, useRef } from 'react';
import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import { appRouter } from '../appRouter';
import AccessScheduleList from '../dashboard/users/AccessScheduleList';
import BlockedTagList from '../dashboard/users/BlockedTagList';
import ButtonElement from '../dashboard/users/ButtonElement';
import CheckBoxListItem from '../dashboard/users/CheckBoxListItem';
import SectionTitleButtonElement from '../dashboard/users/SectionTitleButtonElement';
import SectionTitleLinkElement from '../dashboard/users/SectionTitleLinkElement';
import SelectMaxParentalRating from '../dashboard/users/SelectMaxParentalRating';
import SectionTabs from '../dashboard/users/SectionTabs';
import loading from '../loading/loading';
import toast from '../toast/toast';

type Ratings = {
    Name: string;
    Value: string;
}

type ItemsArr = {
    name: string;
    value: string;
    checkedAttribute: string
}

const UserParentalControl: FunctionComponent = () => {
    const [ userName, setUserName ] = useState('');
    const [ parentalRatings, setParentalRatings ] = useState([]);
    const [ unratedItems, setUnratedItems ] = useState([]);
    const [ accessSchedules, setAccessSchedules ] = useState([]);
    const [ blockedTags, setBlockedTags ] = useState([]);

    const element = useRef(null);

    const populateRatings = useCallback((allParentalRatings) => {
        let rating;
        const ratings: Ratings[] = [];

        for (let i = 0, length = allParentalRatings.length; i < length; i++) {
            rating = allParentalRatings[i];

            if (ratings.length) {
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

        setParentalRatings(ratings);
    }, []);

    const loadUnratedItems = useCallback((user) => {
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

        const itemsArr: ItemsArr[] = [];

        for (const item of items) {
            const isChecked = user.Policy.BlockUnratedItems.indexOf(item.value) != -1;
            const checkedAttribute = isChecked ? ' checked="checked"' : '';
            itemsArr.push({
                value: item.value,
                name: item.name,
                checkedAttribute: checkedAttribute
            });
        }

        setUnratedItems(itemsArr);

        const blockUnratedItems = element?.current?.querySelector('.blockUnratedItems');
        blockUnratedItems.dispatchEvent(new CustomEvent('create'));
    }, []);

    const loadBlockedTags = useCallback((tags) => {
        setBlockedTags(tags);

        const blockedTagsElem = element?.current?.querySelector('.blockedTags');

        for (const btnDeleteTag of blockedTagsElem.querySelectorAll('.btnDeleteTag')) {
            btnDeleteTag.addEventListener('click', function () {
                const tag = btnDeleteTag.getAttribute('data-tag');
                const newTags = tags.filter(function (t) {
                    return t != tag;
                });
                loadBlockedTags(newTags);
            });
        }
    }, []);

    const renderAccessSchedule = useCallback((schedules) => {
        setAccessSchedules(schedules);

        const accessScheduleList = element?.current?.querySelector('.accessScheduleList');

        for (const btnDelete of accessScheduleList.querySelectorAll('.btnDelete')) {
            btnDelete.addEventListener('click', function () {
                const index = parseInt(btnDelete.getAttribute('data-index'));
                schedules.splice(index, 1);
                const newindex = schedules.filter(function (i) {
                    return i != index;
                });
                renderAccessSchedule(newindex);
            });
        }
    }, []);

    const loadUser = useCallback((user, allParentalRatings) => {
        setUserName(user.Name);
        LibraryMenu.setTitle(user.Name);
        loadUnratedItems(user);

        loadBlockedTags(user.Policy.BlockedTags);
        populateRatings(allParentalRatings);
        let ratingValue = '';

        if (user.Policy.MaxParentalRating) {
            for (let i = 0, length = allParentalRatings.length; i < length; i++) {
                const rating = allParentalRatings[i];

                if (user.Policy.MaxParentalRating >= rating.Value) {
                    ratingValue = rating.Value;
                }
            }
        }

        element.current.querySelector('.selectMaxParentalRating').value = ratingValue;

        if (user.Policy.IsAdministrator) {
            element?.current?.querySelector('.accessScheduleSection').classList.add('hide');
        } else {
            element?.current?.querySelector('.accessScheduleSection').classList.remove('hide');
        }
        renderAccessSchedule(user.Policy.AccessSchedules || []);
        loading.hide();
    }, [loadBlockedTags, loadUnratedItems, populateRatings, renderAccessSchedule]);

    const loadData = useCallback(() => {
        loading.show();
        const userId = appRouter.param('userId');
        const promise1 = window.ApiClient.getUser(userId);
        const promise2 = window.ApiClient.getParentalRatings();
        Promise.all([promise1, promise2]).then(function (responses) {
            loadUser(responses[0], responses[1]);
        });
    }, [loadUser]);

    useEffect(() => {
        loadData();

        const onSaveComplete = () => {
            loading.hide();
            toast(globalize.translate('SettingsSaved'));
        };

        const saveUser = (user) => {
            user.Policy.MaxParentalRating = element?.current?.querySelector('.selectMaxParentalRating').value || null;
            user.Policy.BlockUnratedItems = Array.prototype.filter.call(element?.current?.querySelectorAll('.chkUnratedItem'), function (i) {
                return i.checked;
            }).map(function (i) {
                return i.getAttribute('data-id');
            });
            user.Policy.AccessSchedules = getSchedulesFromPage();
            user.Policy.BlockedTags = getBlockedTagsFromPage();
            window.ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                onSaveComplete();
            });
        };

        const showSchedulePopup = (schedule, index) => {
            schedule = schedule || {};
            import('../../components/accessSchedule/accessSchedule').then(({default: accessschedule}) => {
                accessschedule.show({
                    schedule: schedule
                }).then(function (updatedSchedule) {
                    const schedules = getSchedulesFromPage();

                    if (index == -1) {
                        index = schedules.length;
                    }

                    schedules[index] = updatedSchedule;
                    renderAccessSchedule(schedules);
                });
            });
        };

        const getSchedulesFromPage = () => {
            return Array.prototype.map.call(element?.current?.querySelectorAll('.liSchedule'), function (elem) {
                return {
                    DayOfWeek: elem.getAttribute('data-day'),
                    StartHour: elem.getAttribute('data-start'),
                    EndHour: elem.getAttribute('data-end')
                };
            });
        };

        const getBlockedTagsFromPage = () => {
            return Array.prototype.map.call(element?.current?.querySelectorAll('.blockedTag'), function (elem) {
                return elem.getAttribute('data-tag');
            });
        };

        const showBlockedTagPopup = () => {
            import('../../components/prompt/prompt').then(({default: prompt}) => {
                prompt({
                    label: globalize.translate('LabelTag')
                }).then(function (value) {
                    const tags = getBlockedTagsFromPage();

                    if (tags.indexOf(value) == -1) {
                        tags.push(value);
                        loadBlockedTags(tags);
                    }
                });
            });
        };

        const onSubmit = (e) => {
            loading.show();
            const userId = appRouter.param('userId');
            window.ApiClient.getUser(userId).then(function (result) {
                saveUser(result);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        element?.current?.querySelector('.btnAddSchedule').addEventListener('click', function () {
            showSchedulePopup({}, -1);
        });

        element?.current?.querySelector('.btnAddBlockedTag').addEventListener('click', function () {
            showBlockedTagPopup();
        });

        element?.current?.querySelector('.userParentalControlForm').addEventListener('submit', onSubmit);
    }, [loadBlockedTags, loadData, renderAccessSchedule]);

    return (
        <div ref={element}>
            <div className='content-primary'>
                <div className='verticalSection'>
                    <div className='sectionTitleContainer flex align-items-center'>
                        <h2 className='sectionTitle username'>
                            {userName}
                        </h2>
                        <SectionTitleLinkElement
                            className='raised button-alt headerHelpButton'
                            title='Help'
                            url='https://docs.jellyfin.org/general/server/users/'
                        />
                    </div>
                </div>
                <SectionTabs activeTab='userparentalcontrol'/>
                <form className='userParentalControlForm'>
                    <div className='selectContainer'>
                        <SelectMaxParentalRating
                            className= 'selectMaxParentalRating'
                            label= 'LabelMaxParentalRating'
                            parentalRatings={parentalRatings}
                        />
                        <div className='fieldDescription'>
                            {globalize.translate('MaxParentalRatingHelp')}
                        </div>
                    </div>
                    <div>
                        <div className='blockUnratedItems'>
                            <h3 className='checkboxListLabel'>
                                {globalize.translate('HeaderBlockItemsWithNoRating')}
                            </h3>
                            <div className='checkboxList paperList' style={{ padding: '.5em 1em' }}>
                                {unratedItems.map(Item => {
                                    return <CheckBoxListItem
                                        key={Item.value}
                                        className='chkUnratedItem'
                                        Id={Item.value}
                                        Name={Item.name}
                                        checkedAttribute={Item.checkedAttribute}
                                    />;
                                })}
                            </div>
                        </div>
                    </div>
                    <br />
                    <div className='verticalSection' style={{marginBottom: '2em'}}>
                        <div
                            className='detailSectionHeader sectionTitleContainer'
                            style={{display: 'flex', alignItems: 'center', paddingBottom: '1em'}}
                        >
                            <h2 className='sectionTitle'>
                                {globalize.translate('LabelBlockContentWithTags')}
                            </h2>
                            <SectionTitleButtonElement
                                className='fab btnAddBlockedTag submit'
                                title='Add'
                                icon='add'
                            />
                        </div>
                        <div className='blockedTags' style={{marginTop: '.5em'}}>
                            {blockedTags.map((tag, index) => {
                                return <BlockedTagList
                                    key={index}
                                    tag={tag}
                                />;
                            })}
                        </div>
                    </div>
                    <div className='accessScheduleSection verticalSection' style={{marginBottom: '2em'}}>
                        <div
                            className='sectionTitleContainer'
                            style={{display: 'flex', alignItems: 'center', paddingBottom: '1em'}}
                        >
                            <h2 className='sectionTitle'>
                                {globalize.translate('HeaderAccessSchedule')}
                            </h2>
                            <SectionTitleButtonElement
                                className='fab btnAddSchedule submit'
                                title='Add'
                                icon='add'
                            />
                        </div>
                        <p>{globalize.translate('HeaderAccessScheduleHelp')}</p>
                        <div className='accessScheduleList paperList'>
                            {accessSchedules.map((accessSchedule, index) => {
                                return <AccessScheduleList
                                    key={index}
                                    index={index}
                                    DayOfWeek={accessSchedule.DayOfWeek}
                                    StartHour={accessSchedule.StartHour}
                                    EndHour={accessSchedule.EndHour}
                                />;
                            })}
                        </div>
                    </div>
                    <div>
                        <ButtonElement
                            type='submit'
                            className='raised button-submit block'
                            title='Save'
                        />
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserParentalControl;
