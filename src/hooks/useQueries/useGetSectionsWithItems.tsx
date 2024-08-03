import {
    ImageType,
    ItemFields,
    BaseItemDto
} from '@jellyfin/sdk/lib/generated-client';
import { getItemsApi } from '@jellyfin/sdk/lib/utils/api/items-api';
import { getLiveTvApi } from '@jellyfin/sdk/lib/utils/api/live-tv-api';
import { getTvShowsApi } from '@jellyfin/sdk/lib/utils/api/tv-shows-api';
import { getUserLibraryApi } from '@jellyfin/sdk/lib/utils/api/user-library-api';
import { useQuery } from '@tanstack/react-query';
import type { AxiosRequestConfig } from 'axios';
import { JellyfinApiContext, useApi } from 'hooks/useApi';
import { ParentId } from 'types/library';
import { Section, SectionApiMethod, SectionType } from 'types/sections';
import { getSuggestionSections, getProgramSections } from 'utils/sections';

const fetchGetSectionItems = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    section: Section,
    options?: AxiosRequestConfig
) => {
    const { api, user } = currentApi;
    if (api && user?.Id) {
        let response;
        switch (section.apiMethod) {
            case SectionApiMethod.RecommendedPrograms: {
                response = (
                    await getLiveTvApi(api).getRecommendedPrograms(
                        {
                            userId: user.Id,
                            limit: 12,
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb,
                                ImageType.Backdrop
                            ],
                            enableTotalRecordCount: false,
                            fields: [
                                ItemFields.ChannelInfo,
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.LiveTvPrograms: {
                response = (
                    await getLiveTvApi(api).getLiveTvPrograms(
                        {
                            userId: user.Id,
                            limit: 12,
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb,
                                ImageType.Backdrop
                            ],
                            enableTotalRecordCount: false,
                            fields: [
                                ItemFields.ChannelInfo,
                                ItemFields.PrimaryImageAspectRatio
                            ],
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.Recordings: {
                response = (
                    await getLiveTvApi(api).getRecordings(
                        {
                            userId: user.Id,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb,
                                ImageType.Backdrop
                            ],
                            enableTotalRecordCount: false,
                            fields: [
                                ItemFields.CanDelete,
                                ItemFields.PrimaryImageAspectRatio
                            ],
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.RecordingFolders: {
                response = (
                    await getLiveTvApi(api).getRecordingFolders(
                        {
                            userId: user.Id
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.NextUp: {
                response = (
                    await getTvShowsApi(api).getNextUp(
                        {
                            userId: user.Id,
                            limit: 25,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            parentId: parentId ?? undefined,
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb,
                                ImageType.Backdrop
                            ],
                            enableTotalRecordCount: false,
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.ResumeItems: {
                response = (
                    await getItemsApi(api).getResumeItems(
                        {
                            userId: user.Id,
                            parentId: parentId ?? undefined,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb,
                                ImageType.Backdrop
                            ],
                            enableTotalRecordCount: false,
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
            case SectionApiMethod.LatestMedia: {
                response = (
                    await getUserLibraryApi(api).getLatestMedia(
                        {
                            userId: user.Id,
                            fields: [
                                ItemFields.PrimaryImageAspectRatio,
                                ItemFields.MediaSourceCount
                            ],
                            parentId: parentId ?? undefined,
                            imageTypeLimit: 1,
                            enableImageTypes: [
                                ImageType.Primary,
                                ImageType.Thumb
                            ],
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data;
                break;
            }
            default: {
                response = (
                    await getItemsApi(api).getItems(
                        {
                            userId: user.Id,
                            parentId: parentId ?? undefined,
                            recursive: true,
                            limit: 25,
                            enableTotalRecordCount: false,
                            ...section.parametersOptions
                        },
                        {
                            signal: options?.signal
                        }
                    )
                ).data.Items;
                break;
            }
        }
        return response;
    }
};

type SectionWithItems = {
    section: Section;
    items: BaseItemDto[];
};

const getSectionsWithItems = async (
    currentApi: JellyfinApiContext,
    parentId: ParentId,
    sections: Section[],
    sectionType?: SectionType[],
    options?: AxiosRequestConfig
) => {
    if (sectionType) {
        sections = sections.filter((section) =>
            sectionType.includes(section.type)
        );
    }

    const updatedSectionWithItems: SectionWithItems[] = [];

    for (const section of sections) {
        const items = await fetchGetSectionItems(
            currentApi,
            parentId,
            section,
            options
        );

        if (items && items.length > 0) {
            updatedSectionWithItems.push({
                section,
                items
            });
        }
    }

    return updatedSectionWithItems;
};

export const useGetSuggestionSectionsWithItems = (
    parentId: ParentId,
    suggestionSectionType: SectionType[]
) => {
    const currentApi = useApi();
    const sections = getSuggestionSections();
    return useQuery({
        queryKey: ['SuggestionSectionWithItems', { suggestionSectionType }],
        queryFn: ({ signal }) =>
            getSectionsWithItems(
                currentApi,
                parentId,
                sections,
                suggestionSectionType,
                { signal }
            ),
        enabled: !!parentId
    });
};

export const useGetProgramsSectionsWithItems = (
    parentId: ParentId,
    programSectionType: SectionType[]
) => {
    const currentApi = useApi();
    const sections = getProgramSections();
    return useQuery({
        queryKey: ['ProgramSectionWithItems', { programSectionType }],
        queryFn: ({ signal }) =>
            getSectionsWithItems(
                currentApi,
                parentId,
                sections,
                programSectionType,
                { signal }
            )
    });
};
