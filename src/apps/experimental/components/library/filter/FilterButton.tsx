import { type BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import React, { type FC, useCallback } from 'react';
import { ChevronRightIcon, MixerHorizontalIcon } from '@radix-ui/react-icons';
import { Box, Flex } from 'ui-primitives/Box';
import { Button } from 'ui-primitives/Button';
import { Menu } from 'ui-primitives/Menu';
import { Text } from 'ui-primitives/Text';
import { vars } from 'styles/tokens.css';

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

import { type LibraryViewSettings, type ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';

const sectionHeaderStyle: React.CSSProperties = {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `${vars.spacing['4']} ${vars.spacing['5']}`,
    backgroundColor: vars.colors.surfaceHover,
    border: `1px solid ${vars.colors.divider}`,
    cursor: 'pointer'
};

const sectionBodyStyle: React.CSSProperties = {
    padding: vars.spacing['5'],
    borderLeft: `1px solid ${vars.colors.divider}`,
    borderRight: `1px solid ${vars.colors.divider}`,
    borderBottom: `1px solid ${vars.colors.divider}`
};

interface FilterButtonProps {
    parentId: ParentId;
    itemType: BaseItemKind[];
    viewType: LibraryTab;
    hasFilters: boolean;
    libraryViewSettings: LibraryViewSettings;
    setLibraryViewSettings: React.Dispatch<React.SetStateAction<LibraryViewSettings>>;
}

const FilterButton: FC<FilterButtonProps> = ({
    parentId,
    itemType,
    viewType,
    hasFilters,
    libraryViewSettings,
    setLibraryViewSettings
}) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [expanded, setExpanded] = React.useState<string | false>(false);

    const { data } = useGetQueryFiltersLegacy(parentId, itemType);
    const { data: studios } = useGetStudios(parentId, itemType);

    const toggleSection = useCallback((panel: string) => {
        setExpanded(current => (current === panel ? false : panel));
    }, []);

    const isFiltersLegacyEnabled = () => {
        return (
            viewType === LibraryTab.Movies ||
            viewType === LibraryTab.Series ||
            viewType === LibraryTab.Albums ||
            viewType === LibraryTab.AlbumArtists ||
            viewType === LibraryTab.Artists ||
            viewType === LibraryTab.Songs ||
            viewType === LibraryTab.Episodes
        );
    };

    const isFiltersStudiosEnabled = () => {
        return viewType === LibraryTab.Movies || viewType === LibraryTab.Series;
    };

    const isFiltersFeaturesEnabled = () => {
        return viewType === LibraryTab.Movies || viewType === LibraryTab.Series || viewType === LibraryTab.Episodes;
    };

    const isFiltersVideoTypesEnabled = () => {
        return viewType === LibraryTab.Movies || viewType === LibraryTab.Episodes;
    };

    const isFiltersSeriesStatusEnabled = () => {
        return viewType === LibraryTab.Series;
    };

    const isFiltersEpisodesStatusEnabled = () => {
        return viewType === LibraryTab.Episodes;
    };

    return (
        <Menu
            id="filter-popover"
            open={isMenuOpen}
            onOpenChange={setIsMenuOpen}
            align="center"
            trigger={
                <Button title={globalize.translate('Filter')} variant="plain">
                    <Box style={{ position: 'relative', display: 'inline-flex' }}>
                        <MixerHorizontalIcon />
                        {hasFilters && (
                            <Box
                                style={{
                                    position: 'absolute',
                                    top: -2,
                                    right: -2,
                                    width: 8,
                                    height: 8,
                                    borderRadius: '50%',
                                    backgroundColor: vars.colors.info
                                }}
                            />
                        )}
                    </Box>
                </Button>
            }
        >
            <Box style={{ maxHeight: '50vh', width: 260, overflow: 'auto' }}>
                <Box>
                    <button type="button" style={sectionHeaderStyle} onClick={() => toggleSection('filtersStatus')}>
                        <Text size="md">{globalize.translate('Filters')}</Text>
                        <ChevronRightIcon
                            style={{
                                width: 14,
                                height: 14,
                                transform: expanded === 'filtersStatus' ? 'rotate(90deg)' : undefined
                            }}
                        />
                    </button>
                    {expanded === 'filtersStatus' && (
                        <Box style={sectionBodyStyle}>
                            <FiltersStatus
                                viewType={viewType}
                                libraryViewSettings={libraryViewSettings}
                                setLibraryViewSettings={setLibraryViewSettings}
                            />
                        </Box>
                    )}
                </Box>
                {isFiltersSeriesStatusEnabled() && (
                    <Box>
                        <button
                            type="button"
                            style={sectionHeaderStyle}
                            onClick={() => toggleSection('filtersSeriesStatus')}
                        >
                            <Text size="md">{globalize.translate('HeaderSeriesStatus')}</Text>
                            <ChevronRightIcon
                                style={{
                                    fontSize: vars.typography['3'].fontSize,
                                    transform: expanded === 'filtersSeriesStatus' ? 'rotate(90deg)' : undefined
                                }}
                            />
                        </button>
                        {expanded === 'filtersSeriesStatus' && (
                            <Box style={sectionBodyStyle}>
                                <FiltersSeriesStatus
                                    libraryViewSettings={libraryViewSettings}
                                    setLibraryViewSettings={setLibraryViewSettings}
                                />
                            </Box>
                        )}
                    </Box>
                )}
                {isFiltersEpisodesStatusEnabled() && (
                    <Box>
                        <button
                            type="button"
                            style={sectionHeaderStyle}
                            onClick={() => toggleSection('filtersEpisodesStatus')}
                        >
                            <Text size="md">{globalize.translate('HeaderEpisodesStatus')}</Text>
                            <ChevronRightIcon
                                style={{
                                    fontSize: vars.typography['3'].fontSize,
                                    transform: expanded === 'filtersEpisodesStatus' ? 'rotate(90deg)' : undefined
                                }}
                            />
                        </button>
                        {expanded === 'filtersEpisodesStatus' && (
                            <Box style={sectionBodyStyle}>
                                <FiltersEpisodesStatus
                                    libraryViewSettings={libraryViewSettings}
                                    setLibraryViewSettings={setLibraryViewSettings}
                                />
                            </Box>
                        )}
                    </Box>
                )}
                {isFiltersFeaturesEnabled() && (
                    <Box>
                        <button
                            type="button"
                            style={sectionHeaderStyle}
                            onClick={() => toggleSection('filtersFeatures')}
                        >
                            <Text size="md">{globalize.translate('Features')}</Text>
                            <ChevronRightIcon
                                style={{
                                    fontSize: vars.typography['3'].fontSize,
                                    transform: expanded === 'filtersFeatures' ? 'rotate(90deg)' : undefined
                                }}
                            />
                        </button>
                        {expanded === 'filtersFeatures' && (
                            <Box style={sectionBodyStyle}>
                                <FiltersFeatures
                                    libraryViewSettings={libraryViewSettings}
                                    setLibraryViewSettings={setLibraryViewSettings}
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {isFiltersVideoTypesEnabled() && (
                    <Box>
                        <button
                            type="button"
                            style={sectionHeaderStyle}
                            onClick={() => toggleSection('filtersVideoTypes')}
                        >
                            <Text size="md">{globalize.translate('HeaderVideoType')}</Text>
                            <ChevronRightIcon
                                style={{
                                    fontSize: vars.typography['3'].fontSize,
                                    transform: expanded === 'filtersVideoTypes' ? 'rotate(90deg)' : undefined
                                }}
                            />
                        </button>
                        {expanded === 'filtersVideoTypes' && (
                            <Box style={sectionBodyStyle}>
                                <FiltersVideoTypes
                                    libraryViewSettings={libraryViewSettings}
                                    setLibraryViewSettings={setLibraryViewSettings}
                                />
                            </Box>
                        )}
                    </Box>
                )}

                {isFiltersLegacyEnabled() && (
                    <>
                        {data?.Genres && data?.Genres?.length > 0 && (
                            <Box>
                                <button
                                    type="button"
                                    style={sectionHeaderStyle}
                                    onClick={() => toggleSection('filtersGenres')}
                                >
                                    <Text size="md">{globalize.translate('Genres')}</Text>
                                    <ChevronRightIcon
                                        style={{
                                            fontSize: vars.typography['3'].fontSize,
                                            transform: expanded === 'filtersGenres' ? 'rotate(90deg)' : undefined
                                        }}
                                    />
                                </button>
                                {expanded === 'filtersGenres' && (
                                    <Box style={sectionBodyStyle}>
                                        <FiltersGenres
                                            genresOptions={data.Genres}
                                            libraryViewSettings={libraryViewSettings}
                                            setLibraryViewSettings={setLibraryViewSettings}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        {data?.OfficialRatings && data?.OfficialRatings?.length > 0 && (
                            <Box>
                                <button
                                    type="button"
                                    style={sectionHeaderStyle}
                                    onClick={() => toggleSection('filtersOfficialRatings')}
                                >
                                    <Text size="md">{globalize.translate('HeaderParentalRatings')}</Text>
                                    <ChevronRightIcon
                                        style={{
                                            fontSize: vars.typography['3'].fontSize,
                                            transform:
                                                expanded === 'filtersOfficialRatings' ? 'rotate(90deg)' : undefined
                                        }}
                                    />
                                </button>
                                {expanded === 'filtersOfficialRatings' && (
                                    <Box style={sectionBodyStyle}>
                                        <FiltersOfficialRatings
                                            OfficialRatingsOptions={data.OfficialRatings}
                                            libraryViewSettings={libraryViewSettings}
                                            setLibraryViewSettings={setLibraryViewSettings}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        {data?.Tags && data?.Tags.length > 0 && (
                            <Box>
                                <button
                                    type="button"
                                    style={sectionHeaderStyle}
                                    onClick={() => toggleSection('filtersTags')}
                                >
                                    <Text size="md">{globalize.translate('Tags')}</Text>
                                    <ChevronRightIcon
                                        style={{
                                            fontSize: vars.typography['3'].fontSize,
                                            transform: expanded === 'filtersTags' ? 'rotate(90deg)' : undefined
                                        }}
                                    />
                                </button>
                                {expanded === 'filtersTags' && (
                                    <Box style={sectionBodyStyle}>
                                        <FiltersTags
                                            tagsOptions={data.Tags}
                                            libraryViewSettings={libraryViewSettings}
                                            setLibraryViewSettings={setLibraryViewSettings}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}

                        {data?.Years && data?.Years?.length > 0 && (
                            <Box>
                                <button
                                    type="button"
                                    style={sectionHeaderStyle}
                                    onClick={() => toggleSection('filtersYears')}
                                >
                                    <Text size="md">{globalize.translate('HeaderYears')}</Text>
                                    <ChevronRightIcon
                                        style={{
                                            fontSize: vars.typography['3'].fontSize,
                                            transform: expanded === 'filtersYears' ? 'rotate(90deg)' : undefined
                                        }}
                                    />
                                </button>
                                {expanded === 'filtersYears' && (
                                    <Box style={sectionBodyStyle}>
                                        <FiltersYears
                                            yearsOptions={data.Years}
                                            libraryViewSettings={libraryViewSettings}
                                            setLibraryViewSettings={setLibraryViewSettings}
                                        />
                                    </Box>
                                )}
                            </Box>
                        )}
                    </>
                )}
                {isFiltersStudiosEnabled() && studios && (
                    <Box>
                        <button
                            type="button"
                            style={sectionHeaderStyle}
                            onClick={() => toggleSection('filtersStudios')}
                        >
                            <Text size="md">{globalize.translate('Studios')}</Text>
                            <ChevronRightIcon
                                style={{
                                    fontSize: vars.typography['3'].fontSize,
                                    transform: expanded === 'filtersStudios' ? 'rotate(90deg)' : undefined
                                }}
                            />
                        </button>
                        {expanded === 'filtersStudios' && (
                            <Box style={sectionBodyStyle}>
                                <FiltersStudios
                                    studiosOptions={studios}
                                    libraryViewSettings={libraryViewSettings}
                                    setLibraryViewSettings={setLibraryViewSettings}
                                />
                            </Box>
                        )}
                    </Box>
                )}
            </Box>
        </Menu>
    );
};

export default FilterButton;
