import React, { FunctionComponent, useEffect, useRef, useState } from 'react';
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

    useEffect(() => {
        const alphaPickerElement = element.current?.querySelector('.alphaPicker');

        if (alphaPickerElement) {
            alphaPickerElement.addEventListener('alphavaluechanged', (e) => {
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
            });
            setAlphaPicker(new AlphaPicker({
                element: alphaPickerElement,
                valueChangeEvent: 'click'
            }));

            alphaPickerElement.classList.add('alphaPicker-fixed-right');
        }
    }, [query, reloadItems, setAlphaPicker]);

    return (
        <div ref={element}>
            <div className='alphaPicker alphaPicker-fixed alphaPicker-vertical alphabetPicker-right' />
        </div>
    );
};

export default AlphaPickerContainer;
