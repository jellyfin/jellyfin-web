export function getServerAddress(apiClient) {
    return Promise.resolve(apiClient.serverAddress());
}

export default {
    getServerAddress: getServerAddress
};
