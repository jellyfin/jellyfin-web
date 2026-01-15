/**
 * Color Picker UI Component Logic
 *
 * Manages interactive color selection with bi-directional synchronization
 * between HTML5 color picker and hex text input. Provides real-time
 * contrast validation against Jellyfin's dark background (#101010).
 *
 * Architecture:
 * - Color swatch: HTML5 <input type="color"> (uses OS-native picker)
 * - Text input: <input type="text"> with hex pattern validation
 * - Bi-directional sync: Changes in either input update the other
 * - Validation: Real-time WCAG AA contrast checking
 * - Warnings: Orange warning box shown if contrast is too low
 *
 * Used in: playbackSettings.js for visualizer color configuration
 *
 * @example
 * import { initializeColorPickers, setColorSettingsUI } from './colorPicker';
 *
 * const container = document.querySelector('.settings');
 * setColorSettingsUI(container, { colorFreqAnalyzerLow: '#1ED24B' });
 * initializeColorPickers(container);
 * // Color pickers now sync automatically
 */

import { isValidHex, hasGoodContrast } from '../../utils/colorUtils';

/** @constant {string} Jellyfin dark background color for contrast checking */
const JELLYFIN_DARK_BG = '#101010';

/**
 * Synchronizes color swatch and hex text input in both directions
 *
 * Creates event listeners for real-time synchronization:
 * 1. Color swatch change → Updates hex text field (uppercase)
 * 2. Hex text change → Updates color swatch if valid
 * 3. Text blur → Normalizes to uppercase
 *
 * Validation happens on every change using WCAG contrast checking.
 * Invalid hex input shows red border via .invalid CSS class.
 *
 * @param {HTMLInputElement} colorInput - Color picker input element
 * @param {HTMLInputElement} textInput - Hex text input element (must be in DOM)
 * @returns {void}
 *
 * @example
 * const color = document.getElementById('colorPicker');
 * const text = document.getElementById('hexInput');
 * syncColorInputs(color, text);
 * // Now user can edit either input and they stay in sync
 */
export function syncColorInputs(colorInput, textInput) {
    if (!colorInput || !textInput) return;

    // Color picker changed -> update text
    colorInput.addEventListener('input', () => {
        textInput.value = colorInput.value.toUpperCase();
        validateColorContrast(colorInput);
    });

    // Text input changed -> update color picker
    textInput.addEventListener('input', () => {
        const hex = textInput.value.trim();
        if (isValidHex(hex)) {
            colorInput.value = hex;
            textInput.classList.remove('invalid');
            validateColorContrast(colorInput);
        } else {
            textInput.classList.add('invalid');
        }
    });

    // Ensure uppercase on blur
    textInput.addEventListener('blur', () => {
        const hex = textInput.value.trim();
        if (isValidHex(hex)) {
            textInput.value = hex.toUpperCase();
        }
    });
}

/**
 * Validates WCAG AA contrast and shows/hides warning element
 *
 * Checks if the selected color has sufficient contrast (4.5:1) against
 * Jellyfin's dark background (#101010). Shows an orange warning box
 * if contrast is insufficient.
 *
 * Warning behavior:
 * - If no warning exists yet, creates one and appends to parent
 * - If contrast fails: Shows warning (removes .hide class)
 * - If contrast passes: Hides warning (adds .hide class)
 *
 * Warning element is created dynamically with structure:
 * <div id="{colorInputId}Warning" class="colorContrastWarning">
 *     <span class="material-icons">visibility_off</span>
 *     Low contrast: May be hard to see
 * </div>
 *
 * @param {HTMLInputElement} colorInput - Color picker input (must have id attribute)
 * @returns {void}
 *
 * @example
 * const colorInput = document.getElementById('colorFreqAnalyzerLow');
 * validateColorContrast(colorInput);
 * // Shows warning if '#333333' is selected because it has low contrast
 */
function validateColorContrast(colorInput) {
    if (!colorInput || !colorInput.id) return;

    const selectedColor = colorInput.value;
    const contrastRatio = 4.5; // WCAG AA standard

    // Create warning element ID
    const warningId = `${colorInput.id}Warning`;
    let warning = document.getElementById(warningId);
    const warningContainer = colorInput.closest('.colorPickerRow')
        || colorInput.parentElement
        || colorInput;

    if (!hasGoodContrast(selectedColor, JELLYFIN_DARK_BG, contrastRatio)) {
        if (!warning) {
            warning = document.createElement('div');
            warning.id = warningId;
            warning.className = 'colorContrastWarning';
            warning.innerHTML = '<span class="material-icons">visibility_off</span> Low contrast: May be hard to see';
            if (warningContainer && warningContainer.appendChild) {
                warningContainer.appendChild(warning);
            }
        }
        warning.classList.remove('hide');
    } else {
        if (warning) {
            warning.classList.add('hide');
        }
    }
}

