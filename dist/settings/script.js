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
  if (host) {
    document.querySelector(".header-content").innerHTML = host.replace(
      "www.",
      ""
    );
  }
});
getCurrentTabHostName().then((host) => {
  const settings_key = host + "_counts";
  chrome.storage.local.get(settings_key).then((count) => {
    if (count?.[settings_key]) {
      document.querySelector("#current-site-processed-image span").innerHTML = count?.[settings_key];
    }
  });
  chrome.runtime.sendMessage(
    {
      type: "getSettings",
      settingsKey: host ?? "power"
    },
    (result) => {
      const status = document.getElementById("safegaze-switch-status-check");
      if (result) {
        status.innerHTML = "UP";
        document.querySelector(".main.container").style.display = "flex";
      } else {
        status.innerHTML = "DOWN";
        document.querySelector(".main.container").style.display = "none";
      }
      console.log(result);
      checkbox.checked = result || false;
    }
  );
});
chrome.storage.local.get("safe_gaze_total_counts").then((count) => {
  if (count?.safe_gaze_total_counts) {
    document.querySelector("#total-processed-image span").innerHTML = count?.safe_gaze_total_counts;
  }
}).catch((error) => {
  console.log("total count error error on script js", error);
});
chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    getCurrentTabHostName().then((host) => {
      const settings_key = host + "_counts";
      if (key === "safe_gaze_total_counts" && newValue) {
        document.querySelector("#total-processed-image span").innerHTML = newValue;
      } else if (key === settings_key && newValue) {
        document.querySelector("#current-site-processed-image span").innerHTML = newValue;
      }
    });
  }
});
checkbox.addEventListener("change", (event) => {
  let checked = event.currentTarget.checked;
  const status = document.getElementById("safegaze-switch-status-check");
  if (checked) {
    status.innerHTML = "UP";
    document.querySelector(".main.container").style.display = "flex";
  } else {
    status.innerHTML = "DOWN";
    document.querySelector(".main.container").style.display = "none";
  }
  reloadBtn.classList.remove("hide");
  getCurrentTabHostName().then((host) => {
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
});
