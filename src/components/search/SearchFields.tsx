import debounce from 'lodash-es/debounce';
import React, { FunctionComponent, useEffect, useMemo, useRef } from 'react';

import AlphaPicker from '../alphaPicker/AlphaPickerComponent';
import globalize from '../../scripts/globalize';

import 'material-design-icons-iconfont';

import '../../elements/jellyfin-input/jellyfin-input';
import '../../assets/css/flexstyles.scss';
import './searchfields.scss';
import layoutManager from '../layoutManager';
import browser from '../../scripts/browser';

// There seems to be some compatibility issues here between
// React and our legacy web components, so we need to inject
// them as an html string for now =/
const createInputElement = () => ({
    __html: `<input
    is="jellyfin-input"
    class="searchfields-txtSearch"
    type="text"
    data-keyboard="true"
    placeholder="${globalize.translate('Search')}"
    autocomplete="off"
    maxlength="40"
    autofocus
/>`
});

const normalizeInput = (value = '') => value.trim();

type SearchFieldsProps = {
    onSearch?: () => void
};

// eslint-disable-next-line @typescript-eslint/no-empty-function
const SearchFields: FunctionComponent<SearchFieldsProps> = ({ onSearch = () => {} }: SearchFieldsProps) => {
    const element = useRef(null);

    const getSearchInput = () => element?.current?.querySelector('.searchfields-txtSearch');

    const debouncedOnSearch = useMemo(() => debounce(onSearch, 400), [onSearch]);

    useEffect(() => {
        getSearchInput()?.addEventListener('input', e => {
            debouncedOnSearch(normalizeInput(e.target?.value));
        });
        getSearchInput()?.focus();

        return () => {
            debouncedOnSearch.cancel();
        };
    }, [debouncedOnSearch]);

    const onAlphaPicked = e => {
        const value = e.detail.value;
        const searchInput = getSearchInput();

        if (value === 'backspace') {
            const currentValue = searchInput.value;
            searchInput.value = currentValue.length ? currentValue.substring(0, currentValue.length - 1) : '';
        } else {
            searchInput.value += value;
        }

        searchInput.dispatchEvent(new CustomEvent('input', { bubbles: true }));
    };

    return (
        <div
            className='padded-left padded-right searchFields'
            ref={element}
        >
            <div className='searchFieldsInner flex align-items-center justify-content-center'>
                <span className='searchfields-icon material-icons search' />
                <div
                    className='inputContainer flex-grow'
                    style={{ marginBottom: 0 }}
                    dangerouslySetInnerHTML={createInputElement()}
                />
            </div>
            {layoutManager.tv && !browser.tv &&
                <AlphaPicker onAlphaPicked={onAlphaPicked} />
            }
        </div>
    );
};

export default SearchFields;
