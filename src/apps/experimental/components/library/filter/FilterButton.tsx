import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { FC, useCallback } from 'react';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import FilterAlt from '@mui/icons-material/FilterAlt';
import Clear from '@mui/icons-material/Clear';

import Button from '@mui/material/Button';
import Popover from '@mui/material/Popover';
import MuiAccordion, { AccordionProps } from '@mui/material/Accordion';
import MuiAccordionDetails from '@mui/material/AccordionDetails';
import MuiAccordionSummary, {
    AccordionSummaryProps
} from '@mui/material/AccordionSummary';
import Badge from '@mui/material/Badge';
import { styled } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { useGetQueryFilters, useGetQueryFiltersLegacy, useGetStudios } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';

import FiltersAudioLanguages from './FiltersAudioLanguages';
import FiltersFeatures from './FiltersFeatures';
import FiltersGenres from './FiltersGenres';
import FiltersOfficialRatings from './FiltersOfficialRatings';
import FiltersEpisodesStatus from './FiltersEpisodesStatus';
import FiltersSeriesStatus from './FiltersSeriesStatus';
import FiltersStatus from './FiltersStatus';
import FiltersStudios from './FiltersStudios';
import FiltersSubtitleLanguages from './FiltersSubtitleLanguages';
import FiltersTags from './FiltersTags';
import FiltersVideoTypes from './FiltersVideoTypes';
import FiltersYears from './FiltersYears';

import { LibraryViewSettings, ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const Accordion = styled((props: AccordionProps) => (
    <MuiAccordion
        disableGutters
        elevation={0}
        square
        {...props}
        slotProps={{
            transition: { unmountOnExit: true }
        }}
    />
))(({ theme }) => ({
    border: `1px solid ${theme.palette.divider}`,
    '&:not(:last-child)': {
        borderBottom: 0
    },
    '&:before': {
        display: 'none'
    }
}));

const AccordionSummary = styled((props: AccordionSummaryProps) => (
    <MuiAccordionSummary
        expandIcon={<ArrowForwardIosSharpIcon sx={{ fontSize: '0.9rem' }} />}
        {...props}
    />
))(({ theme }) => ({
    backgroundColor:
        theme.palette.mode === 'dark' ?
            'rgba(255, 255, 255, .05)' :
            'rgba(0, 0, 0, .03)',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
        transform: 'rotate(90deg)'
    },
    '& .MuiAccordionSummary-content': {
        marginLeft: theme.spacing(1)
    }
}));

const AccordionDetails = styled(MuiAccordionDetails)(({ theme }) => ({
    padding: theme.spacing(2),
    borderTop: '1px solid rgba(0, 0, 0, .125)'
}));

