import React, { type FC, useCallback, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import TheatersIcon from '@mui/icons-material/Theaters';
import ExploreIcon from '@mui/icons-material/Explore';
import ShuffleIcon from '@mui/icons-material/Shuffle';

import { useApi } from 'hooks/useApi';
import { useTrackSelections } from '../hooks/useTrackSelections';

import { playbackManager } from 'components/playback/playbackmanager';
import globalize from 'scripts/globalize';
import { appHost } from 'components/apphost';
import dom from 'scripts/dom';
import { getCanPlay } from '../utils/items';
import { CardShape } from 'utils/card';
import itemHelper from 'components/itemHelper';

import Card from 'components/cardbuilder/Card/Card';
import PrimaryMediaInfo from 'components/mediainfo/PrimaryMediaInfo';
import TextLines from 'components/common/textLines/TextLines';
import SplitVersionsButton from './buttons/SplitVersionsButton';
import CancelTimerButton from './buttons/CancelTimerButton';
import CancelSeriesTimerButton from './buttons/CancelSeriesTimerButton';
import PlayButton from './buttons/PlayButton';
import MoreCommandsButton from './buttons/MoreCommandsButton';
import DownloadButton from './buttons/DownloadButton';
import PlayedButton from 'elements/emby-playstatebutton/PlayedButton';
import FavoriteButton from 'elements/emby-ratingbutton/FavoriteButton';

import type { ItemDto } from 'types/base/models/item-dto';
import type { CardOptions } from 'types/cardOptions';
import { ItemKind } from 'types/base/models/item-kind';
import { ItemStatus } from 'types/base/models/item-status';

interface DetailPrimaryContainerProps {
    item: ItemDto;
    id: string | null;
    reloadItems?: () => void;
}

const DetailPrimaryContainer: FC<DetailPrimaryContainerProps> = ({
    item,
    id
    //reloadItems
}) => {
    const { user } = useApi();
    const {
        mediaSourceInfo,
        groupedVersions,
        selectedMediaSourceId,
        selectedAudioTrack,
        selectedSubtitleTrack
    } = useTrackSelections();

    const onShuffleClick = useCallback(async () => {
        await playbackManager.shuffle(item);
    }, [item]);

    const onInstantMixClick = useCallback(async () => {
        await playbackManager.instantMix(item);
    }, [item]);

    const onPlayTrailerClick = useCallback(async () => {
        await playbackManager.playTrailers(item);
    }, [item]);

    const getCardOptions = useCallback(() => {
        let shape: CardShape = CardShape.Square;
        if (item?.PrimaryImageAspectRatio) {
            if (item.PrimaryImageAspectRatio >= 3) {
                shape = CardShape.Banner;
            } else if (item.PrimaryImageAspectRatio >= 1.33) {
                shape = CardShape.Backdrop;
            } else if (item.PrimaryImageAspectRatio > 0.8) {
                shape = CardShape.Square;
            } else {
                shape = CardShape.Portrait;
            }
        }

        const cardOptions: CardOptions = {
            shape: shape,
            action: 'none',
            width: dom.getWindowSize().innerWidth * 0.25,
            disableHoverMenu: true,
            disableIndicators: true,
            cardLayout: true,
            disableCardFooter: true
            //queryKey: ['DetailsItem']
        };

        return cardOptions;
    }, [item?.PrimaryImageAspectRatio]);

    const { IsFavorite, Played } = useMemo(
        () => item?.UserData ?? {},
        [item?.UserData]
    );

    return (
        <div className='detailPagePrimaryContainer detailRibbon padded-left padded-right'>
            <div className='infoWrapper'>
                <div className='detailImageContainer '>
                    <Card item={item} cardOptions={getCardOptions()} />
                </div>
                <div className='nameContainer'>
                    <TextLines
                        item={item}
                        className='itemName infoText parentNameLast'
                        subClassName=''
                        textLineOpts={{
                            showProgramDateTime: false,
                            showProgramTime: false,
                            showChannel: false,
                            showParentTitle: false,
                            showIndexNumber: false,
                            parentTitleWithTitle: false,
                            showArtist: true,
                            includeParentInfoInTitle: false,
                            showCurrentProgram: false
                        }}
                        isLargeStyle
                    />
                </div>
                <PrimaryMediaInfo
                    className='itemMiscInfo itemMiscInfo-primary'
                    item={{
                        ...item,
                        ...mediaSourceInfo
                    }}
                    isEpisodeTitleEnabled={true}
                    isOriginalAirDateEnabled={true}
                    isCaptionIndicatorEnabled={true}
                    isRuntimeEnabled={true}
                    isStarRatingEnabled={true}
                    isOfficialRatingEnabled={true}
                    isYearEnabled={true}
                    isContainerEnabled={true}
                    isProgramIndicatorEnabled={true}
                    isEpisodeTitleIndexNumberEnabled={true}
                    isCriticRatingEnabled={true}
                    isEndsAtEnabled={true}
                />
            </div>
            <div className='mainDetailButtons'>
                {getCanPlay(item).canPlay && (
                    <PlayButton
                        item={item}
                        isResumable={getCanPlay(item).isResumable}
                        selectedMediaSourceId={selectedMediaSourceId}
                        selectedAudioTrack={selectedAudioTrack}
                        selectedSubtitleTrack={selectedSubtitleTrack}
                    />
                )}

                {getCanPlay(item).isResumable && (
                    <PlayButton
                        item={item}
                        isResumable={false} // Play form the beginning
                        selectedMediaSourceId={selectedMediaSourceId}
                        selectedAudioTrack={selectedAudioTrack}
                        selectedSubtitleTrack={selectedSubtitleTrack}
                    />
                )}

                {item?.Type === ItemKind.Book
                    && item.CanDownload
                    && appHost.supports('filedownload') && (
                    <DownloadButton item={item} />
                )}

                {(item?.LocalTrailerCount
                    || (item?.RemoteTrailers && item.RemoteTrailers.length > 0))
                    && playbackManager
                        .getSupportedCommands()
                        .indexOf('PlayTrailers') !== -1 && (
                    <IconButton
                        className='button-flat btnPlayTrailer'
                        title={globalize.translate('ButtonTrailer')}
                        onClick={onPlayTrailerClick}
                    >
                        <TheatersIcon />
                    </IconButton>
                )}

                {getCanPlay(item).canInstantMix && (
                    <IconButton
                        className='button-flat btnInstantMix'
                        title={globalize.translate('HeaderInstantMix')}
                        onClick={onInstantMixClick}
                    >
                        <ExploreIcon />
                    </IconButton>
                )}

                {getCanPlay(item).canShuffle && (
                    <IconButton
                        className='button-flat btnShuffle'
                        title={globalize.translate('Shuffle')}
                        onClick={onShuffleClick}
                    >
                        <ShuffleIcon />
                    </IconButton>
                )}

                {item?.Type === ItemKind.SeriesTimer
                    && item.TimerId
                    && user?.Policy?.EnableLiveTvManagement && (
                    <CancelSeriesTimerButton timerId={item.TimerId} />
                )}

                {item.Type !== ItemKind.Recording
                    || !user?.Policy?.EnableLiveTvManagement
                    || !item.TimerId
                    || (item.Status !== ItemStatus.InProgress && (
                        <CancelTimerButton timerId={item.TimerId} />
                    ))}

                {itemHelper.canMarkPlayed(item) && (
                    <PlayedButton
                        className='button-flat btnPlaystate'
                        isPlayed={Played}
                        itemId={item?.Id}
                        itemType={item?.Type}
                        //queryKey={'DetailsItem'}
                    />
                )}

                {itemHelper.canRate(item) && (
                    <FavoriteButton
                        className='button-flat btnUserRating'
                        isFavorite={IsFavorite}
                        itemId={item?.Id}
                        //queryKey={'DetailsItem'}
                    />
                )}

                {id
                    && user?.Policy?.IsAdministrator
                    && groupedVersions && groupedVersions.length > 0 && (
                    <SplitVersionsButton id={id} />
                )}

                <MoreCommandsButton
                    item={{
                        ...item,
                        ...mediaSourceInfo
                    }}
                    user={user}
                />
            </div>
        </div>
    );
};

export default DetailPrimaryContainer;
