const checkbox = document.getElementById('power');

checkbox.addEventListener('change', (event) => {
  let checked = event.currentTarget.checked;

  console.log('checked', checked);
  chrome.runtime.sendMessage(
    {
      type: "setSettings",
      payload: {
        name: checked,
        settings: "halalz-settings",
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