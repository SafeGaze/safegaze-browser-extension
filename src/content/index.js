const hvf = {

  // Initialize the extension
  init: function () {
    this.sendMedia();

    this.receiveMedia();

    // wait for the page to load
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.listenUrlUpdate();
      }, 1000);
    }, false);
  },

  // Send media to the background script
  sendMedia: function () {
    // console.log("sending Media");
    // Get all media
    // currently supports images only
    let media = document.querySelectorAll('img, image');
    // console.log(media);
    for (let i = 0; i < media.length; i++) {
      console.log('foo');
      // looking for new images only
      // matching hvf-analyzing and hvf-analyzed classes
      if (media[i].classList.contains("hvf-analyz")) continue;

      // add class to mark image as being analyzing
      media[i].classList.add("hvf-analyzing");

      // Get image url and src attribute
      let url = media[i].src;
      let srcAttr = 'src';
      if (!url || url.length === 0) {
        url = media[i].getAttribute('xlink:href');
        srcAttr = 'xlink:href';
      }

      if (url && url.length > 0) {


        chrome.runtime.sendMessage({
          action: 'HVF-MEDIA-ANALYSIS-REQUEST',
          payload: {
            mediaUrl: url,
            mediaType: 'image',
            baseObject: {
              originalUrl: url,
              domObject: media[i],
              srcAttr: srcAttr,
              shouldMask: false
            }
          },
        }, (result) => {
          if (!chrome.runtime.lastError) {
            // message processing code goes here
          } else {
            // error handling code goes here
          }
        });


      }
    }
  },

  // Receive media from the background script
  receiveMedia: function () {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message && message.action === 'HVF-MEDIA-ANALYSIS-REPORT') {

        let media = message.payload.baseObject.domObject;
        let srcAttr = message.payload.baseObject.srcAttr;
        let originalUrl = message.payload.baseObject.originalUrl;

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

  listenUrlUpdate: function () {

    // Callback function to execute when mutations are observed
    let observer = new MutationObserver((mutationList) => {
      for (const mutation of mutationList) {
        let mutationImgUrl = mutation.target.src;

        if (mutation.target.tagName === "image") {
          mutationImgUrl = mutation.target.getAttribute("xlink:href");
        }

        if (
          mutation.type === "attributes" &&
          mutation.target.classList.contains("hvf-analyzed")
        ) {
          mutation.target.classList.remove("hvf-analyzed");
          mutation.target.classList.remove("hvf-analyzing");
        }
      }

      this.sendMedia();
    });

    // Start observing the target node for configured mutations
    // observer.observe(document.body, {
    //   childList: true,
    //   subtree: true,
    //   attributes: true,
    // });

    // Start observing the scroll event
    document.addEventListener("scroll", this.sendMedia);
  },

};

hvf.init();