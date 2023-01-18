import { halalzSettings } from "./database.js";

chrome.action.onClicked.addListener(() => {
  if (chrome.runtime.openOptionsPage) {
    chrome.runtime.openOptionsPage();
  } else {
    window.open(chrome.runtime.getURL("options.html"));
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === "setSettings") {
    halalzSettings.addItem(request.payload);
  }

  if (request.type === "getSettings") {
    halalzSettings.get(request.settingskey).then((data) => {
      sendResponse(data);
    });
    return true;
  }
});
