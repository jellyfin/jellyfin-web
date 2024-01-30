import { UserItemDataDto } from '@jellyfin/sdk/lib/generated-client';

export interface ProgressOptions {
    containerClass: string,
    type?: string | null,
    userData?: UserItemDataDto,
    mediaType?: string
}
