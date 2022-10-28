import { UserDto } from '@jellyfin/sdk/lib/generated-client/models/user-dto';
import { createContext, useContext } from 'react';

export const UserContext = createContext<UserDto | undefined>(undefined);
export const useUser = () => useContext(UserContext);
