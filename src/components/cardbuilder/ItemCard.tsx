import { BaseItemDto, ExternalIdMediaType, LocationType, UserItemDataDto } from '@thornbill/jellyfin-sdk/dist/generated-client';
import { ApiClient, Event as EventObject, Events } from 'jellyfin-apiclient';
import React, { Component, ReactNode } from 'react';
import Card, { Shape } from './Card';
import cardBuilder from './cardBuilder';
import CardIndicator from './CardIndicator';
import CardInnerFooter from './CardInnerFooter';
import CardInnerHeader from './CardInnerHeader';
import CardOuterFooter from './CardOuterFooter';
import CardOverlay from './CardOverlay';
import CardText from './CardText';
import { enablePlayedIndicator, enableProgressIndicator, getTypeIcon } from '../indicators/indicators';
import ProgressBar from '../indicators/ProgressBar';
import itemHelper from '../itemHelper';
import layoutManager from '../layoutManager';
import { playbackManager } from '../playback/playbackmanager';
import PaperIconButtonLight from '../../elements/emby-button/PaperIconButtonLight';
import ItemRefreshIndicator from '../../elements/emby-itemrefreshindicator/ItemRefreshIndicator';
import PlayStateButton from '../../elements/emby-playstatebutton/PlayStateButton';
import RatingButton from '../../elements/emby-ratingbutton/RatingButton';
import TextActionButton from '../../elements/emby-button/TextActionButton';
import browser from '../../scripts/browser';
import datetime from '../../scripts/datetime';
import globalize from '../../scripts/globalize';
import serverNotifications from '../../scripts/serverNotifications';

// TODO: Add Logo

/**
 * Indicator type.
 */
export enum Indicator {
    Played,
    ChildCount,
    UnplayedCount,
    Missing,
    //Sync, // FIXME: obsolete
    Timer,
    Type,
    MediaSourceCount
}

const enableFocusTransform = !browser.slow && !browser.edge;

const btnCssClass = 'cardOverlayButton cardOverlayButton-hover itemAction paper-icon-button-light';

function PlayButton() {
    //import('../../elements/emby-button/paper-icon-button-light');

    const cssClass = `${btnCssClass} cardOverlayFab-primary`;

    return (
        <PaperIconButtonLight className={cssClass} action='resume' icon='play_arrow' title={globalize.translate('Play')} iconClassName='cardOverlayButtonIcon cardOverlayButtonIcon-hover'/>
    );
}

function MoreButton() {
    //import('../../elements/emby-button/paper-icon-button-light');

    return (
        <PaperIconButtonLight className={btnCssClass} action='menu' icon='more_vert' title={globalize.translate('ButtonMore')} iconClassName='cardOverlayButtonIcon cardOverlayButtonIcon-hover'/>
    );
}

function getMediaSourceCountIndicator(item: BaseItemDto) {
    const mediaSourceCount = item.MediaSourceCount || 1;

    if (mediaSourceCount > 1) {
        return (
            <div className='mediaSourceIndicator'>{mediaSourceCount}</div>
        );
    }

    return null;
}

function getMissingIndicator(item: BaseItemDto) {
    if (item.Type === ExternalIdMediaType.Episode && item.LocationType === LocationType.Virtual && item.PremiereDate) {
        let className;
        let text;

        try {
            const premiereDate = datetime.parseISO8601Date(item.PremiereDate).getTime();
            if (premiereDate > new Date().getTime()) {
                className = 'unairedIndicator';
                text = globalize.translate('Unaired');
            }
        } catch (err) {
            console.error(err);
        }

        return (
            <CardIndicator className={className || 'missingIndicator'}>{text || globalize.translate('Missing')}</CardIndicator>
        );
    }

    return null;
}

