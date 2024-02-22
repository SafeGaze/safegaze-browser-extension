import { blockList } from "./blockList.js";
import { ignoreList } from "./ignoreList";
import remoteAnalyzer from "../background/media-processor/remoteAnalyzer.js";

require("@tensorflow/tfjs-backend-cpu");
require("@tensorflow/tfjs-backend-webgl");
const cocoSsd = require("@tensorflow-models/coco-ssd");

const hvf = {
  domObjectIndex: 0,
  interval: null,

  maxRenderItem: 1,

  ignoreImageSize: 40,

  getSettings: async function () {
    const waitTime = 5000; // wait 5 sec
    return await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("timeout"));
      }, waitTime);

      chrome.runtime
        .sendMessage({
          type: "getSettings",
          settingsKey: window.location.host ?? "power",
        })
        .then((value) => {
          clearTimeout(timeoutId);
          resolve(value);
        });
    });
  },

  getOpacity: async function () {
    return await new Promise((resolve, reject) => {
      chrome.runtime
        .sendMessage({
          type: "getSettings",
          settingsKey: window.location.host + "_opacity",
        })
        .then((value) => {
          resolve(value);
        });
    });
  },

  getImageBase64: async function (imgUrl) {
    return await new Promise((resolve, reject) => {
      chrome.runtime
        .sendMessage({
          action: "CONVERT-IMAGE-TO-BASE64",
          imgUrl,
        })
        .then((value) => {
          if (value?.complete) {
            resolve(value);
          }
        });
    });
  },

  is_scrolling: function () {
    return (
      this.lastScrollTime && new Date().getTime() < this.lastScrollTime + 500
    );
  },

  getUrlExtension: function (url) {
    if (!url) {
      return "";
    }
    return url.split(/[#?]/)[0].split(".").pop().trim().toLowerCase();
  },

  isDataSrcImage: function (imageSrc) {
    if (!imageSrc) {
      return;
    }
    // Regular expression for matching base64 encoded images
    const regex = /^data:image\/([a-zA-Z]+);base64,/;

    return regex.test(imageSrc);
  },

  openNewTabWithMessage() {
    chrome.tabs.create({ url: "about:blank" }, function (tab) {
      chrome.tabs.sendMessage(tab.id, { message: "Hello from content.js!" });
    });
  },

  // detect images
  async objectDetection(img) {
    try {
      // Load the model.
      const model = await cocoSsd.load();

      // Classify the image.
      const predictions = await model.detect(img);

      const foundPerson = predictions.find((pred) => pred.class === "person");
      return !!foundPerson;
    } catch (error) {
      console.log("error on detecting image", error);
      return false;
    }
  },

  async imageURLToBase64(url) {
    try {
      const imageUrlWithCors = `${url}`;

      // Fetch the image
      const response = await fetch(imageUrlWithCors, {
        method: "GET", // POST, PUT, DELETE, etc.
        headers: {
          // the content type header value is usually auto-set
          // depending on the request body
          "Content-Type": "application/json;charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
        },
      });
      const blob = await response.blob();

      // Convert the blob to base64
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = () => {
          resolve(reader.result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("Error converting image to base64:", error);
      throw error;
    }
  },

  // Initialize the extension
  init: async function () {
    try {
      console.log("init function called");
      const power = await this.getSettings();

      // console.log(power);
      if (!power) {
        document.body.classList.add("hvf-extension-power-off");
        document.body.classList.add("hvf-show-website");

        return;
      }

      const domain = window.location.hostname.replace("www.", "");

      if (blockList.includes(domain)) {
        console.log("blocking the domain", domain);
        chrome.runtime.sendMessage({ message: "openNewTab" });
        document.body.classList.add("hvf-extension-power-off");
        return;
      }

      document.body.classList.add("hvf-show-website");

      if (ignoreList.includes(domain)) {
        console.log(`Ignoring this domain ${domain}`);
        document.body.classList.add("hvf-extension-power-off");

        return;
      }

      if (!document.getElementById("opacity-style")) {
        const getOpacity = await this.getOpacity();

        console.log({ getOpacity });

        var styles = `
            body:not(.hvf-extension-power-off) img:not(.hvf-invalid-img),
            body:not(.hvf-extension-power-off) image:not(.hvf-invalid-img) {
              filter: blur(${
                getOpacity !== true &&
                getOpacity !== false &&
                Number.isInteger(Number(getOpacity))
                  ? getOpacity
                  : 15
              }px) !important;
            }
      `;
        var styleSheet = document.createElement("style");
        styleSheet.id = "opacity-style";
        styleSheet.innerText = styles;
        document.body.append(styleSheet);
      }

      document.body.classList.add("hvf-extension-loaded");
      // start the extension
      setTimeout(() => {
        this.triggerScanning();
        this.receiveMedia();
      }, 1000);

      // wait for the page to load
      window.addEventListener(
        "load",
        () => {
          this.listenUrlUpdate();
        },
        false
      );
    } catch (error) {
      if (
        !document
          .querySelector("body")
          .classList.contains("hvf-extension-loaded") &&
        !document
          .querySelector("body")
          .classList.contains("hvf-extension-power-off")
      ) {
        console.log("initial load failed!");
        document.body.classList.add("hvf-show-website");

        document.body.classList.add("hvf-extension-power-off");
      }
    }
  },

  isElementInViewport: function (el) {
    let rect = el.getBoundingClientRect();
    let result =
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <=
        (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth);

    // console.log(result);

    return true;
  },

  throttleWaiting: false, // Initially, we're not waiting
  throttle: function (callback, limit) {
    return function () {
      // We return a throttled function
      if (!this.throttleWaiting) {
        // If we're not waiting
        try {
          callback.apply(this, arguments); // Execute users function
        } catch (error) {
          console.log("Error executing callback in throttle");
          console.log(error);
        }
        this.throttleWaiting = true; // Prevent future invocations
        setTimeout(function () {
          // After a period of time
          this.throttleWaiting = false; // And allow future invocations
        }, limit);
      }
    };
  },

  triggerScanning: function () {
    this.throttle(this.sendMedia(), 1000);
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
    if (
      media.classList.contains("hvf-multi-time-analyzing") ||
      media.classList.contains("hvf-invalid")
    ) {
      return;
    }
    const hvgLoader = document.querySelector(
      ".hvf-loader-id-" + this.domObjectIndex
    );
    media.setAttribute(
      "data-loader-id",
      `hvf-loader-id-${this.domObjectIndex}`
    );

    const { top, left, width, height } = media.getBoundingClientRect();
    if (
      top > 0 &&
      left > 0 &&
      width > 0 &&
      height > 0 &&
      !media.querySelector("[class^=hvf-dom-]")?.length
    ) {
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
    document
      .querySelectorAll(`.hvf-loader:not(.hvf-analyzed-loader-el)`)
      .forEach((loader) => {
        const domIdFromLoader = loader.getAttribute("data-dom-id");
        const findDomFromLoader = document.querySelector(`.${domIdFromLoader}`);
        if (findDomFromLoader) {
          // move loader based if dom element position changed
          const loaderId = findDomFromLoader.getAttribute("data-loader-id");
          const loader = document.querySelector(`.${loaderId}`);
          const { top, left, width, height } =
            findDomFromLoader.getBoundingClientRect();
          if (loader) {
            loader.style.width = `${width}px`;
            loader.style.height = `${height}px`;
            loader.style.top = `${top}px`;
            loader.style.left = `${left}px`;
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
  sendMedia: function () {
    // console.log("sending Media");
    // Get all media
    // currently supports images only
    let media = document.querySelectorAll(
      "body *:not(.hvf-analyzed):not(.hvf-analyzing):not(.hvf-unidentified-error):not(.hvf-too-many-render):not(.hvf-dom-checked):not(.hvf-ignored-image):not(.hvf-can-not-processed)"
    );

    // remove unused loader
    this.removeUnUsedLoader();

    for (let i = 0; i < media.length; i++) {
      // Remove the <source> tag
      if (
        media[i].tagName === "SOURCE" &&
        media[i].parentNode.tagName === "PICTURE"
      ) {
        media[i].remove();
      }

      // Is it background image?
      const backgroundImage =
        window.getComputedStyle(media[i]).backgroundImage ||
        media[i].style.backgroundImage;
      const backgroundImageUrl = backgroundImage.slice(5, -2);
      const hasBackgroundImage = backgroundImage?.startsWith("url(");

      // add invalid dom class if it's not bg or image
      if (
        !hasBackgroundImage &&
        media[i].tagName !== "image" &&
        media[i].tagName !== "IMG"
      ) {
        media[i].classList.add("hvf-dom-checked");
      }

      // console.log('foo');
      // looking for new images only
      // matching hvf-analyzing and hvf-analyzed classes
      if (
        media[i].classList.contains("hvf-unidentified-error") ||
        media[i].classList.contains("hvf-too-many-render") ||
        media[i].classList.contains("hvf-analyzing") ||
        media[i].classList.contains("hvf-analyzed") ||
        (!hasBackgroundImage &&
          media[i].tagName !== "IMG" &&
          media[i].tagName !== "image") ||
        this.isDataSrcImage(media[i].src)
      ) {
        continue;
      }

      // ignore if images are less than 48*48
      const { width: imageWidth, height: imageHeight } =
        media[i].getBoundingClientRect();
      if (
        imageWidth <= this.ignoreImageSize ||
        imageHeight <= this.ignoreImageSize ||
        media[i].id.includes("captcha") ||
        media[i].classList.contains("captcha")
      ) {
        media[i].classList.add("hvf-ignored-image");
        continue;
      }

      // Get image url and src attribute
      let url = media[i].src;
      let srcAttr = "src";
      if (!url || url.length === 0) {
        url = media[i].getAttribute("xlink:href");
        srcAttr = "xlink:href";
      }
      // If has background image then updating the url
      if (hasBackgroundImage && media[i].tagName !== "IMG") {
        url = backgroundImageUrl;
      }

      if (url.startsWith("https://images.safegaze.com/annotated_image/")) {
        media[i].classList.add("hvf-analyzed");
        media[i].classList.remove("hvf-analyzing");
        continue;
      }

      // ignored svg and gif and logo
      if (
        this.getUrlExtension(url) == "svg" ||
        // this.getUrlExtension(url) == "gif" ||
        this.getUrlExtension(url) == "ico" ||
        url.includes("logo") ||
        (media[i].tagName === "IMG" &&
          media[i].getAttribute("alt")?.includes("logo"))
      ) {
        media[i].classList.add("hvf-invalid-img");
        continue;
      }

      let isLoaded = media[i].complete && media[i].naturalHeight !== 0;

      if (
        (media[i].tagName == "image" || hasBackgroundImage || isLoaded) &&
        url &&
        url.length > 0
      ) {
        // multiple render limit up to this.maxRenderItem
        let renderCycle = media[i].getAttribute("hvf-render-cycle");
        const loaderId = media[i].getAttribute("data-loader-id");

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

        // added image loader
        this.addImageLoader(media[i]);

        const loader = document.querySelector(`.${loaderId}`);
        if (loader) {
          loader.classList.add("hvf-analyzed-loader-el");
        }

        const that = this;
        let data = {
          mediaUrl: url,
          mediaType:
            hasBackgroundImage &&
            media[i].tagName !== "IMG" &&
            media[i].tagName !== "image"
              ? "backgroundImage"
              : "image",
          domObjectIndex: this.domObjectIndex,
          srcAttr: srcAttr,
          shouldMask: false,
          maskedUrl: null,
        };

        let analyzer = new remoteAnalyzer(data);

        (async function () {
          const result = await that.getImageBase64(media[i].src);
          const base64Image = result.result;
          const imgElement = document.createElement("img");

          // Set base64 as src
          imgElement.src = base64Image;
          imgElement.crossOrigin = "anonymous";

          const detectPerson = await that.objectDetection(imgElement);
          if (!detectPerson) {
            media[i].classList.add("hvf-ignored-image");
            media[i].classList.add("hvf-human-not-included");

            return;
          }

          if (media[i].classList.contains("hvf-could-not-processed-img")) {
            data.mediaUrl = base64Image;
          }

          analyzer
            .analyze()
            .then((result) => {
              console.log("Media analysis complete");

              if (result.invalidMedia) {
                media[i].classList.remove("hvf-analyzed");
                media[i].classList.remove("hvf-analyzing");
                media[i].classList.remove("hvf-invalid");
                media[i].classList.add("hvf-could-not-processed-img");
                that.triggerScanning();
                return;
              }
              media[i].classList.remove("hvf-could-not-processed-img");

              that.receiveMediaV2({
                payload: Object.assign(data, result),
              });

              chrome.runtime.sendMessage(
                {
                  action: "HVF-TOTAL-COUNT",
                  activate: result?.activate,
                },
                (result) => {
                  if (!chrome.runtime.lastError) {
                    // message processing code goes here
                  } else {
                    // error handling code goes here
                  }
                }
              );
            })
            .catch((err) => {
              console.log("Error analyzing media");
              console.log(err);
            });
        })();

        // chrome.runtime.sendMessage(
        //   {
        //     action: "HVF-MEDIA-ANALYSIS-REQUEST",
        //     payload: payload,
        //   },
        //   (result) => {
        //     if (!chrome.runtime.lastError) {
        //       // message processing code goes here
        //     } else {
        //       // error handling code goes here
        //     }
        //   }
        // );
      }
    }
  },

  receiveMediaV2: function (message) {
    let index = message.payload.domObjectIndex;
    let media = document.querySelector(".hvf-dom-id-" + index);

    // console.log(message.payload);

    let srcAttr = message.payload.srcAttr;
    let mediaUrl = message.payload.mediaUrl;

    if (!media) return;

    if (message.payload.shouldMask && message.payload.maskedUrl) {
      // reset the image before replacing the masked url
      media.setAttribute(srcAttr, "");
      media.style.backgroundImage = "";

      media.classList.add("hvf-masked");
      if (message.payload.mediaType === "backgroundImage") {
        media.style.backgroundImage = `url(${message.payload.maskedUrl})`;
      } else {
        // media.setAttribute(srcAttr, this.blankThumbnail());
        media.setAttribute(srcAttr, message.payload.maskedUrl);
        media.removeAttribute("srcset");
      }
      media.setAttribute("data-hvf-original-url", mediaUrl);
    }

    if (message.payload.invalidMedia === true) {
      media.classList.add("hvf-invalid");
    } else {
      media.classList.add("hvf-analyzed");
      media.classList.remove("hvf-invalid");
    }
    media.classList.remove("hvf-analyzing");

    let renderCycle = media.getAttribute("hvf-render-cycle") || 0;
    if (!message.payload.invalidMedia || renderCycle > this.maxRenderItem) {
      this.removeImageLoader(media);
    }
  },

  // Receive media from the background script
  receiveMedia: function () {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === "HVF-MEDIA-ANALYSIS-REPORT") {
        let index = message.payload.domObjectIndex;
        let media = document.querySelector(".hvf-dom-id-" + index);

        // console.log(message.payload);

        let srcAttr = message.payload.srcAttr;
        let mediaUrl = message.payload.mediaUrl;

        if (!media) return;

        if (message.payload.shouldMask && message.payload.maskedUrl) {
          // reset the image before replacing the masked url
          media.setAttribute(srcAttr, "");
          media.style.backgroundImage = "";

          media.classList.add("hvf-masked");
          if (message.payload.mediaType === "backgroundImage") {
            media.style.backgroundImage = `url(${message.payload.maskedUrl})`;
          } else {
            // media.setAttribute(srcAttr, this.blankThumbnail());
            media.setAttribute(srcAttr, message.payload.maskedUrl);
            media.removeAttribute("srcset");
          }
          media.setAttribute("data-hvf-original-url", mediaUrl);
        }

        if (message.payload.invalidMedia === true) {
          media.classList.add("hvf-invalid");
        } else {
          media.classList.add("hvf-analyzed");
          media.classList.remove("hvf-invalid");
        }
        media.classList.remove("hvf-analyzing");

        let renderCycle = media.getAttribute("hvf-render-cycle") || 0;
        if (!message.payload.invalidMedia || renderCycle > this.maxRenderItem) {
          this.removeImageLoader(media);
        }
      }
    });
  },

  listenUrlUpdate: function () {
    // Callback function to execute when mutations are observed
    let observer = new MutationObserver((mutationList) => {
      // if window is not focused return
      if (!document.hasFocus()) {
        return;
      }

      // if scroll, then mutation observer skiping
      if (this.is_scrolling() === true) {
        return;
      }

      for (const mutation of mutationList) {
        if (mutation.type !== "attributes") {
          // if we add nodes, then trigger scaning
          if (mutation.addedNodes.length) {
            setTimeout(() => {
              this.triggerScanning();
            }, 1000);
          }

          continue;
        }

        if (
          mutation.attributeName !== "src" &&
          mutation.attributeName !== "xlink:href"
        ) {
          continue;
        }

        // if show original image then skip rerendering
        if (mutation.target.classList.contains("hvf-showed-original-image")) {
          continue;
        }

        let imgTargetSrc = mutation.target.src;
        if (mutation.target.tagName === "image") {
          imgTargetSrc = mutation.target.getAttribute("xlink:href");
        }

        if (
          mutation.target.getAttribute("data-hvf-masked-url") === imgTargetSrc
        ) {
          continue;
        }

        if (
          mutation.type === "attributes" &&
          (mutation.target.classList.contains("hvf-analyzed") ||
            mutation.target.classList.contains("hvf-invalid"))
        ) {
          mutation.target.classList.remove("hvf-analyzed");
          mutation.target.classList.remove("hvf-analyzing");
          mutation.target.classList.remove("hvf-invalid");
          mutation.target.classList.add("hvf-multi-time-analyzing");
          this.triggerScanning();
        }
      }
    });

    // Start observing the target node for configured mutations
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // forget about the mutation observer
    // it's not working as expected
    // lets use the timer instead
    // hvf.interval = setInterval(() => {
    //   // if window not active then stop the scanning
    //   if (document.hidden) {
    //     return;
    //   }
    //   hvf.triggerScanning();
    // }, 2000);

    // move the loader element on their position while resizing
    window.addEventListener("resize", () => {
      this.movePositionOfLoader();
    });

    // Start observing the scroll event
    document.addEventListener(
      "scroll",
      () => {
        this.movePositionOfLoader();

        hvf.triggerScanning();
      },
      true
    );
  },

  blankThumbnail: function () {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABLAAAAKjAQAAAAAlyMttAAABpUlEQVR42u3OMQEAAAwCIPuX1hjbAQlIX4qWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpaWlpbWmQEz1g2V4P8ycgAAAABJRU5ErkJggg==";
  },
};

function hvfInitObserver(callback) {
  const config = { childList: true, subtree: true, attributes: true };

  const observer = new MutationObserver(callback);

  observer.observe(document.body, config);
}

function hvgObserverCallback() {
  if (
    !document
      .querySelector("body")
      .classList.contains("hvf-extension-loaded") &&
    !document
      .querySelector("body")
      .classList.contains("hvf-extension-power-off")
  ) {
    hvf.init();
  }
}

hvfInitObserver(hvgObserverCallback);
hvgObserverCallback();
