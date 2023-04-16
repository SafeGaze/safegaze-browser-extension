// on click #reload-btn
const reloadBtn = document.getElementById('reload-window');
reloadBtn.addEventListener('click', () => {
  chrome.tabs.reload();
    // add class 'hide' to reload btn.
    reloadBtn.classList.add('hide');
});


const checkbox = document.getElementById('power');

chrome.runtime.sendMessage(
  {
    type: "getSettings",
    settingsKey: "power",
  },
  (result) => {
    console.log(result);
    checkbox.checked = result || false;
  }
);

checkbox.addEventListener('change', (event) => {
  let checked = event.currentTarget.checked;

  // show the reload btn
  reloadBtn.classList.remove('hide');

  chrome.runtime.sendMessage(
    {
      type: "setSettings",
      payload: {
        value: checked,
        settings: "power",
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