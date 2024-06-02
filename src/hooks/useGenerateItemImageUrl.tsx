import { ImageApiGetItemImageRequest } from '@jellyfin/sdk/lib/generated-client/api/image-api';
import { useApi } from './useApi';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';

const useGenerateItemImageUrl = (
    itemId: string | undefined,
    imageType: ImageType,
    parametersOptions: Omit<ImageApiGetItemImageRequest, 'itemId'>
): string | undefined => {
    const currentApi = useApi();

    if (!itemId) return undefined;
    return currentApi.api?.getItemImageUrl(itemId, imageType, parametersOptions);
};

export default useGenerateItemImageUrl;