function getTimerIndicator(item: BaseItemDto) {
    let className = 'timerIndicator';
    let icon = 'fiber_manual_record';
    let status;

    if (item.Type === 'SeriesTimer') {
        icon = 'fiber_smart_record';
    } else if (item.TimerId || item.SeriesTimerId) {
        status = item.Status || 'Cancelled';
    } else if (item.Type === 'Timer') {
        status = item.Status;
    } else {
        return null;
    }

    if (item.SeriesTimerId) {
        icon = 'fiber_smart_record';

        if (status === 'Cancelled') {
            className += ' timerIndicator-inactive';
        }
    }

    return (
        <CardIndicator className={className} icon={icon}/>
    );
}

function getTypeIndicator(item: BaseItemDto) {
    const icon = getTypeIcon(item);
    return icon ? (
        <CardIndicator className='videoIndicator' icon={icon}/>
    ) : null;
}

function getChildCountIndicator(item: BaseItemDto) {
    if (item.ChildCount as number > 1) {
        return (
            <CardIndicator className='countIndicator'>{item.ChildCount}</CardIndicator>
        );
    }

    return null;
}

function getPlayedIndicator(item: BaseItemDto, userData: UserItemDataDto, indicators: Indicator[]) {
    if (enablePlayedIndicator(item)) {
        if (indicators.includes(Indicator.UnplayedCount) && userData.UnplayedItemCount as number > 0) {
            return (
                <CardIndicator className='countIndicator'>{userData.UnplayedItemCount}</CardIndicator>
            );
        }

        if (indicators.includes(Indicator.Played) &&
            (userData.Played || userData.PlayedPercentage && userData.PlayedPercentage >= 100)) {
            return (
                <CardIndicator className='playedIndicator' icon='check'/>
            );
        }
    }

    return null;
}

function getRefreshIndicator(item: BaseItemDto) {
    if (item.Type === 'CollectionFolder' || item.CollectionType) {
        return (
            <ItemRefreshIndicator item={item}/>
        );
    }

    return null;
}

function getProgressBar(item: BaseItemDto, userData: UserItemDataDto) {
    if (enableProgressIndicator(item)) {
        const pct = userData.PlayedPercentage as number;
        if (pct > 0 && pct < 100) {
            return (
                <ProgressBar className='itemProgressBar' progress={pct}/>
            );
        }
    }

    return null;
}

