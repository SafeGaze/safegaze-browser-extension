// src/background/media-analyze-pipeline/analyzer.js
var analyzer = class {
  constructor() {
    this.frameCanvas = new OffscreenCanvas(400, 400);
    this.frameCtx = this.frameCanvas.getContext("2d");
    this.data = {};
    this.n = 0;
  }
  init = async () => {
  };
  // draws the image to the canvas and returns the image data
  drawImage = async (imageUrl) => {
    let img = await fetch(imageUrl);
    img = await img.blob();
    let bitmap = await createImageBitmap(img);
    this.frameCanvas.width = bitmap.width;
    this.frameCanvas.height = bitmap.height;
    this.frameCtx.drawImage(bitmap, 0, 0, bitmap.width, bitmap.height);
    return this.frameCtx.getImageData(0, 0, bitmap.width, bitmap.height);
  };
  blobToBase64 = (blob) => {
    return new Promise((resolve, _) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  };
  canvasToBlob = async (canvas) => {
    var blob = await canvas[
      canvas.convertToBlob ? "convertToBlob" : "toBlob"
      // current Firefox
    ]();
    return blob;
  };
  analyze = async (data) => {
    this.data = data;
    let imageData = await this.drawImage(data.mediaUrl);
    this.frameCtx.fillStyle = "#FF0000";
    this.frameCtx.fillRect(10, 10, 30, 20);
    this.frameCtx.fillStyle = "#00FF00";
    this.frameCtx.font = "40px Arial";
    this.frameCtx.fillText("filtered" + this.n, 10, 40);
    let blob = await this.canvasToBlob(this.frameCanvas);
    let base64 = await this.blobToBase64(blob);
    this.n++;
    return {
      shouldMask: true,
      maskedUrl: base64
    };
  };
};
var analyzer_default = analyzer;

// src/background/media-analyze-pipeline/queueManager.js
var queueManager = {
  isAnalyzing: false,
  dataQueue: [],
  analyzer: null,
  init: async function() {
    this.listenRequest();
    this.analyzer = new analyzer_default();
    await this.analyzer.init();
  },
  addToQueue: function(data) {
    this.dataQueue.push(data);
    if (!this.isAnalyzing) {
      this.processQueue();
    }
  },
  listenRequest: function() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse2) => {
      if (request.action === "HVF-MEDIA-ANALYSIS-REQUEST") {
        this.addToQueue({ tabID: sender.tab.id, ...request.payload });
      }
    });
  },
  processQueue: async function() {
    if (this.dataQueue.length <= 0) {
      this.isAnalyzing = false;
      return;
    }
    this.isAnalyzing = true;
    let data = this.dataQueue.shift();
    let result = await this.analyzer.analyze(data);
    data.baseObject.shouldMask = result.shouldMask;
    data.baseObject.maskedUrl = result.maskedUrl;
    chrome.runtime.sendResponse(
      data.tabID,
      {
        action: "HVF-MEDIA-ANALYSIS-REPORT",
        payload: data
      },
      (result2) => {
        if (!chrome.runtime.lastError) {
        } else {
        }
      }
    ).catch((err) => {
      sendResponse("ERROR");
    });
    this.processQueue();
  }
};
var queueManager_default = queueManager;

// src/background/index.js
queueManager_default.init();
