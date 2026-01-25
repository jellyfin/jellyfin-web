import React, { useState, useEffect } from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import globalize from 'lib/globalize';
import * as userSettings from 'scripts/settings/userSettings';
import { vars } from 'styles/tokens.css';

import { Box, Flex } from 'ui-primitives/Box';
import { Text, Heading } from 'ui-primitives/Text';
import { Button } from 'ui-primitives/Button';
import { Checkbox } from 'ui-primitives/Checkbox';

interface FilterGenre {
    Id: string;
    Name: string;
}

interface FilterOptions {
    settingsKey: string;
    settings: {
        IsUnplayed?: boolean;
        IsPlayed?: boolean;
        IsFavorite?: boolean;
        IsResumable?: boolean;
        SeriesStatus?: string;
        GenreIds?: string;
        IsHD?: boolean;
        Is4K?: boolean;
        IsSD?: boolean;
        Is3D?: boolean;
        HasSubtitles?: boolean;
        HasTrailer?: boolean;
        HasSpecialFeature?: boolean;
        HasThemeSong?: boolean;
        HasThemeVideo?: boolean;
    };
    genres?: FilterGenre[];
    onChange?: (settings: FilterOptions['settings']) => void;
}

interface FilterMenuProps {
    open: boolean;
    onClose: () => void;
    options: FilterOptions;
}

