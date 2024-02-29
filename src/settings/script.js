// on click #reload-btn
const reloadBtn = document.getElementById("reload-window");
reloadBtn.addEventListener("click", () => {
  chrome.tabs.reload();
  // add class 'hide' to reload btn.
  reloadBtn.classList.add("hide");
});

const checkbox = document.getElementById("power");
const kafhDns = document.getElementById("kahf-dns");

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

  // each site process count
  chrome.storage.local.get(settings_key).then((count) => {
    if (count?.[settings_key]) {
      document.querySelector("#current-site-processed-image").innerHTML =
        count?.[settings_key];
    }
  });

  chrome.runtime.sendMessage(
    {
      type: "getSettings",
      settingsKey: host ?? "power",
    },
    (result) => {
      const status = document.querySelector(".safegaze-up span");
      if (result) {
        status.innerHTML = "UP";
        document.querySelector(".main.container").style.display = "flex";
        document
          .querySelectorAll("#settings-on-off option")[0]
          .setAttribute("selected", "selected");
      } else {
        status.innerHTML = "DOWN";
        document.querySelector(".main.container").style.display = "none";
        document
          .querySelectorAll("#settings-on-off option")[1]
          .setAttribute("selected", "selected");
      }

      console.log(result);
      checkbox.checked = result || false;
    }
  );
});

chrome.runtime.sendMessage(
  {
    type: "getSettings",
    settingsKey: "kafh-dns",
  },
  (result) => {
    kafhDns.checked = result || false;
  }
);

chrome.storage.local
  .get("safe_gaze_total_counts")
  .then((count) => {
    if (count?.safe_gaze_total_counts) {
      document.querySelector("#total-processed-image").innerHTML =
        count?.safe_gaze_total_counts;
    }
  })
  .catch((error) => {
    console.log("total count error error on script js", error);
  });

chrome.storage.onChanged.addListener((changes, namespace) => {
  for (let [key, { oldValue, newValue }] of Object.entries(changes)) {
    getCurrentTabHostName().then((host) => {
      const settings_key = host + "_counts";

      if (key === "safe_gaze_total_counts" && newValue) {
        document.querySelector("#total-processed-image").innerHTML = newValue;
      } else if (key === settings_key && newValue) {
        document.querySelector("#current-site-processed-image").innerHTML =
          newValue;
      }
    });
  }
});

document
  .getElementById("settings-on-off")
  .addEventListener("change", (event) => {
    let switchOption = event.currentTarget.value;

    checkbox.checked = switchOption === "on";

    getCurrentTabHostName().then((host) => {
      chrome.runtime.sendMessage(
        {
          type: "setSettings",
          payload: {
            value: switchOption === "on",
            settings: host ?? "power",
          },
        },
        (result) => {
          if (!chrome.runtime.lastError) {
            // message processing code goes here
          } else {
            // error handling code goes here
          }
        }
      );
      chrome.tabs.reload();
    });
  });

checkbox.addEventListener("change", (event) => {
  let checked = event.currentTarget.checked;

  const status = document.querySelector(".safegaze-up span");
  if (checked) {
    status.innerHTML = "UP";
    document.querySelector(".main.container").style.display = "flex";
    document
      .querySelectorAll("#settings-on-off option")[0]
      .setAttribute("selected", "selected");
  } else {
    status.innerHTML = "DOWN";
    document.querySelector(".main.container").style.display = "none";
    document
      .querySelectorAll("#settings-on-off option")[1]
      .setAttribute("selected", "selected");
  }

  // show the reload btn
  reloadBtn.classList.remove("hide");

  getCurrentTabHostName().then((host) => {
    chrome.runtime.sendMessage(
      {
        type: "setSettings",
        payload: {
          value: checked,
          settings: host ?? "power",
        },
      },
      (result) => {
        if (!chrome.runtime.lastError) {
          // message processing code goes here
        } else {
          // error handling code goes here
        }
      }
    );
    chrome.tabs.reload();
  });
});

kafhDns.addEventListener("change", (event) => {
  let checked = event.currentTarget.checked;

  chrome.runtime.sendMessage(
    {
      type: "setSettings",
      payload: {
        value: checked,
        settings: "kafh-dns",
      },
    },
    (result) => {
      if (!chrome.runtime.lastError) {
        // message processing code goes here
      } else {
        // error handling code goes here
      }
    }
  );
});

document
  .querySelector(".eye-crossed-1-parent")
  .addEventListener("click", () => {
    document.querySelector(".childlogo-parent").classList.toggle("hide-el");

    if (
      document.querySelector(".childlogo-parent").classList.contains("hide-el")
    ) {
      document.querySelector(".hide-text").innerHTML = "Show";
    } else {
      document.querySelector(".hide-text").innerHTML = "Hide";
    }
  });

// slider
document.getElementById("opacity").addEventListener("input", function (event) {
  document.querySelector(
    ".rectangle-icon"
  ).style.filter = `blur(${event.target.value}px)`;

  getCurrentTabHostName().then((host) => {
    chrome.runtime.sendMessage(
      {
        type: "setSettings",
        payload: {
          value: event.target.value,
          settings: host + "_opacity",
        },
      },
      (result) => {
        if (!chrome.runtime.lastError) {
          // message processing code goes here
        } else {
          // error handling code goes here
        }
      }
    );
  });
});

getCurrentTabHostName().then((host) => {
  const settings_key = host + "_opacity";

  chrome.runtime.sendMessage(
    {
      type: "getSettings",
      settingsKey: settings_key,
    },
    (result) => {
      document.querySelector(".rectangle-icon").style.filter = `blur(${Number(
        result ?? 15
      )}px)`;
      document.getElementById("opacity").value = result ?? 15;
    }
  );
});
