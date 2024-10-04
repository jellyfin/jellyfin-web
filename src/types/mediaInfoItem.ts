interface TextAction {
    url: string;
    title: string;
    cssClass?: string;
}
export interface MiscInfo {
    text?: string | number;
    type?: string;
    textAction?: TextAction;
    cssClass?: string;
}
