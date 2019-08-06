define(['inputmanager', 'focusManager'], function(inputmanager, focusManager) {
    'use strict';

    console.log("keyboardnavigation");

    function enable() {
        document.addEventListener('keydown', function(e) {
            var capture = true;

            switch (e.keyCode) {
            case 37: // ArrowLeft
                inputmanager.handle('left');
                break;
            case 38: // ArrowUp
                inputmanager.handle('up');
                break;
            case 39: // ArrowRight
                inputmanager.handle('right');
                break;
            case 40: // ArrowDown
                inputmanager.handle('down');
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