function getCardFooterText(isOuterFooter: boolean, forceName: boolean, imgUrl: string, item: BaseItemDto, props: ItemCardProps) {
    // FIXME: Add Timers support
    item = (item as any).ProgramInfo || item;

    const {
        cardFooterAside,
        cardLayout,
        centerText,
        includeParentInfoInTitle,
        maxLines = 0,
        overlayText,
        showAirDateTime,
        showAirEndTime,
        showAirTime,
        showChannelName,
        showCurrentProgram,
        showCurrentProgramTime,
        showItemCounts,
        showParentTitle,
        showParentTitleOrTitle,
        showPersonRoleOrType,
        showPremiereDate,
        showRuntime,
        showSeriesTimerTime,
        showSeriesTimerChannel,
        showSeriesYear,
        showSongCount,
        showTitle,
        showYear,
        textLines
    } = props;

    const showOtherText = isOuterFooter ? !props.overlayText : props.overlayText;
    const parentTitleUnderneath = item.Type === 'MusicAlbum' || item.Type === 'Audio' || item.Type === 'MusicVideo';

    let lines: ReactNode[] = [];
    let titleAdded = false;

    if (showOtherText) {
        if ((showParentTitle || showParentTitleOrTitle) && !parentTitleUnderneath) {
            if (isOuterFooter && item.Type === 'Episode' && item.SeriesName) {
                if (item.SeriesId) {
                    lines.push((
                        <TextActionButton item={{
                            Id: item.SeriesId,
                            ServerId: item.ServerId,
                            Name: item.SeriesName,
                            Type: 'Series',
                            IsFolder: true
                        }}/>
                    ));
                } else {
                    lines.push(item.SeriesName);
                }
            } else {
                if (cardBuilder.isUsingLiveTvNaming(item)) {
                    lines.push(item.Name);

                    if (!item.EpisodeTitle) {
                        titleAdded = true;
                    }
                } else {
                    const parentTitle = item.SeriesName || item.Album || item.AlbumArtist || '';

                    if (parentTitle || showTitle) {
                        lines.push(parentTitle);
                    }
                }
            }
        }
    }

    let showMediaTitle = (showTitle && !titleAdded) || (showParentTitleOrTitle && !lines.length);

    if (!showMediaTitle && !titleAdded && (showTitle || forceName)) {
        showMediaTitle = true;
    }

    if (showMediaTitle) {
        // FIXME: auto showTitle
        const name = /*showTitle === 'auto' &&*/ !item.IsFolder && item.MediaType === 'Photo' ? '' : itemHelper.getDisplayName(item, {
            includeParentInfo: includeParentInfoInTitle
        });

        lines.push((
            <TextActionButton item={{
                Id: item.Id,
                ServerId: item.ServerId,
                Name: name,
                Type: item.Type,
                CollectionType: item.CollectionType,
                IsFolder: item.IsFolder
            }}/>
        ));
    }

    if (showOtherText) {
        if (showParentTitle && parentTitleUnderneath) {
            if (isOuterFooter && item.AlbumArtists && item.AlbumArtists.length) {
                (item.AlbumArtists[0] as any).Type = 'MusicArtist';
                (item.AlbumArtists[0] as any).IsFolder = true;
                lines.push((
                    <TextActionButton item={item.AlbumArtists[0]}/>
                ));
            } else {
                lines.push(cardBuilder.isUsingLiveTvNaming(item) ? item.Name : (item.SeriesName || item.Album || item.AlbumArtist || ''));
            }
        }

        if (item.ExtraType && item.ExtraType !== 'Unknown') {
            lines.push(globalize.translate(item.ExtraType));
        }

        if (showItemCounts) {
            lines.push(cardBuilder.getItemCountsHtml(props, item));
        }

        if (typeof textLines === 'function') {
            for (const str of textLines(item)) {
                lines.push(str);
            }
        }

        if (showSongCount) {
            let songLine = '';

            if (item.SongCount) {
                songLine = item.SongCount === 1 ?
                    globalize.translate('ValueOneSong') :
                    globalize.translate('ValueSongCount', item.SongCount);
            }

            lines.push(songLine);
        }

        if (showPremiereDate) {
            if (item.PremiereDate) {
                try {
                    lines.push(datetime.toLocaleDateString(
                        datetime.parseISO8601Date(item.PremiereDate),
                        { weekday: 'long', month: 'long', day: 'numeric' }
                    ));
                } catch (err) {
                    lines.push('');
                }
            } else {
                lines.push('');
            }
        }

        if (showYear || showSeriesYear) {
            if (item.Type === 'Series') {
                if (item.Status === 'Continuing') {
                    lines.push(globalize.translate('SeriesYearToPresent', item.ProductionYear || ''));
                } else {
                    if (item.EndDate && item.ProductionYear) {
                        const endYear = datetime.parseISO8601Date(item.EndDate).getFullYear();
                        lines.push(item.ProductionYear + ((endYear === item.ProductionYear) ? '' : (' - ' + endYear)));
                    } else {
                        lines.push(item.ProductionYear || '');
                    }
                }
            } else {
                lines.push(item.ProductionYear || '');
            }
        }

        if (showRuntime) {
            if (item.RunTimeTicks) {
                lines.push(datetime.getDisplayRunningTime(item.RunTimeTicks));
            } else {
                lines.push('');
            }
        }

        if (showAirTime) {
            lines.push(cardBuilder.getAirTimeText(item, showAirDateTime || false, showAirEndTime || false) || '');
        }

        if (showChannelName) {
            if (item.ChannelId) {
                lines.push((
                    <TextActionButton item={{
                        Id: item.ChannelId,
                        ServerId: item.ServerId,
                        Name: item.ChannelName,
                        Type: 'TvChannel',
                        MediaType: item.MediaType,
                        IsFolder: false
                    }} title={item.ChannelName || ''}/>
                ));
            } else {
                lines.push(item.ChannelName || '\u00A0');
            }
        }

        if (showCurrentProgram && item.Type === 'TvChannel') {
            if (item.CurrentProgram) {
                lines.push(item.CurrentProgram.Name);
            } else {
                lines.push('');
            }
        }

        if (showCurrentProgramTime && item.Type === 'TvChannel') {
            if (item.CurrentProgram) {
                lines.push(cardBuilder.getAirTimeText(item.CurrentProgram, false, true) || '');
            } else {
                lines.push('');
            }
        }

        if (showSeriesTimerTime) {
            // FIXME: Add Timers support
            if ((item as any).RecordAnyTime) {
                lines.push(globalize.translate('Anytime'));
            } else if (item.StartDate) {
                lines.push(datetime.getDisplayTime(item.StartDate));
            }
        }

        if (showSeriesTimerChannel) {
            // FIXME: Add Timers support
            if ((item as any).RecordAnyChannel) {
                lines.push(globalize.translate('AllChannels'));
            } else {
                lines.push(item.ChannelName || globalize.translate('OneChannel'));
            }
        }

        if (showPersonRoleOrType) {
            // FIXME: Add Person support
            if ((item as any).Role) {
                lines.push(globalize.translate('PersonRole', (item as any).Role));
            }
        }
    }

    if ((showTitle || !imgUrl) && forceName && overlayText && lines.length === 1) {
        lines = [];
    }

    if (overlayText && showTitle) {
        lines = [item.Name];
    }

    const addRightTextMargin = isOuterFooter && cardLayout && !centerText && cardFooterAside !== 'none' && layoutManager.mobile;

    const result: ReactNode[] = [];
    let cssClass = centerText ? 'cardText cardTextCentered' : 'cardText';
    let extraCssClass = ' cardText-first';

    if (addRightTextMargin) {
        cssClass += ' cardText-rightmargin';
    }

    for (const line of lines) {
        if (line) {
            let currentCssClass = cssClass;

            if (isOuterFooter) {
                currentCssClass += extraCssClass;
                extraCssClass = ' cardText-secondary';
            }

            result.push((
                <CardText key={result.length} className={currentCssClass}>{line}</CardText>
            ));

            if (maxLines && result.length >= maxLines) {
                break;
            }
        }
    }

    const forceLines = !overlayText;

    if (forceLines) {
        const linesLength = maxLines || lines.length;

        while (result.length < linesLength) {
            let currentCssClass = cssClass;

            if (isOuterFooter) {
                currentCssClass += extraCssClass;
                extraCssClass = ' cardText-secondary';
            }

            result.push((
                <CardText key={result.length} className={currentCssClass}>&nbsp;</CardText>
            ));
        }
    }

    return result.length ? (
        <>{result}</>
    ) : null;
}

