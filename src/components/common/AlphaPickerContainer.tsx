import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import AlphaPicker from '../alphaPicker/alphaPicker';
import { ViewQuerySettings } from '../../types/interface';

interface AlphaPickerContainerProps {
    viewQuerySettings: ViewQuerySettings;
    setViewQuerySettings: React.Dispatch<React.SetStateAction<ViewQuerySettings>>;
}

const AlphaPickerContainer: FC<AlphaPickerContainerProps> = ({ viewQuerySettings, setViewQuerySettings }) => {
    const [ alphaPicker, setAlphaPicker ] = useState<AlphaPicker>();
    const element = useRef<HTMLDivElement>(null);

    alphaPicker?.updateControls(viewQuerySettings);

    const onAlphaPickerChange = useCallback((e) => {
        const newValue = (e as CustomEvent).detail.value;
        let updatedValue: React.SetStateAction<ViewQuerySettings>;
        if (newValue === '#') {
            updatedValue = {
                NameLessThan: 'A',
                NameStartsWith: undefined
            };
        } else {
            updatedValue = {
                NameLessThan: undefined,
                NameStartsWith: newValue
            };
        }
        setViewQuerySettings((prevState) => ({
            ...prevState,
            StartIndex: 0,
            ...updatedValue
        }));
    }, [setViewQuerySettings]);

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
