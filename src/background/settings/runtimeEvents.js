import safeGazeSettings from "./database.js";

console.log("background.js");

async function getCurrentTabHostName() {
  const tabs = await chrome.tabs.query({ active: true });
  const { hostname } = new URL(tabs?.[0]?.url ?? "");

  return hostname;
}

chrome.runtime.onInstalled.addListener(async function () {
  console.log("installed the extension");

  const host = await getCurrentTabHostName();

  safeGazeSettings.isExistsDB().then((res) => {
    if (res) {
      safeGazeSettings.addItem({
        value: true,
        settings: host ?? "power",
      });
    }
  });
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("req", request);
  if (request.type === "setSettings") {
    safeGazeSettings.addItem(request.payload);
  }

  if (request.type === "getSettings") {
    safeGazeSettings.get(request.settingsKey).then((data) => {
      sendResponse(data?.value ?? true);
    });
    return true;
  }
});
