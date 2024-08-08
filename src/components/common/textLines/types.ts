import type { NullableString } from 'types/base/common/shared/types';

export interface TextAction {
    url: string;
    title: string;
}

export interface TextLine {
    title?: NullableString;
    titleAction?: TextAction[];
}

export interface TextLineOpts {
    showProgramDateTime?: boolean;
    showProgramTime?: boolean;
    showChannel?: boolean;
    showParentTitle?: boolean;
    showIndexNumber?: boolean;
    parentTitleWithTitle?: boolean;
    showArtist?: boolean;
    includeParentInfoInTitle?: boolean;
    showCurrentProgram?: boolean;
}
