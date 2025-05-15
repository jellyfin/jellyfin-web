import escapeHtml from 'escape-html';
import dom from '../../scripts/dom';
import dialogHelper from '../dialogHelper/dialogHelper';
import loading from '../loading/loading';
import globalize from '../../lib/globalize';
import { ServerConnections } from 'lib/jellyfin-apiclient';
import actionsheet from '../actionSheet/actionSheet';
import '../../elements/emby-input/emby-input';
import '../../elements/emby-button/paper-icon-button-light';
import '../../elements/emby-button/emby-button';
import '../listview/listview.scss';
import 'material-design-icons-iconfont';
import '../formdialog.scss';

export default class ChannelMapper {
    constructor(options) {
        function mapChannel(button, channelId, providerChannelId) {
            loading.show();
            const providerId = options.providerId;
            ServerConnections.getApiClient(options.serverId).ajax({
                type: 'POST',
                url: ApiClient.getUrl('LiveTv/ChannelMappings'),
                data: JSON.stringify({
                    providerId: providerId,
                    tunerChannelId: channelId,
                    providerChannelId: providerChannelId
                }),
                contentType: 'application/json',
                dataType: 'json'
            }).then(mapping => {
                const listItem = dom.parentWithClass(button, 'listItem');
                button.setAttribute('data-providerid', mapping.ProviderChannelId);
                listItem.querySelector('.secondary').innerText = getMappingSecondaryName(mapping, currentMappingOptions.ProviderName);
                loading.hide();
            });
        }

        function onChannelsElementClick(e) {
            const btnMap = dom.parentWithClass(e.target, 'btnMap');

            if (btnMap) {
                const channelId = btnMap.getAttribute('data-id');
                const providerChannelId = btnMap.getAttribute('data-providerid');
                const menuItems = currentMappingOptions.ProviderChannels.map(m => {
                    return {
                        name: m.Name,
                        id: m.Id,
                        selected: m.Id.toLowerCase() === providerChannelId.toLowerCase()
                    };
                }).sort((a, b) => {
                    return a.name.localeCompare(b.name);
                });
                actionsheet.show({
                    positionTo: btnMap,
                    items: menuItems
                }).then(newChannelId => {
                    mapChannel(btnMap, channelId, newChannelId);
                });
            }
        }

        function getChannelMappingOptions(serverId, providerId) {
            const apiClient = ServerConnections.getApiClient(serverId);
            return apiClient.getJSON(apiClient.getUrl('LiveTv/ChannelMappingOptions', {
                providerId: providerId
            }));
        }

        function getMappingSecondaryName(mapping, providerName) {
            return `${mapping.ProviderChannelName || ''} - ${providerName}`;
        }

        function getTunerChannelHtml(channel, providerName) {
            let html = '';
            html += '<div class="listItem">';
            html += '<span class="material-icons listItemIcon dvr" aria-hidden="true"></span>';
            html += '<div class="listItemBody two-line">';
            html += '<h3 class="listItemBodyText">';
            html += escapeHtml(channel.Name);
            html += '</h3>';
            html += '<div class="secondary listItemBodyText">';

            if (channel.ProviderChannelName) {
                html += escapeHtml(getMappingSecondaryName(channel, providerName));
            }

            html += '</div>';
            html += '</div>';
            html += `<button class="btnMap autoSize" is="paper-icon-button-light" type="button" data-id="${channel.Id}" data-providerid="${channel.ProviderChannelId}"><span class="material-icons mode_edit" aria-hidden="true"></span></button>`;
            html += '</div>';
            return html;
        }

        function getEditorHtml() {
            let html = '';
            html += '<div class="formDialogContent smoothScrollY">';
            html += '<div class="dialogContentInner dialog-content-centered">';
            html += '<form style="margin:auto;">';
            html += `<h1>${globalize.translate('Channels')}</h1>`;
            html += '<div class="channels paperList">';
            html += '</div>';
            html += '</form>';
            html += '</div>';
            html += '</div>';
            return html;
        }

        function initEditor(dlg, initOptions) {
            getChannelMappingOptions(initOptions.serverId, initOptions.providerId).then(result => {
                currentMappingOptions = result;
                const channelsElement = dlg.querySelector('.channels');
                channelsElement.innerHTML = result.TunerChannels.map(channel => {
                    return getTunerChannelHtml(channel, result.ProviderName);
                }).join('');
                channelsElement.addEventListener('click', onChannelsElementClick);
            });
        }

        let currentMappingOptions;

        this.show = () => {
            const dialogOptions = {
                removeOnClose: true
            };
            dialogOptions.size = 'small';
            const dlg = dialogHelper.createDialog(dialogOptions);
            dlg.classList.add('formDialog');
            dlg.classList.add('ui-body-a');
            dlg.classList.add('background-theme-a');
            let html = '';
            const title = globalize.translate('MapChannels');
            html += '<div class="formDialogHeader">';
            html += `<button is="paper-icon-button-light" class="btnCancel autoSize" tabindex="-1" title="${globalize.translate('ButtonBack')}"><span class="material-icons arrow_back" aria-hidden="true"></span></button>`;
            html += '<h3 class="formDialogHeaderTitle">';
            html += title;
            html += '</h3>';
            html += '</div>';
            html += getEditorHtml();
            dlg.innerHTML = html;
            initEditor(dlg, options);
            dlg.querySelector('.btnCancel').addEventListener('click', () => {
                dialogHelper.close(dlg);
            });
            return new Promise(resolve => {
                dlg.addEventListener('close', resolve);
                dialogHelper.open(dlg);
            });
        };
    }
}
