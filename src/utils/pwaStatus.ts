// PWA Status Dashboard
class PWAStatusDashboard {
    static show() {
        const dashboard = document.createElement('div');
        dashboard.id = 'pwa-status-dashboard';
        dashboard.innerHTML = `
            <div style="
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0,0,0,0.8);
                z-index: 10002;
                display: flex;
                align-items: center;
                justify-content: center;
                font-family: Arial, sans-serif;
            ">
                <div style="
                    background: white;
                    border-radius: 8px;
                    padding: 24px;
                    max-width: 600px;
                    max-height: 80vh;
                    overflow-y: auto;
                    margin: 20px;
                ">
                    <h2 style="margin-top: 0; color: #101010;">PWA Status Dashboard</h2>
                    <div id="status-content">
                        <p>Loading...</p>
                    </div>
                    <div style="margin-top: 20px; text-align: right;">
                        <button id="refresh-status" style="
                            background: #00a4dc;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            margin-right: 8px;
                            cursor: pointer;
                        ">Refresh</button>
                        <button id="close-dashboard" style="
                            background: #666;
                            color: white;
                            border: none;
                            padding: 8px 16px;
                            border-radius: 4px;
                            cursor: pointer;
                        ">Close</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(dashboard);

        document.getElementById('close-dashboard')?.addEventListener('click', () => {
            dashboard.remove();
        });

        document.getElementById('refresh-status')?.addEventListener('click', () => {
            this.updateStatus();
        });

        this.updateStatus();
    }

    static async updateStatus() {
        const content = document.getElementById('status-content');
        if (!content) return;

        try {
            const status = await this.collectStatus();
            content.innerHTML = this.renderStatus(status);
        } catch (error: any) {
            content.innerHTML = `<p style="color: red;">Error loading status: ${error.message}</p>`;
        }
    }

    static async collectStatus() {
        const status: any = {
            pwa: {},
            serviceWorker: {},
            cache: {},
            network: {},
            performance: {}
        };

        const win: any = window;

        // PWA Status
        status.pwa = {
            installed: win.PWAInstallManager?.isInstalled() || false,
            installStats: win.PWAInstallManager?.getInstallStats() || {},
            updateAvailable: win.PWAUpdateManager?.updateAvailable || false
        };

        // Service Worker Status
        if ('serviceWorker' in navigator) {
            const registration = await navigator.serviceWorker.getRegistration();
            status.serviceWorker = {
                supported: true,
                registered: !!registration,
                state: registration?.active?.state || 'unknown',
                scope: registration?.scope || 'none'
            };
        } else {
            status.serviceWorker = { supported: false };
        }

        // Cache Status
        if (win.ServiceWorkerCacheManager) {
            try {
                status.cache = await win.ServiceWorkerCacheManager.getFormattedCacheStatus();
            } catch (e: any) {
                status.cache = { error: e.message };
            }
        }

        // Network Status
        status.network = win.PWAOfflineManager?.getConnectionStatus() || {};

        // Performance Status
        status.performance = {
            displayMode: this.getDisplayMode(),
            userAgent: navigator.userAgent,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            online: navigator.onLine
        };

        return status;
    }

    static getDisplayMode() {
        if (window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
        if (window.matchMedia('(display-mode: minimal-ui)').matches) return 'minimal-ui';
        if (window.matchMedia('(display-mode: fullscreen)').matches) return 'fullscreen';
        return 'browser';
    }

    static renderStatus(status: any) {
        return `
            <div style="line-height: 1.6; color: #333;">
                <h3 style="color: #101010;">PWA Status</h3>
                <ul>
                    <li><strong>Installed:</strong> ${status.pwa.installed ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>Update Available:</strong> ${status.pwa.updateAvailable ? '⚠️ Yes' : '✅ No'}</li>
                    <li><strong>Install Date:</strong> ${status.pwa.installStats.installDate || 'Not installed'}</li>
                    <li><strong>Days Since Install:</strong> ${status.pwa.installStats.daysSinceInstall || 'N/A'}</li>
                </ul>

                <h3 style="color: #101010;">Service Worker</h3>
                <ul>
                    <li><strong>Supported:</strong> ${status.serviceWorker.supported ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>Registered:</strong> ${status.serviceWorker.registered ? '✅ Yes' : '❌ No'}</li>
                    <li><strong>State:</strong> ${status.serviceWorker.state}</li>
                    <li><strong>Scope:</strong> ${status.serviceWorker.scope}</li>
                </ul>

                <h3 style="color: #101010;">Cache Status</h3>
                ${
                    Object.keys(status.cache).length > 0 && !status.cache.error
                        ? Object.entries(status.cache)
                              .map(
                                  ([cache, info]: [string, any]) =>
                                      `<li><strong>${cache}:</strong> ${info.entries} entries, ${info.size}, limit: ${info.limit}</li>`
                              )
                              .join('')
                        : '<li>No cache information available</li>'
                }

                <h3 style="color: #101010;">Network Status</h3>
                <ul>
                    <li><strong>Online:</strong> ${status.network.online ? '✅ Yes' : '❌ No'}</li>
                    ${
                        status.network.connection
                            ? `<li><strong>Connection:</strong> ${status.network.connection.effectiveType}, ${status.network.connection.downlink} Mbps</li>
                         <li><strong>RTT:</strong> ${status.network.connection.rtt}ms</li>
                         <li><strong>Save Data:</strong> ${status.network.connection.saveData ? 'On' : 'Off'}</li>`
                            : '<li>No connection information available</li>'
                    }
                </ul>

                <h3 style="color: #101010;">Performance</h3>
                <ul>
                    <li><strong>Display Mode:</strong> ${status.performance.displayMode}</li>
                    <li><strong>Language:</strong> ${status.performance.language}</li>
                    <li><strong>Cookies:</strong> ${status.performance.cookieEnabled ? 'Enabled' : 'Disabled'}</li>
                    <li><strong>Online:</strong> ${status.performance.online ? 'Yes' : 'No'}</li>
                </ul>
            </div>
        `;
    }
}

// Add keyboard shortcut for status dashboard (Ctrl+Shift+P)
if (typeof document !== 'undefined') {
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            PWAStatusDashboard.show();
        }
    });
}

export default PWAStatusDashboard;