interface FilterButtonProps {
    parentId: ParentId;
    itemType: BaseItemKind[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<
        React.SetStateAction<LibraryViewSettings>
    >;
}

const FilterButton: FC<FilterButtonProps> = ({
    parentId,
    itemType,
    viewType,
    hasFilters,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [expanded, setExpanded] = React.useState<string | false>(false);
    const open = Boolean(anchorEl);
    const id = open ? 'filter-popover' : undefined;

    const { data: filtersLegacy } = useGetQueryFiltersLegacy(parentId, itemType);
    const { data: filters } = useGetQueryFilters(parentId, itemType);
    const { data: studios } = useGetStudios(parentId, itemType);

    const handleChange =
        (panel: string) =>
            (event: React.SyntheticEvent, newExpanded: boolean) => {
                setExpanded(newExpanded ? panel : false);
            };

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

    const handleResetFiltersClick = useCallback(() => {
        if (hasFilters) {
            setLibraryViewSettings((prevState) => ({
                ...prevState,
                StartIndex: 0,
                Filters: {}
            }));
        }
    }, [hasFilters, setLibraryViewSettings]);

    const handleClose = useCallback(() => {
        setAnchorEl(null);
    }, []);

    const isFiltersLegacyEnabled = () => {
        return (
            viewType === LibraryTab.Movies
            || viewType === LibraryTab.Series
            || viewType === LibraryTab.Albums
            || viewType === LibraryTab.AlbumArtists
            || viewType === LibraryTab.Artists
            || viewType === LibraryTab.Songs
            || viewType === LibraryTab.Episodes
            || viewType === LibraryTab.Books
            || viewType === LibraryTab.Folders
            || viewType === LibraryTab.MusicVideos
            || viewType === LibraryTab.Videos
            || viewType === LibraryTab.Collections
            || viewType === LibraryTab.Playlists
            || viewType === LibraryTab.Mixed
        );
    };

    const isFiltersStudiosEnabled = () => {
        return (
            viewType === LibraryTab.Movies
            || viewType === LibraryTab.Series
            || viewType === LibraryTab.Books
            || viewType === LibraryTab.Albums
            || viewType === LibraryTab.AlbumArtists
            || viewType === LibraryTab.Artists
            || viewType === LibraryTab.Songs
        );
    };

    const isFiltersFeaturesEnabled = () => {
        return (
            viewType === LibraryTab.Movies
            || viewType === LibraryTab.Series
            || viewType === LibraryTab.Episodes
        );
    };

    const isFiltersSeriesStatusEnabled = () => {
        return viewType === LibraryTab.Series;
    };

    const isFiltersEpisodesStatusEnabled = () => {
        return viewType === LibraryTab.Episodes;
    };

    const isFiltersLanguagesEnabled = () => {
        return viewType === LibraryTab.Movies
            || viewType === LibraryTab.Series
            || viewType === LibraryTab.Episodes
            || viewType === LibraryTab.Mixed;
    };

    return (
        <>
            <Button
                title={globalize.translate('Filter')}
                aria-describedby={id}
                onClick={handleClick}
            >
                <Badge color='info' variant='dot' invisible={!hasFilters}>
                    <FilterAlt />
                </Badge>
            </Button>
            <Popover
                id={id}
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'center'
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'center'
                }}
                slotProps={{
                    paper: {
                        style: {
                            maxHeight: '50%',
                            width: 250
                        }
                    }
                }}
            >
                <Accordion
                    expanded={expanded === 'filtersStatus'}
                    onChange={handleChange('filtersStatus')}
                >
                    <AccordionSummary
                        aria-controls='filtersStatus-content'
                        id='filtersStatus-header'
                    >
                        <Typography>
                            {globalize.translate('Filters')}
                        </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <FiltersStatus
                            viewType={viewType}
                            libraryViewSettings={libraryViewSettings}
                            setLibraryViewSettings={setLibraryViewSettings}
                        />
                    </AccordionDetails>
                </Accordion>
                {isFiltersSeriesStatusEnabled() && (
                    <Accordion
                        expanded={expanded === 'filtersSeriesStatus'}
                        onChange={handleChange('filtersSeriesStatus')}
                    >
                        <AccordionSummary
                            aria-controls='filtersSeriesStatus-content'
                            id='filtersSeriesStatus-header'
                        >
                            <Typography>
                                {globalize.translate('HeaderSeriesStatus')}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FiltersSeriesStatus
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={
                                    setLibraryViewSettings
                                }
                            />
                        </AccordionDetails>
                    </Accordion>
                )}
                {isFiltersEpisodesStatusEnabled() && (
                    <Accordion
                        expanded={expanded === 'filtersEpisodesStatus'}
                        onChange={handleChange('filtersEpisodesStatus')}
                    >
                        <AccordionSummary
                            aria-controls='filtersEpisodesStatus-content'
                            id='filtersEpisodesStatus-header'
                        >
                            <Typography>
                                {globalize.translate(
                                    'HeaderEpisodesStatus'
                                )}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FiltersEpisodesStatus
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={
                                    setLibraryViewSettings
                                }
                            />
                        </AccordionDetails>
                    </Accordion>
                )}
                {isFiltersFeaturesEnabled() && (
                    <Accordion
                        expanded={expanded === 'filtersFeatures'}
                        onChange={handleChange('filtersFeatures')}
                    >
                        <AccordionSummary
                            aria-controls='filtersFeatures-content'
                            id='filtersFeatures-header'
                        >
                            <Typography>
                                {globalize.translate('Features')}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FiltersFeatures
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={
                                    setLibraryViewSettings
                                }
                            />
                        </AccordionDetails>
                    </Accordion>
                )}

                {isFiltersFeaturesEnabled() && (
                    <Accordion
                        expanded={expanded === 'filtersVideoTypes'}
                        onChange={handleChange('filtersVideoTypes')}
                    >
                        <AccordionSummary
                            aria-controls='filtersVideoTypes-content'
                            id='filtersVideoTypes-header'
                        >
                            <Typography>
                                {globalize.translate('HeaderVideoType')}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FiltersVideoTypes
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={
                                    setLibraryViewSettings
                                }
                            />
                        </AccordionDetails>
                    </Accordion>
                )}

                {isFiltersLegacyEnabled() && (
                    <>
                        {filtersLegacy?.Genres && filtersLegacy?.Genres?.length > 0 && (
                            <Accordion
                                expanded={expanded === 'filtersGenres'}
                                onChange={handleChange('filtersGenres')}
                            >
                                <AccordionSummary
                                    aria-controls='filtersGenres-content'
                                    id='filtersGenres-header'
                                >
                                    <Typography>
                                        {globalize.translate('Genres')}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FiltersGenres
                                        genresOptions={filtersLegacy.Genres}
                                        libraryViewSettings={
                                            libraryViewSettings
                                        }
                                        setLibraryViewSettings={
                                            setLibraryViewSettings
                                        }
                                    />
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {filtersLegacy?.OfficialRatings
                            && filtersLegacy?.OfficialRatings?.length > 0 && (
                            <Accordion
                                expanded={
                                    expanded === 'filtersOfficialRatings'
                                }
                                onChange={handleChange(
                                    'filtersOfficialRatings'
                                )}
                            >
                                <AccordionSummary
                                    aria-controls='filtersOfficialRatings-content'
                                    id='filtersOfficialRatings-header'
                                >
                                    <Typography>
                                        {globalize.translate(
                                            'HeaderParentalRatings'
                                        )}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FiltersOfficialRatings
                                        OfficialRatingsOptions={filtersLegacy.OfficialRatings}
                                        libraryViewSettings={
                                            libraryViewSettings
                                        }
                                        setLibraryViewSettings={
                                            setLibraryViewSettings
                                        }
                                    />
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {filtersLegacy?.Tags && filtersLegacy?.Tags.length > 0 && (
                            <Accordion
                                expanded={expanded === 'filtersTags'}
                                onChange={handleChange('filtersTags')}
                            >
                                <AccordionSummary
                                    aria-controls='filtersTags-content'
                                    id='filtersTags-header'
                                >
                                    <Typography>
                                        {globalize.translate('Tags')}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FiltersTags
                                        tagsOptions={filtersLegacy.Tags}
                                        libraryViewSettings={
                                            libraryViewSettings
                                        }
                                        setLibraryViewSettings={
                                            setLibraryViewSettings
                                        }
                                    />
                                </AccordionDetails>
                            </Accordion>
                        )}

                        {filtersLegacy?.Years && filtersLegacy?.Years?.length > 0 && (
                            <Accordion
                                expanded={expanded === 'filtersYears'}
                                onChange={handleChange('filtersYears')}
                            >
                                <AccordionSummary
                                    aria-controls='filtersYears-content'
                                    id='filtersYears-header'
                                >
                                    <Typography>
                                        {globalize.translate('HeaderYears')}
                                    </Typography>
                                </AccordionSummary>
                                <AccordionDetails>
                                    <FiltersYears
                                        yearsOptions={filtersLegacy.Years}
                                        libraryViewSettings={
                                            libraryViewSettings
                                        }
                                        setLibraryViewSettings={
                                            setLibraryViewSettings
                                        }
                                    />
                                </AccordionDetails>
                            </Accordion>
                        )}
                    </>
                )}
                {isFiltersStudiosEnabled() && studios && (
                    <Accordion
                        expanded={expanded === 'filtersStudios'}
                        onChange={handleChange('filtersStudios')}
                    >
                        <AccordionSummary
                            aria-controls='filtersStudios-content'
                            id='filtersStudios-header'
                        >
                            <Typography>
                                {globalize.translate('Studios')}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FiltersStudios
                                studiosOptions={studios}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={
                                    setLibraryViewSettings
                                }
                            />
                        </AccordionDetails>
                    </Accordion>
                )}
                {isFiltersLanguagesEnabled() && !!filters?.AudioLanguages?.length && (
                    <Accordion
                        expanded={expanded === 'filtersAudioLanguages'}
                        onChange={handleChange('filtersAudioLanguages')}
                    >
                        <AccordionSummary
                            aria-controls='audioLanguages-content'
                            id='filtersAudioLanguages-header'
                        >
                            <Typography>
                                {globalize.translate('AudioLanguages')}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FiltersAudioLanguages
                                options={filters.AudioLanguages}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        </AccordionDetails>
                    </Accordion>
                )}
                {isFiltersLanguagesEnabled() && !!filters?.SubtitleLanguages?.length && (
                    <Accordion
                        expanded={expanded === 'filtersSubtitleLanguages'}
                        onChange={handleChange('filtersSubtitleLanguages')}
                    >
                        <AccordionSummary
                            aria-controls='subtitleLanguages-content'
                            id='filtersSubtitleLanguages-header'
                        >
                            <Typography>
                                {globalize.translate('SubtitleLanguages')}
                            </Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <FiltersSubtitleLanguages
                                options={filters.SubtitleLanguages}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        </AccordionDetails>
                    </Accordion>
                )}
                <Button
                    disabled={!hasFilters}
                    title={globalize.translate('ResetFilters')}
                    aria-describedby={id}
                    onClick={handleResetFiltersClick}
                    fullWidth={true}
                    startIcon={<Clear />}
                    sx={{
                        justifyContent: 'right'
                    }}
                >
                    {globalize.translate('ResetFilters')}
                </Button>
            </Popover>
        </>
    );
};

export default FilterButton;
