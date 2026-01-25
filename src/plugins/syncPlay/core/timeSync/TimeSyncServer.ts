import TimeSync from './TimeSync';

class TimeSyncServer extends (TimeSync as any) {
    requestPing(): Promise<any> {
        const apiClient = this.manager.getApiClient();
        const requestSent = new Date();
        return apiClient.getServerTime().then((response: any) => {
            const responseReceived = new Date();
            return response.json().then((data: any) => {
                const requestReceived = new Date(data.RequestReceptionTime);
                const responseSent = new Date(data.ResponseTransmissionTime);
                return {
                    requestSent,
                    requestReceived,
                    responseSent,
                    responseReceived
                };
            });
        });
    }
}

export default TimeSyncServer;
