// src/background/media-analyze-pipeline/mediaAnalyzer.js
var mediaAnalyzer_default = mediaAnalyzer = {
  isAnalyzing: false,
  dataQueue: [],
  init: function() {
    this.listenRequest();
  },
  addToQueue: function(data) {
    this.dataQueue.push(data);
    if (!this.isAnalyzing) {
      this.processQueue();
    }
  },
  listenRequest: function() {
    chrome.runtime.onMessage.addListener((request2, sender, sendResponse2) => {
      if (request2.action === "HVF-MEDIA-ANALYSIS-REQUEST") {
        this.addToQueue({ tabID: 9, ...request2.payload });
      }
    });
  },
  processQueue: function() {
    new maskingPipeline().processImage(request.payload.url).then((data) => {
      console.log(data);
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(
          tabs[0].id,
          {
            action: "HARAM-IMAGE-ANALYSIS-REPORT",
            payload: {
              url: data.url,
              maskedUrl: data.maskedUrl,
              block: false
            }
          },
          (result) => {
            if (!chrome.runtime.lastError) {
            } else {
            }
          }
        );
      });
    }).catch((err) => {
      sendResponse("ERROR");
    });
  }
};

// src/background/index.js
mediaAnalyzer_default().init();
