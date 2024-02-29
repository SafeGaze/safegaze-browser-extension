// src/settings/script.js
var reloadBtn = document.getElementById("reload-window");
reloadBtn.addEventListener("click", () => {
  browser.tabs.reload();
  reloadBtn.classList.add("hide");
});
var checkbox = document.getElementById("power");
var kafhDns = document.getElementById("kahf-dns");
async function getCurrentTabHostName() {
  const tabs = await browser.tabs.query({ active: true });
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
  browser.storage.local.get(settings_key).then((count) => {
    if (count?.[settings_key]) {
      document.querySelector("#current-site-processed-image").innerHTML = count?.[settings_key];
    }
  });
  browser.runtime.sendMessage(
    {
      type: "getSettings",
      settingsKey: host ?? "power"
    },
    (result) => {
      const status = document.querySelector(".safegaze-up span");
      if (result) {
        status.innerHTML = "UP";
        document.querySelector(".main.container").style.display = "flex";
        document.querySelectorAll("#settings-on-off option")[0].setAttribute("selected", "selected");
      } else {
        status.innerHTML = "DOWN";
        document.querySelector(".main.container").style.display = "none";
        document.querySelectorAll("#settings-on-off option")[1].setAttribute("selected", "selected");
      }
      console.log(result);
      checkbox.checked = result || false;
    }
  );
});
browser.runtime.sendMessage(
  {
    type: "getSettings",
    settingsKey: "kafh-dns"
  },
  (result) => {
    kafhDns.checked = result || false;
  }
);
browser.storage.local.get("safe_gaze_total_counts").then((count) => {
  if (count?.safe_gaze_total_counts) {
    document.querySelector("#total-processed-image").innerHTML = count?.safe_gaze_total_counts;
  }
}).catch((error) => {
  console.log("total count error error on script js", error);
});
browser.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    getCurrentTabHostName().then((host) => {
      const settings_key = host + "_counts";
      if (key === "safe_gaze_total_counts" && newValue) {
        document.querySelector("#total-processed-image").innerHTML = newValue;
      } else if (key === settings_key && newValue) {
        document.querySelector("#current-site-processed-image").innerHTML = newValue;
      }
    });
  }
});
document.getElementById("settings-on-off").addEventListener("change", (event) => {
  let switchOption = event.currentTarget.value;
  checkbox.checked = switchOption === "on";
  getCurrentTabHostName().then((host) => {
    browser.runtime.sendMessage(
      {
        type: "setSettings",
        payload: {
          value: switchOption === "on",
          settings: host ?? "power"
        }
      },
      (result) => {
        if (!browser.runtime.lastError) {
        } else {
        }
      }
    );
    browser.tabs.reload();
  });
});
checkbox.addEventListener("change", (event) => {
  let checked = event.currentTarget.checked;
  const status = document.querySelector(".safegaze-up span");
  if (checked) {
    status.innerHTML = "UP";
    document.querySelector(".main.container").style.display = "flex";
    document.querySelectorAll("#settings-on-off option")[0].setAttribute("selected", "selected");
  } else {
    status.innerHTML = "DOWN";
    document.querySelector(".main.container").style.display = "none";
    document.querySelectorAll("#settings-on-off option")[1].setAttribute("selected", "selected");
  }
  reloadBtn.classList.remove("hide");
  getCurrentTabHostName().then((host) => {
    browser.runtime.sendMessage(
      {
        type: "setSettings",
        payload: {
          value: checked,
          settings: host ?? "power"
        }
      },
      (result) => {
        if (!browser.runtime.lastError) {
        } else {
        }
      }
    );
    browser.tabs.reload();
  });
});
kafhDns.addEventListener("change", (event) => {
  let checked = event.currentTarget.checked;
  browser.runtime.sendMessage(
    {
      type: "setSettings",
      payload: {
        value: checked,
        settings: "kafh-dns"
      }
    },
    (result) => {
      if (!browser.runtime.lastError) {
      } else {
      }
    }
  );
});
document.querySelector(".eye-crossed-1-parent").addEventListener("click", () => {
  document.querySelector(".childlogo-parent").classList.toggle("hide-el");
  if (document.querySelector(".childlogo-parent").classList.contains("hide-el")) {
    document.querySelector(".hide-text").innerHTML = "Show";
  } else {
    document.querySelector(".hide-text").innerHTML = "Hide";
  }
});
document.getElementById("opacity").addEventListener("input", function(event) {
  document.querySelector(
    ".rectangle-icon"
  ).style.filter = `blur(${event.target.value}px)`;
  getCurrentTabHostName().then((host) => {
    browser.runtime.sendMessage(
      {
        type: "setSettings",
        payload: {
          value: event.target.value,
          settings: host + "_opacity"
        }
      },
      (result) => {
        if (!browser.runtime.lastError) {
        } else {
        }
      }
    );
  });
});
getCurrentTabHostName().then((host) => {
  const settings_key = host + "_opacity";
  browser.runtime.sendMessage(
    {
      type: "getSettings",
      settingsKey: settings_key
    },
    (result) => {
      document.querySelector(".rectangle-icon").style.filter = `blur(${Number(
        result ?? 15
      )}px)`;
      document.getElementById("opacity").value = result ?? 15;
    }
  );
});
