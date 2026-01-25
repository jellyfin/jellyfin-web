import React, { useEffect, useState } from 'react';
import { useSearchParams } from './useSearchParams';

import { usePrevious } from './usePrevious';

/**
 * A hook for getting and setting a URL search parameter value that automatically handles updates to/from the URL.
 * @param param The search parameter name.
 */
const useSearchParam: (
    param: string,
    defaultValue?: string
) => [string, React.Dispatch<React.SetStateAction<string>>] = (param, defaultValue = '') => {
    const [searchParams, setSearchParams] = useSearchParams();
    const urlValue = searchParams.get(param) || defaultValue;
    const [value, setValue] = useState(urlValue);
    const previousValue = usePrevious(value, defaultValue);

    useEffect(() => {
        if (value !== previousValue) {
            if (value === defaultValue && urlValue !== defaultValue) {
                // The query input has been cleared; remove the url param
                searchParams.delete(param);
                setSearchParams(searchParams, { replace: true });
            } else if (value !== urlValue) {
                // Update the query url param value
                searchParams.set(param, value);
                setSearchParams(searchParams, { replace: true });
            }
        } else if (value !== urlValue) {
            // Update the query if the query url param has changed
            if (!urlValue) {
                searchParams.delete(param);
                setSearchParams(searchParams, { replace: true });
            }

            setValue(urlValue);
        }
    }, [value, previousValue, searchParams, setSearchParams, urlValue]);

    return [value, setValue];
};

export default useSearchParam;
