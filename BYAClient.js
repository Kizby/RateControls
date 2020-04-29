(function () {
    "use strict";
    var rateValueSpans = new Set();
    var fullScreenButton;
    var playButton;

    var playbackExponent = 0;
    const playbackRate = () => Math.pow(1.05, playbackExponent);
    var updatePlaybackExponent = function (span) {
        span.textContent = playbackRate().toFixed(2) + 'x';
    };
    var updatePlaybackExponents = function () {
        rateValueSpans.forEach(updatePlaybackExponent);
    };

    chrome.storage.sync.get({ 'embeddedYouTubePlaybackExponent': 1 }, function (val) {
        playbackExponent = val.embeddedYouTubePlaybackExponent;
        updatePlaybackExponents();
    });
    chrome.storage.onChanged.addListener(function (changes, areaName) {
        if ('sync' != areaName) {
            return;
        }
        var change = changes.embeddedYouTubePlaybackExponent;
        if (!change) {
            return;
        }
        playbackExponent = change.newValue;
        updatePlaybackExponents();
    });

    var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
            if ('childList' == mutation.type &&
                'DIV' == mutation.target.tagName &&
                mutation.target.classList.contains('secondary-controls')) {
                mutation.addedNodes.forEach(function (child) {
                    if ('DIV' == child.tagName &&
                        child.classList.contains('speeds')) {
                        var buttonList = child.getElementsByClassName('speed-button');
                        if (0 == buttonList.length) {
                            return;
                        }
                        // Should only be one button...
                        var valueList = buttonList[0].getElementsByClassName('value');
                        if (0 == valueList.length) {
                            return;
                        }

                        // Should only be one value...
                        var valueSpan = valueList[0];
                        rateValueSpans.add(valueSpan);
                        updatePlaybackExponent(valueSpan);

                        // Grab the full screen and play buttons while we're at it
                        var fullScreenList = mutation.target.getElementsByClassName('add-fullscreen');
                        fullScreenButton = fullScreenList[0];
                        var playButtonList = mutation.target.parentNode.getElementsByClassName('play');
                        playButton = playButtonList[0];
                    }
                });
                mutation.removedNodes.forEach(function (child) {
                    if ('DIV' == child.tagName &&
                        child.classList.contains('speeds')) {
                        var buttonList = child.getElementsByClassName('speed-button');
                        if (0 == buttonList.length) {
                            return;
                        }
                        // Should only be one button...
                        var valueList = buttonList[0].getElementsByClassName('value');
                        if (0 == valueList.length) {
                            return;
                        }

                        // Should only be one value...
                        var valueSpan = valueList[0];
                        rateValueSpans.delete(valueSpan);
                        //console.log('Dropping span:', valueSpan);

                        if (0 == rateValueSpans.size) {
                            fullScreenButton = undefined;
                            playButton = undefined;
                        }
                    }
                });
            }
        });
    });
    {
        var config = { childList: true, subtree: true };
        observer.observe(document.body, config);
    }

    var updateStoredPlaybackExponent = function () {
        chrome.storage.sync.set({ 'embeddedYouTubePlaybackExponent': playbackExponent }, function () { });
    };
    var skip = function (seconds) {
        chrome.storage.sync.set({ 'pendingYouTubeSkipSeconds': seconds }, function () { });
    };
    var isInputElement = function (target) {
        return target.tagName == 'INPUT' || target.tagName == 'TEXTAREA';
    }
    window.addEventListener('keyup', function (event) {
        if (0 == rateValueSpans.size || isInputElement(event.target)) {
            return;
        }
        if (!event.ctrlKey) {
            if (32 == event.keyCode) { // space
                if (playButton) {
                    playButton.dispatchEvent(new Event('click'));
                    event.preventDefault();
                } else {
                    console.log('No play button');
                }
            }
            return;
        }
        switch (event.keyCode) {
            case 37: // left arrow
                skip(-5);
                break;
            case 38: // up arrow
                playbackExponent += 1;
                updateStoredPlaybackExponent();
                break;
            case 39: // right arrow
                skip(5);
                break;
            case 40: // down arrow
                if (0.25 < playbackRate()) {
                    playbackExponent -= 1;
                    updateStoredPlaybackExponent();
                }
                break;
            case 32: // space
                playbackExponent = 0;
                updateStoredPlaybackExponent();
                break;
            case 13: // enter
                if (fullScreenButton) {
                    fullScreenButton.dispatchEvent(new Event('click'));
                } else {
                    console.log('No full screen button');
                }
                break;
        }
    });
})();