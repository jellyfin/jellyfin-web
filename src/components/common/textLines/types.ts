export interface TextLine {
    title?: string;
    cssClass?: string;
}

export interface TextLineOpts {
    showProgramDateTime?: boolean;
    showProgramTime?: boolean;
    showChannel?: boolean;
    showTitle?: boolean;
    showParentTitle?: boolean;
    showIndexNumber?: boolean;
    parentTitleWithTitle?: boolean;
    showArtist?: boolean;
    showCurrentProgram?: boolean;
    includeIndexNumber?: boolean;
    includeParentInfoInTitle?: boolean;
}
