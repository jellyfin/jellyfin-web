// PWA Offline Manager
class PWAOfflineManager {
    static init() {
        this.online = navigator.onLine;
        this.setupOfflineDetection();
        this.updateOnlineStatus();
    }

    static setupOfflineDetection() {
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

    static handleOnline() {
        this.online = true;
        console.log('[PWA] Connection restored');
        this.updateOnlineStatus();
        this.hideOfflineBanner();

        // Trigger background sync if available
        if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
            navigator.serviceWorker.ready.then((registration) => {
                registration.sync.register('background-sync');
            });
        }
    }

    static handleOffline() {
        this.online = false;
        console.log('[PWA] Connection lost');
        this.updateOnlineStatus();
        this.showOfflineBanner();
    }

    static checkConnectivity() {
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
        const themeMeta = document.querySelector('meta[name="theme-color"]');
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
                top: 0;
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

        // Adjust body padding to account for banner
        document.body.style.paddingTop = '40px';
    }

    static hideOfflineBanner() {
        const banner = document.getElementById('pwa-offline-banner');
        if (banner) {
            banner.remove();
            document.body.style.paddingTop = '';
        }
    }

    static getConnectionStatus() {
        return {
            online: this.online,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            } : null
        };
    }
}

// Initialize offline manager
PWAOfflineManager.init();

// Export for debugging
window.PWAOfflineManager = PWAOfflineManager;