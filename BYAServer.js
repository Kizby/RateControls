(function setupServer() {
    "use strict";

    var video;
    {
        var videos = document.getElementsByTagName('video');
        if (0 == videos.length) {
            //console.warn('Found no video elements in the player!');
            setTimeout(setupServer, 250);
            return;
        }
        if (1 != videos.length) {
            console.warn('Found multiple video elements in the player?');
        }
        video = videos[0];
    }
    var fullScreenButton = document.getElementsByClassName('ytp-fullscreen-button')[0];
    var playButton = document.getElementsByClassName('ytp-play-button')[0];

    var playbackExponent = 0;
    const playbackRate = () => Math.pow(1.05, playbackExponent);
    const getPlaybackExponent = () => chrome.storage.sync.get({ 'embeddedYouTubePlaybackExponent': 1 }, function (val) {
        playbackExponent = val.embeddedYouTubePlaybackExponent;
        video.playbackExponent = playbackRate();
    });
    video.addEventListener('loadedmetadata', getPlaybackExponent);
    getPlaybackExponent();
    var updatePlaybackExponent = function () {
        chrome.storage.sync.set({ 'embeddedYouTubePlaybackExponent': playbackExponent }, function () { });
    };
    var skip = function (seconds) {
        chrome.storage.sync.set({ 'pendingYouTubeSkipSeconds': seconds }, function () { });
    };
    chrome.storage.onChanged.addListener(function (changes, areaName) {
        if ('sync' != areaName) {
            return;
        }
        var newExponent = changes.embeddedYouTubePlaybackExponent;
        if (newExponent) {
            playbackExponent = newExponent.newValue;
            video.playbackRate = playbackRate();
        }
        var newSkip = changes.pendingYouTubeSkipSeconds;
        if (newSkip && newSkip.newValue) {
            var newTime = video.currentTime + newSkip.newValue * playbackExponent;
            if (newTime < 0) {
                newTime = 0;
            }
            video.currentTime = newTime;
            chrome.storage.sync.remove('pendingYouTubeSkipSeconds', function () { });
        }
    });

    var isInputElement = function (target) {
        return target.tagName == 'INPUT' || target.tagName == 'TEXTAREA';
    };
    var playerIsTarget = function (target) {
        while (target) {
            if ('player-container' == target.id) {
                return true;
            }
            target = target.parentNode;
        }
        return false;
    };
    window.addEventListener('keyup', function (event) {
        if (isInputElement(event.target)) {
            return;
        }
        if (!event.ctrlKey) {
            if (32 == event.keyCode) {
                if (playButton && !playerIsTarget(event.target)) {
                    playButton.dispatchEvent(new Event('click'));
                    event.preventDefault();
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
                updatePlaybackExponent();
                break;
            case 39: // right arrow
                skip(5);
                break;
            case 40: // down arrow
                if (0.25 < playbackRate()) {
                    playbackExponent -= 1;
                    updatePlaybackExponent();
                }
                break;
            case 32: // space
                playbackExponent = 0;
                updatePlaybackExponent();
                break;
            case 13: // enter
                if (fullScreenButton) {
                    fullScreenButton.dispatchEvent(new Event('click'));
                }
                break;
        }
    });
})();