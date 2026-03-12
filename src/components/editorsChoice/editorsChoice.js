/**
 * Editor's Choice Banner Carousel Component
 * Displays featured movies/series in an interactive banner carousel
 */

import { appRouter } from '../router/appRouter';
import globalize from '../../lib/globalize';
import escapeHtml from 'escape-html';
import layoutManager from '../layoutManager';
import focusManager from '../focusManager';
import './editorsChoice.scss';

let splideLoaded = false;
let splideInstance = null;
let keyboardNavigationEnabled = false;

/**
 * Load Splide.js library dynamically
 */
async function loadSplide() {
    if (splideLoaded) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        // Load CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/css/splide.min.css';
        link.integrity = 'sha256-5uKiXEwbaQh9cgd2/5Vp6WmMnsUr3VZZw0a8rKnOKNU=';
        link.crossOrigin = 'anonymous';
        document.head.appendChild(link);

        // Load JS
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@splidejs/splide@4.1.4/dist/js/splide.min.js';
        script.integrity = 'sha256-FZsW7H2V5X9TGinSjjwYJ419Xka27I8XPDmWryGlWtw=';
        script.crossOrigin = 'anonymous';
        script.onload = () => {
            splideLoaded = true;
            resolve();
        };
        script.onerror = () => {
            console.error('[EditorsChoice] Failed to load Splide.js');
            reject(new Error('Failed to load Splide.js'));
        };
        document.head.appendChild(script);
    });
}

/**
 * Get localized title text
 */
function getTitleText() {
    const locale = globalize.getCurrentLocale() || 'es-mx';

    const titleTranslations = {
        'en': 'Featured',
        'en-us': 'Featured',
        'en-gb': 'Featured',
        'es': 'Destacados',
        'es-mx': 'Destacados',
        'es-ar': 'Destacados',
        'fr': 'En vedette',
        'fr-ca': 'En vedette',
        'de': 'Empfohlen',
        'it': 'In evidenza',
        'pt': 'Em destaque',
        'pt-br': 'Em destaque',
        'pt-pt': 'Em destaque'
    };

    return titleTranslations[locale.toLowerCase()] || titleTranslations['en'];
}

/**
 * Get localized "Watch" button text
 */
function getWatchButtonText() {
    const locale = globalize.getCurrentLocale() || 'es-mx';

    const watchTranslations = {
        'en': 'Watch',
        'en-us': 'Watch',
        'en-gb': 'Watch',
        'es': 'Ver',
        'es-mx': 'Ver',
        'es-ar': 'Ver',
        'fr': 'Regarder',
        'fr-ca': 'Regarder',
        'de': 'Ansehen',
        'it': 'Guarda',
        'pt': 'Assistir',
        'pt-br': 'Assistir',
        'pt-pt': 'Assistir'
    };

    return watchTranslations[locale.toLowerCase()] || watchTranslations['en'];
}

/**
 * Get image URL for an item
 */
function getImageUrl(apiClient, item, imageType) {
    if (!item) return null;

    const itemId = item.Id;

    if (imageType === 'Logo' && item.ImageTags?.Logo) {
        return apiClient.getScaledImageUrl(itemId, {
            type: 'Logo',
            maxWidth: 300,
            tag: item.ImageTags.Logo
        });
    }

    if (imageType === 'Backdrop' && (item.BackdropImageTags?.length > 0 || item.ImageTags?.Backdrop)) {
        return apiClient.getScaledImageUrl(itemId, {
            type: 'Backdrop',
            maxWidth: 1920,
            tag: item.BackdropImageTags?.[0] || item.ImageTags.Backdrop
        });
    }

    if (imageType === 'Primary' && item.ImageTags?.Primary) {
        return apiClient.getScaledImageUrl(itemId, {
            type: 'Primary',
            maxWidth: 1920,
            tag: item.ImageTags.Primary
        });
    }

    return null;
}

