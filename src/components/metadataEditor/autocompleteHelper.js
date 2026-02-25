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

    // Handle input for autocomplete with debouncing
    const handleInput = function(e) {
        const searchTerm = e.target.value;

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
            inputElement.focus();
        }
    };

    // Hide suggestions when clicking outside
    const handleOutsideClick = function(e) {
        // If boundaryElement is specified, only handle clicks within it
        if (boundaryElement && !boundaryElement.contains(e.target)) {
            return;
        }

        if (!inputElement.contains(e.target) && !suggestionsContainer.contains(e.target)) {
            suggestionsContainer.style.display = 'none';
        }
    };

    // Attach event listeners
    inputElement.addEventListener('input', handleInput);
    suggestionsContainer.addEventListener('click', handleSuggestionClick);
    document.addEventListener('click', handleOutsideClick);

    // Return cleanup function
    return function cleanup() {
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        inputElement.removeEventListener('input', handleInput);
        suggestionsContainer.removeEventListener('click', handleSuggestionClick);
        document.removeEventListener('click', handleOutsideClick);
    };
}
