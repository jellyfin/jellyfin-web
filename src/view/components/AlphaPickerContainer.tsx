import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import AlphaPicker from '../../components/alphaPicker/alphaPicker';
import { AlphaPickerValueI, QueryI } from './interface';

interface AlphaPickerContainerI {
    getQuery: () => QueryI
    setAlphaPickerValue: React.Dispatch<AlphaPickerValueI>;
    setStartIndex: React.Dispatch<React.SetStateAction<number>>;
}

const AlphaPickerContainer: FC<AlphaPickerContainerI> = ({ getQuery, setAlphaPickerValue, setStartIndex }) => {
    const [ alphaPicker, setAlphaPicker ] = useState<AlphaPicker>();
    const element = useRef<HTMLDivElement>(null);
    const query = getQuery();

    alphaPicker?.updateControls(query);

    const onAlphaPickerChange = useCallback((e) => {
        const newValue = (e as CustomEvent).detail.value;
        let updatedValue;
        if (newValue === '#') {
            updatedValue = {NameLessThan: 'A'};
        } else {
            updatedValue = {NameStartsWith: newValue};
        }
        setAlphaPickerValue(updatedValue);
        setStartIndex(0);
    }, [setStartIndex, setAlphaPickerValue]);

    useEffect(() => {
        const alphaPickerElement = element.current;

        setAlphaPicker(new AlphaPicker({
            element: alphaPickerElement,
            valueChangeEvent: 'click'
        }));

        if (alphaPickerElement) {
            alphaPickerElement.addEventListener('alphavaluechanged', onAlphaPickerChange);
        }

        return () => {
            alphaPickerElement?.removeEventListener('alphavaluechanged', onAlphaPickerChange);
        };
    }, [onAlphaPickerChange]);

    return (
        <div ref={element} className='alphaPicker alphaPicker-fixed alphaPicker-fixed-right alphaPicker-vertical alphabetPicker-right' />
    );
};

export default AlphaPickerContainer;
