import React, { type ChangeEvent, type FC, useCallback, useRef } from 'react';
import AlphaPicker from 'components/alphaPicker/AlphaPickerComponent';
import { Input } from 'ui-primitives/Input';
import globalize from 'lib/globalize';
import layoutManager from 'components/layoutManager';
import browser from 'scripts/browser';
import * as layoutStyles from 'styles/layout.css';
import * as styles from './searchfields.css';

interface SearchFieldsProps {
    query: string;
    onSearch?: (query: string) => void;
}

const SearchFields: FC<SearchFieldsProps> = ({
    onSearch = () => {
        /* no-op */
    },
    query
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const onAlphaPicked = useCallback(
        (e: Event) => {
            const value = (e as CustomEvent).detail.value;
            const inputValue = inputRef.current?.value || '';

            if (value === 'backspace') {
                onSearch(inputValue.length ? inputValue.substring(0, inputValue.length - 1) : '');
            } else {
                onSearch(inputValue + value);
            }
        },
        [onSearch]
    );

    const onChange = useCallback(
        (e: ChangeEvent<HTMLInputElement>) => {
            onSearch(e.target.value);
        },
        [onSearch]
    );

    return (
        <div className={`${layoutStyles.paddedLeft} ${layoutStyles.paddedRight} searchFields`}>
            <div
                className={`${styles.searchFieldsInner} ${layoutStyles.display.flex} ${layoutStyles.alignItems.center} ${layoutStyles.justifyContent.center}`}
            >
                <span className={`${styles.searchFieldsIcon} material-icons search`} aria-hidden="true" />
                <div className={`${layoutStyles.flexGrow}`} style={{ marginBottom: 0 }}>
                    <Input
                        ref={inputRef}
                        id="searchTextInput"
                        className="searchfields-txtSearch"
                        type="text"
                        data-keyboard="true"
                        placeholder={globalize.translate('Search')}
                        autoComplete="off"
                        maxLength={40}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus
                        value={query}
                        onChange={onChange}
                    />
                </div>
            </div>
            {layoutManager.tv && !browser.tv && <AlphaPicker onAlphaPicked={onAlphaPicked} />}
        </div>
    );
};

export default SearchFields;
