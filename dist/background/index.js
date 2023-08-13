// src/background/media-processor/remoteAnalyzer.js
var remoteAnalyzer = class {
  constructor(data) {
    this.data = data;
  }
  analyze = async () => {
    let annotatedData;
    if (this.data.mediaUrl.startsWith(
      "https://safegazecdn.s3.ap-southeast-1.amazonaws.com/annotated_image/"
    )) {
      return {
        shouldMask: true,
        maskedUrl: this.data.mediaUrl
      };
    }
    try {
      let relativeFilePath = this.relativeFilePath(this.data.mediaUrl);
      if (await this.urlExists(relativeFilePath)) {
        console.log("url exists");
        return {
          shouldMask: true,
          maskedUrl: relativeFilePath
        };
      }
    } catch (error) {
      console.log("Error checking if url exists");
      console.log(error);
    }
    try {
      annotatedData = await this.getAnnotatedMedia(this.data.mediaUrl);
    } catch (error) {
      console.log("Error getting annotated media");
      console.log(error);
      annotatedData = {
        success: false
      };
    }
    console.log(annotatedData);
    if (annotatedData.success === false || annotatedData.media.length <= 0 || annotatedData.media[0].success === false) {
      return {
        shouldMask: false,
        maskedUrl: null,
        invalidMedia: true
      };
    }
    let maskedUrl = annotatedData.media[0].processed_media_url;
    return {
      shouldMask: true,
      maskedUrl
    };
  };
  getAnnotatedMedia = async (url) => {
    let myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    let raw = JSON.stringify({
      media: [
        {
          media_url: url,
          media_type: "image",
          has_attachment: false
        }
      ]
    });
    let requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: raw,
      redirect: "follow"
    };
    let response = await fetch(
      "https://api.safegaze.com/api/v1/analyze",
      requestOptions
    );
    let result = await response.json();
    console.log({
      request: {
        media: [
          {
            media_url: url,
            media_type: "image",
            has_attachment: false
          }
        ]
      },
      response: result
    });
    return result;
  };
  urlExists = async (url) => {
    const response = await fetch(url, {
      method: "HEAD",
      cache: "no-cache"
    }).catch(() => ({ ok: false }));
    return response.ok;
  };
  relativeFilePath = (originalMediaUrl) => {
    let url = decodeURIComponent(originalMediaUrl);
    let urlParts = url.split("?");
    let protocolStrippedUrl = urlParts[0].replace(/http:\/\//, "").replace(/https:\/\//, "").replace(/--/g, "__").replace(/%/g, "_");
    let queryParams = urlParts[1] !== void 0 ? urlParts[1].replace(/,/g, "_").replace(/=/g, "_").replace(/&/g, "/") : "";
    let relativeFolder = protocolStrippedUrl.split("/").slice(0, -1).join("/");
    if (queryParams.length) {
      relativeFolder = `${relativeFolder}/${queryParams}`;
    }
    let filenameWithExtension = protocolStrippedUrl.split("/").pop();
    let filenameParts = filenameWithExtension.split(".");
    let filename, extension;
    if (filenameParts.length >= 2) {
      filename = filenameParts.slice(0, -1).join(".");
      extension = filenameParts.pop();
    } else {
      filename = filenameParts[0].length ? filenameParts[0] : "image";
      extension = "jpg";
    }
    return `https://safegazecdn.s3.ap-southeast-1.amazonaws.com/annotated_image/${relativeFolder}/${filename}.${extension}`;
  };
};
var remoteAnalyzer_default = remoteAnalyzer;

// src/background/media-processor/runtimeEvents.js
var queueManager = {
  isAnalyzing: false,
  dataQueue: [],
  analyzer: null,
  overloadTimeout: null,
  init: async function() {
    this.listenRequest();
  },
  addToQueue: async function(data) {
    this.dataQueue.push(data);
    if (!this.isAnalyzing) {
      this.processQueue();
    }
  },
  listenRequest: function() {
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "HVF-MEDIA-ANALYSIS-REQUEST") {
        this.addToQueue({ tabID: sender.tab.id, ...request.payload });
      }
    });
  },
  getActiveTabId: async function() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await chrome.tabs.query(queryOptions);
    return tab?.id || 0;
  },
  getAllTabIds: async function() {
    let queryOptions = {};
    let tabs = await chrome.tabs.query(queryOptions);
    return tabs.map((tab) => tab.id);
  },
  processQueue: async function() {
    if (this.dataQueue.length <= 0) {
      this.isAnalyzing = false;
      return;
    }
    this.overloadTimeout = 10;
    await new Promise((r) => setTimeout(r, this.overloadTimeout));
    this.isAnalyzing = true;
    let data = this.dataQueue.shift();
    if (typeof data === "undefined") {
      this.isAnalyzing = false;
      return;
    }
    const activeTabId = await this.getActiveTabId();
    if (data.tabID !== activeTabId) {
      let allTabIds = await this.getAllTabIds();
      if (allTabIds.includes(data.tabID)) {
        this.dataQueue.push(data);
      }
      this.overloadTimeout = 10;
      this.processQueue();
      return;
    }
    let analyzer = new remoteAnalyzer_default(data);
    analyzer.analyze().then((result) => {
      console.log("Media analysis complete");
      console.log(result);
      chrome.tabs.sendMessage(
        data.tabID,
        {
          action: "HVF-MEDIA-ANALYSIS-REPORT",
          payload: Object.assign(data, result)
        },
        (result2) => {
          if (!chrome.runtime.lastError) {
          } else {
          }
        }
      );
      this.processQueue();
    }).catch((err) => {
      console.log("Error analyzing media");
      console.log(err);
      this.processQueue();
    });
  }
};
queueManager.init();

// src/background/settings/database.js
var SafeGazeDB = class {
  db;
  openRequest;
  version = 1;
  constructor({ dbName, version, tableName, settingsKey }) {
    if (!dbName && !tableName && !settingsKey) {
      return;
    }
    this.version = version;
    this.dbName = dbName;
    this.tableName = tableName;
    this.settingsKey = settingsKey;
    this.#createDatabase();
    this.#upgradeNeeded();
    this.#success();
  }
  #createDatabase() {
    this.openRequest = indexedDB.open(this.dbName, this.version);
  }
  #upgradeNeeded() {
    this.openRequest.onupgradeneeded = (e) => {
      this.db = e.target.result;
      this.db.createObjectStore(this.tableName, {
        keyPath: this.settingsKey
      });
    };
  }
  #success() {
    this.openRequest.onsuccess = (e) => {
      this.db = e.target.result;
    };
  }
  addItem(value) {
    const tx = this.db.transaction(this.tableName, "readwrite");
    const store = tx.objectStore(this.tableName);
    store.put(value);
  }
  get(key, cb) {
    return new Promise((resolve, reject) => {
      const tx = this.db.transaction(this.tableName, "readonly");
      const store = tx.objectStore(this.tableName);
      const get = store.get(key);
      get.onsuccess = (e) => {
        resolve(get.result);
      };
    });
  }
};
var safeGazeSettings = new SafeGazeDB({
  dbName: "safeGaze",
  version: 1,
  tableName: "settings",
  settingsKey: "settings"
});
var database_default = safeGazeSettings;

// src/background/settings/runtimeEvents.js
console.log("background.js");
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("req", request);
  if (request.type === "setSettings") {
    database_default.addItem(request.payload);
  }
  if (request.type === "getSettings") {
    database_default.get(request.settingsKey).then((data) => {
      sendResponse(data.value);
    });
    return true;
  }
});
