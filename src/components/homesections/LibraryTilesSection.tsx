import React from 'react';

import { Heading } from 'ui-primitives';

import globalize from 'lib/globalize';
import { CardBuilder } from '../cardbuilder/builders';
import { CardOptions } from '../cardbuilder/cardBuilder';
import * as styles from './LibraryTilesSection.css.ts';

interface LibraryTilesSectionProps {
    userViews: any[];
}

const LibraryTilesSection: React.FC<LibraryTilesSectionProps> = ({ userViews }) => {
    if (userViews.length === 0) return null;

    const cardOptions: CardOptions = {
        shape: 'backdrop',
        showTitle: true,
        centerText: true,
        overlayText: false
    };

    return (
        <div className={styles.container}>
            <Heading.H3 className={styles.header}>{globalize.translate('HeaderMyMedia')}</Heading.H3>
            <CardBuilder items={userViews} options={cardOptions} />
        </div>
    );
};

export default LibraryTilesSection;
