const hvf = {
  domObjectIndex: 0,

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

    for (let i = 0; i < media.length; i++) {
      console.log('foo');
      // looking for new images only
      // matching hvf-analyzing and hvf-analyzed classes
      if (media[i].classList.contains("hvf-analyzing") || media[i].classList.contains("hvf-analyzed")) {
        continue;
      };
      // console.log(media[i].classList)

      // add class to mark image as being analyzing
      

      // Get image url and src attribute
      let url = media[i].src;
      let srcAttr = 'src';
      if (!url || url.length === 0) {
        url = media[i].getAttribute('xlink:href');
        srcAttr = 'xlink:href';
      }

      let isLoaded = media[i].complete && media[i].naturalHeight !== 0;

      if (isLoaded && url && url.length > 0) {

        this.domObjectIndex++;
        media[i].classList.add("hvf-analyzing");
        media[i].classList.add("hvf-dom-id-" + this.domObjectIndex);

        console.log(this.domObjectIndex);
        let payload = {
          mediaUrl: url,
          mediaType: 'image',
          baseObject: {
            originalUrl: url,
            domObjectIndex: this.domObjectIndex,
            srcAttr: srcAttr,
            shouldMask: false
          }
        };

        chrome.runtime.sendMessage({
          action: 'HVF-MEDIA-ANALYSIS-REQUEST',
          payload: payload,
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

        let index = message.payload.baseObject.domObjectIndex;
        let media = document.querySelector(".hvf-dom-id-" + index);
        
        console.log(media);

        let srcAttr = message.payload.baseObject.srcAttr;
        let originalUrl = message.payload.baseObject.originalUrl;

        if (!media) return;

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
        if(mutation.type !== 'attributes'){
          continue;
        }
        
        if(mutation.attributeName !== 'src' && mutation.attributeName !== 'xlink:href') {
          continue;
        }

        if(mutation.target.classList.contains("hvf-analyzed")) {
          continue;
        }

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

      // this.sendMedia();
    });

    // Start observing the target node for configured mutations
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
    });

    // Start observing the scroll event
    document.addEventListener("scroll", () => {hvf.sendMedia()}, true);
  },

};

hvf.init();