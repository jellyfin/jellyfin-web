import React, { FC, useCallback, useEffect, useRef, useState } from 'react';
import AlphaPicker from '../../components/alphaPicker/alphaPicker';
import { ViewSettingsI } from './interface';

interface AlphaPickerContainerProps {
    viewSettings: ViewSettingsI
    setViewSettings: React.Dispatch<React.SetStateAction<ViewSettingsI>>;
}

const AlphaPickerContainer: FC<AlphaPickerContainerProps> = ({ viewSettings, setViewSettings }) => {
    const [ alphaPicker, setAlphaPicker ] = useState<AlphaPicker>();
    const element = useRef<HTMLDivElement>(null);

    alphaPicker?.updateControls(viewSettings);

    const onAlphaPickerChange = useCallback((e) => {
        const newValue = (e as CustomEvent).detail.value;
        let updatedValue: React.SetStateAction<ViewSettingsI>;
        if (newValue === '#') {
            updatedValue = {NameLessThan: 'A'};
        } else {
            updatedValue = {NameStartsWith: newValue};
        }
        setViewSettings((prevState) => ({
            ...prevState,
            StartIndex: 0,
            ...updatedValue
        }));
    }, [setViewSettings]);

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