export interface ItemCardProps {
    action?: string;
    /** Watch for item status updates. */
    autoUpdate?: boolean;
    cardFooterAside?: string;
    cardLayout?: boolean;
    centerText?: boolean;
    coverImage?: boolean;
    includeParentInfoInTitle?: boolean;
    index?: number;
    indicators?: Indicator[];
    item: BaseItemDto;
    maxLines?: number;
    overlayMarkPlayedButton?: boolean;
    overlayMoreButton?: boolean;
    overlayPlayButton?: boolean;
    overlayRateButton?: boolean;
    overlayText?: boolean;
    showAirDateTime?: boolean;
    showAirEndTime?: boolean;
    showAirTime?: boolean;
    showChannelName?: boolean;
    showCurrentProgram?: boolean;
    showCurrentProgramTime?: boolean;
    showItemCounts?: boolean;
    showParentTitle?: boolean;
    showParentTitleOrTitle?: boolean;
    showPersonRoleOrType?: boolean;
    showProgressBar?: boolean;
    showPremiereDate?: boolean;
    showRuntime?: boolean;
    showSeriesTimerTime?: boolean;
    showSeriesTimerChannel?: boolean;
    showSeriesYear?: boolean;
    showSongCount?: boolean;
    showYear?: boolean;
    showTitle?: boolean;
    shape?: Shape;
    textLines?: (item: BaseItemDto) => string[];
    width?: number;
    options?: any;
}

