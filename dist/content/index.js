// src/content/index.js
var hvf = {
  domObjects: [],
  // Initialize the extension
  init: function() {
    console.log(this.domObjects);
    this.sendMedia();
    this.receiveMedia();
    window.addEventListener("load", () => {
      setTimeout(() => {
        this.listenUrlUpdate();
      }, 1e3);
    }, false);
  },
  // Send media to the background script
  sendMedia: function() {
    let media = document.querySelectorAll("img, image");
    for (let i = 0; i < media.length; i++) {
      console.log("foo");
      if (media[i].classList.contains("hvf-analyz"))
        continue;
      media[i].classList.add("hvf-analyzing");
      let url = media[i].src;
      let srcAttr = "src";
      if (!url || url.length === 0) {
        url = media[i].getAttribute("xlink:href");
        srcAttr = "xlink:href";
      }
      if (url && url.length > 0) {
        let domObjectIndex = this.domObjects.push(media[i]);
        console.log(domObjectIndex);
        let payload = {
          mediaUrl: url,
          mediaType: "image",
          baseObject: {
            originalUrl: url,
            domObjectIndex,
            srcAttr,
            shouldMask: false
          }
        };
        chrome.runtime.sendMessage({
          action: "HVF-MEDIA-ANALYSIS-REQUEST",
          payload
        }, (result) => {
          if (!chrome.runtime.lastError) {
          } else {
          }
        });
      }
    }
  },
  // Receive media from the background script
  receiveMedia: function() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === "HVF-MEDIA-ANALYSIS-REPORT") {
        let media = this.domObjects[message.payload.baseObject.domObjectIndex];
        console.log([this.domObjects, message.payload]);
        let srcAttr = message.payload.baseObject.srcAttr;
        let originalUrl = message.payload.baseObject.originalUrl;
        if (!media)
          return;
        if (message.payload.shouldMask && message.payload.maskedUrl) {
          media.classList.add("hvf-masked");
          media.setAttribute(srcAttr, message.payload.maskedUrl);
          media.setAttribute("data-hvf-original-url", originalUrl);
        }
        media.classList.add("hvf-analyzed");
        media.classList.remove("hvf-analyzing");
      }
    });
  },
  listenUrlUpdate: function() {
    let observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        let mutationImgUrl = mutation.target.src;
        if (mutation.target.tagName === "image") {
          mutationImgUrl = mutation.target.getAttribute("xlink:href");
        }
        if (mutation.type === "attributes" && mutation.target.classList.contains("hvf-analyzed")) {
          mutation.target.classList.remove("hvf-analyzed");
          mutation.target.classList.remove("hvf-analyzing");
        }
      }
      this.sendMedia();
    });
    document.addEventListener("scroll", () => {
      hvf.sendMedia();
    }, true);
  }
};
hvf.init();