/**
 * Generate HTML for a single carousel item
 */
function generateCarouselItemHtml(item, apiClient) {
    const backdropUrl = getImageUrl(apiClient, item, 'Backdrop') || getImageUrl(apiClient, item, 'Primary');
    const logoUrl = getImageUrl(apiClient, item, 'Logo');
    const itemUrl = appRouter.getRouteUrl(item);
    const watchText = getWatchButtonText();

    // Add focusable class for TV navigation
    const focusableClass = layoutManager.tv ? ' focusable' : '';

    let html = `<a href="${escapeHtml(itemUrl)}" class="editorsChoiceItemBanner splide__slide${focusableClass}" style="background-image:url('${escapeHtml(backdropUrl)}');" tabindex="0">`;
    html += '<div>';

    // Logo or Title
    if (logoUrl) {
        html += `<img class="editorsChoiceItemLogo" src="${escapeHtml(logoUrl)}" alt="${escapeHtml(item.Name || '')}" loading="lazy" />`;
    } else if (item.Name) {
        html += `<h1 class="editorsChoiceItemTitle">${escapeHtml(item.Name)}</h1>`;
    }

    // Rating
    if (item.CommunityRating) {
        html += '<div class="editorsChoiceItemRating starRatingContainer">';
        html += '<span class="material-icons starIcon star">star</span>';
        html += `<span>${item.CommunityRating.toFixed(1)}</span>`;
        html += '</div>';
    }

    // Overview
    if (item.Overview) {
        html += `<p class="editorsChoiceItemOverview">${escapeHtml(item.Overview)}</p>`;
    }

    // Watch button
    html += '<button is="emby-button" class="editorsChoiceItemButton raised button-submit block emby-button">';
    html += `<span>${escapeHtml(watchText)}</span>`;
    html += '</button>';

    html += '</div>'; // inner div
    html += '</a>'; // editorsChoiceItemBanner

    return html;
}

/**
 * Fetch featured items from Jellyfin API
 */
async function fetchFeaturedItems(apiClient) {
    try {
        const options = {
            IncludeItemTypes: 'Movie,Series',
            Limit: 10,
            SortBy: 'Random',
            Fields: 'PrimaryImageAspectRatio,Overview,CommunityRating,BackdropImageTags,ImageTags',
            ImageTypeLimit: 1,
            EnableImageTypes: 'Primary,Backdrop,Logo,Thumb',
            Filters: 'IsNotFolder',
            Recursive: true
        };

        const result = await apiClient.getItems(apiClient.getCurrentUserId(), options);
        const items = result.Items || [];

        return items;
    } catch (error) {
        console.error('[EditorsChoice] Error fetching featured items:', error);
        return [];
    }
}

/**
 * Handle keyboard navigation for TV
 */
function handleKeyboardNavigation(e) {
    if (!splideInstance || !layoutManager.tv) return;

    const key = e.key;
    const activeElement = document.activeElement;

    // Only handle if focus is on a slide
    if (!activeElement?.classList.contains('editorsChoiceItemBanner')) return;

    let handled = false;

    switch (key) {
        case 'ArrowLeft':
        case 'Left':
            e.preventDefault();
            e.stopPropagation();
            splideInstance.go('<');
            // Focus the new slide after transition
            setTimeout(() => {
                const activeSlide = document.querySelector('.editorsChoiceItemBanner.is-active');
                if (activeSlide) focusManager.focus(activeSlide);
            }, 100);
            handled = true;
            break;

        case 'ArrowRight':
        case 'Right':
            e.preventDefault();
            e.stopPropagation();
            splideInstance.go('>');
            // Focus the new slide after transition
            setTimeout(() => {
                const activeSlide = document.querySelector('.editorsChoiceItemBanner.is-active');
                if (activeSlide) focusManager.focus(activeSlide);
            }, 100);
            handled = true;
            break;
    }

    return handled;
}

