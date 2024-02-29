// src/background/media-processor/remoteAnalyzer.js
var remoteAnalyzer = class {
  constructor(data) {
    this.data = data;
  }
  getCurrentTabHostName = async () => {
    const tabs = await browser.tabs.query({ active: true });
    const { hostname } = new URL(tabs?.[0]?.url ?? "");
    return hostname;
  };
  analyze = async () => {
    let annotatedData;
    if (this.data.mediaUrl.startsWith(
      "https://images.safegaze.com/annotated_image/"
    )) {
      return {
        shouldMask: true,
        maskedUrl: this.data.mediaUrl
      };
    }
    try {
      let relativeFilePath = await this.relativeFilePath(this.data.mediaUrl);
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
      maskedUrl,
      activate: true
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
  relativeFilePath = async (originalMediaUrl) => {
    const hash = await this.sha256(originalMediaUrl);
    let newUrl = `https://images.safegaze.com/annotated_image/${hash}/image.png`;
    return newUrl;
  };
  sha256 = async (str) => {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(str);
      const hashBuffer = await crypto.subtle.digest("SHA-256", data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((byte) => byte.toString(16).padStart(2, "0")).join("");
      return hashHex;
    } catch (error) {
      return "";
    }
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
    browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "HVF-MEDIA-ANALYSIS-REQUEST") {
        this.addToQueue({ tabID: sender.tab.id, ...request.payload });
      }
    });
  },
  getActiveTabId: async function() {
    let queryOptions = { active: true, currentWindow: true };
    let [tab] = await browser.tabs.query(queryOptions);
    return tab?.id || 0;
  },
  getAllTabIds: async function() {
    let queryOptions = {};
    let tabs = await browser.tabs.query(queryOptions);
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
      browser.tabs.sendMessage(
        data.tabID,
        {
          action: "HVF-MEDIA-ANALYSIS-REPORT",
          payload: Object.assign(data, result)
        },
        (result2) => {
          if (!browser.runtime.lastError) {
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
  isExistsDB() {
    return new Promise((resolve, reject) => {
      this.openRequest.onsuccess = (e) => {
        resolve(true);
      };
      this.openRequest.onerror = (e) => {
        reject(false);
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
async function getCurrentTabHostName() {
  const tabs = await browser.tabs.query({ active: true });
  const { hostname } = new URL(tabs?.[0]?.url ?? "");
  return hostname;
}
browser.runtime.onInstalled.addListener(async function() {
  console.log("installed the extension");
  const host = await getCurrentTabHostName();
  database_default.isExistsDB().then((res) => {
    if (res) {
      database_default.addItem({
        value: true,
        settings: host ?? "power"
      });
    }
  });
});
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("req", request);
  if (request.type === "setSettings") {
    database_default.addItem(request.payload);
  }
  if (request.type === "getSettings") {
    database_default.get(request.settingsKey).then((data) => {
      sendResponse(data?.value ?? true);
    });
    return true;
  }
});

// src/background/index.js
browser.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.message === "openNewTab") {
    browser.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      const tab = tabs[0];
      browser.tabs.update(tab.id, { url: browser.runtime.getURL("block.html") });
    });
  }
});
var getCurrentTabHostName2 = async () => {
  const tabs = await browser.tabs.query({ active: true });
  const { hostname } = new URL(tabs?.[0]?.url ?? "");
  return hostname;
};
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "CONVERT-IMAGE-TO-BASE64") {
    fetch(request.imgUrl).then(async (response) => {
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        sendResponse({
          complete: true,
          result: reader.result
        });
      };
      reader.readAsDataURL(blob);
    });
    return true;
  }
});
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "HVF-TOTAL-COUNT" && message.activate === true) {
    browser.storage.local.get("safe_gaze_total_counts").then((count) => {
      browser.storage.local.set({
        safe_gaze_total_counts: count?.safe_gaze_total_counts ? count?.safe_gaze_total_counts + 1 : 1
      }).then(() => {
        console.log("Value is set for total count remoteanalyzer");
      });
    }).catch((error) => {
      console.log("total count error error remoteanalyzer", error);
    });
    getCurrentTabHostName2().then(async (host) => {
      const settings_key = host + "_counts";
      const count = await browser.storage.local.get(settings_key);
      browser.storage.local.set({
        [settings_key]: count?.[settings_key] ? count?.[settings_key] + 1 : 1
      }).then(() => {
        console.log("Value is set for each website remoteanalyzer");
      });
    }).catch((error) => {
      console.log("error on current tab remoteanalyzer", error);
    });
  }
});
browser.runtime.onStartup.addListener(() => {
  browser.storage.local.clear();
});