/**
 * Initializes all color picker pairs in a container
 *
 * Finds all `.colorPickerGroup` elements containing color/text input pairs
 * and sets up bi-directional synchronization. Performs initial contrast
 * validation on each color picker.
 *
 * Typical structure (provided by HTML template):
 * ```html
 * <div class="colorPickerGroup">
 *     <input type="color" id="colorFreqAnalyzerLow" class="colorInput" />
 *     <input type="text" id="textFreqAnalyzerLow" class="colorText" />
 * </div>
 * ```
 *
 * This function is called once per settings load to activate all pickers.
 *
 * @param {HTMLElement} container - Parent container element
 * @returns {void}
 *
 * @example
 * const form = document.getElementById('settingsForm');
 * initializeColorPickers(form);
 * // Now all .colorPickerGroup elements in form have active pickers
 */
export function initializeColorPickers(container) {
    if (!container) return;

    const colorGroups = container.querySelectorAll('.colorPickerGroup');

    colorGroups.forEach(group => {
        const colorInput = group.querySelector('input[type="color"]');
        const textInput = group.querySelector('input[type="text"]');

        if (colorInput && textInput) {
            syncColorInputs(colorInput, textInput);
            // Initial contrast check
            validateColorContrast(colorInput);
        }
    });
}

/**
 * Resets visualizer colors to hardcoded defaults
 *
 * Restores all colors for a specific visualizer to their original values.
 * Updates both color swatch and hex text inputs.
 * Triggers contrast validation after setting new values.
 *
 * Supported targets:
 * - 'freqAnalyzer': Frequency analyzer colors (solid + gradient)
 * - 'waveform': Waveform visualizer colors (monochrome + stereo)
 *
 * Default values:
 * - freqAnalyzer solid: #1ED24B (green)
 * - freqAnalyzer gradient: low=#1ED24B, mid=#FFD700, high=#FF3232
 * - waveform: wave=#1ED24B, cursor=#FFFFFF, left=#1ED24B, right=#FF3232
 *
 * @param {string} target - Visualizer type ('freqAnalyzer', 'waveform')
 * @returns {void}
 *
 * @example
 * resetColorsToDefault('freqAnalyzer');
 * // Updates colorFreqAnalyzerSolid, colorFreqAnalyzerLow, etc. to defaults
 */
export function resetColorsToDefault(target, container = document) {
    const defaults = {
        freqAnalyzer: {
            solid: '#1ED24B',
            low: '#1ED24B',
            mid: '#FFD700',
            high: '#FF3232'
        },
        waveform: {
            wave: '#1ED24B',
            cursor: '#FFFFFF',
            left: '#1ED24B',
            right: '#FF3232'
        }
    };

    if (!defaults[target]) {
        console.error(`Unknown color target: ${target}`);
        return;
    }

    Object.entries(defaults[target]).forEach(([key, value]) => {
        const colorInputId = `color${capitalize(target)}${capitalize(key)}`;
        const textInputId = `text${capitalize(target)}${capitalize(key)}`;

        const colorInput = container.querySelector(`#${colorInputId}`);
        const textInput = container.querySelector(`#${textInputId}`);

        if (colorInput && textInput) {
            colorInput.value = value;
            textInput.value = value;
            validateColorContrast(colorInput);
        }
    });
}

/**
 * Capitalizes first letter of string (internal utility)
 *
 * Used to construct HTML element IDs by capitalizing target names.
 * Example: 'freqAnalyzer' → 'FreqAnalyzer' (for colorFreqAnalyzer)
 *
 * @private
 * @param {string} str - Input string
 * @returns {string} String with first character uppercased
 *
 * @example
 * capitalize('freqAnalyzer') // 'FreqAnalyzer'
 */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sets up collapsible advanced settings panel
 *
 * Toggles visibility of advanced settings section with CSS class management.
 * Button gets `.expanded` class when panel is visible for styling.
 * Panel uses `.hide` class for display: none.
 *
 * Smooth CSS transition handled by `.advancedSettingsPanel` in colorPicker.scss.
 *
 * @param {HTMLElement} button - Expand/collapse toggle button
 * @param {HTMLElement} panel - Panel element to toggle (advanced settings)
 * @returns {void}
 *
 * @example
 * const btn = document.getElementById('toggleAdvanced');
 * const panel = document.getElementById('advancedPanel');
 * setupAdvancedToggle(btn, panel);
 * // User can now click button to expand/collapse
 */
