import { Api } from '@jellyfin/sdk';
import { createContext, useContext } from 'react';

export const ApiContext = createContext<Api | undefined>(undefined);
export const useApi = () => useContext(ApiContext);
