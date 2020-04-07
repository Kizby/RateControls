updateBadge = exponent => chrome.browserAction.setBadgeText({ text: exponent !== 0 ? Math.pow(1.05, exponent).toFixed(2) : '' });
chrome.storage.sync.get({ 'embeddedYouTubePlaybackExponent': 0 }, function (val) {
  updateBadge(val.embeddedYouTubePlaybackExponent);
});

chrome.storage.onChanged.addListener(function (changes, areaName) {
  if ('sync' != areaName) {
    return;
  }
  var newExponent = changes.embeddedYouTubePlaybackExponent;
  if (newExponent) {
    updateBadge(newExponent.newValue);
  }
});