import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { FC, useCallback, useState } from 'react';
import ArrowForwardIosSharpIcon from '@mui/icons-material/ArrowForwardIosSharp';
import FilterAlt from '@mui/icons-material/FilterAlt';
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

import { useGetQueryFiltersLegacy, useGetStudios } from 'hooks/useFetchItems';
import globalize from 'lib/globalize';

import FiltersFeatures from './FiltersFeatures';
import FiltersGenres from './FiltersGenres';
import FiltersOfficialRatings from './FiltersOfficialRatings';
import FiltersEpisodesStatus from './FiltersEpisodesStatus';
import FiltersSeriesStatus from './FiltersSeriesStatus';
import FiltersStatus from './FiltersStatus';
import FiltersStudios from './FiltersStudios';
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
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [expanded, setExpanded] = useState<string | false>(false);
    const open = Boolean(anchorEl);
    const id = open ? 'filter-popover' : undefined;

    const { data } = useGetQueryFiltersLegacy(parentId, itemType);
    const { data: studios } = useGetStudios(parentId, itemType);

    const handleChange =
        (panel: string) =>
            (_event: React.SyntheticEvent, newExpanded: boolean) => {
                setExpanded(newExpanded ? panel : false);
            };

    const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    }, []);

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
        );
    };

    const isFiltersStudiosEnabled = () => {
        return (
            viewType === LibraryTab.Movies
            || viewType === LibraryTab.Series
        );
    };

    const isFiltersFeaturesEnabled = () => {
        return (
            viewType === LibraryTab.Movies
            || viewType === LibraryTab.Series
            || viewType === LibraryTab.Episodes
        );
    };

    const isFiltersVideoTypesEnabled = () => {
        return (
            viewType === LibraryTab.Movies
            || viewType === LibraryTab.Episodes
        );
    };

    const isFiltersSeriesStatusEnabled = () => {
        return viewType === LibraryTab.Series;
    };

    const isFiltersEpisodesStatusEnabled = () => {
        return viewType === LibraryTab.Episodes;
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

                {isFiltersVideoTypesEnabled() && (
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
                        {data?.Genres && data?.Genres?.length > 0 && (
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
                                        genresOptions={data.Genres}
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

                        {data?.OfficialRatings
                            && data?.OfficialRatings?.length > 0 && (
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
                                        OfficialRatingsOptions={data.OfficialRatings}
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

                        {data?.Tags && data?.Tags.length > 0 && (
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
                                        tagsOptions={data.Tags}
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

                        {data?.Years && data?.Years?.length > 0 && (
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
                                        yearsOptions={data.Years}
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
            </Popover>
        </>
    );
};

export default FilterButton;
