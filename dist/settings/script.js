// src/settings/script.js
var reloadBtn = document.getElementById("reload-window");
reloadBtn.addEventListener("click", () => {
  chrome.tabs.reload();
  reloadBtn.classList.add("hide");
});
var checkbox = document.getElementById("power");
async function getCurrentTabHostName() {
  const tabs = await chrome.tabs.query({ active: true });
  const { hostname } = new URL(tabs?.[0]?.url ?? "");
  return hostname;
}
getCurrentTabHostName().then((host) => {
  chrome.runtime.sendMessage(
    {
      type: "getSettings",
      settingsKey: host ?? "power"
    },
    (result) => {
      console.log(result);
      checkbox.checked = result || false;
    }
  );
});
checkbox.addEventListener("change", async (event) => {
  let checked = event.currentTarget.checked;
  reloadBtn.classList.remove("hide");
  const host = await getCurrentTabHostName();
  chrome.runtime.sendMessage(
    {
      type: "setSettings",
      payload: {
        value: checked,
        settings: host ?? "power"
      }
    },
    (result) => {
      if (!chrome.runtime.lastError) {
      } else {
      }
    }
  );
});
