import safeGazeSettings from "./database.js";

console.log("background.js");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log(request.payload);
    if (request.type === "setSettings") {
        safeGazeSettings.addItem(request.payload);

        safeGazeSettings.get(request.settingskey).then((data) => {
            console.log(data);
          });
    }
  
    if (request.type === "getSettings") {
        safeGazeSettings.get(request.settingskey).then((data) => {
        sendResponse(data);
      });
      return true;
    }
  });