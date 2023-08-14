import safeGazeSettings from "./database.js";

console.log("background.js");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log('req',request);
    if (request.type === "setSettings") {
        safeGazeSettings.addItem(request.payload);
    }
  
    if (request.type === "getSettings") {
        safeGazeSettings.get(request.settingsKey).then((data) => {
        sendResponse(data.value);
      });
      return true;
    }
  });