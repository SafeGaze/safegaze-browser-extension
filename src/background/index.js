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

const getCurrentTabHostName = async () => {
  const tabs = await chrome.tabs.query({ active: true });
  const { hostname } = new URL(tabs?.[0]?.url ?? "");

  return hostname;
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CONVERT-IMAGE-TO-BASE64") {
    fetch(request.imgUrl).then(async (response) => {
      const blob = await response.blob();

      const reader = new FileReader();
      reader.onloadend = () => {
        sendResponse({
          complete: true,
          result: reader.result,
        });
      };
      reader.readAsDataURL(blob);
    });

    return true;
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "HVF-TOTAL-COUNT" && message.activate === true) {
    chrome.storage.local
      .get("safe_gaze_total_counts")
      .then((count) => {
        chrome.storage.local
          .set({
            safe_gaze_total_counts: count?.safe_gaze_total_counts
              ? count?.safe_gaze_total_counts + 1
              : 1,
          })
          .then(() => {
            console.log("Value is set for total count remoteanalyzer");
          });
      })
      .catch((error) => {
        console.log("total count error error remoteanalyzer", error);
      });

    getCurrentTabHostName()
      .then(async (host) => {
        const settings_key = host + "_counts";
        // each site process count
        const count = await chrome.storage.local.get(settings_key);
        chrome.storage.local
          .set({
            [settings_key]: count?.[settings_key]
              ? count?.[settings_key] + 1
              : 1,
          })
          .then(() => {
            console.log("Value is set for each website remoteanalyzer");
          });
        // end each site process count
      })
      .catch((error) => {
        console.log("error on current tab remoteanalyzer", error);
      });
  }
});

/*
 * Created by Mehdi with ♥ / hi@mehssi.com
 * Last modified 2/21/24, 12:21 AM
 */

//this is needed as to check if newer websites are blocked.
// Storage is only cleared on browser restart.

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.clear();
});