type IState = {
    userData: UserItemDataDto;
}

/**
 * Item card.
 */
class ItemCard extends Component<ItemCardProps, IState> {
    constructor(props: ItemCardProps) {
        super(props);

        this.state = {
            userData: (this.props.item as BaseItemDto).UserData || {}
        };

        this.onUserDataChanged = this.onUserDataChanged.bind(this);
    }

    /**
     * Adds user data to the card such as progress indicators and played status.
     * @param userData - User data to apply to the card.
     */
    updateUserData(userData: UserItemDataDto) {
        if (userData.ItemId === (this.props.item as BaseItemDto)?.Id) {
            this.setState({userData});
        }
    }

    onUserDataChanged(e: EventObject, apiClient: ApiClient, userData: UserItemDataDto) {
        this.updateUserData(userData);
    }

    bindEvents() {
        this.unbindEvents();

        if (this.props.autoUpdate !== false && (this.props.item as BaseItemDto)?.Id) {
            Events.on(serverNotifications, 'UserDataChanged', this.onUserDataChanged);
        }
    }

    unbindEvents() {
        Events.off(serverNotifications, 'UserDataChanged', this.onUserDataChanged);
    }

    componentDidMount() {
        this.bindEvents();
    }

    componentDidUpdate(prevProps: ItemCardProps) {
        if ((this.props.item as BaseItemDto)?.Id !== (prevProps.item as BaseItemDto)?.Id) {
            this.bindEvents();
        }
    }

    componentWillUnmount() {
        this.unbindEvents();
    }

