import { halalzSettings } from "./settings/database.js";
import maskingPipeline from "./masking-pipeline/maskingPipeline.js";

// const maskingPipelineInstance = new maskingPipeline();
// maskingPipelineInstance.loadModel();

// Get browser API
const browser = chrome || browser;

// masking
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "HARAM-IMAGE-FOR-ANALYSIS") {

    (new maskingPipeline()).processImage(request.payload.url)
      .then((data) => {
        console.log(data);
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          chrome.tabs.sendMessage(tabs[0].id,
            {
              action: "HARAM-IMAGE-ANALYSIS-REPORT",
              payload: {
                url: data.url,
                maskedUrl: data.maskedUrl,
                block: false
              }
            }, (result) => {
              if (!chrome.runtime.lastError) {
                 // message processing code goes here
              } else {
                // error handling code goes here
              }
            })
        })
      })
      .catch((err) => {
        sendResponse("ERROR");
      });
  }
});


// others
browser.action.onClicked.addListener(() => {
  if (browser.runtime.openOptionsPage) {
    browser.runtime.openOptionsPage();
  } else {
    window.open(browser.runtime.getURL("options.html"));
  }
});

browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
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