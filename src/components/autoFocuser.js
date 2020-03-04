define(["focusManager", "layoutManager"], function (focusManager, layoutManager) {
    "use strict";

    /**
     * Previously selected element.
     */
    var activeElement;

    /**
     * Returns true if AutoFocuser is enabled.
     */
    function isEnabled() {
        return layoutManager.tv;
    }

    /**
     * Start AutoFocuser
     */
    function enable() {
        if (!isEnabled()) {
            return;
        }

        window.addEventListener("focusin", function (e) {
            activeElement = e.target;
        });

        console.debug("AutoFocuser enabled");
    }

    /**
     * Create an array from some source.
     */
    var arrayFrom = Array.prototype.from || function (src) {
        return Array.prototype.slice.call(src);
    }

    /**
     * Set focus on a suitable element, taking into account the previously selected.
     */
    function autoFocus(container) {
        if (!isEnabled()) {
            return;
        }

        container = container || document.body;

        var candidates = [];

        if (activeElement) {
            // These elements are recreated
            if (activeElement.classList.contains("btnPreviousPage")) {
                candidates.push(container.querySelector(".btnPreviousPage"));
                candidates.push(container.querySelector(".btnNextPage"));
            } else if (activeElement.classList.contains("btnNextPage")) {
                candidates.push(container.querySelector(".btnNextPage"));
                candidates.push(container.querySelector(".btnPreviousPage"));
            } else if (activeElement.classList.contains("btnSelectView")) {
                candidates.push(container.querySelector(".btnSelectView"));
            }

            candidates.push(activeElement);
        }

        candidates = candidates.concat(arrayFrom(container.querySelectorAll(".btnResume")));
        candidates = candidates.concat(arrayFrom(container.querySelectorAll(".btnPlay")));

        var focusedElement;

        candidates.every(function (element) {
            if (focusManager.isCurrentlyFocusable(element)) {
                focusManager.focus(element);
                focusedElement = element;
                return false;
            }

            return true;
        });

        if (!focusedElement) {
            // FIXME: Multiple itemsContainers
            var itemsContainer = container.querySelector(".itemsContainer");

            if (itemsContainer) {
                focusedElement = focusManager.autoFocus(itemsContainer);
            }
        }

        if (!focusedElement) {
            focusedElement = focusManager.autoFocus(container);
        }

        return focusedElement;
    }

    return {
        isEnabled: isEnabled,
        enable: enable,
        autoFocus: autoFocus
    };
});
