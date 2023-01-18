chrome.runtime.sendMessage(
  {
    type: "getSettings",
    settingskey: "halalz-settings",
  },
  (response) => {
    $("#name").val(response?.name || "");
  }
);

$("#settings-form").on("submit", (e) => {
  e.preventDefault();

  const nameInput = $("#name");

  chrome.runtime.sendMessage({
    type: "setSettings",
    payload: {
      name: nameInput.val(),
      settings: "halalz-settings",
    },
  });
});
