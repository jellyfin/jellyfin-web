// PWA Offline Manager
class PWAOfflineManager {
    private static online = true;

    static init() {
        this.online = navigator.onLine;
        this.setupOfflineDetection();
        this.updateOnlineStatus();
    }

    private static setupOfflineDetection() {
        window.addEventListener('online', () => {
            this.handleOnline();
        });

        window.addEventListener('offline', () => {
            this.handleOffline();
        });

        // Periodic connectivity check
        setInterval(() => {
            this.checkConnectivity();
        }, 30000); // Check every 30 seconds
    }

    private static handleOnline() {
        this.online = true;
        console.log('[PWA] Connection restored');
        this.updateOnlineStatus();
        this.hideOfflineBanner();

        // Trigger background sync if available
        if ('serviceWorker' in navigator && 'sync' in (window as any).ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration: any) => {
                registration.sync.register('background-sync');
            });
        }
    }

    private static handleOffline() {
        this.online = false;
        console.log('[PWA] Connection lost');
        this.updateOnlineStatus();
        this.showOfflineBanner();
    }

    private static checkConnectivity() {
        // Simple connectivity check
        fetch('/offline.html', {
            method: 'HEAD',
            cache: 'no-cache'
        })
            .then(() => {
                if (!this.online) {
                    this.handleOnline();
                }
            })
            .catch(() => {
                if (this.online) {
                    this.handleOffline();
                }
            });
    }

    static updateOnlineStatus() {
        document.documentElement.classList.toggle('offline', !this.online);
        document.documentElement.classList.toggle('online', this.online);

        // Update meta theme color based on connection status
        const themeMeta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement;
        if (themeMeta) {
            themeMeta.content = this.online ? '#101010' : '#ff6b35';
        }
    }

    static showOfflineBanner() {
        // Only show if not already showing
        if (document.getElementById('pwa-offline-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'pwa-offline-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                top: 50px;
                left: 0;
                right: 0;
                background: #ff6b35;
                color: white;
                padding: 8px 16px;
                text-align: center;
                font-family: Arial, sans-serif;
                font-size: 14px;
                z-index: 10001;
                box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            ">
                <span>📱 You're offline. Some features may be limited.</span>
            </div>
        `;

        document.body.appendChild(banner);
    }

    static hideOfflineBanner() {
        const banner = document.getElementById('pwa-offline-banner');
        if (banner) {
            banner.remove();
        }
    }

    static getConnectionStatus() {
        const nav: any = navigator;
        return {
            online: this.online,
            connection: nav.connection ? {
                effectiveType: nav.connection.effectiveType,
                downlink: nav.connection.downlink,
                rtt: nav.connection.rtt,
                saveData: nav.connection.saveData
            } : null
        };
    }
}

export default PWAOfflineManager;
