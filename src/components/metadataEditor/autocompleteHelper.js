/**
 * Sets up autocomplete behavior for an input field with a suggestions container.
 * @param {HTMLInputElement} inputElement - The input field to attach autocomplete to
 * @param {HTMLElement} suggestionsContainer - The container to display suggestions
 * @param {Function} searchFunction - Function that performs the search (searchTerm, suggestionsContainer) => void
 * @param {Object} options - Configuration options
 * @param {string} options.dataAttribute - The data attribute name to read the value from (default: 'data-value')
 * @param {number} options.debounceMs - Debounce delay in milliseconds (default: 300)
 * @param {HTMLElement} options.boundaryElement - Element to check for outside clicks (default: document)
 * @returns {Function} Cleanup function to remove event listeners
 */
export function setupAutocomplete(inputElement, suggestionsContainer, searchFunction, options = {}) {
    const {
        dataAttribute = 'data-value',
        debounceMs = 300,
        boundaryElement = null
    } = options;

    let searchTimeout = null;
    let focusedIndex = -1;

    // Get all suggestion items
    const getSuggestionItems = () => suggestionsContainer.querySelectorAll('.suggestionItem');

    // Update visual focus on suggestions
    const updateFocus = () => {
        const items = getSuggestionItems();
        items.forEach((item, index) => {
            if (index === focusedIndex) {
                item.classList.add('focused');
                item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            } else {
                item.classList.remove('focused');
            }
        });
    };

    // Select the currently focused suggestion
    const selectFocusedItem = () => {
        const items = getSuggestionItems();
        if (focusedIndex >= 0 && focusedIndex < items.length) {
            const value = items[focusedIndex].getAttribute(dataAttribute);
            inputElement.value = value;
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.innerHTML = '';
            focusedIndex = -1;
            inputElement.focus();
            return true;
        }
        return false;
    };

    // Handle input for autocomplete with debouncing
    const handleInput = function(e) {
        const searchTerm = e.target.value;
        focusedIndex = -1; // Reset focus on new input

        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }

        searchTimeout = setTimeout(() => {
            searchFunction(searchTerm, suggestionsContainer);
        }, debounceMs);
    };

    // Handle clicking on suggestions
    const handleSuggestionClick = function(e) {
        const suggestionItem = e.target.closest('.suggestionItem');
        if (suggestionItem) {
            const value = suggestionItem.getAttribute(dataAttribute);
            inputElement.value = value;
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.innerHTML = '';
            focusedIndex = -1;
            inputElement.focus();
        }
    };

    // Handle mouse hovering on suggestions to sync keyboard focus
    const handleSuggestionHover = function(e) {
        const suggestionItem = e.target.closest('.suggestionItem');
        if (suggestionItem) {
            const items = Array.from(getSuggestionItems());
            focusedIndex = items.indexOf(suggestionItem);
            updateFocus();
        }
    };

    // Handle input losing focus - hide dropdown with slight delay to allow clicks
    const handleBlur = function(e) {
        // Small delay to allow click events on suggestions to fire first
        setTimeout(() => {
            // Only hide if input still doesn't have focus (handles rapid focus changes)
            if (document.activeElement !== inputElement) {
                suggestionsContainer.style.display = 'none';
                focusedIndex = -1;
            }
        }, 150);
    };

    // Hide suggestions when clicking outside or on input
    const handleOutsideClick = function(e) {
        // If boundaryElement is specified, only handle clicks within it
        if (boundaryElement && !boundaryElement.contains(e.target)) {
            return;
        }

        // Hide if clicking anywhere except the suggestions container itself
        if (!suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
            focusedIndex = -1;
        }
    };

    // Handle keyboard events
    const handleKeyDown = function(e) {
        const items = getSuggestionItems();
        const isDropdownVisible = suggestionsContainer.style.display !== 'none' && items.length > 0;

        if (e.key === 'Escape') {
            suggestionsContainer.style.display = 'none';
            suggestionsContainer.innerHTML = '';
            focusedIndex = -1;
            return;
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();

            if (!isDropdownVisible && inputElement.value.trim().length >= 2) {
                searchFunction(inputElement.value, suggestionsContainer);
                setTimeout(() => {
                    const newItems = getSuggestionItems();
                    if (newItems.length > 0) {
                        focusedIndex = 0;
                        updateFocus();
                    }
                }, 100);
                return;
            }

            if (isDropdownVisible) {
                focusedIndex = Math.min(focusedIndex + 1, items.length - 1);
                updateFocus();
            }
            return;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();

            if (!isDropdownVisible && inputElement.value.trim().length >= 2) {
                searchFunction(inputElement.value, suggestionsContainer);
                setTimeout(() => {
                    const newItems = getSuggestionItems();
                    if (newItems.length > 0) {
                        focusedIndex = newItems.length - 1;
                        updateFocus();
                    }
                }, 100);
                return;
            }

            if (isDropdownVisible) {
                focusedIndex = Math.max(focusedIndex - 1, -1);
                updateFocus();
            }
            return;
        }

        if (e.key === 'Enter') {
            if (isDropdownVisible && selectFocusedItem()) {
                e.preventDefault();
            }
            return;
        }

        if (e.key === 'Tab') {
            if (isDropdownVisible && selectFocusedItem()) {
                e.preventDefault();
            }
            return;
        }
    };

    // Attach event listeners
    inputElement.addEventListener('input', handleInput);
    inputElement.addEventListener('blur', handleBlur);
    inputElement.addEventListener('keydown', handleKeyDown);
    suggestionsContainer.addEventListener('click', handleSuggestionClick);
    suggestionsContainer.addEventListener('mouseenter', handleSuggestionHover, true);
    document.addEventListener('click', handleOutsideClick);

    // Return cleanup function
    return function cleanup() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        inputElement.removeEventListener('input', handleInput);
        inputElement.removeEventListener('blur', handleBlur);
        inputElement.removeEventListener('keydown', handleKeyDown);
        suggestionsContainer.removeEventListener('click', handleSuggestionClick);
        suggestionsContainer.removeEventListener('mouseenter', handleSuggestionHover, true);
        document.removeEventListener('click', handleOutsideClick);
    };
}
