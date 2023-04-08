// src/settings/script.js
var checkbox = document.getElementById("power");
chrome.runtime.sendMessage(
  {
    type: "getSettings",
    settingsKey: "power"
  },
  (result) => {
    console.log(result);
    checkbox.checked = result || false;
  }
);
checkbox.addEventListener("change", (event) => {
  let checked = event.currentTarget.checked;
  chrome.runtime.sendMessage(
    {
      type: "setSettings",
      payload: {
        value: checked,
        settings: "power"
      }
    },
    (result) => {
      if (!chrome.runtime.lastError) {
      } else {
      }
    }
  );
});
