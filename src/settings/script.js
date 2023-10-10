// on click #reload-btn
const reloadBtn = document.getElementById("reload-window");
reloadBtn.addEventListener("click", () => {
  chrome.tabs.reload();
  // add class 'hide' to reload btn.
  reloadBtn.classList.add("hide");
});

const checkbox = document.getElementById("power");

async function getCurrentTabHostName() {
  const tabs = await chrome.tabs.query({ active: true });
  const { hostname } = new URL(tabs?.[0]?.url ?? "");

  return hostname;
}

getCurrentTabHostName().then((host) => {
  chrome.runtime.sendMessage(
    {
      type: "getSettings",
      settingsKey: host ?? "power",
    },
    (result) => {
      console.log(result);
      checkbox.checked = result || false;
    }
  );
});

checkbox.addEventListener("change", async (event) => {
  let checked = event.currentTarget.checked;
  // show the reload btn
  reloadBtn.classList.remove("hide");

  const host = await getCurrentTabHostName();

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
});
