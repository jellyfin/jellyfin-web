import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { usePrevious } from './usePrevious';

/**
 * A hook for getting and setting a URL search parameter value that automatically handles updates to/from the URL.
 * @param param The search parameter name.
 */
const useSearchParam: (param: string) => [ string, React.Dispatch<React.SetStateAction<string>> ] = param => {
    const [ searchParams, setSearchParams ] = useSearchParams();
    const urlValue = searchParams.get(param) || '';
    const [ value, setValue ] = useState(urlValue);
    const previousValue = usePrevious(value, '');

    useEffect(() => {
        if (value !== previousValue) {
            if (value === '' && urlValue !== '') {
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
    }, [ value, previousValue, searchParams, setSearchParams, urlValue ]);

    return [ value, setValue ];
};

export default useSearchParam;
