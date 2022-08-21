import React, { FunctionComponent, useCallback, useEffect, useRef, useState } from 'react';
import AlphaPicker from '../../components/alphaPicker/alphaPicker';
import { IQuery } from './type';

type AlphaPickerProps = {
    query: IQuery;
    reloadItems: () => void;
};

const AlphaPickerContainer: FunctionComponent<AlphaPickerProps> = ({ query, reloadItems }: AlphaPickerProps) => {
    const [ alphaPicker, setAlphaPicker ] = useState<AlphaPicker>();
    const element = useRef<HTMLDivElement>(null);

    alphaPicker?.updateControls(query);

    const onAlphaPickerChange = useCallback((e) => {
        const newValue = (e as CustomEvent).detail.value;
        if (newValue === '#') {
            query.NameLessThan = 'A';
            delete query.NameStartsWith;
        } else {
            query.NameStartsWith = newValue;
            delete query.NameLessThan;
        }
        query.StartIndex = 0;
        reloadItems();
    }, [query, reloadItems]);

    useEffect(() => {
        const alphaPickerElement = element.current?.querySelector('.alphaPicker');

        setAlphaPicker(new AlphaPicker({
            element: alphaPickerElement,
            valueChangeEvent: 'click'
        }));

        if (alphaPickerElement) {
            alphaPickerElement.addEventListener('alphavaluechanged', onAlphaPickerChange);
        }
    }, [onAlphaPickerChange]);

    return (
        <div ref={element}>
            <div className='alphaPicker alphaPicker-fixed alphaPicker-fixed-right alphaPicker-vertical alphabetPicker-right' />
        </div>
    );
};

export default AlphaPickerContainer;
