// src/content/index.js
var hvf = {
  domObjectIndex: 0,
  // Initialize the extension
  init: function() {
    this.triggerScanning();
    this.receiveMedia();
    window.addEventListener("load", () => {
      setTimeout(() => {
        this.listenUrlUpdate();
      }, 1e3);
    }, false);
  },
  isElementInViewport: function(el) {
    let rect = el.getBoundingClientRect();
    let result = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    return result;
  },
  throttle: function(callback, limit) {
    var waiting = false;
    return function() {
      if (!waiting) {
        callback.apply(this, arguments);
        waiting = true;
        setTimeout(function() {
          waiting = false;
        }, limit);
      }
    };
  },
  triggerScanning: function() {
    this.throttle(this.sendMedia(), 1e3);
  },
  // Send media to the background script
  sendMedia: function() {
    let media = document.querySelectorAll("img, image");
    for (let i = 0; i < media.length; i++) {
      if (media[i].classList.contains("hvf-unidentified-error") || media[i].classList.contains("hvf-too-many-render") || media[i].classList.contains("hvf-analyzing") || media[i].classList.contains("hvf-analyzed") || this.isElementInViewport(media[i]) === false) {
        continue;
      }
      ;
      let url = media[i].src;
      let srcAttr = "src";
      if (!url || url.length === 0) {
        url = media[i].getAttribute("xlink:href");
        srcAttr = "xlink:href";
      }
      let isLoaded = media[i].complete && media[i].naturalHeight !== 0;
      if (isLoaded && url && url.length > 0) {
        this.domObjectIndex++;
        media[i].classList.add("hvf-analyzing");
        media[i].classList.add("hvf-dom-id-" + this.domObjectIndex);
        let payload = {
          mediaUrl: url,
          mediaType: "image",
          baseObject: {
            originalUrl: url,
            domObjectIndex: this.domObjectIndex,
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
        let index = message.payload.baseObject.domObjectIndex;
        let media = document.querySelector(".hvf-dom-id-" + index);
        let srcAttr = message.payload.baseObject.srcAttr;
        let originalUrl = message.payload.baseObject.originalUrl;
        if (!media)
          return;
        if (message.payload.shouldMask && message.payload.maskedUrl) {
          media.classList.add("hvf-masked");
          media.setAttribute(srcAttr, message.payload.maskedUrl);
          media.setAttribute("data-hvf-original-url", originalUrl);
        }
        if (message.payload.invalidMedia === true) {
          media.classList.add("hvf-invalid");
        } else {
          media.classList.add("hvf-analyzed");
        }
        media.classList.remove("hvf-analyzing");
        media.classList.remove("hvf-invalid");
      }
    });
  },
  listenUrlUpdate: function() {
    let observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        if (mutation.type !== "attributes") {
          continue;
        }
        if (mutation.attributeName !== "src" && mutation.attributeName !== "xlink:href") {
          continue;
        }
        if (mutation.target.classList.contains("hvf-analyzed")) {
          continue;
        }
        let mutationImgUrl = mutation.target.src;
        if (mutation.target.tagName === "image") {
          mutationImgUrl = mutation.target.getAttribute("xlink:href");
        }
        if (mutation.type === "attributes" && mutation.target.classList.contains("hvf-analyzed")) {
          mutation.target.classList.remove("hvf-analyzed");
          mutation.target.classList.remove("hvf-analyzing");
        }
      }
      this.triggerScanning();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
    document.addEventListener("scroll", () => {
      hvf.triggerScanning();
    }, true);
  }
};
hvf.init();