export function setupAdvancedToggle(button, panel) {
    if (!button || !panel) return;

    button.addEventListener('click', (e) => {
        e.preventDefault();
        const isHidden = panel.classList.contains('hide');

        if (isHidden) {
            panel.classList.remove('hide');
            button.classList.add('expanded');
        } else {
            panel.classList.add('hide');
            button.classList.remove('expanded');
        }
    });
}

/**
 * Attaches reset button to restore visualizer colors to defaults
 *
 * Searches for button with `[data-target="{target}"]` attribute and
 * attaches click handler that calls resetColorsToDefault().
 *
 * Button structure (from HTML template):
 * ```html
 * <button type="button" class="btnResetColors" data-target="freqAnalyzer">
 *     Reset Colors
 * </button>
 * ```
 *
 * @param {HTMLElement} container - Parent container to search within
 * @param {string} target - Visualizer target ('freqAnalyzer', 'waveform')
 * @returns {void}
 *
 * @example
 * setupResetButton(settingsForm, 'freqAnalyzer');
 * // Now the button[data-target="freqAnalyzer"] resets freq analyzer colors
 */
export function setupResetButton(container, target) {
    if (!container) return;

    const resetBtn = container.querySelector(`[data-target="${target}"]`);
    if (!resetBtn) return;

    resetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        resetColorsToDefault(target, container);
    });
}

/**
 * Extracts all color values from UI into settings object
 *
 * Iterates all color picker inputs in container and builds object
 * with color IDs as keys and uppercase hex values as values.
 *
 * ID conversion: "colorFreqAnalyzerLow" → { "FreqAnalyzerLow": "#1ED24B" }
 * (strips "color" prefix from input ID)
 *
 * Used in playbackSettings.js saveUser() to serialize current UI state.
 *
 * @param {HTMLElement} container - Parent container to search
 * @returns {Object|null} Object with color ID keys and hex values, or null if no container
 *
 * @example
 * const colors = getColorSettingsFromUI(settingsForm);
 * // Returns: {
 * //   FreqAnalyzerLow: '#1ED24B',
 * //   FreqAnalyzerMid: '#FFD700',
 * //   FreqAnalyzerHigh: '#FF3232',
 * //   ...
 * // }
 */
export function getColorSettingsFromUI(container) {
    if (!container) return null;

    const colors = {};
    const colorInputs = container.querySelectorAll('input[type="color"]');

    colorInputs.forEach(input => {
        const id = input.id.replace('color', '');
        colors[id] = input.value.toUpperCase();
    });

    return colors;
}

/**
 * Populates color picker UI from settings object
 *
 * Takes a settings object with color IDs and updates both color swatch
 * and hex text inputs. Validates colors before setting.
 *
 * ID mapping: { "FreqAnalyzerLow": "#1ED24B" }
 * → Sets colorFreqAnalyzerLow.value = "#1ED24B"
 * → Sets textFreqAnalyzerLow.value = "#1ED24B"
 *
 * Invalid colors are skipped with console warning.
 * Used in playbackSettings.js loadForm() to restore saved settings.
 *
 * @param {HTMLElement} container - Parent container to find inputs
 * @param {Object} colors - Color settings object (ID: hex value pairs)
 * @returns {void}
 *
 * @example
 * const savedColors = {
 *     FreqAnalyzerLow: '#1ED24B',
 *     FreqAnalyzerMid: '#FFD700',
 *     FreqAnalyzerHigh: '#FF3232'
 * };
 * setColorSettingsUI(settingsForm, savedColors);
 * // Now all color pickers show the saved colors
 */
export function setColorSettingsUI(container, colors) {
    if (!container || !colors) return;

    Object.entries(colors).forEach(([key, value]) => {
        if (!isValidHex(value)) {
            console.warn(`Invalid color value: ${value}`);
            return;
        }

        const colorInput = container.querySelector(`#color${key}`);
        const textInput = container.querySelector(`#text${key}`);

        if (colorInput && textInput) {
            colorInput.value = value;
            textInput.value = value.toUpperCase();
        }
    });
}
