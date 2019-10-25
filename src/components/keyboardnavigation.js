define(['inputManager', 'focusManager'], function(inputManager, focusManager) {
    'use strict';

    console.log("keyboardnavigation");

    function enable() {
        document.addEventListener('keydown', function(e) {
            var capture = true;

            switch (e.keyCode) {
            case 37: // ArrowLeft
                inputManager.handle('left');
                break;
            case 38: // ArrowUp
                inputManager.handle('up');
                break;
            case 39: // ArrowRight
                inputManager.handle('right');
                break;
            case 40: // ArrowDown
                inputManager.handle('down');
                break;
            default:
                capture = false;
            }
            if (capture) {
                console.log("Disabling default event handling");
                e.preventDefault();
            }
        });

    }
    return {
        enable: enable,
    };
});