export function FilterMenu({ open, onClose, options }: FilterMenuProps) {
    const [filters, setFilters] = useState<FilterOptions['settings']>(options.settings);
    const [selectedGenres, setSelectedGenres] = useState<string[]>(
        options.settings.GenreIds?.split(',').filter(Boolean) || []
    );

    useEffect(() => {
        setFilters(options.settings);
        setSelectedGenres(options.settings.GenreIds?.split(',').filter(Boolean) || []);
    }, [options.settings]);

    const toggleGenre = (genreId: string) => {
        setSelectedGenres(prev => (prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]));
    };

    const toggleFilter = (key: keyof FilterOptions['settings']) => {
        setFilters(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const handleSave = () => {
        const delimiter = ',';
        const newFilters = {
            ...filters,
            GenreIds: selectedGenres.join(delimiter) || undefined
        };

        Object.keys(newFilters).forEach(key => {
            const value = newFilters[key as keyof typeof newFilters];
            const settingKey = options.settingsKey + '-' + key;
            if (value !== undefined && value !== null && value !== false) {
                userSettings.setFilter(settingKey, String(value));
            } else {
                userSettings.setFilter(settingKey, null);
            }
        });

        options.onChange?.(newFilters);
        onClose();
    };

    const handleClose = () => {
        setFilters(options.settings);
        setSelectedGenres(options.settings.GenreIds?.split(',').filter(Boolean) || []);
        onClose();
    };

    const genreOptions = options.genres || [];

    return (
        <DialogPrimitive.Root open={open} onOpenChange={isOpen => !isOpen && handleClose()}>
            <DialogPrimitive.Portal>
                <DialogPrimitive.Overlay
                    style={{
                        backgroundColor: vars.colors.overlay,
                        position: 'fixed',
                        inset: 0,
                        animation: 'fade-in 150ms ease',
                        zIndex: vars.zIndex.modalBackdrop
                    }}
                />
                <DialogPrimitive.Content
                    style={{
                        backgroundColor: vars.colors.surface,
                        borderRadius: vars.borderRadius.lg,
                        boxShadow: vars.shadows.xl,
                        position: 'fixed',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        maxWidth: '450px',
                        width: '90%',
                        maxHeight: '85vh',
                        overflowY: 'auto',
                        padding: '24px',
                        zIndex: vars.zIndex.modal
                    }}
                >
                    <Text
                        style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '16px',
                            display: 'block'
                        }}
                    >
                        {globalize.translate('Filters')}
                    </Text>
                    <Box style={{ padding: '0' }}>
                        <Box style={{ marginBottom: '24px' }}>
                            <Text size="sm" color="secondary" style={{ marginBottom: '16px' }}>
                                {globalize.translate('Unplayed')}
                            </Text>
                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.IsUnplayed || false}
                                        onChange={() => toggleFilter('IsUnplayed')}
                                    />
                                    <Text size="sm">{globalize.translate('Unplayed')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.IsPlayed || false}
                                        onChange={() => toggleFilter('IsPlayed')}
                                    />
                                    <Text size="sm">{globalize.translate('Played')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.IsFavorite || false}
                                        onChange={() => toggleFilter('IsFavorite')}
                                    />
                                    <Text size="sm">{globalize.translate('Favorite')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.IsResumable || false}
                                        onChange={() => toggleFilter('IsResumable')}
                                    />
                                    <Text size="sm">{globalize.translate('ContinueWatching')}</Text>
                                </label>
                            </Box>
                        </Box>

                        <Box style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />

                        <Box style={{ marginBottom: '24px' }}>
                            <Heading.H4 style={{ marginBottom: '16px' }}>
                                {globalize.translate('HeaderSeriesStatus')}
                            </Heading.H4>
                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.SeriesStatus === 'Continuing'}
                                        onChange={() =>
                                            setFilters(prev => ({
                                                ...prev,
                                                SeriesStatus:
                                                    prev.SeriesStatus === 'Continuing' ? undefined : 'Continuing'
                                            }))
                                        }
                                    />
                                    <Text size="sm">{globalize.translate('Continuing')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.SeriesStatus === 'Ended'}
                                        onChange={() =>
                                            setFilters(prev => ({
                                                ...prev,
                                                SeriesStatus: prev.SeriesStatus === 'Ended' ? undefined : 'Ended'
                                            }))
                                        }
                                    />
                                    <Text size="sm">{globalize.translate('Ended')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.SeriesStatus === 'Unreleased'}
                                        onChange={() =>
                                            setFilters(prev => ({
                                                ...prev,
                                                SeriesStatus:
                                                    prev.SeriesStatus === 'Unreleased' ? undefined : 'Unreleased'
                                            }))
                                        }
                                    />
                                    <Text size="sm">{globalize.translate('Unreleased')}</Text>
                                </label>
                            </Box>
                        </Box>

                        {genreOptions.length > 0 && (
                            <>
                                <Box style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />
                                <Box style={{ marginBottom: '24px' }}>
                                    <Heading.H4 style={{ marginBottom: '16px' }}>
                                        {globalize.translate('Genres')}
                                    </Heading.H4>
                                    <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                        {genreOptions.map(genre => (
                                            <label
                                                key={genre.Id}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '8px',
                                                    cursor: 'pointer'
                                                }}
                                            >
                                                <Checkbox
                                                    checked={selectedGenres.includes(genre.Id)}
                                                    onChange={() => toggleGenre(genre.Id)}
                                                />
                                                <Text size="sm">{genre.Name}</Text>
                                            </label>
                                        ))}
                                    </Box>
                                </Box>
                            </>
                        )}

                        <Box style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />

                        <Box style={{ marginBottom: '24px' }}>
                            <Heading.H4 style={{ marginBottom: '16px' }}>
                                {globalize.translate('HeaderVideoType')}
                            </Heading.H4>
                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox checked={filters.IsHD || false} onChange={() => toggleFilter('IsHD')} />
                                    <Text size="sm">HD</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox checked={filters.Is4K || false} onChange={() => toggleFilter('Is4K')} />
                                    <Text size="sm">4K</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox checked={filters.IsSD || false} onChange={() => toggleFilter('IsSD')} />
                                    <Text size="sm">SD</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox checked={filters.Is3D || false} onChange={() => toggleFilter('Is3D')} />
                                    <Text size="sm">3D</Text>
                                </label>
                            </Box>
                        </Box>

                        <Box style={{ height: '1px', background: 'var(--border-color)', margin: '16px 0' }} />

                        <Box style={{ marginBottom: '24px' }}>
                            <Heading.H4 style={{ marginBottom: '16px' }}>{globalize.translate('Features')}</Heading.H4>
                            <Box style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.HasSubtitles || false}
                                        onChange={() => toggleFilter('HasSubtitles')}
                                    />
                                    <Text size="sm">{globalize.translate('Subtitles')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.HasTrailer || false}
                                        onChange={() => toggleFilter('HasTrailer')}
                                    />
                                    <Text size="sm">{globalize.translate('Trailers')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.HasSpecialFeature || false}
                                        onChange={() => toggleFilter('HasSpecialFeature')}
                                    />
                                    <Text size="sm">{globalize.translate('Extras')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.HasThemeSong || false}
                                        onChange={() => toggleFilter('HasThemeSong')}
                                    />
                                    <Text size="sm">{globalize.translate('ThemeSongs')}</Text>
                                </label>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <Checkbox
                                        checked={filters.HasThemeVideo || false}
                                        onChange={() => toggleFilter('HasThemeVideo')}
                                    />
                                    <Text size="sm">{globalize.translate('ThemeVideos')}</Text>
                                </label>
                            </Box>
                        </Box>

                        <Flex style={{ justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
                            <Button variant="ghost" onClick={handleClose}>
                                {globalize.translate('ButtonBack')}
                            </Button>
                            <Button variant="primary" onClick={handleSave}>
                                {globalize.translate('Save')}
                            </Button>
                        </Flex>
                    </Box>
                    <DialogPrimitive.Close asChild>
                        <button
                            style={{
                                position: 'absolute',
                                right: '16px',
                                top: '16px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                            aria-label="Close"
                        >
                            ✕
                        </button>
                    </DialogPrimitive.Close>
                </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
        </DialogPrimitive.Root>
    );
}

export default FilterMenu;
