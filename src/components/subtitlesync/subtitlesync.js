define(['playbackManager', 'text!./subtitlesync.template.html', 'css!./subtitlesync'], function (playbackManager, template, css) {
    "use strict";

    var player;
    var subtitleSyncSlider;
    var subtitleSyncTextField;
    var subtitleSyncCloseButton;
    var subtitleSyncContainer;

    function init(instance) {

        var parent = document.createElement('div');
        parent.innerHTML = template;

        subtitleSyncSlider = parent.querySelector(".subtitleSyncSlider");
        subtitleSyncTextField = parent.querySelector(".subtitleSyncTextField");
        subtitleSyncCloseButton = parent.querySelector(".subtitleSync-closeButton");
        subtitleSyncContainer = parent.querySelector(".subtitleSyncContainer");

        subtitleSyncContainer.classList.add("hide");

        subtitleSyncTextField.updateOffset = function(offset) {
            this.textContent = offset + "s";
        }

        subtitleSyncTextField.addEventListener("keypress", function(event) {

            if(event.key === "Enter"){
                // if input key is enter search for float pattern
                var inputOffset = /[-+]?\d+\.?\d*/g.exec(this.textContent);
                if(inputOffset) {
                    inputOffset = inputOffset[0];

                    // replace current text by considered offset
                    this.textContent = inputOffset + "s";

                    inputOffset = parseFloat(inputOffset);
                    // set new offset
                    playbackManager.setSubtitleOffset(inputOffset, player);
                    // synchronize with slider value
                    subtitleSyncSlider.updateOffset(
                        getPercentageFromOffset(inputOffset));
                } else {
                    this.textContent = (playbackManager.getPlayerSubtitleOffset(player) || 0) + "s";
                }
                this.hasFocus = false;
                event.preventDefault();
            } else {
                // keep focus to prevent fade with bottom layout
                this.hasFocus = true;
                if(event.key.match(/[+-\d.s]/) === null) {
                    event.preventDefault();
                }
            }
        });

        subtitleSyncSlider.updateOffset = function(percent) {
            // default value is 0s = 50%
            this.value = percent === undefined ? 50 : percent;
        }

        subtitleSyncSlider.addEventListener("change", function () {
            // set new offset
            playbackManager.setSubtitleOffset(getOffsetFromPercentage(this.value), player);
            // synchronize with textField value
            subtitleSyncTextField.updateOffset(
                getOffsetFromPercentage(this.value));
        });

        subtitleSyncSlider.addEventListener("touchmove", function () {
            // set new offset
            playbackManager.setSubtitleOffset(getOffsetFromPercentage(this.value), player);
            // synchronize with textField value
            subtitleSyncTextField.updateOffset(
                getOffsetFromPercentage(this.value));
        });

        subtitleSyncSlider.getBubbleHtml = function (value) {
            var newOffset = getOffsetFromPercentage(value);
            return '<h1 class="sliderBubbleText">' +
            (newOffset > 0 ? "+" : "") + parseFloat(newOffset) + "s" +
            "</h1>";
        };

        subtitleSyncCloseButton.addEventListener("click", function() {
            playbackManager.disableShowingSubtitleOffset(player);
            SubtitleSync.prototype.toggle("forceToHide");
        });

        document.body.appendChild(parent);

        instance.element = parent;
    }


    function getOffsetFromPercentage(value) {
        // convert percent to fraction
        var offset = (value - 50) / 50;
        // multiply by offset min/max range value (-x to +x) :
        offset *= 30;
        return offset.toFixed(1);
    };

    function getPercentageFromOffset(value) {
        // divide by offset min/max range value (-x to +x) :
        var percentValue = value / 30;
        // convert fraction to percent
        percentValue *= 50;
        percentValue += 50;
        return Math.min(100, Math.max(0, percentValue.toFixed()));
    };

    function SubtitleSync(currentPlayer) {
        player = currentPlayer;
        init(this);
    }

    SubtitleSync.prototype.destroy = function(){
        SubtitleSync.prototype.toggle("forceToHide");
        if(player){
            playbackManager.disableShowingSubtitleOffset(player);
            playbackManager.setSubtitleOffset(0, player);
        }
        var elem = this.element;
        if (elem) {
            elem.parentNode.removeChild(elem);
            this.element = null;
        }
    }

    SubtitleSync.prototype.toggle = function(action) {

        if(player && playbackManager.supportSubtitleOffset(player)){

            switch(action) {
                case undefined:
                    // if showing subtitle sync is enabled
                    if(playbackManager.isShowingSubtitleOffsetEnabled(player) && 
                        // if there is an external subtitle stream enabled
                        playbackManager.canHandleOffsetOnCurrentSubtitle(player)){
                            // if no subtitle offset is defined
                            if(!playbackManager.getPlayerSubtitleOffset(player)) {
                                // set default offset to '0' = 50%
                                subtitleSyncSlider.value = "50";
                                subtitleSyncTextField.textContent = "0s";
                                playbackManager.setSubtitleOffset(0, player);
                            }
                            // show subtitle sync
                            subtitleSyncContainer.classList.remove("hide");
                            break; // stop here
                    } // else continue and hide
                case "hide":
                    if(subtitleSyncTextField.hasFocus){break;} // else continue and hide
                case "forceToHide":
                    subtitleSyncContainer.classList.add("hide");
                    break;
            }

        }
    }

    return SubtitleSync;
});