    render() {
        let {
            action = 'link',
            cardLayout,
            coverImage,
            index,
            item,
            overlayMarkPlayedButton,
            overlayMoreButton,
            overlayPlayButton,
            overlayRateButton,
            showParentTitle,
            showProgressBar,
            showTitle,
            shape,
            width,
            options = {}
        } = this.props;

        if (!shape) {
            cardBuilder.setCardData([item], options);
            shape = options.shape as Shape;
        }

        const imgInfo = cardBuilder.getCardImageUrl(item, window.ApiClient, { width }, shape);
        const imgUrl = imgInfo.imgUrl;
        const blurhash = imgInfo.blurhash;
        const userData = this.state.userData;

        let className = '';

        if (layoutManager.desktop) {
            className = 'card-hoverable';
        } else if (layoutManager.tv) {
            className += ' show-focus';

            if (enableFocusTransform) {
                className += ' show-animation';
            }
        }

        if (item.Type !== 'MusicAlbum' && item.Type !== 'MusicArtist' && item.Type !== 'Audio') {
            className += ' card-withuserdata';
        }

        const nameWithPrefix = (item.SortName || item.Name || '');
        const prefix = nameWithPrefix.substring(0, Math.min(3, nameWithPrefix.length)).toUpperCase();

        const indicators = this.props.indicators || [];

        const mediaSourceCountIndicator = indicators.includes(Indicator.MediaSourceCount) ? getMediaSourceCountIndicator(item) : null;
        const missingIndicator = indicators.includes(Indicator.Missing) ? getMissingIndicator(item) : null;
        const timerIndicator = indicators.includes(Indicator.Timer) ? getTimerIndicator(item) : null;
        const typeIndicator = indicators.includes(Indicator.Type) ? getTypeIndicator(item) : null;
        const childCountIndicator = indicators.includes(Indicator.ChildCount) ? getChildCountIndicator(item) : null;

        let playedIndicator: ReactNode;

        if (childCountIndicator) {
            className += ' groupedCard';
        } else {
            playedIndicator = getPlayedIndicator(item, this.state.userData, indicators);
        }

        const refreshIndicator = getRefreshIndicator(item);

        const progressBar = showProgressBar ? getProgressBar(item, this.state.userData) : null;

        let title: ReactNode;
        let subTitle: ReactNode;

        if (showTitle) {
            title = (<TextActionButton item={item}/>);

            const parentId = item.SeriesId;
            const parentTitle = item.SeriesName || item.Album || item.AlbumArtist || '';
            const parentType = 'Series';

            if (showParentTitle && parentId && parentTitle) {
                subTitle = (<TextActionButton item={{
                    Id: parentId,
                    ServerId: item.ServerId,
                    Name: parentTitle,
                    Type: parentType,
                    IsFolder: true
                }}/>);
            }
        }

        const footerText = getCardFooterText(true, imgInfo.forceName, imgUrl, this.props.item, this.props);

        return (
            <Card
                className={className}
                backgroundClass={!imgUrl ? cardBuilder.getDefaultBackgroundClass(item.Name) : ''}
                blurhash={blurhash}
                cardLayout={cardLayout}
                coverImage={coverImage || imgInfo.coverImage}
                coverImageContain={item.Type === 'TvChannel'}
                defaultText={cardBuilder.getDefaultText(item, {})}
                imgUrl={imgUrl}
                shape={shape}
                attributes={{
                    'data-index': index,
                    'data-timerid': item.TimerId,
                    'data-seriestimerid': item.SeriesTimerId,
                    'data-action': action,
                    'data-isfolder': item.IsFolder,
                    'data-serverid': (item.ServerId || options.serverId),
                    'data-id': item.Id,
                    'data-type': item.Type,
                    'data-prefix': prefix,
                    'data-positionticks': userData.PlaybackPositionTicks,
                    'data-collectionid': options.collectionId,
                    'data-playlistid': options.playlistId,
                    'data-mediatype': item.MediaType,
                    'data-channelid': item.ChannelId,
                    'data-path': item.Path,
                    'data-collectiontype': item.CollectionType,
                    'data-context': options.context,
                    'data-parentid': options.parentId,
                    'data-startdate': item.StartDate?.toString(),
                    'data-enddate': item.EndDate?.toString()
                }}
            >
                {childCountIndicator || missingIndicator || playedIndicator || refreshIndicator || timerIndicator || typeIndicator ? <CardInnerHeader>
                    {missingIndicator}
                    {timerIndicator}
                    {typeIndicator}
                    {childCountIndicator}
                    {playedIndicator}
                    {refreshIndicator}
                </CardInnerHeader> : null}

                {mediaSourceCountIndicator}

                {progressBar ? <CardInnerFooter>
                    {progressBar}
                </CardInnerFooter> : null}

                <CardOverlay className='cardOverlayContainer itemAction' action={action}>
                    {overlayPlayButton && playbackManager.canPlay(item) ? <PlayButton/> : null}
                    {overlayMarkPlayedButton || overlayMoreButton || overlayRateButton ? (
                        <div className='cardOverlayButton-br flex'>
                            {overlayMarkPlayedButton && itemHelper.canMarkPlayed(item) ? <PlayStateButton className={btnCssClass} item={item}/> : null}
                            {overlayRateButton && itemHelper.canRate(item) ? <RatingButton className={btnCssClass} item={item}/> : null}
                            {overlayMoreButton ? <MoreButton/> : null}
                        </div>
                    ) : null}
                </CardOverlay>

                {footerText ? <CardOuterFooter>
                    {footerText}
                </CardOuterFooter> : null}
            </Card>
        );
    }
}

export default ItemCard;
