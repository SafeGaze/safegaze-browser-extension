// src/content/index.js
var hvf = {
  domObjectIndex: 0,
  interval: null,
  maxRenderItem: 2,
  ignoreImageSize: 40,
  is_scrolling: function() {
    return this.lastScrollTime && (/* @__PURE__ */ new Date()).getTime() < this.lastScrollTime + 500;
  },
  getUrlExtension: function(url) {
    if (!url) {
      return "";
    }
    return url.split(/[#?]/)[0].split(".").pop().trim().toLowerCase();
  },
  // Initialize the extension
  init: async function() {
    const power = await chrome.runtime.sendMessage({
      type: "getSettings",
      settingsKey: "power"
    });
    if (!power) {
      document.body.classList.add("hvf-extension-power-off");
      return;
    }
    setTimeout(() => {
      document.body.classList.add("hvf-extension-loaded");
      this.triggerScanning();
      this.receiveMedia();
    }, 1e3);
    window.addEventListener(
      "load",
      () => {
        this.listenUrlUpdate();
      },
      false
    );
  },
  isElementInViewport: function(el) {
    let rect = el.getBoundingClientRect();
    let result = rect.top >= 0 && rect.left >= 0 && rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && rect.right <= (window.innerWidth || document.documentElement.clientWidth);
    return result;
  },
  throttleWaiting: false,
  // Initially, we're not waiting
  throttle: function(callback, limit) {
    return function() {
      if (!this.throttleWaiting) {
        try {
          callback.apply(this, arguments);
        } catch (error) {
          console.log("Error executing callback in throttle");
          console.log(error);
        }
        this.throttleWaiting = true;
        setTimeout(function() {
          this.throttleWaiting = false;
        }, limit);
      }
    };
  },
  triggerScanning: function() {
    this.throttle(this.sendMedia(), 1e3);
  },
  removeUnUsedLoader() {
    document.querySelectorAll(`.hvf-loader`).forEach((loader) => {
      const domIdFromLoader = loader.getAttribute("data-dom-id");
      const findDomFromLoader = document.querySelector(`.${domIdFromLoader}`);
      if (!findDomFromLoader) {
        loader.remove();
      }
    });
  },
  addImageLoader(media) {
    const hvgLoader = document.querySelector(
      ".hvf-loader-id-" + this.domObjectIndex
    );
    media.setAttribute(
      "data-loader-id",
      `hvf-loader-id-${this.domObjectIndex}`
    );
    const { top, left, width, height } = media.getBoundingClientRect();
    if (top > 0 && left > 0 && width > 0 && height > 0 && !media.querySelector("[class^=hvf-dom-]")?.length) {
      if (!hvgLoader?.length) {
        document.body.insertAdjacentHTML(
          "beforeend",
          `<div data-dom-id="hvf-dom-id-${this.domObjectIndex}" style="width: ${width}px; height: ${height}px; top: ${top}px; left: ${left}px;" class="lds-ring hvf-loader hvf-loader-id-${this.domObjectIndex}"><div></div><div></div><div></div><div></div></div>`
        );
      } else {
        if (hvgLoader?.length) {
          hvgLoader.style.width = `${width}px`;
          hvgLoader.style.height = `${height}px`;
          hvgLoader.style.top = `${top}px`;
          hvgLoader.style.left = `${left}px`;
          hvgLoader.style.display = "flex";
        }
      }
    }
  },
  movePositionOfLoader() {
    document.querySelectorAll(`.hvf-loader:not(.hvf-analyzed-loader-el)`).forEach((loader) => {
      const domIdFromLoader = loader.getAttribute("data-dom-id");
      const findDomFromLoader = document.querySelector(`.${domIdFromLoader}`);
      if (findDomFromLoader) {
        const loaderId = findDomFromLoader.getAttribute("data-loader-id");
        const loader2 = document.querySelector(`.${loaderId}`);
        const { top, left, width, height } = findDomFromLoader.getBoundingClientRect();
        if (loader2) {
          loader2.style.width = `${width}px`;
          loader2.style.height = `${height}px`;
          loader2.style.top = `${top}px`;
          loader2.style.left = `${left}px`;
        }
      }
    });
  },
  removeImageLoader(media) {
    const loaderId = media.getAttribute("data-loader-id");
    const loader = document.querySelector(`.${loaderId}`);
    if (loader) {
      loader.classList.add("hvf-analyzed-loader-el");
    }
  },
  // Send media to the background script
  sendMedia: function() {
    let media = document.querySelectorAll(
      "body *:not(.hvf-analyzed):not(.hvf-analyzing):not(.hvf-unidentified-error):not(.hvf-too-many-render):not(.hvf-dom-checked):not(.hvf-ignored-image)"
    );
    this.removeUnUsedLoader();
    for (let i = 0; i < media.length; i++) {
      const backgroundImage = window.getComputedStyle(media[i]).backgroundImage || media[i].style.backgroundImage;
      const backgroundImageUrl = backgroundImage.slice(5, -2);
      const hasBackgroundImage = backgroundImage?.startsWith("url(");
      if (!hasBackgroundImage && media[i].tagName !== "image" && media[i].tagName !== "IMG") {
        media[i].classList.add("hvf-dom-checked");
      }
      if (media[i].classList.contains("hvf-unidentified-error") || media[i].classList.contains("hvf-too-many-render") || media[i].classList.contains("hvf-analyzing") || media[i].classList.contains("hvf-analyzed") || this.isElementInViewport(media[i]) === false || !hasBackgroundImage && media[i].tagName !== "IMG" && media[i].tagName !== "image") {
        continue;
      }
      const { width: imageWidth, height: imageHeight } = media[i].getBoundingClientRect();
      if (imageWidth <= this.ignoreImageSize || imageHeight <= this.ignoreImageSize) {
        media[i].classList.add("hvf-ignored-image");
        continue;
      }
      let url = media[i].src;
      let srcAttr = "src";
      if (!url || url.length === 0) {
        url = media[i].getAttribute("xlink:href");
        srcAttr = "xlink:href";
      }
      if (hasBackgroundImage && media[i].tagName !== "IMG") {
        url = backgroundImageUrl;
      }
      if (this.getUrlExtension(url) == "svg" || this.getUrlExtension(url) == "gif" || this.getUrlExtension(url) == "ico" || url.includes("logo") || media[i].tagName === "IMG" && media[i].getAttribute("alt")?.includes("logo")) {
        media[i].classList.add("hvf-invalid-img");
        continue;
      }
      let isLoaded = media[i].complete && media[i].naturalHeight !== 0;
      if ((media[i].tagName == "image" || hasBackgroundImage || isLoaded) && url && url.length > 0) {
        let renderCycle = media[i].getAttribute("hvf-render-cycle");
        if (renderCycle && +renderCycle > this.maxRenderItem) {
          media[i].classList.add("hvf-too-many-render");
          continue;
        }
        media[i].setAttribute("hvf-render-cycle", +renderCycle + 1 || 1);
        console.log("sending data to background script");
        this.domObjectIndex++;
        media[i].classList.remove("hvf-invalid");
        media[i].classList.add("hvf-analyzing");
        media[i].classList.add("hvf-dom-id-" + this.domObjectIndex);
        this.addImageLoader(media[i]);
        let payload = {
          mediaUrl: url,
          mediaType: hasBackgroundImage && media[i].tagName !== "IMG" && media[i].tagName !== "image" ? "backgroundImage" : "image",
          baseObject: {
            originalUrl: url,
            domObjectIndex: this.domObjectIndex,
            srcAttr,
            shouldMask: false
          }
        };
        chrome.runtime.sendMessage(
          {
            action: "HVF-MEDIA-ANALYSIS-REQUEST",
            payload
          },
          (result) => {
            if (!chrome.runtime.lastError) {
            } else {
            }
          }
        );
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
          if (message.payload.mediaType === "backgroundImage") {
            media.style.backgroundImage = `url(${message.payload.maskedUrl})`;
          } else {
            media.setAttribute(srcAttr, message.payload.maskedUrl);
            media.removeAttribute("srcset");
          }
          media.setAttribute("data-hvf-original-url", originalUrl);
        }
        if (message.payload.invalidMedia === true) {
          media.classList.add("hvf-invalid");
        } else {
          media.classList.add("hvf-analyzed");
          media.classList.remove("hvf-invalid");
        }
        media.classList.remove("hvf-analyzing");
        this.removeImageLoader(media);
      }
    });
  },
  listenUrlUpdate: function() {
    let observer = new MutationObserver((mutationList) => {
      if (!document.hasFocus()) {
        return;
      }
      if (this.is_scrolling() === true) {
        return;
      }
      for (const mutation of mutationList) {
        if (mutation.type !== "attributes") {
          if (mutation.addedNodes.length) {
            setTimeout(() => {
              this.triggerScanning();
            }, 1e3);
          }
          continue;
        }
        if (mutation.attributeName !== "src" && mutation.attributeName !== "xlink:href") {
          continue;
        }
        if (mutation.target.classList.contains("hvf-showed-original-image")) {
          continue;
        }
        let imgTargetSrc = mutation.target.src;
        if (mutation.target.tagName === "image") {
          imgTargetSrc = mutation.target.getAttribute("xlink:href");
        }
        if (mutation.target.getAttribute("data-hvf-masked-url") === imgTargetSrc) {
          continue;
        }
        if (mutation.type === "attributes" && (mutation.target.classList.contains("hvf-analyzed") || mutation.target.classList.contains("hvf-invalid"))) {
          mutation.target.classList.remove("hvf-analyzed");
          mutation.target.classList.remove("hvf-analyzing");
          mutation.target.classList.remove("hvf-invalid");
          this.triggerScanning();
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true
    });
    window.addEventListener("resize", () => {
      this.movePositionOfLoader();
    });
    document.addEventListener(
      "scroll",
      () => {
        this.movePositionOfLoader();
        hvf.triggerScanning();
      },
      true
    );
  },
  blankThumbnail: function() {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAKjAQAAAAAlyMttAAABpUlEQVR42u3OMQEAAAwCIPuX1hjbAQlIX4qWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpbWmQEz1g2V4P8ycgAAAABJRU5ErkJggg==";
  }
};
hvf.init();
