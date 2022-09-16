import type { AccessSchedule, ParentalRating, UserDto } from '@jellyfin/sdk/lib/generated-client';
import { DynamicDayOfWeek } from '@jellyfin/sdk/lib/generated-client/models/dynamic-day-of-week';
import React, { FunctionComponent, useCallback, useEffect, useState, useRef } from 'react';
import globalize from '../../scripts/globalize';
import LibraryMenu from '../../scripts/libraryMenu';
import AccessScheduleList from '../../components/dashboard/users/AccessScheduleList';
import BlockedTagList from '../../components/dashboard/users/BlockedTagList';
import ButtonElement from '../../elements/ButtonElement';
import SectionTitleContainer from '../../elements/SectionTitleContainer';
import SectionTabs from '../../components/dashboard/users/SectionTabs';
import loading from '../../components/loading/loading';
import toast from '../../components/toast/toast';
import { getParameterByName } from '../../utils/url';
import CheckBoxElement from '../../elements/CheckBoxElement';
import escapeHTML from 'escape-html';
import SelectElement from '../../elements/SelectElement';
import Page from '../../components/Page';

type UnratedItem = {
    name: string;
    value: string;
    checkedAttribute: string
}

const UserParentalControl: FunctionComponent = () => {
    const [ userName, setUserName ] = useState('');
    const [ parentalRatings, setParentalRatings ] = useState<ParentalRating[]>([]);
    const [ unratedItems, setUnratedItems ] = useState<UnratedItem[]>([]);
    const [ accessSchedules, setAccessSchedules ] = useState<AccessSchedule[]>([]);
    const [ blockedTags, setBlockedTags ] = useState([]);

    const element = useRef<HTMLDivElement>(null);

    const populateRatings = useCallback((allParentalRatings) => {
        let rating;
        const ratings: ParentalRating[] = [];

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
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

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

        const itemsArr: UnratedItem[] = [];

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

        const blockUnratedItems = page.querySelector('.blockUnratedItems') as HTMLDivElement;
        blockUnratedItems.dispatchEvent(new CustomEvent('create'));
    }, []);

    const loadBlockedTags = useCallback((tags) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        setBlockedTags(tags);

        const blockedTagsElem = page.querySelector('.blockedTags') as HTMLDivElement;

        for (const btnDeleteTag of blockedTagsElem.querySelectorAll('.btnDeleteTag')) {
            btnDeleteTag.addEventListener('click', function () {
                const tag = btnDeleteTag.getAttribute('data-tag');
                const newTags = tags.filter(function (t: string) {
                    return t != tag;
                });
                loadBlockedTags(newTags);
            });
        }
    }, []);

    const renderAccessSchedule = useCallback((schedules) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        setAccessSchedules(schedules);

        const accessScheduleList = page.querySelector('.accessScheduleList') as HTMLDivElement;

        for (const btnDelete of accessScheduleList.querySelectorAll('.btnDelete')) {
            btnDelete.addEventListener('click', function () {
                const index = parseInt(btnDelete.getAttribute('data-index') || '0', 10);
                schedules.splice(index, 1);
                const newindex = schedules.filter(function (i: number) {
                    return i != index;
                });
                renderAccessSchedule(newindex);
            });
        }
    }, []);

    const loadUser = useCallback((user, allParentalRatings) => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

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

        (page.querySelector('#selectMaxParentalRating') as HTMLSelectElement).value = ratingValue;

        if (user.Policy.IsAdministrator) {
            (page.querySelector('.accessScheduleSection') as HTMLDivElement).classList.add('hide');
        } else {
            (page.querySelector('.accessScheduleSection') as HTMLDivElement).classList.remove('hide');
        }
        renderAccessSchedule(user.Policy.AccessSchedules || []);
        loading.hide();
    }, [loadBlockedTags, loadUnratedItems, populateRatings, renderAccessSchedule]);

    const loadData = useCallback(() => {
        loading.show();
        const userId = getParameterByName('userId');
        const promise1 = window.ApiClient.getUser(userId);
        const promise2 = window.ApiClient.getParentalRatings();
        Promise.all([promise1, promise2]).then(function (responses) {
            loadUser(responses[0], responses[1]);
        });
    }, [loadUser]);

    useEffect(() => {
        const page = element.current;

        if (!page) {
            console.error('Unexpected null reference');
            return;
        }

        loadData();

        const onSaveComplete = () => {
            loading.hide();
            toast(globalize.translate('SettingsSaved'));
        };

        const saveUser = (user: UserDto) => {
            if (!user.Id) {
                throw new Error('Unexpected null user.Id');
            }

            if (!user.Policy) {
                throw new Error('Unexpected null user.Policy');
            }

            user.Policy.MaxParentalRating = parseInt((page.querySelector('#selectMaxParentalRating') as HTMLSelectElement).value || '0', 10) || null;
            user.Policy.BlockUnratedItems = Array.prototype.filter.call(page.querySelectorAll('.chkUnratedItem'), function (i) {
                return i.checked;
            }).map(function (i) {
                return i.getAttribute('data-itemtype');
            });
            user.Policy.AccessSchedules = getSchedulesFromPage();
            user.Policy.BlockedTags = getBlockedTagsFromPage();
            window.ApiClient.updateUserPolicy(user.Id, user.Policy).then(function () {
                onSaveComplete();
            });
        };

        const showSchedulePopup = (schedule: AccessSchedule, index: number) => {
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
            return Array.prototype.map.call(page.querySelectorAll('.liSchedule'), function (elem) {
                return {
                    DayOfWeek: elem.getAttribute('data-day'),
                    StartHour: elem.getAttribute('data-start'),
                    EndHour: elem.getAttribute('data-end')
                };
            }) as AccessSchedule[];
        };

        const getBlockedTagsFromPage = () => {
            return Array.prototype.map.call(page.querySelectorAll('.blockedTag'), function (elem) {
                return elem.getAttribute('data-tag');
            }) as string[];
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

        const onSubmit = (e: Event) => {
            loading.show();
            const userId = getParameterByName('userId');
            window.ApiClient.getUser(userId).then(function (result) {
                saveUser(result);
            });
            e.preventDefault();
            e.stopPropagation();
            return false;
        };

        (page.querySelector('#btnAddSchedule') as HTMLButtonElement).addEventListener('click', function () {
            showSchedulePopup({
                Id: 0,
                UserId: '',
                DayOfWeek: DynamicDayOfWeek.Sunday,
                StartHour: 0,
                EndHour: 0
            }, -1);
        });

        (page.querySelector('#btnAddBlockedTag') as HTMLButtonElement).addEventListener('click', function () {
            showBlockedTagPopup();
        });

        (page.querySelector('.userParentalControlForm') as HTMLFormElement).addEventListener('submit', onSubmit);
    }, [loadBlockedTags, loadData, renderAccessSchedule]);

    const optionMaxParentalRating = () => {
        let content = '';
        content += '<option value=\'\'></option>';
        for (const rating of parentalRatings) {
            content += `<option value='${rating.Value}'>${escapeHTML(rating.Name)}</option>`;
        }
        return content;
    };

    return (
        <Page
            id='userParentalControlPage'
            className='mainAnimatedPage type-interior'
        >
            <div ref={element} className='content-primary'>
                <div className='verticalSection'>
                    <SectionTitleContainer
                        title={userName}
                        url='https://docs.jellyfin.org/general/server/users/'
                    />
                </div>
                <SectionTabs activeTab='userparentalcontrol'/>
                <form className='userParentalControlForm'>
                    <div className='selectContainer'>
                        <SelectElement
                            id='selectMaxParentalRating'
                            label='LabelMaxParentalRating'
                        >
                            {optionMaxParentalRating()}
                        </SelectElement>
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
                                    return <CheckBoxElement
                                        key={Item.value}
                                        className='chkUnratedItem'
                                        itemType={Item.value}
                                        itemName={Item.name}
                                        itemCheckedAttribute={Item.checkedAttribute}
                                    />;
                                })}
                            </div>
                        </div>
                    </div>
                    <br />
                    <div className='verticalSection' style={{marginBottom: '2em'}}>
                        <SectionTitleContainer
                            SectionClassName='detailSectionHeader'
                            title={globalize.translate('LabelBlockContentWithTags')}
                            isBtnVisible={true}
                            btnId='btnAddBlockedTag'
                            btnClassName='fab submit sectionTitleButton'
                            btnTitle='Add'
                            btnIcon='add'
                            isLinkVisible={false}
                        />
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
                        <SectionTitleContainer
                            title={globalize.translate('HeaderAccessSchedule')}
                            isBtnVisible={true}
                            btnId='btnAddSchedule'
                            btnClassName='fab submit sectionTitleButton'
                            btnTitle='Add'
                            btnIcon='add'
                            isLinkVisible={false}
                        />
                        <p>{globalize.translate('HeaderAccessScheduleHelp')}</p>
                        <div className='accessScheduleList paperList'>
                            {accessSchedules.map((accessSchedule, index) => {
                                return <AccessScheduleList
                                    key={index}
                                    index={index}
                                    Id={accessSchedule.Id}
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
        </Page>

    );
};

export default UserParentalControl;
