// PWA Update Manager
class PWAUpdateManager {
    static init() {
        this.registration = null;
        this.updateAvailable = false;

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/serviceworker.js')
                .then((registration) => {
                    this.registration = registration;
                    this.setupUpdateListener();
                    this.checkForUpdates();
                })
                .catch(console.error);
        }
    }

    static setupUpdateListener() {
        if (!this.registration) return;

        this.registration.addEventListener('updatefound', () => {
            const newWorker = this.registration.installing;
            if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdatePrompt();
                    }
                });
            }
        });
    }

    static checkForUpdates() {
        if (!this.registration) return;

        this.registration.update().then(() => {
            console.log('[PWA] Checked for updates');
        }).catch(console.error);
    }

    static showUpdatePrompt() {
        this.updateAvailable = true;

        const updateBanner = document.createElement('div');
        updateBanner.id = 'pwa-update-banner';
        updateBanner.innerHTML = `
            <div style="
                position: fixed;
                bottom: 80px;
                left: 20px;
                right: 20px;
                background: #00a4dc;
                color: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                font-family: Arial, sans-serif;
                display: flex;
                align-items: center;
                justify-content: space-between;
            ">
                <div style="flex: 1;">
                    <strong>Update Available</strong><br>
                    <small>A new version of Jellyfin is ready</small>
                </div>
                <div>
                    <button id="update-btn" style="
                        background: white;
                        color: #00a4dc;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        margin-right: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Update</button>
                    <button id="dismiss-update-btn" style="
                        background: transparent;
                        color: white;
                        border: 1px solid white;
                        padding: 8px 16px;
                        border-radius: 4px;
                        cursor: pointer;
                    ">Later</button>
                </div>
            </div>
        `;

        document.body.appendChild(updateBanner);

        document.getElementById('update-btn').addEventListener('click', () => {
            this.applyUpdate();
        });

        document.getElementById('dismiss-update-btn').addEventListener('click', () => {
            this.hideUpdatePrompt();
        });
    }

    static hideUpdatePrompt() {
        const banner = document.getElementById('pwa-update-banner');
        if (banner) {
            banner.remove();
        }
    }

    static applyUpdate() {
        if (!this.registration?.waiting) return;

        // Tell the new service worker to skip waiting
        this.registration.waiting.postMessage({ type: 'SKIP_WAITING' });

        // Listen for the controlling change
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            // Reload the page to get the new version
            window.location.reload();
        });
    }

    static getUpdateStatus() {
        return {
            updateAvailable: this.updateAvailable,
            registrationState: this.registration?.active?.state || 'unknown'
        };
    }
}

// Initialize PWA update manager
PWAUpdateManager.init();

// Export for debugging
window.PWAUpdateManager = PWAUpdateManager;