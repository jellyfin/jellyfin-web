import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

export interface UserContextType {
    user: UserDto;
}