/**
 * Initialize Splide carousel
 */
function initializeSplide(containerId, autoplay = true, interval = 10000, height = 360) {
    if (!globalThis.Splide) {
        console.error('[EditorsChoice] Splide is not available');
        return;
    }

    const splideElement = document.querySelector(`#${containerId} .splide`);
    if (!splideElement) {
        console.error('[EditorsChoice] Splide element not found');
        return;
    }

    // Destroy existing instance if any
    if (splideInstance) {
        splideInstance.destroy();
    }

    try {
        // Disable autoplay on TV for better control
        const enableAutoplay = layoutManager.tv ? false : autoplay;

        splideInstance = new globalThis.Splide(`#${containerId} .splide`, {
            type: 'loop',
            autoplay: enableAutoplay,
            interval: interval,
            pagination: false,
            keyboard: !layoutManager.tv, // Disable Splide keyboard on TV, we handle it ourselves
            height: `${height}px`,
            arrows: !layoutManager.tv, // Hide arrows on TV
            drag: !layoutManager.tv,
            pauseOnHover: true,
            pauseOnFocus: true,
            resetProgress: false,
            speed: 800,
            rewind: true,
            rewindSpeed: 800
        });

        splideInstance.mount();

        // Enable keyboard navigation for TV
        if (layoutManager.tv && !keyboardNavigationEnabled) {
            document.addEventListener('keydown', handleKeyboardNavigation);
            keyboardNavigationEnabled = true;

            // Auto-focus first slide on TV
            setTimeout(() => {
                const firstSlide = document.querySelector('.editorsChoiceItemBanner.is-active');
                if (firstSlide) {
                    focusManager.focus(firstSlide);
                }
            }, 200);
        }
    } catch (error) {
        console.error('[EditorsChoice] Error initializing Splide:', error);
    }
}

/**
 * Render the Editor's Choice carousel
 * @param {HTMLElement} elem - Container element
 * @param {Object} apiClient - Jellyfin API client
 */
export async function renderEditorsChoice(elem, apiClient) {
    try {
        // Load Splide library
        await loadSplide();

        // Fetch featured items
        const items = await fetchFeaturedItems(apiClient);

        if (!items || items.length === 0) {
            elem.innerHTML = '';
            return;
        }

        // Generate unique container ID
        const containerId = 'editorsChoice-' + Date.now();

        // Generate HTML structure
        let html = `<div id="${containerId}" class="verticalSection section-1 editorsChoiceContainer">`;
        html += `<h2 class="sectionTitle sectionTitle-cards">${getTitleText()}</h2>`;
        html += '<div class="splide cardScalable">';

        // Carousel track
        html += '<div class="splide__track">';
        html += '<div class="editorsChoiceItemsContainer splide__list">';

        // Generate items
        items.forEach(item => {
            html += generateCarouselItemHtml(item, apiClient);
        });

        html += '</div>'; // splide__list
        html += '</div>'; // splide__track
        html += '</div>'; // splide
        html += '</div>'; // editorsChoiceContainer

        // Set HTML
        elem.innerHTML = html;

        // Initialize Splide after DOM update using requestAnimationFrame
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                // Use different height for TV layout
                const carouselHeight = layoutManager.tv ? 450 : 360;
                initializeSplide(containerId, true, 10000, carouselHeight);
            });
        });
    } catch (error) {
        console.error('[EditorsChoice] Error rendering:', error);
        elem.innerHTML = '';
    }
}

/**
 * Destroy the carousel instance
 */
export function destroyEditorsChoice() {
    if (splideInstance) {
        splideInstance.destroy();
        splideInstance = null;
    }

    // Remove keyboard navigation listener
    if (keyboardNavigationEnabled) {
        document.removeEventListener('keydown', handleKeyboardNavigation);
        keyboardNavigationEnabled = false;
    }
}

export default {
    renderEditorsChoice,
    destroyEditorsChoice
};
