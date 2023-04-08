  chrome.runtime.sendMessage({
    type: "setSettings",
    payload: {
      name: nameInput.val(),
      settings: "halalz-settings",
    },
  });








  import { halalzSettings } from "./settings/database.js.js";
import { processImage, getBase64FromUrl } from "./helpers";

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




