import type { BaseItemDto, BaseItemKind, CollectionTypeOptions, RecordingStatus, SearchHint, SeriesTimerInfoDto, TimerInfoDto, UserItemDataDto, VirtualFolderInfo } from '@jellyfin/sdk/lib/generated-client';

type BaseItem = Omit<BaseItemDto, 'ChannelId' | 'EndDate' | 'Id' | 'StartDate' | 'Status' | 'Type' | 'Artists' | 'MediaType' | 'Name' | 'CollectionType'>;
type TimerInfo = Omit<TimerInfoDto, 'ChannelId' | 'EndDate' | 'Id' | 'StartDate' | 'Status' | 'Type' | 'Name'>;
type SeriesTimerInfo = Omit<SeriesTimerInfoDto, 'ChannelId' | 'EndDate' | 'Id' | 'StartDate' | 'Type' | 'Name'>;
type SearchHintItem = Omit<SearchHint, 'ItemId' |'Artists' | 'Id' | 'MediaType' | 'Name' | 'StartDate' | 'Type'>;
type UserItem = Omit<UserItemDataDto, 'ItemId'>;
type VirtualFolder = Omit<VirtualFolderInfo, 'CollectionType'>;

export interface ItemDto extends BaseItem, TimerInfo, SeriesTimerInfo, SearchHintItem, UserItem, VirtualFolder {
    'ChannelId'?: string | null;
    'EndDate'?: string | null;
    'Id'?: string | null;
    'StartDate'?: string | null;
    'Type'?: BaseItemKind | string | null;
    'Status'?: RecordingStatus | string | null;
    'CollectionType'?: CollectionTypeOptions | string | null;
    'Artists'?: Array<string> | null;
    'MediaType'?: string | null;
    'Name'?: string | null;
    'ItemId'?: string | null;
}
