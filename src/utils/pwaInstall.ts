// PWA Installation Manager
import { logger } from './logger';

declare global {
    interface Window {
        gtag?: (...args: any[]) => void;
        PWAInstallManager: typeof PWAInstallManager;
    }
}

class PWAInstallManager {
    private static deferredPrompt: any = null;

    static init() {
        // Listen for the beforeinstallprompt event
        window.addEventListener('beforeinstallprompt', (e) => {
            logger.info('[PWA] Install prompt available', { component: 'pwaInstall' });
            e.preventDefault();
            this.deferredPrompt = e;
            this.showInstallPrompt();
        });

        // Listen for successful installation
        window.addEventListener('appinstalled', () => {
            logger.info('[PWA] App installed successfully', { component: 'pwaInstall' });
            this.hideInstallPrompt();
            this.trackInstallation();
        });

        // Check if already installed
        if (this.isInstalled()) {
            logger.info('[PWA] App already installed', { component: 'pwaInstall' });
            return;
        }

        // Show install prompt after some user interaction
        this.setupAutoPrompt();
    }

    static isInstalled(): boolean {
        // Check if running in standalone mode
        return (
            window.matchMedia('(display-mode: standalone)').matches ||
            (window.navigator as any).standalone === true
        );
    }

    private static setupAutoPrompt() {
        // Show install prompt after 3 seconds of interaction
        let interactionCount = 0;
        const handleInteraction = () => {
            interactionCount++;
            if (interactionCount >= 3 && this.deferredPrompt && !this.isInstalled()) {
                setTimeout(() => this.showInstallPrompt(), 30000);
                document.removeEventListener('click', handleInteraction);
                document.removeEventListener('touchstart', handleInteraction);
            }
        };

        document.addEventListener('click', handleInteraction);
        document.addEventListener('touchstart', handleInteraction);
    }

    static showInstallPrompt() {
        if (!this.deferredPrompt || sessionStorage.getItem('pwa-install-dismissed') === 'true')
            return;

        // Create and show install banner
        const banner = document.createElement('div');
        banner.id = 'pwa-install-banner';
        banner.innerHTML = `
            <div style="
                position: fixed;
                bottom: 20px;
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
                    <strong>Install Jellyfin</strong><br>
                    <small>Add to home screen for the best experience</small>
                </div>
                <div>
                    <button id="install-btn" style="
                        background: white;
                        color: #00a4dc;
                        border: none;
                        padding: 8px 16px;
                        border-radius: 4px;
                        margin-left: 8px;
                        cursor: pointer;
                        font-weight: bold;
                    ">Install</button>
                    <button id="dismiss-btn" style="
                        background: transparent;
                        color: white;
                        border: 1px solid white;
                        padding: 8px 16px;
                        border-radius: 4px;
                        margin-left: 8px;
                        cursor: pointer;
                    ">Not Now</button>
                </div>
            </div>
        `;

        document.body.appendChild(banner);

        // Handle install button
        document.getElementById('install-btn')?.addEventListener('click', async () => {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            logger.info('[PWA] Install outcome', { component: 'pwaInstall', outcome });
            this.deferredPrompt = null;
            this.hideInstallPrompt();
        });

        // Handle dismiss button
        document.getElementById('dismiss-btn')?.addEventListener('click', () => {
            this.hideInstallPrompt();
            // Don't show again for this session
            sessionStorage.setItem('pwa-install-dismissed', 'true');
        });
    }

    static hideInstallPrompt() {
        const banner = document.getElementById('pwa-install-banner');
        if (banner) {
            banner.remove();
        }
    }

    static trackInstallation() {
        // Track installation for analytics
        if (window.gtag) {
            window.gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: 'Installation'
            });
        }

        // Store installation date
        localStorage.setItem('pwa-installed-date', new Date().toISOString());
    }

    static getInstallStats() {
        const installDate = localStorage.getItem('pwa-installed-date');
        return {
            isInstalled: this.isInstalled(),
            installDate: installDate,
            daysSinceInstall: installDate
                ? Math.floor((Date.now() - new Date(installDate).getTime()) / (1000 * 60 * 60 * 24))
                : null
        };
    }
}

export default PWAInstallManager;
