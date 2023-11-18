import "./media-processor/runtimeEvents.js";
import "./settings/runtimeEvents.js";

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.message === "openNewTab") {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      chrome.tabs.update(tab.id, { url: chrome.runtime.getURL("block.html") });
    });
  }
});
