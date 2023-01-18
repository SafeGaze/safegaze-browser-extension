console.log("hello world");

chrome.runtime.sendMessage(
  {
    type: "getSettings",
    settingskey: "halalz-settings",
  },
  (response) => {
    console.log(response);
  }
);
