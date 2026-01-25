export function getTextActionButton(item: any, text: string, serverId?: string): string {
    return `<button is="emby-button" type="button" class="cardTextAction cardTextAction-primary card-padded card-hovereffect" data-action="${text}" data-serverid="${serverId}" data-cardid="${item.Id}">
        <span class="cardTextAction-text">${text}</span>
    </button>`;
}
