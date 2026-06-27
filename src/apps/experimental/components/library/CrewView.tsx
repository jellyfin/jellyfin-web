import { ItemSortBy } from '@jellyfin/sdk/lib/models/api/item-sort-by';
import { SortOrder } from '@jellyfin/sdk/lib/generated-client/models/sort-order';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import React, { type FC, useCallback, useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useNavigate } from 'react-router-dom';
import Loading from 'components/loading/LoadingComponent';
import NoItemsMessage from 'components/common/NoItemsMessage';
import AlphabetPicker from './AlphabetPicker';
import Pagination from './Pagination';
import SortButton from './SortButton';
import { useApi } from 'hooks/useApi';
import { useLocalStorage } from 'hooks/useLocalStorage';
import { type LibraryViewSettings, type ParentId } from 'types/library';
import { LibraryTab } from 'types/libraryTab';
import { getAlphaPickerQuery, getDefaultLibraryViewSettings, getLimitQuery, getSettingsKey } from 'utils/items';

interface CrewMemberDto {
    PersonId: string;
    Name: string;
    PersonType: string;
}

interface CrewQueryResult {
    Items: CrewMemberDto[];
    TotalRecordCount: number;
}

interface CrewViewProps {
    parentId: ParentId;
    isBtnSortEnabled?: boolean;
    isAlphabetPickerEnabled?: boolean;
    noItemsMessage: string;
}

const CrewView: FC<CrewViewProps> = ({
    parentId,
    isBtnSortEnabled = true,
    isAlphabetPickerEnabled = true,
    noItemsMessage
}) => {
    const { api } = useApi();
    const navigate = useNavigate();
    const [libraryViewSettings, setLibraryViewSettings] =
        useLocalStorage<LibraryViewSettings>(
            getSettingsKey(LibraryTab.Crew, parentId),
            {
                ...getDefaultLibraryViewSettings(LibraryTab.Crew),
                SortBy: ItemSortBy.SortName,
                SortOrder: SortOrder.Ascending,
                StartIndex: 0
            }
        );

    const { isLoading, data, isPlaceholderData } = useQuery({
        queryKey: ['Crew', parentId, libraryViewSettings.SortBy, libraryViewSettings.SortOrder, libraryViewSettings.StartIndex, libraryViewSettings.Alphabet],
        queryFn: async ({ signal }) => {
            if (!api) return undefined;
            const alphaQuery = getAlphaPickerQuery(libraryViewSettings);
            const limitQuery = getLimitQuery();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const apiAny = api as any;
            const queryParams = new URLSearchParams();
            queryParams.set('sortBy', libraryViewSettings.SortBy);
            queryParams.set('sortOrder', libraryViewSettings.SortOrder);
            queryParams.set('startIndex', String(libraryViewSettings.StartIndex));
            if (parentId) queryParams.set('parentId', String(parentId));
            if (alphaQuery.nameStartsWith) queryParams.set('nameStartsWith', alphaQuery.nameStartsWith);
            if (alphaQuery.nameLessThan) queryParams.set('nameLessThan', alphaQuery.nameLessThan);
            if (limitQuery.limit) queryParams.set('limit', String(limitQuery.limit));

            const response = await apiAny.axiosInstance.get(
                `${apiAny.basePath}/Persons/Crew?${queryParams.toString()}`,
                {
                    headers: { Authorization: apiAny.authorizationHeader },
                    signal
                }
            );
            return response.data as CrewQueryResult;
        },
        enabled: !!api,
        refetchOnWindowFocus: false,
        placeholderData: keepPreviousData
    });

    const totalRecordCount = data?.TotalRecordCount ?? 0;
    const items = data?.Items ?? [];

    useEffect(() => {
        if (
            !isLoading
            && !isPlaceholderData
            && libraryViewSettings.StartIndex > 0
            && items.length === 0
            && totalRecordCount > 0
        ) {
            setLibraryViewSettings(prev => ({ ...prev, StartIndex: 0 }));
        }
    }, [isLoading, isPlaceholderData, items.length, totalRecordCount, libraryViewSettings.StartIndex, setLibraryViewSettings]);

    const getImageUrl = useCallback((personId: string) => {
        if (!api || !personId || personId === '00000000000000000000000000000000') return undefined;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return `${(api as any).basePath}/Items/${personId}/Images/Primary?fillHeight=300&fillWidth=200&quality=90`;
    }, [api]);

    const handleCardClick = useCallback((member: CrewMemberDto) => {
        navigate(`/personvideos?personId=${member.PersonId}&personType=${encodeURIComponent(member.PersonType)}`);
    }, [navigate]);

    return (
        <Box>
            <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    totalRecordCount={totalRecordCount}
                    libraryViewSettings={libraryViewSettings}
                    isPlaceholderData={isPlaceholderData}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
                {isBtnSortEnabled && (
                    <SortButton
                        viewType={LibraryTab.Crew}
                        libraryViewSettings={libraryViewSettings}
                        setLibraryViewSettings={setLibraryViewSettings}
                    />
                )}
            </Box>

            {isAlphabetPickerEnabled && (
                <AlphabetPicker
                    libraryViewSettings={libraryViewSettings}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            )}

            {isLoading ? (
                <Loading />
            ) : items.length === 0 ? (
                <NoItemsMessage message={noItemsMessage} />
            ) : (
                <Box
                    className='centered padded-left padded-right vertical-wrap'
                    sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}
                >
                    {items.map((member) => {
                        const imageUrl = getImageUrl(member.PersonId);
                        return (
                            <Box
                                key={`${member.Name}-${member.PersonType}`}
                                onClick={() => handleCardClick(member)}
                                sx={{
                                    cursor: 'pointer',
                                    width: 140,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    userSelect: 'none',
                                    '&:hover': { opacity: 0.8 }
                                }}
                            >
                                <Box
                                    sx={{
                                        width: 140,
                                        height: 210,
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        backgroundColor: 'rgba(255,255,255,0.1)',
                                        mb: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}
                                >
                                    {imageUrl ? (
                                        <Box
                                            component='img'
                                            src={imageUrl}
                                            alt={member.Name}
                                            sx={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover'
                                            }}
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <Box
                                            sx={{
                                                fontSize: 48,
                                                color: 'rgba(255,255,255,0.3)'
                                            }}
                                        >
                                            👤
                                        </Box>
                                    )}
                                </Box>
                                <Typography
                                    variant='body2'
                                    align='center'
                                    sx={{ fontWeight: 'bold', lineHeight: 1.2 }}
                                >
                                    {member.Name}
                                </Typography>
                                <Typography
                                    variant='caption'
                                    align='center'
                                    sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.25 }}
                                >
                                    {member.PersonType}
                                </Typography>
                            </Box>
                        );
                    })}
                </Box>
            )}

            <Box className='flex align-items-center justify-content-center flex-wrap-wrap padded-top padded-left padded-right padded-bottom focuscontainer-x'>
                <Pagination
                    totalRecordCount={totalRecordCount}
                    libraryViewSettings={libraryViewSettings}
                    isPlaceholderData={isPlaceholderData}
                    setLibraryViewSettings={setLibraryViewSettings}
                />
            </Box>
        </Box>
    );
};

export default CrewView;
