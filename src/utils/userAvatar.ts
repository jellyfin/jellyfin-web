import type { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';

import { getDefaultBackgroundClass } from 'components/cardbuilder/utils/builder';

/**
 * The classes that give the fallback avatar of a user without a picture one of the theme's card background colors,
 * so users can still be told apart and the avatars look like the other cards of the theme. The color is picked by
 * the id (or the name when there is none) instead of at random, so a user keeps the same color everywhere, in the
 * legacy as in the modern layout.
 */
export const getUserAvatarBackgroundClass = (user: UserDto): string => getDefaultBackgroundClass(user.Id ?? user.Name);
